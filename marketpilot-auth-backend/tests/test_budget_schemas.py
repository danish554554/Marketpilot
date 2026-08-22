from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas import MarketingBudgetCreateRequest, MarketingBudgetUpdateRequest


def valid_budget() -> dict:
    return {
        "total_monthly_budget": "5000.00",
        "organic_percentage": "70.00",
        "paid_percentage": "30.00",
        "currency": "pkr",
        "notes": "Monthly marketing budget for Q3",
    }


def test_budget_normalizes_currency() -> None:
    budget = MarketingBudgetCreateRequest(**valid_budget())
    assert budget.currency == "PKR"


def test_budget_accepts_default_split() -> None:
    budget = MarketingBudgetCreateRequest(total_monthly_budget="2000.00", currency="USD")
    assert budget.organic_percentage == Decimal("70.00")
    assert budget.paid_percentage == Decimal("30.00")


def test_budget_rejects_split_not_summing_to_100() -> None:
    data = valid_budget()
    data["organic_percentage"] = "60.00"
    data["paid_percentage"] = "30.00"
    with pytest.raises(ValidationError, match="sum to 100"):
        MarketingBudgetCreateRequest(**data)


def test_budget_accepts_all_organic() -> None:
    data = valid_budget()
    data["organic_percentage"] = "100.00"
    data["paid_percentage"] = "0.00"
    budget = MarketingBudgetCreateRequest(**data)
    assert budget.organic_percentage == Decimal("100.00")
    assert budget.paid_percentage == Decimal("0.00")


def test_budget_accepts_all_paid() -> None:
    data = valid_budget()
    data["organic_percentage"] = "0.00"
    data["paid_percentage"] = "100.00"
    budget = MarketingBudgetCreateRequest(**data)
    assert budget.organic_percentage == Decimal("0.00")


def test_budget_rejects_negative_total() -> None:
    data = valid_budget()
    data["total_monthly_budget"] = "-100.00"
    with pytest.raises(ValidationError):
        MarketingBudgetCreateRequest(**data)


def test_budget_accepts_zero_total() -> None:
    data = valid_budget()
    data["total_monthly_budget"] = "0.00"
    budget = MarketingBudgetCreateRequest(**data)
    assert budget.total_monthly_budget == Decimal("0.00")


def test_budget_rejects_invalid_currency() -> None:
    data = valid_budget()
    data["currency"] = "12"
    with pytest.raises(ValidationError):
        MarketingBudgetCreateRequest(**data)


def test_budget_update_accepts_partial_changes() -> None:
    update = MarketingBudgetUpdateRequest(total_monthly_budget="8000.00")
    dumped = update.model_dump(exclude_unset=True)
    assert dumped["total_monthly_budget"] == Decimal("8000.00")
    assert "organic_percentage" not in dumped
