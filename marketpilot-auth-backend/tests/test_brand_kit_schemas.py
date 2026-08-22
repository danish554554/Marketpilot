import pytest
from pydantic import ValidationError

from app.schemas import BrandKitCreateRequest, BrandKitUpdateRequest


def valid_brand_kit() -> dict:
    return {
        "brand_voice": "  Helpful and confident  ",
        "preferred_language": " English ",
        "target_audience": "  Ecommerce sellers in Pakistan  ",
        "content_style": " Educational short-form video ",
        "brand_tone": ["Friendly", "Practical"],
        "primary_colors": ["#1a73e8"],
        "secondary_colors": ["#fbbc04"],
        "fonts": ["Inter"],
        "preferred_ctas": ["Shop now"],
        "prohibited_words": ["guaranteed"],
        "approved_caption_examples": ["Make your product work harder."],
        "logo_url": "https://example.com/logo.png",
    }


def test_brand_kit_normalizes_text_and_colors() -> None:
    brand_kit = BrandKitCreateRequest(**valid_brand_kit())
    assert brand_kit.brand_voice == "Helpful and confident"
    assert brand_kit.primary_colors == ["#1A73E8"]


@pytest.mark.parametrize("field,value", [("primary_colors", ["blue"]), ("brand_tone", ["   "]), ("target_audience", " ")])
def test_brand_kit_rejects_invalid_values(field: str, value: object) -> None:
    data = valid_brand_kit()
    data[field] = value
    with pytest.raises(ValidationError):
        BrandKitCreateRequest(**data)


def test_brand_kit_update_accepts_partial_changes() -> None:
    update = BrandKitUpdateRequest(primary_colors=["#123abc"])
    assert update.model_dump(exclude_unset=True) == {"primary_colors": ["#123ABC"]}
