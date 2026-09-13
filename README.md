# SPASHTA (स्पष्ट) — Multilingual Explainable AI Platform

<div align="center">

[![Backend Tests & CI](https://github.com/Code4Uplift/spashta/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/Code4Uplift/spashta/actions/workflows/backend-tests.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg?logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel%20Live-black.svg?logo=vercel&logoColor=white)](https://spashtaa.vercel.app/)
[![Render](https://img.shields.io/badge/Backend-Render%20Live-46E3B7.svg?logo=render&logoColor=white)](https://spashta-backend.onrender.com/health)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Audit-Ready, Citizen-Centric Explainable AI (XAI) for Regulated Financial Sectors in India**  
*Democratizing algorithmic transparency across 6 regulatory authorities in 22 Eighth Schedule Indian languages.*

[🌐 Live Web Application](https://spashtaa.vercel.app/) • [⚡ Live FastAPI Backend](https://spashta-backend.onrender.com/) • [📚 Interactive Swagger API Docs](https://spashta-backend.onrender.com/docs) • [🏥 Health Check](https://spashta-backend.onrender.com/health)

</div>

---

## 📌 Executive Summary

Algorithmic decision-making in Indian financial services—such as digital loan disbursements, health insurance claims, and retail trading algorithms—frequently operates as an opaque "black box." Denied applicants and policyholders often receive arbitrary rejections without actionable justification, violating citizens' rights and drawing scrutiny under India's **Digital Personal Data Protection (DPDP) Act 2023** and sector-specific regulatory guidelines.

**SPASHTA (स्पष्ट)** is an enterprise-grade Explainable AI platform that dismantles algorithmic opacity by combining:
1. **Exact Closed-Form Aumann-Shapley Marginal Attribution Math** ($\phi_i$) that strictly satisfies the game-theoretic **Efficiency Axiom** ($\sum_i \phi_i = \Delta P$).
2. **22 Official Eighth Schedule Indian Languages** translation & dynamic regional voice synthesis.
3. **Cryptographically Sealed Audit Certificates** with dynamic scannable QR codes providing tamper-evident public verification without leaking private citizen data (Zero PII leakage).
4. **Smart Hands-Free Voice Assistant** for natural navigation across all 6 regulatory frameworks.

---

## 🏛️ 6 Regulated Financial Sectors Supported

SPASHTA implements mathematically verified explainability models across 6 major Indian regulatory authorities:

| Authority | Domain / Use-Case | Primary Regulatory Framework | Input Features Explained |
|---|---|---|---|
| **RBI** | Digital Lending & Credit Risk Underwriting | *RBI Digital Lending Guidelines (2022) & Fair Practices Code* | CIBIL Score, Monthly Income, Debt-to-Income (DTI), Unsecured Loans, Employment Tenure |
| **IRDAI** | Health & Motor Claim Adjudication | *IRDAI (Health Insurance) Regulations, 2016* | Claim Amount, Hospitalization Duration, Pre-existing Disease (PED), Network Hospital Status, Policy Tenure |
| **SEBI** | Retail Algorithmic Advisory Suitability | *SEBI (Investment Advisers) Regulations, 2013* | Annual Income, Trading Experience, Risk Tolerance, Portfolio Concentration, Leverage Ratio |
| **PFRDA** | National Pension System (NPS) Allocation | *PFRDA (Exits and Withdrawals under NPS) Regulations, 2015* | Investor Age, Monthly Contribution, NPS Tier (I/II), Equity Choice Ratio, Pension Tenure |
| **IBBI** | Corporate Insolvency & Resolution Assessment | *Insolvency and Bankruptcy Code (IBC) 2016 § 29A* | Current Ratio, Debt-to-Equity Ratio, EBITDA Margin, Interest Coverage Ratio, Promoter Share Pledge |
| **NABARD** | Kisan Credit Card (KCC) & Rural Agri-Credit | *NABARD Master Guidelines on Kisan Credit Card Scheme* | Land Holding (Acres), Crop Type Code, Annual Farm Yield, Irrigation Access, KCC Repayment History |

---

## 🧮 Mathematical Core: Aumann-Shapley Attribution

Unlike heuristic methods (like LIME or perturbation-based feature importances) which can produce non-deterministic or inconsistent attributions, SPASHTA computes exact marginal contributions using the continuous **Aumann-Shapley diagonal cost-sharing formula**:

$$\phi_i(x) = \int_0^1 \frac{\partial f}{\partial x_i}\left(x_0 + t(x - x_0)\right) dt \cdot (x_i - x_{0,i})$$

Where:
- $x \in \mathbb{R}^n$ is the applicant's normalized feature vector.
- $x_0 \in \mathbb{R}^n$ is the domain-specific neutral baseline vector.
- $f(x) = \sigma(w^T x + b) = \frac{1}{1 + e^{-(w^T x + b)}}$ is the logistic outcome probability.

### Four Game-Theoretic Axioms Satisfied:
1. **Efficiency (Completeness)**: $\sum_{i=1}^n \phi_i(x) = f(x) - f(x_0)$ (the sum of all feature contributions exactly equals the change in outcome probability from baseline).
2. **Symmetry**: If two features contribute identically along every path, their marginal attributions are identical.
3. **Dummy / Null Player**: If a feature has zero partial derivative $\frac{\partial f}{\partial x_i} = 0$, its attribution $\phi_i = 0$.
4. **Additivity**: If an outcome model is composed of sub-models $f = f_1 + f_2$, the attributions sum: $\phi_i(f) = \phi_i(f_1) + \phi_i(f_2)$.

---

## 🌟 Key Features & Capabilities

- **AI Underwriting Copilot (Conversational XAI)**: Interactive AI underwriting assistant powered by natural language understanding (with TCET CoE Qwen model integration and deterministic regex fallback). Users can speak or type complex financial queries (e.g. *"I am an applicant with CIBIL 780, monthly income 85000, looking for personal loan"*), and the copilot automatically parses parameters, updates input sliders, triggers Aumann-Shapley recalculation, and provides conversational advice.
- **Voice Note (VN) Speech Recognition with Silence Auto-Submit**: Full hands-free voice note system using Web Speech API with real-time speech waveform animations (`.vn-audio-bars`), silence timeout detection (`onend` auto-submission), and multilingual speech-to-text dictation across Indian languages.
- **Instant Sector Switching & Parameter Dictation**: Automatically switches active authority (RBI, IRDAI, SEBI, PFRDA, IBBI, NABARD) and updates sliders in real time with live streaming feedback.
- **Exact Closed-Form Aumann-Shapley Marginal Attribution Math**: Strict adherence to Efficiency, Symmetry, Additivity, and Null Player axioms, guaranteeing $\sum \phi_i = \Delta P$.
- **QR-Verified PDF Compliance Certificates**: Scannable, tamper-evident cryptographic certificates with dynamic QR deep-links (`?verify=<cert_id>`) ensuring **zero PII leakage** under India's DPDP Act 2023.
- **Indic Regional Voice Synthesis (TTS)**: Dynamic regional voice playback with Play, Pause, Resume, and Stop controls across Eighth Schedule Indian languages.
- **6-Agency Regulatory Domain Expansion**: Full mathematical models for RBI, IRDAI, SEBI, PFRDA, IBBI, and NABARD.
- **DPDP 2023 Federated Privacy Mode**: Zero-server transmission client-side sandbox toggle computing Shapley values locally on-device for maximum data privacy.

---

## 🏗️ System Architecture

```
                               ┌───────────────────────────────────┐
                               │       Vercel Static Hosting       │
                               │      (frontend/ Single Page App)  │
                               └─────────────────┬─────────────────┘
                                                 │ HTTPS / JSON
                                                 ▼
                               ┌───────────────────────────────────┐
                               │       Render Web Service          │
                               │      (FastAPI Python 3.11/3.14)   │
                               └────────┬───────────────────┬──────┘
                                        │                   │
                ┌───────────────────────┴────────┐          │
                ▼                                ▼          ▼
   ┌──────────────────────────┐     ┌─────────────────────────────┐
   │  Aumann-Shapley Engine   │     │   Supabase PostgreSQL DB    │
   │  Closed-Form Continuous  │     │   SHA-256 Ledger (Pooled)   │
   └──────────────────────────┘     └─────────────────────────────┘
```

---

## 🔌 API Specification

### Endpoints Overview

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `GET` | `/health` | None (Public) | Service uptime, supported sectors, and PostgreSQL connection ping |
| `POST` | `/score` | `X-API-Key` | Computes Aumann-Shapley attributions ($\phi_i$), outcome probability, and decision |
| `POST` | `/translate` | None (Public) | Single string translation across 22 Indian languages with server-side in-memory cache |
| `POST` | `/translate/batch` | None (Public) | Single-roundtrip batch UI dictionary translation powered by Gemini 1.5 Flash (via Google AI Studio) & parallel fallback |
| `POST` | `/certificate` | `X-API-Key` | Persists decision record, generates SHA-256 fingerprint, returns `cert_id` |
| `GET` | `/verify/{cert_id}` | None (Public) | Scoped verification endpoint returning cryptographic metadata without PII |
| `POST` | `/webhook/account-aggregator` | `X-API-Key` | Financial statement ingestion simulating Sahamati AA consent flow |
| `POST` | `/voice-intent` | None (Public) | Multilingual voice & text intent parsing for automatic slider & sector extraction |

### Example Request: `/score`
```bash
curl -X POST https://spashta-backend.onrender.com/score \
  -H "Content-Type: application/json" \
  -H "X-API-Key: spashta-secret-key-2026" \
  -d '{
    "domain": "rbi",
    "inputs": {
      "cibil_score": 780,
      "monthly_income": 85000,
      "dti_ratio": 28,
      "unsecured_loans": 0,
      "employment_years": 5
    }
  }'
```

### Example Response: `/score`
```json
{
  "domain": "rbi",
  "probability": 0.8842,
  "verdict": "Approved",
  "baseline_probability": 0.5000,
  "delta_probability": 0.3842,
  "features": [
    {
      "feature": "cibil_score",
      "value": 780.0,
      "shap_value": 0.1824,
      "direction": "positive",
      "impact": "Significant credit score above prime benchmark"
    }
  ],
  "efficiency_verified": true
}
```

---

## 🚢 Production Deployment Guide

### 1. Database Setup (Supabase) & IPv4 Pooler Fix
> [!IMPORTANT]
> **Render Free Tier IPv4 Limitation**: Direct Supabase database hosts (`db.<ref>.supabase.co:5432`) resolve to IPv6, which will cause `psycopg2.OperationalError: Network is unreachable` on Render. You **must** use Supabase's **Transaction Connection Pooler** (IPv4).

1. In your [Supabase Dashboard](https://supabase.com/dashboard), navigate to **Project Settings** > **Database**.
2. Under **Connection string**, select the **Transaction** pooler mode (port `6543`).
3. Your connection URI will look like:
   ```text
   postgresql://postgres.<project-ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
4. Use this URI for the `DATABASE_URL` environment variable.

### 2. Backend Deployment (Render)
1. Fork or push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), click **New** > **Web Service**.
3. Select your `spashta` repository.
4. Configure the service:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Configure Environment Variables:
   - `DATABASE_URL`: Your Supabase Transaction Pooler URI.
   - `API_KEY`: `spashta-secret-key-2026`
    - `ALLOWED_ORIGINS`: `https://spashtaa.vercel.app,http://localhost:3000`

### 3. Frontend Deployment (Vercel)
1. In [Vercel Dashboard](https://vercel.com/), click **Add New Project** and import the repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Other**.
4. Click **Deploy**.
5. The frontend is pre-configured in `frontend/js/config.js` to automatically target `https://spashta-backend.onrender.com`.

---

## 💻 Local Development & Testing

### Prerequisites
- Python 3.11 or 3.14
- Git

### 1. Clone Repository
```bash
git clone https://github.com/Code4Uplift/spashta.git
cd spashta
```

### 2. Setup Virtual Environment
```bash
# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run Automated Tests
```bash
python -m pytest backend/tests -v
```
Output:
```text
======================== 37 passed in 1.88s ========================
```

### 4. Run Backend Server
```bash
uvicorn main:app --reload --port 8000
```
Open `http://localhost:8000/docs` to view Swagger UI.

### 5. Run Frontend
```bash
cd frontend
python -m http.server 3000
```
Open `http://localhost:3000` in any web browser.

---

## 🔒 Security, Privacy & DPDP Act 2023

- **Zero PII in Public Verification**: The `/verify/{cert_id}` endpoint only returns cryptographic proof (`cert_id`, `domain`, `verdict`, `sha256_hash`, `timestamp`). Input parameters, coefficients, and private data remain strictly sequestered in the private database.
- **Federated On-Device Sandbox Mode**: Citizens can toggle "DPDP Privacy Mode" in the UI header. When enabled, calculations run entirely in client-side JavaScript without any network telemetry or server requests.
- **Deterministic Cryptographic Hashing**: Certificates generate a canonical SHA-256 digest over normalized inputs, ensuring tamper-evidence.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE). Developed for hackathons and public demonstration of Explainable AI in Indian public interest technology.
