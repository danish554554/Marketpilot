import re
from uuid import UUID

from app.schemas import (
    GuardrailEvaluationResult,
    GuardrailStatus,
    GuardrailViolation,
    GuardrailViolationType,
    PlannerProduct,
    StrategicRecommendation,
    StructuredContext,
    TrendSignal,
)


class GuardrailsEngine:
    """
    Evaluates generated marketing content and recommendations against
    business guardrails (brand voice, prohibited words, in-stock product grounding,
    and verified trend signals).
    """

    @staticmethod
    def sanitize_prohibited_words(content: str, prohibited_words: list[str]) -> tuple[str, list[str]]:
        """
        Replaces prohibited words in text with '[REDACTED]' or removes them,
        returning the sanitized string and the list of detected prohibited words.
        """
        sanitized = content
        detected: list[str] = []
        for word in prohibited_words:
            cleaned = word.strip()
            if not cleaned:
                continue
            pattern = re.compile(rf"\b{re.escape(cleaned)}\b", re.IGNORECASE)
            if pattern.search(sanitized):
                detected.append(cleaned)
                sanitized = pattern.sub("[REDACTED]", sanitized)
        return sanitized, detected

    @classmethod
    def evaluate_text_content(
        cls,
        text: str,
        prohibited_words: list[str],
        allowed_products: list[PlannerProduct] | None = None,
        allowed_trends: list[TrendSignal] | None = None,
        auto_sanitize: bool = False,
    ) -> GuardrailEvaluationResult:
        """
        Evaluates a raw string of marketing content against prohibited words and available entities.
        """
        violations: list[GuardrailViolation] = []
        sanitized_text: str | None = None

        # 1. Prohibited words check
        sanitized, detected_words = cls.sanitize_prohibited_words(text, prohibited_words)
        if detected_words:
            for dw in detected_words:
                violations.append(
                    GuardrailViolation(
                        violation_type=GuardrailViolationType.prohibited_word,
                        severity="error",
                        offending_text=dw,
                        description=f"Content contains prohibited brand word '{dw}'.",
                        suggested_fix=f"Remove or replace '{dw}' with an approved alternative.",
                    )
                )
            if auto_sanitize:
                sanitized_text = sanitized

        # Determine overall status
        status = GuardrailStatus.passed
        if violations:
            status = GuardrailStatus.sanitized if auto_sanitize else GuardrailStatus.failed

        return GuardrailEvaluationResult(
            status=status,
            violations=violations,
            passed=len([v for v in violations if v.severity == "error"]) == 0 or (auto_sanitize and status == GuardrailStatus.sanitized),
            sanitized_content=sanitized_text if auto_sanitize else None,
        )

    @classmethod
    def evaluate_recommendation(
        cls,
        rec: StrategicRecommendation,
        context: StructuredContext,
        auto_sanitize: bool = True,
    ) -> tuple[StrategicRecommendation, list[GuardrailViolation]]:
        """
        Evaluates a structured recommendation against context rules:
        - Prohibited words
        - Product grounding (must exist, must have stock > 0)
        - Trend grounding (must exist in verified signals)
        - Offer grounding (must be active)
        """
        violations: list[GuardrailViolation] = []
        flags: list[str] = list(rec.guardrail_flags)

        # 1. Check prohibited words in headline, angle, content_body, cta
        combined_text = f"{rec.headline} {rec.angle} {rec.content_body} {rec.call_to_action}"
        sanitized_body, detected_words = cls.sanitize_prohibited_words(rec.content_body, context.prohibited_words)
        _, detected_headline = cls.sanitize_prohibited_words(rec.headline, context.prohibited_words)
        _, detected_angle = cls.sanitize_prohibited_words(rec.angle, context.prohibited_words)
        _, detected_cta = cls.sanitize_prohibited_words(rec.call_to_action, context.prohibited_words)

        all_detected = list(set(detected_words + detected_headline + detected_angle + detected_cta))
        if all_detected:
            for dw in all_detected:
                violations.append(
                    GuardrailViolation(
                        violation_type=GuardrailViolationType.prohibited_word,
                        severity="error",
                        offending_text=dw,
                        description=f"Recommendation contains prohibited word '{dw}'.",
                        suggested_fix=f"Replace '{dw}' with on-brand vocabulary.",
                    )
                )
            flags.append(f"prohibited_words_detected:{','.join(all_detected)}")
            if auto_sanitize:
                rec.content_body = sanitized_body
                rec.headline, _ = cls.sanitize_prohibited_words(rec.headline, context.prohibited_words)
                rec.angle, _ = cls.sanitize_prohibited_words(rec.angle, context.prohibited_words)
                rec.call_to_action, _ = cls.sanitize_prohibited_words(rec.call_to_action, context.prohibited_words)

        # 2. Product grounding check
        if rec.product_id:
            matching_prods = [p for p in context.available_products if p.id == rec.product_id]
            if not matching_prods:
                violations.append(
                    GuardrailViolation(
                        violation_type=GuardrailViolationType.hallucinated_product,
                        severity="error",
                        offending_text=str(rec.product_id),
                        description=f"Referenced product ID '{rec.product_id}' is not in active in-stock inventory.",
                        suggested_fix="Select an active in-stock product from the catalogue.",
                    )
                )
                flags.append("hallucinated_or_unstocked_product")
            else:
                prod = matching_prods[0]
                if prod.stock_quantity <= 0:
                    violations.append(
                        GuardrailViolation(
                            violation_type=GuardrailViolationType.out_of_stock_product,
                            severity="error",
                            offending_text=prod.name,
                            description=f"Product '{prod.name}' is out of stock (quantity={prod.stock_quantity}).",
                            suggested_fix="Do not market out of stock items.",
                        )
                    )
                    flags.append("out_of_stock_product")
                rec.product_name = prod.name

        # 3. Trend grounding check
        if rec.trend_signal_id:
            matching_trends = [t for t in context.matched_trends if t.id == rec.trend_signal_id]
            if not matching_trends:
                violations.append(
                    GuardrailViolation(
                        violation_type=GuardrailViolationType.ungrounded_trend,
                        severity="warning",
                        offending_text=str(rec.trend_signal_id),
                        description=f"Referenced trend signal ID '{rec.trend_signal_id}' was not found in verified signals.",
                        suggested_fix="Reference verified trend signal ID with grounded evidence.",
                    )
                )
                flags.append("unverified_trend_signal")
            else:
                trend = matching_trends[0]
                rec.trend_topic = trend.topic

        # 4. Offer grounding check
        if rec.offer_id:
            matching_offers = [o for o in context.active_offers if o.id == rec.offer_id]
            if not matching_offers:
                violations.append(
                    GuardrailViolation(
                        violation_type=GuardrailViolationType.price_mismatch,
                        severity="warning",
                        offending_text=str(rec.offer_id),
                        description=f"Referenced offer ID '{rec.offer_id}' is not active or valid.",
                        suggested_fix="Ensure offer is currently active.",
                    )
                )
                flags.append("inactive_offer_referenced")
            else:
                rec.offer_title = matching_offers[0].title

        # 5. Professional Rationale Verification
        if not rec.rationale or not rec.rationale.overall_rationale:
            violations.append(
                GuardrailViolation(
                    violation_type=GuardrailViolationType.brand_voice_drift,
                    severity="warning",
                    offending_text="missing_rationale",
                    description="Recommendation lacks a strategic rationale explanation.",
                    suggested_fix="Provide a grounded justification for margin, inventory, or trend alignment.",
                )
            )
            flags.append("lacks_strategic_rationale")

        rec.guardrail_flags = flags
        return rec, violations

    @classmethod
    def evaluate_batch(
        cls,
        recommendations: list[StrategicRecommendation],
        context: StructuredContext,
        auto_sanitize: bool = True,
    ) -> tuple[list[StrategicRecommendation], GuardrailEvaluationResult]:
        """
        Evaluates a batch of recommendations and compiles the global guardrail audit result.
        """
        all_violations: list[GuardrailViolation] = []
        processed_recs: list[StrategicRecommendation] = []

        for rec in recommendations:
            evaluated_rec, rec_violations = cls.evaluate_recommendation(rec, context, auto_sanitize=auto_sanitize)
            processed_recs.append(evaluated_rec)
            all_violations.extend(rec_violations)

        error_count = len([v for v in all_violations if v.severity == "error"])
        warning_count = len([v for v in all_violations if v.severity == "warning"])

        if error_count == 0 and warning_count == 0:
            overall_status = GuardrailStatus.passed
        elif error_count == 0 and warning_count > 0:
            overall_status = GuardrailStatus.warnings
        elif auto_sanitize and error_count > 0 and all(v.violation_type == GuardrailViolationType.prohibited_word for v in all_violations if v.severity == "error"):
            overall_status = GuardrailStatus.sanitized
        else:
            overall_status = GuardrailStatus.failed

        return processed_recs, GuardrailEvaluationResult(
            status=overall_status,
            violations=all_violations,
            passed=overall_status in (GuardrailStatus.passed, GuardrailStatus.warnings, GuardrailStatus.sanitized),
        )
