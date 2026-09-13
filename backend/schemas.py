from datetime import datetime
from typing import Dict, List, Literal, Optional, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator

try:
    from backend.shapley_engine import DOMAINS
except ImportError:
    from shapley_engine import DOMAINS

DomainType = Literal["rbi", "irdai", "sebi", "pfrda", "ibbi", "nabard"]


class ScoreRequest(BaseModel):
    domain: DomainType
    inputs: Dict[str, float] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_inputs_for_domain(self):
        domain_cfg = DOMAINS.get(self.domain)
        if not domain_cfg:
            raise ValueError(f"Unknown domain: {self.domain}")

        for field in domain_cfg["fields"]:
            key = field["key"]
            if key in self.inputs:
                val = float(self.inputs[key])
                if field.get("type") == "range":
                    min_val = field.get("min", float("-inf"))
                    max_val = field.get("max", float("inf"))
                    if val < min_val or val > max_val:
                        raise ValueError(
                            f"Field '{key}' value {val} out of range [{min_val}, {max_val}] for domain '{self.domain}'"
                        )
                elif "allowed_values" in field:
                    allowed = field["allowed_values"]
                    if not any(abs(val - a) < 1e-6 for a in allowed):
                        raise ValueError(
                            f"Field '{key}' value {val} is not in allowed choices {allowed} for domain '{self.domain}'"
                        )
            else:
                self.inputs[key] = field["base"]

        return self


class FactorAttribution(BaseModel):
    key: str
    name: str
    attribution: float
    value: float
    baseline: float
    coef: float


class ScoreResponse(BaseModel):
    domain: str
    full_prob: float
    baseline_prob: float
    score_pct: int
    baseline_pct: int
    verdict: str
    decided: bool
    shap_values: List[float]
    factor_breakdown: List[FactorAttribution]
    citation: str
    cert_prefix: str


class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "en"
    target_lang: str = "hi"


class TranslateResponse(BaseModel):
    translated_text: str
    source_lang: str
    target_lang: str
    cached: bool = False


class BatchTranslateRequest(BaseModel):
    texts: Dict[str, str] = Field(..., description="Key-value mapping of element keys to texts to translate")
    source_lang: str = "en"
    target_lang: str = "hi"


class BatchTranslateResponse(BaseModel):
    translations: Dict[str, str]
    source_lang: str
    target_lang: str
    engine: str = "gemini-1.5-flash"


class CertificateCreateRequest(BaseModel):
    domain: DomainType
    inputs: Dict[str, float] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_certificate_inputs(self):
        domain_cfg = DOMAINS.get(self.domain)
        if not domain_cfg:
            raise ValueError(f"Unknown domain: {self.domain}")

        for field in domain_cfg["fields"]:
            key = field["key"]
            if key in self.inputs:
                val = float(self.inputs[key])
                if field.get("type") == "range":
                    min_val = field.get("min", float("-inf"))
                    max_val = field.get("max", float("inf"))
                    if val < min_val or val > max_val:
                        raise ValueError(
                            f"Field '{key}' value {val} out of range [{min_val}, {max_val}] for domain '{self.domain}'"
                        )
                elif "allowed_values" in field:
                    allowed = field["allowed_values"]
                    if not any(abs(val - a) < 1e-6 for a in allowed):
                        raise ValueError(
                            f"Field '{key}' value {val} is not in allowed choices {allowed} for domain '{self.domain}'"
                        )
            else:
                self.inputs[key] = field["base"]

        return self


class CertificatePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cert_id: str
    domain: str
    verdict: str
    sha256_hash: str
    created_at: datetime


class CertificateInternal(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cert_id: str
    domain: str
    inputs: Dict[str, Any]
    coefficients: Optional[Any] = None
    shap_values: List[float]
    baseline_prob: float
    full_prob: float
    verdict: str
    sha256_hash: str
    created_at: datetime


class AccountAggregatorWebhookPayload(BaseModel):
    consent_handle: str = "AA-CONSENT-2026-SPASHTA"
    fip_id: str = "FIP-HDFC-BANK-CBS"
    financial_data: Dict[str, Any]
    domain: DomainType = "rbi"


class AccountAggregatorResponse(BaseModel):
    status: str
    consent_handle: str
    extracted_parameters: Dict[str, float]
    score_result: ScoreResponse
    verified_at: datetime


class VoiceIntentRequest(BaseModel):
    text: str
    current_domain: str = "rbi"
    language: str = "en"


class VoiceIntentResponse(BaseModel):
    domain: Optional[str] = None
    action: Optional[str] = None
    parameters: Dict[str, float] = Field(default_factory=dict)
    feedback: str
    engine: str = "tcet_coe_qwen3.6"
