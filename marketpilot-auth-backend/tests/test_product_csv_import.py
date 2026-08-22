from app.routers.products import parse_product_csv


def test_csv_import_parses_aliases_mapping_and_images() -> None:
    csv_contents = (
        "Product Name,Product Description,Selling Price,Inventory,Images\n"
        "Travel Mug,Insulated mug,24.99,12,https://example.com/one.jpg|https://example.com/two.jpg\n"
    ).encode()
    products, errors = parse_product_csv(csv_contents)
    assert errors == []
    row, product = products[0]
    assert row == 2
    assert product["name"] == "Travel Mug"
    assert product["stock_quantity"] == 12
    assert len(product["images"]) == 2


def test_csv_import_reports_row_errors_and_does_not_prepare_bad_product() -> None:
    csv_contents = b"name,description,price\nValid Product,Valid description,10.00\nBad Product,Description,0\n"
    products, errors = parse_product_csv(csv_contents)
    assert len(products) == 1
    assert errors[0].row == 3
    assert "price" in errors[0].message


def test_csv_import_rejects_missing_required_headers() -> None:
    products, errors = parse_product_csv(b"name,price\nTravel Mug,24.99\n")
    assert products == []
    assert errors[0].row == 1
    assert "description" in errors[0].message


def test_csv_import_rejects_duplicate_skus_inside_file() -> None:
    csv_contents = b"name,description,price,sku\nMug A,Description,10.00,MUG-1\nMug B,Description,12.00,MUG-1\n"
    products, errors = parse_product_csv(csv_contents)
    assert len(products) == 1
    assert errors[0].row == 3
    assert "Duplicate SKU" in errors[0].message


def test_csv_import_parses_cost_price_features_and_pain_points() -> None:
    csv_contents = (
        "name,description,price,cost_price,features,pain_points\n"
        "Travel Mug,Insulated mug,24.99,12.50,Double-wall insulation|BPA-free,Cold drinks get warm|Bulky mugs\n"
    ).encode()
    products, errors = parse_product_csv(csv_contents)
    assert errors == []
    row, product = products[0]
    assert row == 2
    assert product["cost_price"] == "12.50"
    assert product["features"] == ["Double-wall insulation", "BPA-free"]
    assert product["pain_points"] == ["Cold drinks get warm", "Bulky mugs"]


def test_csv_import_uses_unit_cost_alias() -> None:
    csv_contents = (
        "name,description,price,unit_cost\n"
        "Mug,Nice mug,20.00,8.00\n"
    ).encode()
    products, errors = parse_product_csv(csv_contents)
    assert errors == []
    _, product = products[0]
    assert product["cost_price"] == "8.00"

