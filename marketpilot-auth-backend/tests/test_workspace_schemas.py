import pytest
from pydantic import ValidationError

from app.schemas import MarketingObjective, WorkspaceCreateRequest, WorkspaceUpdateRequest


def valid_workspace() -> dict:
    return {
        "business_name": "  MarketPilot Store  ",
        "industry": "  Ecommerce  ",
        "website": "https://example.com",
        "country": "pk",
        "currency": "pkr",
        "target_market": "  Pakistani online shoppers  ",
        "business_description": "  An online shop for useful products.  ",
        "marketing_objectives": [MarketingObjective.INCREASE_SALES],
    }


def test_workspace_request_normalizes_codes_and_text() -> None:
    workspace = WorkspaceCreateRequest(**valid_workspace())
    assert workspace.business_name == "MarketPilot Store"
    assert workspace.country == "PK"
    assert workspace.currency == "PKR"


@pytest.mark.parametrize("field,value", [("country", "PAK"), ("currency", "Rs"), ("business_name", "   ")])
def test_workspace_request_rejects_invalid_required_values(field: str, value: str) -> None:
    data = valid_workspace()
    data[field] = value
    with pytest.raises(ValidationError):
        WorkspaceCreateRequest(**data)


def test_workspace_update_accepts_only_changed_fields() -> None:
    update = WorkspaceUpdateRequest(currency="usd")
    assert update.model_dump(exclude_unset=True) == {"currency": "USD"}
