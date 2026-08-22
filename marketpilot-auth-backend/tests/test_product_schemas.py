import pytest
from pydantic import ValidationError

from app.schemas import ProductCreateRequest, ProductPriority, ProductStatus, ProductUpdateRequest


def valid_product() -> dict:
    return {
        "name": "  Travel Mug  ",
        "description": "  An insulated mug for hot and cold drinks.  ",
        "category": "  Drinkware  ",
        "sku": "  MUG-001  ",
        "price": "24.99",
        "compare_at_price": "29.99",
        "cost_price": "12.50",
        "stock_quantity": 20,
        "status": ProductStatus.ACTIVE,
        "priority": ProductPriority.HIGH,
        "images": [
            {"url": "https://example.com/mug-2.jpg", "position": 1},
            {"url": "https://example.com/mug-1.jpg", "position": 0},
        ],
        "features": ["  Double-wall insulation  ", "BPA-free"],
        "pain_points": ["  Cold drinks get warm  "],
    }


def test_product_normalizes_text_and_sorts_images() -> None:
    product = ProductCreateRequest(**valid_product())
    assert product.name == "Travel Mug"
    assert product.sku == "MUG-001"
    assert [image.position for image in product.images] == [0, 1]


def test_product_normalizes_features_and_pain_points() -> None:
    product = ProductCreateRequest(**valid_product())
    assert product.features == ["Double-wall insulation", "BPA-free"]
    assert product.pain_points == ["Cold drinks get warm"]
    assert product.cost_price is not None


@pytest.mark.parametrize("field,value", [("price", "0"), ("stock_quantity", -1), ("name", " ")])
def test_product_rejects_invalid_catalogue_values(field: str, value: object) -> None:
    data = valid_product()
    data[field] = value
    with pytest.raises(ValidationError):
        ProductCreateRequest(**data)


def test_product_rejects_negative_cost_price() -> None:
    data = valid_product()
    data["cost_price"] = "-1.00"
    with pytest.raises(ValidationError):
        ProductCreateRequest(**data)


def test_product_accepts_zero_cost_price() -> None:
    data = valid_product()
    data["cost_price"] = "0.00"
    product = ProductCreateRequest(**data)
    assert product.cost_price == 0


def test_product_rejects_blank_features() -> None:
    data = valid_product()
    data["features"] = ["Good feature", "   "]
    with pytest.raises(ValidationError):
        ProductCreateRequest(**data)


def test_product_rejects_too_many_features() -> None:
    data = valid_product()
    data["features"] = [f"Feature {i}" for i in range(11)]
    with pytest.raises(ValidationError):
        ProductCreateRequest(**data)


def test_product_rejects_repeated_image_positions() -> None:
    data = valid_product()
    data["images"] = [
        {"url": "https://example.com/one.jpg", "position": 0},
        {"url": "https://example.com/two.jpg", "position": 0},
    ]
    with pytest.raises(ValidationError):
        ProductCreateRequest(**data)


def test_product_update_accepts_partial_inventory_update() -> None:
    update = ProductUpdateRequest(stock_quantity=15, status=ProductStatus.ARCHIVED)
    assert update.model_dump(exclude_unset=True) == {"stock_quantity": 15, "status": ProductStatus.ARCHIVED}


def test_product_update_accepts_cost_price_and_features() -> None:
    update = ProductUpdateRequest(cost_price="8.50", features=["Updated feature"])
    dumped = update.model_dump(exclude_unset=True)
    assert "cost_price" in dumped
    assert dumped["features"] == ["Updated feature"]

