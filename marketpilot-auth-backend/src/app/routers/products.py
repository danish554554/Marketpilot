import csv
import io
import json
from uuid import UUID

import openpyxl
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
REQUIRED_CSV_COLUMNS = {"name", "price"}
HEADER_ALIASES = {
    "product_name": "name", "title": "name", "product": "name", "item": "name", "item_name": "name", "product_title": "name",
    "product_description": "description", "details": "description", "desc": "description", "about": "description",
    "selling_price": "price", "sale_price": "price", "retail_price": "price", "unit_price": "price", "price_pkr": "price", "pkr": "price", "rate": "price",
    "cost": "cost_price", "unit_cost": "cost_price", "purchase_price": "cost_price", "buying_price": "cost_price", "cogs": "cost_price", "wholesale_price": "cost_price",
    "inventory": "stock_quantity", "quantity": "stock_quantity", "qty": "stock_quantity", "stock": "stock_quantity", "units": "stock_quantity", "available": "stock_quantity",
    "images": "image_urls", "image_url": "image_urls", "image": "image_urls", "photo": "image_urls",
    "product_features": "features", "key_features": "features", "highlights": "features", "specs": "features",
    "problems_solved": "pain_points", "problems": "pain_points", "painpoints": "pain_points", "pain_point": "pain_points", "problem": "pain_points",
    "compare_price": "compare_at_price", "original_price": "compare_at_price", "old_price": "compare_at_price", "list_price": "compare_at_price",
}


def _require_manager(current_user: CurrentUser) -> None:
    if current_user.role not in {Role.BUSINESS_OWNER, Role.ADMINISTRATOR, Role.TEAM_MEMBER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only authorized store members can manage products.")


def _current_workspace_id(current_user: CurrentUser) -> str:
    service_client = get_service_client()
    try:
        result = service_client.table("business_workspaces").select("id").eq("owner_id", str(current_user.id)).maybe_single().execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Business workspace storage is temporarily unavailable.") from exc
    if result and result.data:
        return result.data["id"]

    # Auto-provision a default business workspace for this user if one does not exist
    try:
        biz_name = getattr(current_user, "full_name", None) or "My Store"
        country = getattr(current_user, "target_country", None) or "Pakistan"
        ins = service_client.table("business_workspaces").insert({
            "owner_id": str(current_user.id),
            "business_name": biz_name,
            "business_description": f"{biz_name} e-commerce store catalogue and marketing workspace.",
            "industry": "e-commerce",
            "country": "PK",
            "currency": "PKR",
            "target_market": country,
            "marketing_objectives": ["increase_sales", "increase_engagement"],
        }).execute()
        if ins.data and len(ins.data) > 0:
            return ins.data[0]["id"]
    except Exception:
        pass

    try:
        retry = service_client.table("business_workspaces").select("id").eq("owner_id", str(current_user.id)).maybe_single().execute()
        if retry and retry.data:
            return retry.data["id"]
    except Exception:
        pass

    raise HTTPException(status_code=404, detail="Create your business workspace before adding products.")


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


def _clean_numeric_string(val: any) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    for prefix in ["Rs.", "Rs", "PKR", "$", "pkr", "rs"]:
        if s.startswith(prefix):
            s = s[len(prefix):].strip()
    s = s.replace(",", "").strip()
    try:
        f = float(s)
        if f.is_integer():
            return str(int(f))
        return str(f)
    except Exception:
        return s


def parse_product_csv(contents: bytes, column_mapping: dict[str, str] | None = None) -> tuple[list[tuple[int, dict]], list[ProductImportRowError]]:
    """Parse and validate a CSV before any database write occurs."""
    return parse_product_spreadsheet(contents, filename="catalog.csv", column_mapping=column_mapping)


def parse_product_spreadsheet(contents: bytes, filename: str = "", column_mapping: dict[str, str] | None = None) -> tuple[list[tuple[int, dict]], list[ProductImportRowError]]:
    """Parse and validate either an Excel (.xlsx/.xls) or CSV file before any database write."""
    is_excel = filename.lower().endswith((".xlsx", ".xls"))
    raw_rows_data: list[tuple[int, dict[str, str]]] = []

    if is_excel:
        try:
            wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
            sheet = wb.active
            all_rows = list(sheet.iter_rows(values_only=True))
            if not all_rows:
                return [], [ProductImportRowError(row=1, message="Excel file contains no data.")]
            
            # Locate first non-empty row as header
            header_row_idx = 0
            for idx, r in enumerate(all_rows):
                if any(c is not None and str(c).strip() for c in r):
                    header_row_idx = idx
                    break

            raw_fieldnames = [str(cell or "").strip() for cell in all_rows[header_row_idx]]
            mapping = {_normalize_header(source): _normalize_header(target) for source, target in (column_mapping or {}).items()}
            resolved_headers = {
                idx: mapping.get(_normalize_header(name), HEADER_ALIASES.get(_normalize_header(name), _normalize_header(name)))
                for idx, name in enumerate(raw_fieldnames) if name
            }
            
            available = set(resolved_headers.values())
            missing = REQUIRED_CSV_COLUMNS - available
            if missing:
                return [], [ProductImportRowError(row=1, message=f"Missing required spreadsheet columns: {', '.join(sorted(missing))}.")]

            for row_number, row in enumerate(all_rows[header_row_idx + 1:], start=header_row_idx + 2):
                if not any(cell is not None and str(cell).strip() for cell in row):
                    continue
                row_dict = {}
                for col_idx, col_name in resolved_headers.items():
                    val = row[col_idx] if col_idx < len(row) else ""
                    row_dict[col_name] = str(val if val is not None else "").strip()
                raw_rows_data.append((row_number, row_dict))
        except Exception as exc:
            return [], [ProductImportRowError(row=1, message=f"Unable to read Excel file: {str(exc)}")]
    else:
        # CSV parsing
        try:
            text = contents.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                text = contents.decode("latin-1")
            except Exception:
                return [], [ProductImportRowError(row=1, message="File must be UTF-8 or Excel (.xlsx) format.")]
        try:
            reader = csv.DictReader(io.StringIO(text))
            if not reader.fieldnames:
                return [], [ProductImportRowError(row=1, message="File must include a header row.")]
            mapping = {_normalize_header(source): _normalize_header(target) for source, target in (column_mapping or {}).items()}
            resolved_headers = {
                source: mapping.get(_normalize_header(source), HEADER_ALIASES.get(_normalize_header(source), _normalize_header(source)))
                for source in reader.fieldnames if source
            }
            available = set(resolved_headers.values())
            missing = REQUIRED_CSV_COLUMNS - available
            if missing:
                return [], [ProductImportRowError(row=1, message=f"Missing required spreadsheet columns: {', '.join(sorted(missing))}.")]

            for row_number, raw_row in enumerate(reader, start=2):
                if not any((value or "").strip() for value in raw_row.values()):
                    continue
                row_dict = {destination: (raw_row.get(source) or "").strip() for source, destination in resolved_headers.items()}
                raw_rows_data.append((row_number, row_dict))
        except csv.Error as exc:
            return [], [ProductImportRowError(row=1, message=f"Invalid CSV format: {exc}")]

    products: list[tuple[int, dict]] = []
    errors: list[ProductImportRowError] = []
    seen_skus: set[str] = set()

    for row_number, raw in raw_rows_data:
        # Auto-truncate string fields to schema maximums
        if raw.get("name"):
            raw["name"] = str(raw["name"]).strip()[:200]
        if raw.get("category"):
            raw["category"] = str(raw["category"]).strip()[:100]
        if raw.get("sku"):
            raw["sku"] = str(raw["sku"]).strip()[:100]

        # Auto-default description if omitted
        if not raw.get("description"):
            prod_name = raw.get("name", "Product")
            raw["description"] = f"{prod_name} - Premium quality e-commerce product."
        else:
            raw["description"] = str(raw["description"]).strip()[:4900]

        # Clean price & cost_price
        if raw.get("price"):
            raw["price"] = _clean_numeric_string(raw.get("price"))
        if raw.get("cost_price"):
            raw["cost_price"] = _clean_numeric_string(raw.get("cost_price"))
        if raw.get("compare_at_price"):
            raw["compare_at_price"] = _clean_numeric_string(raw.get("compare_at_price"))

        # Default stock if blank
        if not raw.get("stock_quantity") or raw.get("stock_quantity") == "":
            raw["stock_quantity"] = 100
        else:
            try:
                raw["stock_quantity"] = int(float(str(raw["stock_quantity"]).strip()))
            except Exception:
                raw["stock_quantity"] = 100

        if raw.get("image_urls"):
            raw["images"] = [{"url": url.strip(), "position": index} for index, url in enumerate(raw.pop("image_urls").split("|")) if url.strip()]
        
        # Support comma, pipe, or newline for features and pain points
        if raw.get("features"):
            feat_text = raw["features"].replace("|", ",").replace("\n", ",")
            raw["features"] = [f.strip() for f in feat_text.split(",") if f.strip()][:10]
        if raw.get("pain_points"):
            pain_text = raw["pain_points"].replace("|", ",").replace("\n", ",")
            raw["pain_points"] = [p.strip() for p in pain_text.split(",") if p.strip()][:10]

        for optional_field in ("category", "sku", "compare_at_price", "cost_price", "status", "priority"):
            if raw.get(optional_field) == "":
                raw.pop(optional_field, None)
        try:
            product = ProductCreateRequest.model_validate(raw)
            values = product.model_dump(mode="json")
            sku = values.get("sku")
            if sku and sku.casefold() in seen_skus:
                errors.append(ProductImportRowError(row=row_number, message=f"Duplicate SKU '{sku}' appears in this file."))
            else:
                if sku:
                    seen_skus.add(sku.casefold())
                products.append((row_number, values))
        except Exception as exc:
            errors.append(ProductImportRowError(row=row_number, message=_csv_error_message(exc)))

    if not products and not errors:
        errors.append(ProductImportRowError(row=1, message="Spreadsheet contains no product rows."))
    return products, errors


def parse_product_csv(contents: bytes, column_mapping: dict[str, str] | None = None) -> tuple[list[tuple[int, dict]], list[ProductImportRowError]]:
    """Legacy wrapper for backward compatibility."""
    return parse_product_spreadsheet(contents, filename="products.csv", column_mapping=column_mapping)


@router.get("/import/template", response_class=Response)
def download_import_template(current_user: CurrentUser) -> Response:
    _require_manager(current_user)
    template = "Product Name,Price,Cost Price,Stock Quantity,Category,Pain Points,Features,Description,SKU\n"
    template += "2-in-1 Rechargeable Hair Remover,2000,1200,100,Personal Care,Peach fuzz ruins makeup|Painful waxing|Sensitive skin,Painless micro-blade|USB rechargeable|Built-in LED,Painless facial hair remover for smooth makeup application.,HR-001\n"
    template += "Soothing Facial Serum Kit,3200,1500,60,Skincare,Redness after hair removal|Dry patchy skin,Organic aloe vera|Hyaluronic acid|Non-comedogenic,Hydrating serum to lock in moisture after treatment.,SERUM-002\n"
    return Response(content=template, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=marketpilot-products-template.csv"})


@router.get("/import/template/excel", response_class=Response)
@router.get("/import/template.xlsx", response_class=Response)
def download_excel_template(current_user: CurrentUser) -> Response:
    _require_manager(current_user)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Product Catalogue"

    headers = ["Product Name", "Price", "Cost Price", "Stock Quantity", "Category", "Pain Points", "Features", "Description", "SKU"]
    ws.append(headers)
    ws.append([
        "2-in-1 Rechargeable Hair Remover",
        2000,
        1200,
        100,
        "Personal Care",
        "Peach fuzz ruins makeup, Painful waxing, Skin burns",
        "Painless micro-blade, USB rechargeable, Built-in LED",
        "Instant painless hair remover for smooth makeup application.",
        "HR-001",
    ])
    ws.append([
        "Soothing Facial Serum Kit",
        3200,
        1500,
        60,
        "Skincare",
        "Redness after hair removal, Dry patchy skin, Irritation",
        "Organic aloe vera, Hyaluronic acid, Non-comedogenic",
        "Hydrating soothing serum to lock in moisture.",
        "SERUM-002",
    ])

    header_fill = openpyxl.styles.PatternFill(start_color="059669", end_color="059669", fill_type="solid")
    header_font = openpyxl.styles.Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = openpyxl.styles.Alignment(horizontal="center", vertical="center")

    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=marketpilot-products-template.xlsx"}
    )


@router.post("/import/csv", response_model=ProductCsvImportResponse)
@router.post("/import/excel", response_model=ProductCsvImportResponse)
async def import_products_spreadsheet(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    on_duplicate: CsvDuplicateStrategy = Query(default=CsvDuplicateStrategy.SKIP),
    column_mapping: str | None = Form(default=None),
) -> ProductCsvImportResponse:
    _require_manager(current_user)
    fn = (file.filename or "").lower()
    if not (fn.endswith(".csv") or fn.endswith(".xlsx") or fn.endswith(".xls")):
        raise HTTPException(status_code=415, detail="Upload a valid spreadsheet (.xlsx or .csv file).")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is too large. Maximum size is 10 MB.")
    try:
        mapping = None if column_mapping is None else json.loads(column_mapping)
        if mapping is not None and (not isinstance(mapping, dict) or not all(isinstance(key, str) and isinstance(value, str) for key, value in mapping.items())):
            raise ValueError
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=422, detail="column_mapping must be a JSON object, for example {\"Product Name\": \"name\"}.")

    products, errors = parse_product_spreadsheet(contents, filename=file.filename or "", column_mapping=mapping)
    if len(products) + len(errors) > 500:
        raise HTTPException(status_code=413, detail="Spreadsheet can contain at most 500 product rows.")
    if errors:
        return ProductCsvImportResponse(imported=0, skipped=0, errors=errors, message="Nothing was imported. Fix the listed rows and upload again.")

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
    if not values.get("description") or not values["description"].strip():
        values["description"] = f"{values.get('name', 'Product')} - High quality store product."
    if values.get("features") is None:
        values["features"] = []
    if values.get("pain_points") is None:
        values["pain_points"] = []
    if values.get("images") is None:
        values["images"] = []
    try:
        result = get_service_client().table("products").insert(values).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to insert product record.")
        row = result.data[0]
        if row.get("profit_margin") is None and row.get("price") and row.get("cost_price"):
            try:
                p = float(row["price"])
                c = float(row["cost_price"])
                if p > 0:
                    row["profit_margin"] = round(((p - c) / p) * 100, 2)
            except Exception:
                pass
        return Product.model_validate(row)
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        if "products_workspace_id_sku_key" in str(exc):
            raise HTTPException(status_code=409, detail="A product with this SKU already exists in this workspace.") from exc
        # Fallback if 004b optional columns (features/pain_points/cost_price) are not present in table
        err_str = str(exc).lower()
        if any(col in err_str for col in ["features", "pain_points", "cost_price"]):
            try:
                fallback_values = {k: v for k, v in values.items() if k not in {"features", "pain_points", "cost_price"}}
                result = get_service_client().table("products").insert(fallback_values).execute()
                if result.data:
                    return Product.model_validate(result.data[0])
            except Exception:
                pass
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
        products: list[Product] = []
        for row in (result.data or []):
            if row.get("profit_margin") is None and row.get("price") and row.get("cost_price"):
                try:
                    p = float(row["price"])
                    c = float(row["cost_price"])
                    if p > 0:
                        row["profit_margin"] = round(((p - c) / p) * 100, 2)
                except Exception:
                    pass
            products.append(Product.model_validate(row))
        return products
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
