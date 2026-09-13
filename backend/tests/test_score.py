import pytest


def test_score_requires_auth(client):
    payload = {
        "domain": "rbi",
        "inputs": {
            "score": 790,
            "loan_amount": 300000,
            "income": 120000,
            "foir": 25,
            "delinquency": 0,
            "emp_status": 2
        }
    }
    response = client.post("/score", json=payload)
    assert response.status_code == 401


def test_score_invalid_auth(client):
    payload = {
        "domain": "rbi",
        "inputs": {
            "score": 790,
            "loan_amount": 300000,
            "income": 120000,
            "foir": 25,
            "delinquency": 0,
            "emp_status": 2
        }
    }
    response = client.post("/score", json=payload, headers={"X-API-Key": "wrong-key"})
    assert response.status_code == 401


def test_score_rbi_valid(client, auth_headers):
    payload = {
        "domain": "rbi",
        "inputs": {
            "score": 790,
            "loan_amount": 300000,
            "income": 120000,
            "foir": 25,
            "delinquency": 0,
            "emp_status": 2
        }
    }
    response = client.post("/score", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["domain"] == "rbi"
    assert data["verdict"] == "CREDIT APPROVED"
    assert data["decided"] is True
    assert data["full_prob"] > data["baseline_prob"]
    assert len(data["shap_values"]) == 6
    assert len(data["factor_breakdown"]) == 6

    # Mathematical Verification: Aumann-Shapley Efficiency Axiom
    shap_sum = sum(data["shap_values"])
    prob_delta = data["full_prob"] - data["baseline_prob"]
    assert abs(shap_sum - prob_delta) < 1e-6, f"Efficiency axiom violated: sum(phi)={shap_sum}, delta_prob={prob_delta}"


def test_score_multilingual_response(client, auth_headers):
    payload = {
        "domain": "rbi",
        "inputs": {
            "score": 800,
            "loan_amount": 200000,
            "income": 100000,
            "foir": 20,
            "delinquency": 0,
            "emp_status": 2
        },
        "target_lang": "hi"
    }
    response = client.post("/score", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "rbi"
    assert data["verdict"] == "CREDIT APPROVED"
    assert "explanation" in data and len(data["explanation"]) > 0
    assert "audio_summary" in data and len(data["audio_summary"]) > 0
    assert len(data["factor_breakdown"]) == 6
    assert data["factor_breakdown"][0]["impact"] is not None



def test_score_out_of_range_input(client, auth_headers):
    payload = {
        "domain": "rbi",
        "inputs": {
            "score": 1500  # CIBIL max is 900
        }
    }
    response = client.post("/score", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_score_invalid_domain(client, auth_headers):
    payload = {
        "domain": "crypto_lending",
        "inputs": {}
    }
    response = client.post("/score", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_score_irdai_and_sebi(client, auth_headers):
    # IRDAI Test
    irdai_payload = {
        "domain": "irdai",
        "inputs": {
            "tenure": 5,
            "amount": 85000,
            "network": 1,
            "pre_existing": 1,
            "fraud_score": 5
        }
    }
    resp_irdai = client.post("/score", json=irdai_payload, headers=auth_headers)
    assert resp_irdai.status_code == 200
    data_irdai = resp_irdai.json()
    assert data_irdai["verdict"] == "CLAIM APPROVED"
    assert abs(sum(data_irdai["shap_values"]) - (data_irdai["full_prob"] - data_irdai["baseline_prob"])) < 1e-6

    # SEBI Test
    sebi_payload = {
        "domain": "sebi",
        "inputs": {
            "risk_appetite": 75,
            "income": 1800000,
            "concentration": 25,
            "horizon": 8,
            "risk_category": 3
        }
    }
    resp_sebi = client.post("/score", json=sebi_payload, headers=auth_headers)
    assert resp_sebi.status_code == 200
    data_sebi = resp_sebi.json()
    assert data_sebi["verdict"] == "PRODUCT SUITABLE"
    assert abs(sum(data_sebi["shap_values"]) - (data_sebi["full_prob"] - data_sebi["baseline_prob"])) < 1e-6


def test_score_pfrda_ibbi_nabard(client, auth_headers):
    # PFRDA (Pensions)
    pfrda_payload = {
        "domain": "pfrda",
        "inputs": {
            "age": 28,
            "monthly_contribution": 25000,
            "equity_allocation": 60,
            "pension_target": 40000,
            "corpus_index": 85
        }
    }
    resp_pfrda = client.post("/score", json=pfrda_payload, headers=auth_headers)
    assert resp_pfrda.status_code == 200
    data_pfrda = resp_pfrda.json()
    assert data_pfrda["verdict"] == "PENSION PLAN SUITABLE"
    assert abs(sum(data_pfrda["shap_values"]) - (data_pfrda["full_prob"] - data_pfrda["baseline_prob"])) < 1e-6

    # IBBI (Insolvency Resolution)
    ibbi_payload = {
        "domain": "ibbi",
        "inputs": {
            "ev_amount": 350,
            "liquidation_coverage": 140,
            "timeline_months": 9,
            "op_creditor_recovery": 65,
            "promoter_track": 3.0
        }
    }
    resp_ibbi = client.post("/score", json=ibbi_payload, headers=auth_headers)
    assert resp_ibbi.status_code == 200
    data_ibbi = resp_ibbi.json()
    assert data_ibbi["verdict"] == "RESOLUTION PLAN VIABLE"
    assert abs(sum(data_ibbi["shap_values"]) - (data_ibbi["full_prob"] - data_ibbi["baseline_prob"])) < 1e-6

    # NABARD (Kisan Agricultural Credit)
    nabard_payload = {
        "domain": "nabard",
        "inputs": {
            "land_holding": 8.5,
            "crop_value": 750000,
            "informal_debt": 5,
            "irrigation_status": 1,
            "crop_insurance": 1
        }
    }
    resp_nabard = client.post("/score", json=nabard_payload, headers=auth_headers)
    assert resp_nabard.status_code == 200
    data_nabard = resp_nabard.json()
    assert data_nabard["verdict"] == "KCC CROP LOAN APPROVED"
    assert abs(sum(data_nabard["shap_values"]) - (data_nabard["full_prob"] - data_nabard["baseline_prob"])) < 1e-6
