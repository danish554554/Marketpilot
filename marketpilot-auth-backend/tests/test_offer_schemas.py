from datetime import date

import pytest
from pydantic import ValidationError

from app.schemas import DiscountType, OfferCreateRequest, OfferStatus, OfferUpdateRequest


def valid_offer() -> dict:
    return {
        "title": "  Eid Sale 30% Off  ",
        "description": "  Special Eid promotion on all drinkware  ",
        "discount_type": DiscountType.PERCENTAGE,
        "discount_value": "30.00",
        "minimum_order_value": "50.00",
        "start_date": date(2026, 3, 28),
        "end_date": date(2026, 4, 5),
        "status": OfferStatus.DRAFT,
    }


def test_offer_normalizes_title() -> None:
    offer = OfferCreateRequest(**valid_offer())
    assert offer.title == "Eid Sale 30% Off"
    assert offer.description == "Special Eid promotion on all drinkware"


def test_offer_accepts_workspace_wide_without_product_id() -> None:
    offer = OfferCreateRequest(**valid_offer())
    assert offer.product_id is None


def test_offer_rejects_end_before_start() -> None:
    data = valid_offer()
    data["start_date"] = date(2026, 4, 10)
    data["end_date"] = date(2026, 4, 5)
    with pytest.raises(ValidationError):
        OfferCreateRequest(**data)


def test_offer_accepts_same_start_and_end_date() -> None:
    data = valid_offer()
    data["start_date"] = date(2026, 4, 5)
    data["end_date"] = date(2026, 4, 5)
    offer = OfferCreateRequest(**data)
    assert offer.start_date == offer.end_date


def test_offer_rejects_zero_discount_value() -> None:
    data = valid_offer()
    data["discount_value"] = "0"
    with pytest.raises(ValidationError):
        OfferCreateRequest(**data)


def test_offer_rejects_blank_title() -> None:
    data = valid_offer()
    data["title"] = "   "
    with pytest.raises(ValidationError):
        OfferCreateRequest(**data)


def test_offer_update_accepts_partial_changes() -> None:
    update = OfferUpdateRequest(status=OfferStatus.ACTIVE, discount_value="25.00")
    dumped = update.model_dump(exclude_unset=True)
    assert dumped["status"] == OfferStatus.ACTIVE
    assert "discount_value" in dumped
