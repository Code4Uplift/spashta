import math
import hashlib
import json
from typing import Dict, Any, List, Tuple


def sigmoid(z: float) -> float:
    # Bound z to avoid overflow with exp(-z)
    z_clamped = max(-500.0, min(500.0, z))
    return 1.0 / (1.0 + math.exp(-z_clamped))


def calculate_shapley(features: List[Dict[str, Any]], intercept: float = 0.0) -> Dict[str, Any]:
    """
    Computes Aumann-Shapley continuous marginal attributions for linear-logistic models.
    Guarantees the efficiency axiom: sum(phi_i) == full_prob - baseline_prob
    """
    baseline_z = intercept
    for f in features:
        baseline_z += f["coef"] * f["base"]
    baseline_prob = sigmoid(baseline_z)

    target_z = intercept
    for f in features:
        target_z += f["coef"] * f["value"]
    full_prob = sigmoid(target_z)

    delta_z = target_z - baseline_z

    eps = 1e-9
    if abs(delta_z) < eps:
        secant_slope = baseline_prob * (1.0 - baseline_prob)
    else:
        secant_slope = (full_prob - baseline_prob) / delta_z

    shapley_values = []
    for f in features:
        delta = f["coef"] * (f["value"] - f["base"])
        shapley_values.append(delta * secant_slope)

    return {
        "shap": shapley_values,
        "baseline": baseline_prob,
        "full": full_prob,
        "deltaZ": delta_z
    }


DOMAINS: Dict[str, Dict[str, Any]] = {
    "rbi": {
        "key": "rbi",
        "name": "RBI",
        "fullName": "Reserve Bank of India",
        "certPrefix": "RBI/XAI-CREDIT",
        "intercept": -4.395,
        "intro": "Evaluates applicant creditworthiness under <b>RBI Master Direction on Credit Card and Debit Card Issuance (2022)</b> & Digital Lending Guidelines.",
        "citation": "Clause 6.2 (Explainability in Automated Underwriting) & RBI Fair Lending Practices Code 2023.",
        "decisionWord": {
            "pos": "CREDIT APPROVED",
            "neg": "CREDIT REJECTED"
        },
        "decisionVerb": "credit card / personal loan application",
        "fields": [
            {
                "key": "score",
                "label": "CIBIL / Credit Score",
                "flabel": "Credit Score",
                "min": 300.0, "max": 900.0, "step": 5.0, "base": 650.0, "coef": 0.008, "type": "range"
            },
            {
                "key": "loan_amount",
                "label": "Requested Loan Amount (₹)",
                "flabel": "Requested Loan Amount",
                "min": 10000.0, "max": 2500000.0, "step": 10000.0, "base": 500000.0, "coef": -0.0000008, "type": "range"
            },
            {
                "key": "income",
                "label": "Monthly Income (₹)",
                "flabel": "Monthly Income",
                "min": 500.0, "max": 300000.0, "step": 500.0, "base": 45000.0, "coef": 0.000015, "type": "range"
            },
            {
                "key": "foir",
                "label": "Existing Obligation (FOIR %)",
                "flabel": "Debt Ratio (FOIR)",
                "min": 10.0, "max": 90.0, "step": 1.0, "base": 45.0, "coef": -0.03, "type": "range"
            },
            {
                "key": "delinquency",
                "label": "Past 90-Day DPD (Delinquency)",
                "flabel": "Past 90D Delinquencies",
                "base": 0.0, "coef": -1.0, "type": "select",
                "allowed_values": [0.0, 1.0, 2.0]
            },
            {
                "key": "emp_status",
                "label": "Employment Type",
                "flabel": "Employment Category",
                "base": 1.0, "coef": 0.4, "type": "select",
                "allowed_values": [2.0, 1.0, 0.5, -0.5]
            }
        ]
    },
    "irdai": {
        "key": "irdai",
        "name": "IRDAI",
        "fullName": "Insurance Regulatory & Development Authority of India",
        "certPrefix": "IRDAI/XAI-CLAIM",
        "intercept": 0.75,
        "intro": "Evaluates health & motor insurance claim settlement validity under <b>IRDAI Protection of Policyholders Interests Regulations 2024</b>.",
        "citation": "Section 14(2) (Fair & Transparent Automated Claims Adjudication) & Policyholder Protection Act.",
        "decisionWord": {
            "pos": "CLAIM APPROVED",
            "neg": "CLAIM FLAGGED / REJECTED"
        },
        "decisionVerb": "insurance claim settlement",
        "fields": [
            {
                "key": "tenure",
                "label": "Policy Vintage (Years)",
                "flabel": "Policy Tenure",
                "min": 0.0, "max": 15.0, "step": 0.5, "base": 3.0, "coef": 0.12, "type": "range"
            },
            {
                "key": "amount",
                "label": "Claim Amount (₹)",
                "flabel": "Claim Value",
                "min": 10000.0, "max": 1000000.0, "step": 10000.0, "base": 150000.0, "coef": -0.0000015, "type": "range"
            },
            {
                "key": "network",
                "label": "Network Hospital / Garage",
                "flabel": "Network Facility Status",
                "base": 1.0, "coef": 0.9, "type": "toggle",
                "allowed_values": [0.0, 1.0]
            },
            {
                "key": "pre_existing",
                "label": "Pre-existing Disease Declared",
                "flabel": "Pre-existing Condition Disclosure",
                "base": 1.0, "coef": 1.6, "type": "toggle",
                "allowed_values": [0.0, 1.0]
            },
            {
                "key": "fraud_score",
                "label": "Anomaly / Risk Index (%)",
                "flabel": "Claim Anomaly Score",
                "min": 0.0, "max": 100.0, "step": 5.0, "base": 15.0, "coef": -0.062, "type": "range"
            }
        ]
    },
    "sebi": {
        "key": "sebi",
        "name": "SEBI",
        "fullName": "Securities and Exchange Board of India",
        "certPrefix": "SEBI/XAI-SUIT",
        "intercept": 0.3,
        "intro": "Evaluates retail investor risk suitability for structured products under <b>SEBI Investment Advisers Regulations (2020 Amendment)</b>.",
        "citation": "Regulation 16 (Suitability & Risk Profiling of Retail Investors) & SEBI Cybersecurity Circular.",
        "decisionWord": {
            "pos": "PRODUCT SUITABLE",
            "neg": "RISK MISMATCH / UNSUITABLE"
        },
        "decisionVerb": "investment product advisory recommendation",
        "fields": [
            {
                "key": "risk_appetite",
                "label": "Investor Risk Tolerance (1-100)",
                "flabel": "Risk Tolerance Score",
                "min": 10.0, "max": 100.0, "step": 5.0, "base": 60.0, "coef": 0.045, "type": "range"
            },
            {
                "key": "income",
                "label": "Annual Net Worth / Income (₹)",
                "flabel": "Annual Net Worth",
                "min": 200000.0, "max": 5000000.0, "step": 100000.0, "base": 1200000.0, "coef": 0.0000004, "type": "range"
            },
            {
                "key": "concentration",
                "label": "Portfolio Concentration (%)",
                "flabel": "Portfolio Exposure",
                "min": 5.0, "max": 90.0, "step": 5.0, "base": 30.0, "coef": -0.025, "type": "range"
            },
            {
                "key": "horizon",
                "label": "Investment Horizon (Years)",
                "flabel": "Investment Tenure",
                "min": 1.0, "max": 20.0, "step": 1.0, "base": 7.0, "coef": 0.1, "type": "range"
            },
            {
                "key": "risk_category",
                "label": "Product Risk Meter Level",
                "flabel": "Product Risk Category",
                "base": 3.0, "coef": -0.9, "type": "select",
                "allowed_values": [1.0, 3.0, 5.0]
            }
        ]
    },
    "pfrda": {
        "key": "pfrda",
        "name": "PFRDA",
        "fullName": "Pension Fund Regulatory and Development Authority",
        "certPrefix": "PFRDA/XAI-PENSION",
        "intercept": -0.45,
        "intro": "Evaluates citizen retirement pension suitability and National Pension System (NPS) asset allocation under <b>PFRDA (Retirement Adviser) Regulations 2016</b>.",
        "citation": "Regulation 14 (Suitability of Pension Schemes & Life-Cycle Fund Allocation) & PFRDA Master Circular 2023.",
        "decisionWord": {
            "pos": "PENSION PLAN SUITABLE",
            "neg": "CORPUS INADEQUATE / UNSUITABLE"
        },
        "decisionVerb": "pension scheme and annuity suitability assessment",
        "fields": [
            {
                "key": "age",
                "label": "Current Investor Age",
                "flabel": "Investor Age",
                "min": 18.0, "max": 70.0, "step": 1.0, "base": 35.0, "coef": -0.04, "type": "range"
            },
            {
                "key": "monthly_contribution",
                "label": "Monthly NPS Contribution (₹)",
                "flabel": "Monthly NPS Savings",
                "min": 500.0, "max": 100000.0, "step": 500.0, "base": 10000.0, "coef": 0.00004, "type": "range"
            },
            {
                "key": "equity_allocation",
                "label": "Active Equity Allocation (E-Class %)",
                "flabel": "Equity Exposure",
                "min": 5.0, "max": 75.0, "step": 5.0, "base": 40.0, "coef": 0.025, "type": "range"
            },
            {
                "key": "pension_target",
                "label": "Desired Monthly Pension Target (₹)",
                "flabel": "Target Monthly Pension",
                "min": 10000.0, "max": 200000.0, "step": 5000.0, "base": 45000.0, "coef": -0.00002, "type": "range"
            },
            {
                "key": "corpus_index",
                "label": "Retirement Corpus Adequacy Score",
                "flabel": "Corpus Adequacy Ratio",
                "min": 10.0, "max": 100.0, "step": 5.0, "base": 50.0, "coef": 0.035, "type": "range"
            }
        ]
    },
    "ibbi": {
        "key": "ibbi",
        "name": "IBBI",
        "fullName": "Insolvency and Bankruptcy Board of India",
        "certPrefix": "IBBI/XAI-CIRP",
        "intercept": -0.20,
        "intro": "Evaluates Corporate Insolvency Resolution Process (CIRP) resolution plan feasibility and liquidation viability under <b>Insolvency and Bankruptcy Code 2016</b>.",
        "citation": "Section 30(2) & Section 31 (Feasibility and Viability of Resolution Plan) & IBBI CIRP Regulations 2024.",
        "decisionWord": {
            "pos": "RESOLUTION PLAN VIABLE",
            "neg": "LIQUIDATION RISK / REJECTED"
        },
        "decisionVerb": "insolvency resolution plan evaluation",
        "fields": [
            {
                "key": "ev_amount",
                "label": "Resolution Enterprise Value (₹ Cr)",
                "flabel": "Offered Resolution Value",
                "min": 10.0, "max": 1000.0, "step": 10.0, "base": 150.0, "coef": 0.004, "type": "range"
            },
            {
                "key": "liquidation_coverage",
                "label": "Liquidation Value Coverage (%)",
                "flabel": "Liquidation Coverage Ratio",
                "min": 50.0, "max": 200.0, "step": 5.0, "base": 110.0, "coef": 0.015, "type": "range"
            },
            {
                "key": "timeline_months",
                "label": "Implementation Horizon (Months)",
                "flabel": "Resolution Timeline",
                "min": 3.0, "max": 36.0, "step": 1.0, "base": 12.0, "coef": -0.06, "type": "range"
            },
            {
                "key": "op_creditor_recovery",
                "label": "Operational Creditor Recovery (%)",
                "flabel": "Operational Creditor Share",
                "min": 10.0, "max": 100.0, "step": 5.0, "base": 40.0, "coef": 0.02, "type": "range"
            },
            {
                "key": "promoter_track",
                "label": "Applicant Governance / Track Record",
                "flabel": "Resolution Applicant Track Record",
                "base": 1.0, "coef": 0.45, "type": "select",
                "allowed_values": [3.0, 1.0, -1.0]
            }
        ]
    },
    "nabard": {
        "key": "nabard",
        "name": "NABARD",
        "fullName": "National Bank for Agriculture & Rural Development",
        "certPrefix": "NABARD/XAI-AGRI",
        "intercept": -0.85,
        "intro": "Evaluates smallholder farmer Kisan Credit Card (KCC) limit and agricultural crop loan viability under <b>NABARD Master Guidelines on Kisan Credit Card</b>.",
        "citation": "NABARD KCC Operational Guidelines & RBI Master Direction on Priority Sector Lending (Agriculture).",
        "decisionWord": {
            "pos": "KCC CROP LOAN APPROVED",
            "neg": "AGRI CREDIT REJECTED / HIGH RISK"
        },
        "decisionVerb": "agricultural credit and Kisan Credit Card underwriting",
        "fields": [
            {
                "key": "land_holding",
                "label": "Cultivable Land Holding (Acres)",
                "flabel": "Cultivable Land Size",
                "min": 0.5, "max": 25.0, "step": 0.5, "base": 3.5, "coef": 0.18, "type": "range"
            },
            {
                "key": "crop_value",
                "label": "Annual Harvest Market Value (₹)",
                "flabel": "Annual Harvest Yield",
                "min": 5000.0, "max": 1500000.0, "step": 5000.0, "base": 300000.0, "coef": 0.0000035, "type": "range"
            },
            {
                "key": "informal_debt",
                "label": "Informal Moneylender Debt Share (%)",
                "flabel": "Non-Institutional Debt Ratio",
                "min": 0.0, "max": 80.0, "step": 5.0, "base": 20.0, "coef": -0.04, "type": "range"
            },
            {
                "key": "irrigation_status",
                "label": "Perennial Irrigation Source Access",
                "flabel": "Irrigation Reliability",
                "base": 1.0, "coef": 0.85, "type": "toggle",
                "allowed_values": [0.0, 1.0]
            },
            {
                "key": "crop_insurance",
                "label": "PM-Fasal Bima Yojana (PMFBY) Insured",
                "flabel": "PMFBY Crop Insurance Coverage",
                "base": 1.0, "coef": 1.15, "type": "toggle",
                "allowed_values": [0.0, 1.0]
            }
        ]
    }
}


def score_domain_inputs(domain_key: str, inputs: Dict[str, float]) -> Dict[str, Any]:
    """
    Validates domain and runs Aumann-Shapley marginal attribution on the input state.
    """
    domain = DOMAINS[domain_key]
    features = []
    for f in domain["fields"]:
        val = float(inputs.get(f["key"], f["base"]))
        features.append({
            "key": f["key"],
            "flabel": f["flabel"],
            "coef": f["coef"],
            "base": f["base"],
            "value": val
        })

    shapley_result = calculate_shapley(features, domain["intercept"])
    full_prob = shapley_result["full"]
    baseline_prob = shapley_result["baseline"]
    decided = full_prob >= 0.5
    verdict = domain["decisionWord"]["pos"] if decided else domain["decisionWord"]["neg"]

    factor_breakdown = []
    for i, f in enumerate(features):
        factor_breakdown.append({
            "key": f["key"],
            "name": f["flabel"],
            "attribution": shapley_result["shap"][i],
            "value": f["value"],
            "baseline": f["base"],
            "coef": f["coef"]
        })

    return {
        "domain": domain_key,
        "full_prob": full_prob,
        "baseline_prob": baseline_prob,
        "score_pct": round(full_prob * 100),
        "baseline_pct": round(baseline_prob * 100),
        "verdict": verdict,
        "decided": decided,
        "shap_values": shapley_result["shap"],
        "factor_breakdown": factor_breakdown,
        "intercept": domain["intercept"],
        "citation": domain["citation"],
        "cert_prefix": domain["certPrefix"]
    }


def compute_cert_hash(domain_key: str, inputs: Dict[str, float], shap_result: Dict[str, Any]) -> Tuple[str, str]:
    """
    Generates deterministic SHA-256 fingerprint matching the frontend payload spec:
    { domain, intercept, inputs: [{key, value, coef, base}], baseline, full, shap }
    """
    domain = DOMAINS[domain_key]
    payload = {
        "domain": domain_key,
        "intercept": domain["intercept"],
        "inputs": [
            {
                "key": f["key"],
                "value": float(inputs.get(f["key"], f["base"])),
                "coef": f["coef"],
                "base": f["base"]
            }
            for f in domain["fields"]
        ],
        "baseline": shap_result["baseline_prob"],
        "full": shap_result["full_prob"],
        "shap": shap_result["shap_values"]
    }

    json_str = json.dumps(payload, separators=(',', ':'))
    full_sha256 = hashlib.sha256(json_str.encode('utf-8')).hexdigest().upper()
    short_id = full_sha256[:10]
    return full_sha256, short_id
