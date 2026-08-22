import csv
import io
import json
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from app.dependencies import CurrentUser
from app.schemas import (
    CsvDuplicateStrategy, MarginTier, PlannerProduct, Product, ProductCreateRequest,
    ProductCsvImportResponse, ProductImportRowError, ProductPriority, ProductStatus,
    ProductUpdateRequest, Role,
)
from app.supabase_client import get_service_client

router = APIRouter(prefix="/products", tags=["Product Catalogue"])

CSV_COLUMNS = [
    "name", "description", "price", "category", "sku", "compare_at_price",
    "cost_price", "stock_quantity", "track_inventory", "status", "priority",
    "image_urls", "features", "pain_points",
]
REQUIRED_CSV_COLUMNS = {"name", "description", "price"}
HEADER_ALIASES = {
    "product_name": "name", "title": "name", "product_description": "description",
    "selling_price": "price", "sale_price": "price", "unit_cost": "cost_price",
    "inventory": "stock_quantity", "quantity": "stock_quantity",
    "images": "image_urls", "image_url": "image_urls",
    "product_features": "features",
}


def _require_manager(current_user: CurrentUser) -> None:
    if current_user.role not in {Role.BUSINESS_OWNER, Role.ADMINISTRATOR}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only a business owner can manage products.")


def _current_workspace_id(current_user: CurrentUser) -> str:
    try:
        result = get_service_client().table("business_workspaces").select("id").eq("owner_id", str(current_user.id)).maybe_single().execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Business workspace storage is temporarily unavailable.") from exc
    if result is None or not result.data:
        raise HTTPException(status_code=404, detail="Create your business workspace before adding products.")
    return result.data["id"]


def _product_or_404(product_id: UUID, workspace_id: str) -> Product:
    try:
        result = get_service_client().table("products").select("*").eq("id", str(product_id)).eq("workspace_id", workspace_id).maybe_single().execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Product storage is temporarily unavailable. Run the Module 4 migration first.") from exc
    if result is None or not result.data:
        raise HTTPException(status_code=404, detail="Product not found.")
    return Product.model_validate(result.data)


def _csv_error_message(exc: Exception) -> str:
    if hasattr(exc, "errors"):
        return "; ".join(f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}" for error in exc.errors())
    return str(exc)


def _normalize_header(header: str) -> str:
    return header.strip().lower().replace(" ", "_").replace("-", "_")


def parse_product_csv(contents: bytes, column_mapping: dict[str, str] | None = None) -> tuple[list[tuple[int, dict]], list[ProductImportRowError]]:
    """Parse and validate a CSV before any database write occurs."""
    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        return [], [ProductImportRowError(row=1, message="CSV must be UTF-8 encoded.")]
    try:
        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            return [], [ProductImportRowError(row=1, message="CSV must include a header row.")]
        mapping = {_normalize_header(source): _normalize_header(target) for source, target in (column_mapping or {}).items()}
        if any(target not in CSV_COLUMNS for target in mapping.values()):
            return [], [ProductImportRowError(row=1, message="Column mapping contains an unsupported destination field.")]
        resolved_headers = {
            source: mapping.get(_normalize_header(source), HEADER_ALIASES.get(_normalize_header(source), _normalize_header(source)))
            for source in reader.fieldnames if source
        }
        available = set(resolved_headers.values())
        missing = REQUIRED_CSV_COLUMNS - available
        if missing:
            return [], [ProductImportRowError(row=1, message=f"Missing required CSV columns: {', '.join(sorted(missing))}.")]

        products: list[tuple[int, dict]] = []
        errors: list[ProductImportRowError] = []
        seen_skus: set[str] = set()
        for row_number, raw_row in enumerate(reader, start=2):
            if not any((value or "").strip() for value in raw_row.values()):
                continue
            raw = {destination: (raw_row.get(source) or "").strip() for source, destination in resolved_headers.items()}
            if raw.get("image_urls"):
                raw["images"] = [{"url": url.strip(), "position": index} for index, url in enumerate(raw.pop("image_urls").split("|")) if url.strip()]
            if raw.get("features"):
                raw["features"] = [f.strip() for f in raw["features"].split("|") if f.strip()]
            if raw.get("pain_points"):
                raw["pain_points"] = [p.strip() for p in raw["pain_points"].split("|") if p.strip()]
            for optional_field in ("category", "sku", "compare_at_price", "cost_price", "stock_quantity", "track_inventory", "status", "priority"):
                if raw.get(optional_field) == "":
                    raw.pop(optional_field, None)
            try:
                product = ProductCreateRequest.model_validate(raw)
                values = product.model_dump(mode="json")
                sku = values.get("sku")
                if sku and sku.casefold() in seen_skus:
                    errors.append(ProductImportRowError(row=row_number, message=f"Duplicate SKU '{sku}' appears in this CSV."))
                else:
                    if sku:
                        seen_skus.add(sku.casefold())
                    products.append((row_number, values))
            except Exception as exc:
                errors.append(ProductImportRowError(row=row_number, message=_csv_error_message(exc)))
        if not products and not errors:
            errors.append(ProductImportRowError(row=1, message="CSV contains no product rows."))
        return products, errors
    except csv.Error as exc:
        return [], [ProductImportRowError(row=1, message=f"Invalid CSV: {exc}")]


@router.get("/import/template", response_class=Response)
def download_import_template(current_user: CurrentUser) -> Response:
    _require_manager(current_user)
    template = "name,description,price,category,sku,compare_at_price,cost_price,stock_quantity,track_inventory,status,priority,image_urls,features,pain_points\n"
    template += "Travel Mug,Insulated mug for hot and cold drinks,24.99,Drinkware,MUG-001,29.99,12.50,20,true,draft,normal,https://example.com/mug-front.jpg|https://example.com/mug-side.jpg,Double-wall insulation|BPA-free|Leak-proof lid,Cold drinks get warm|Bulky mugs don't fit cup holders\n"
    return Response(content=template, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=marketpilot-products-template.csv"})


@router.post("/import/csv", response_model=ProductCsvImportResponse)
async def import_products_csv(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    on_duplicate: CsvDuplicateStrategy = Query(default=CsvDuplicateStrategy.SKIP),
    column_mapping: str | None = Form(default=None),
) -> ProductCsvImportResponse:
    _require_manager(current_user)
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="Upload a .csv file.")
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="CSV file is too large. Maximum size is 2 MB.")
    try:
        mapping = None if column_mapping is None else json.loads(column_mapping)
        if mapping is not None and (not isinstance(mapping, dict) or not all(isinstance(key, str) and isinstance(value, str) for key, value in mapping.items())):
            raise ValueError
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=422, detail="column_mapping must be a JSON object, for example {\"Product Name\": \"name\"}.")

    products, errors = parse_product_csv(contents, mapping)
    if len(products) + len(errors) > 500:
        raise HTTPException(status_code=413, detail="CSV can contain at most 500 product rows.")
    if errors:
        return ProductCsvImportResponse(imported=0, skipped=0, errors=errors, message="Nothing was imported. Fix the listed CSV rows and upload again.")

    workspace_id = _current_workspace_id(current_user)
    try:
        existing_result = get_service_client().table("products").select("sku").eq("workspace_id", workspace_id).execute()
        existing_skus = {row["sku"].casefold() for row in existing_result.data if row.get("sku")}
        accepted: list[dict] = []
        duplicate_errors: list[ProductImportRowError] = []
        skipped = 0
        for row_number, product in products:
            sku = product.get("sku")
            if sku and sku.casefold() in existing_skus:
                if on_duplicate == CsvDuplicateStrategy.REJECT:
                    duplicate_errors.append(ProductImportRowError(row=row_number, message=f"SKU '{sku}' already exists in this workspace."))
                else:
                    skipped += 1
                continue
            product["workspace_id"] = workspace_id
            accepted.append(product)
        if duplicate_errors:
            return ProductCsvImportResponse(imported=0, skipped=0, errors=duplicate_errors, message="Nothing was imported. Resolve the existing SKU conflicts and upload again.")
        if accepted:
            get_service_client().table("products").insert(accepted).execute()
        return ProductCsvImportResponse(imported=len(accepted), skipped=skipped, message="CSV import completed successfully.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Product storage is temporarily unavailable. No CSV rows were imported.") from exc


@router.post("", response_model=Product, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreateRequest, current_user: CurrentUser) -> Product:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    values = payload.model_dump(mode="json")
    values["workspace_id"] = workspace_id
    try:
        result = get_service_client().table("products").insert(values).execute()
        return Product.model_validate(result.data[0])
    except Exception as exc:
        if "products_workspace_id_sku_key" in str(exc):
            raise HTTPException(status_code=409, detail="A product with this SKU already exists in this workspace.") from exc
        raise HTTPException(status_code=503, detail="Product storage is temporarily unavailable. Run the Module 4 migration first.") from exc


@router.get("", response_model=list[Product])
def list_products(
    current_user: CurrentUser,
    product_status: ProductStatus | None = Query(default=None, alias="status"),
    priority: ProductPriority | None = None,
    category: str | None = Query(default=None, min_length=1, max_length=100),
) -> list[Product]:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    try:
        query = get_service_client().table("products").select("*").eq("workspace_id", workspace_id)
        if product_status is not None:
            query = query.eq("status", product_status.value)
        if priority is not None:
            query = query.eq("priority", priority.value)
        if category is not None:
            query = query.eq("category", category.strip())
        result = query.order("created_at", desc=True).execute()
        return [Product.model_validate(row) for row in result.data]
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Product storage is temporarily unavailable. Run the Module 4 migration first.") from exc


@router.get("/available", response_model=list[PlannerProduct])
def list_available_products(current_user: CurrentUser) -> list[PlannerProduct]:
    """Return active, in-stock products enriched with offer and margin data for the content planner."""
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    try:
        result = get_service_client().table("products").select("*").eq("workspace_id", workspace_id).eq("status", "active").order("priority", desc=True).execute()
        products = result.data or []
        # Filter out products that are out of stock when inventory tracking is on.
        available = [p for p in products if not p.get("track_inventory", True) or p.get("stock_quantity", 0) > 0]
        # Load active offers for enrichment.
        try:
            from datetime import date as date_type
            today = date_type.today().isoformat()
            offers_result = get_service_client().table("offers").select("product_id,title").eq("workspace_id", workspace_id).eq("status", "active").lte("start_date", today).gte("end_date", today).execute()
            offer_map: dict[str, str] = {}
            workspace_wide_offer: str | None = None
            for offer in (offers_result.data or []):
                if offer.get("product_id"):
                    offer_map[offer["product_id"]] = offer["title"]
                else:
                    workspace_wide_offer = offer["title"]
        except Exception:
            offer_map = {}
            workspace_wide_offer = None

        planner_products: list[PlannerProduct] = []
        for p in available:
            from decimal import Decimal as D
            price = D(str(p["price"])) if p.get("price") else None
            cost = D(str(p["cost_price"])) if p.get("cost_price") else None
            margin = round((price - cost) / price * 100, 2) if price and cost and price > 0 else None
            margin_tier = None
            if margin is not None:
                if margin < 30:
                    margin_tier = MarginTier.LOW
                elif margin < 60:
                    margin_tier = MarginTier.MEDIUM
                else:
                    margin_tier = MarginTier.HIGH
            pid = p["id"]
            active_title = offer_map.get(pid) or workspace_wide_offer
            planner_products.append(PlannerProduct(
                id=pid, name=p["name"], description=p["description"],
                category=p.get("category"), price=p["price"],
                cost_price=p.get("cost_price"), profit_margin=margin,
                margin_tier=margin_tier, stock_quantity=p.get("stock_quantity", 0),
                priority=p.get("priority", "normal"),
                features=p.get("features") or [],
                pain_points=p.get("pain_points") or [],
                is_on_offer=active_title is not None,
                active_offer_title=active_title,
            ))
        return planner_products
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Product storage is temporarily unavailable.") from exc


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: UUID, current_user: CurrentUser) -> Product:
    _require_manager(current_user)
    return _product_or_404(product_id, _current_workspace_id(current_user))


@router.patch("/{product_id}", response_model=Product)
def update_product(product_id: UUID, payload: ProductUpdateRequest, current_user: CurrentUser) -> Product:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    changes = payload.model_dump(exclude_unset=True, mode="json")
    if not changes:
        return _product_or_404(product_id, workspace_id)
    try:
        result = get_service_client().table("products").update(changes).eq("id", str(product_id)).eq("workspace_id", workspace_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Product not found.")
        return Product.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        if "products_workspace_id_sku_key" in str(exc):
            raise HTTPException(status_code=409, detail="A product with this SKU already exists in this workspace.") from exc
        raise HTTPException(status_code=503, detail="Product storage is temporarily unavailable. Run the Module 4 migration first.") from exc


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: UUID, current_user: CurrentUser) -> None:
    _require_manager(current_user)
    workspace_id = _current_workspace_id(current_user)
    try:
        result = get_service_client().table("products").delete().eq("id", str(product_id)).eq("workspace_id", workspace_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Product not found.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Product storage is temporarily unavailable. Run the Module 4 migration first.") from exc
