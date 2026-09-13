import asyncio
import os
import sys
import re
import json
import urllib.parse
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List
from contextlib import asynccontextmanager

# Add parent directory and current directory to sys.path for robust import resolution
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

import httpx
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv

try:
    from backend.database import get_db, init_db
    from backend.models import CertificateRecord
    from backend.schemas import (
        ScoreRequest,
        ScoreResponse,
        TranslateRequest,
        TranslateResponse,
        BatchTranslateRequest,
        BatchTranslateResponse,
        CertificateCreateRequest,
        CertificatePublic,
        AccountAggregatorWebhookPayload,
        AccountAggregatorResponse,
        VoiceIntentRequest,
        VoiceIntentResponse
    )
    from backend.shapley_engine import DOMAINS, score_domain_inputs, compute_cert_hash
    from backend.auth import require_api_key
except ImportError:
    from database import get_db, init_db
    from models import CertificateRecord
    from schemas import (
        ScoreRequest,
        ScoreResponse,
        TranslateRequest,
        TranslateResponse,
        BatchTranslateRequest,
        BatchTranslateResponse,
        CertificateCreateRequest,
        CertificatePublic,
        AccountAggregatorWebhookPayload,
        AccountAggregatorResponse,
        VoiceIntentRequest,
        VoiceIntentResponse
    )
    from shapley_engine import DOMAINS, score_domain_inputs, compute_cert_hash
    from auth import require_api_key

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
        print("✓ Database initialized successfully.")
    except Exception as e:
        print(f"⚠️ Warning: Database connection failed during startup ({e}).")
        print("Backend is running with local fallback.")
    yield


app = FastAPI(
    title="SPASHTA (स्पष्ट) Backend API",
    description="Multilingual Explainable AI API for 6 Regulated Indian Financial Sectors (RBI, IRDAI, SEBI, PFRDA, IBBI, NABARD)",
    version="2.5.0",
    lifespan=lifespan
)

# Configure CORS
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://spashta.vercel.app",
    "https://spashtaa.vercel.app",
    "https://spashta-seven.vercel.app",
    "https://spashta-ideathon-demo.vercel.app"
]

env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    custom_origins = [o.strip() for o in env_origins.split(",") if o.strip()]
    origins = list(set(default_origins + custom_origins))
else:
    origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https:\/\/.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory translation cache (thread-safe in GIL / async single loop)
_translation_cache: Dict[str, str] = {}


@app.get("/", tags=["Root"])
def root():
    """
    Root endpoint returning service identity and quick links to /docs and /health.
    """
    return {
        "status": "ok",
        "service": "SPASHTA (स्पष्ट) Explainable AI Backend API",
        "version": "2.5.0",
        "docs": "/docs",
        "health": "/health",
        "sectors": ["RBI", "IRDAI", "SEBI", "PFRDA", "IBBI", "NABARD"]
    }


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Public health check endpoint.
    Performs a database ping to verify PostgreSQL / SQLite connectivity.
    Ideal for UptimeRobot and Render keep-alive pings.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "service": "SPASHTA XAI Backend",
        "version": "2.5.0",
        "sectors": ["RBI", "IRDAI", "SEBI", "PFRDA", "IBBI", "NABARD"],
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/score", response_model=ScoreResponse, tags=["XAI Scoring"], dependencies=[Depends(require_api_key)])
def compute_score(request: ScoreRequest):
    """
    Protected endpoint: Computes exact continuous Aumann-Shapley marginal attributions
    for applicant parameters across RBI, IRDAI, SEBI, PFRDA, IBBI, or NABARD frameworks.
    Guarantees efficiency axiom: sum(phi_i) == P(outcome) - P(baseline).
    """
    result = score_domain_inputs(request.domain, request.inputs)
    return ScoreResponse(**result)


LANGUAGE_NAMES: Dict[str, str] = {
    "hi": "Hindi",
    "mr": "Marathi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu",
    "sa": "Sanskrit",
    "ne": "Nepali",
    "sd": "Sindhi",
    "ks": "Kashmiri",
    "kok": "Konkani",
    "mai": "Maithili",
    "doi": "Dogri",
    "mni": "Manipuri",
    "brx": "Bodo",
    "sat": "Santali",
    "en": "English"
}

HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}


async def _translate_single_text(clean_text: str, source_lang: str, target_lang: str, client: httpx.AsyncClient) -> str:
    if not clean_text or source_lang == target_lang:
        return clean_text

    cache_key = f"{source_lang}_{target_lang}_{clean_text}"
    if cache_key in _translation_cache:
        return _translation_cache[cache_key]

    translated_result = clean_text

    # 1. Primary: Google GTX
    try:
        encoded_query = urllib.parse.quote(clean_text)
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl={target_lang}&dt=t&q={encoded_query}"
        resp = await client.get(url)
        if resp.status_code == 200:
            data = resp.json()
            if data and isinstance(data, list) and len(data) > 0 and data[0]:
                chunks = [item[0] for item in data[0] if item and item[0]]
                if chunks:
                    cand = "".join(chunks).strip()
                    if cand and cand != clean_text:
                        _translation_cache[cache_key] = cand
                        return cand
    except Exception:
        pass

    # 2. Fallback: MyMemory API
    if target_lang != "en":
        try:
            encoded_query = urllib.parse.quote(clean_text)
            url2 = f"https://api.mymemory.translated.net/get?q={encoded_query}&langpair={source_lang}|{target_lang}&de=spashta.audit.ai@gmail.com"
            resp2 = await client.get(url2)
            if resp2.status_code == 200:
                data2 = resp2.json()
                mem_trans = data2.get("responseData", {}).get("translatedText", "").strip()
                if mem_trans and not mem_trans.upper().startswith("MYMEMORY WARNING") and mem_trans != clean_text:
                    _translation_cache[cache_key] = mem_trans
                    return mem_trans
        except Exception:
            pass

    return translated_result


@app.post("/translate", response_model=TranslateResponse, tags=["Multilingual NMT"])
async def translate_text(request: TranslateRequest):
    """
    Public endpoint: Translates text across 22 Indian languages.
    Proxies to Google GTX and MyMemory APIs server-side with an in-memory cache to prevent
    client-side CORS issues and browser rate-limiting.
    """
    source_lang = request.source_lang.lower().strip()
    target_lang = request.target_lang.lower().strip()
    raw_text = request.text.strip()

    if not raw_text or source_lang == target_lang:
        return TranslateResponse(
            translated_text=raw_text,
            source_lang=source_lang,
            target_lang=target_lang,
            cached=False
        )

    clean_text = re.sub(r"<[^>]*>", "", raw_text).strip()
    if not clean_text:
        return TranslateResponse(
            translated_text=raw_text,
            source_lang=source_lang,
            target_lang=target_lang,
            cached=False
        )

    cache_key = f"{source_lang}_{target_lang}_{clean_text}"
    if cache_key in _translation_cache:
        return TranslateResponse(
            translated_text=_translation_cache[cache_key],
            source_lang=source_lang,
            target_lang=target_lang,
            cached=True
        )

    async with httpx.AsyncClient(timeout=6.0, headers=HTTP_HEADERS) as client:
        res = await _translate_single_text(clean_text, source_lang, target_lang, client)

    return TranslateResponse(
        translated_text=res,
        source_lang=source_lang,
        target_lang=target_lang,
        cached=False
    )


@app.post("/translate/batch", response_model=BatchTranslateResponse, tags=["Multilingual NMT"])
async def translate_batch(request: BatchTranslateRequest):
    """
    Batch-translates a dictionary of UI strings across 22 Indian languages in a single roundtrip.
    Powered by Google Gemini 1.5 Flash (via GEMINI_API_KEY) with structured JSON output,
    with an automatic parallelized fallback and in-memory caching.
    """
    source_lang = request.source_lang.lower().strip()
    target_lang = request.target_lang.lower().strip()
    raw_texts = request.texts

    if not raw_texts:
        return BatchTranslateResponse(
            translations={},
            source_lang=source_lang,
            target_lang=target_lang,
            engine="noop"
        )

    if source_lang == target_lang:
        return BatchTranslateResponse(
            translations=raw_texts,
            source_lang=source_lang,
            target_lang=target_lang,
            engine="identity"
        )

    translated_dict: Dict[str, str] = {}
    uncached_items: Dict[str, str] = {}

    # 1. Check in-memory cache
    for key, text_val in raw_texts.items():
        clean_text = re.sub(r"<[^>]*>", "", text_val or "").strip()
        if not clean_text:
            translated_dict[key] = text_val
            continue

        cache_key = f"{source_lang}_{target_lang}_{clean_text}"
        if cache_key in _translation_cache:
            translated_dict[key] = _translation_cache[cache_key]
        else:
            uncached_items[key] = clean_text

    if not uncached_items:
        return BatchTranslateResponse(
            translations=translated_dict,
            source_lang=source_lang,
            target_lang=target_lang,
            engine="cache"
        )

    engine_used = "cache"
    gemini_key = os.getenv("GEMINI_API_KEY")

    # 2. Primary: Google Gemini 1.5 Flash batch JSON translation
    if gemini_key and uncached_items:
        try:
            target_lang_name = LANGUAGE_NAMES.get(target_lang, target_lang)
            prompt = (
                f"You are a professional financial and regulatory translator specializing in Indian languages.\n"
                f"Translate the string values of the following JSON dictionary from {source_lang} to {target_lang_name} ({target_lang}).\n\n"
                f"RULES:\n"
                f"1. Keep every JSON key identical. Do NOT translate or change any keys.\n"
                f"2. Translate only the string values into natural, contextually accurate {target_lang_name}.\n"
                f"3. Maintain financial/regulatory acronyms and terms properly (e.g. CIBIL, FOIR, DTI, PMFBY, IRDAI, SEBI, RBI, NPS, KCC).\n"
                f"4. Return strictly a single valid JSON object matching the input keys and translated values.\n\n"
                f"Input JSON:\n{json.dumps(uncached_items, ensure_ascii=False)}"
            )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            gemini_dict = json.loads(parts[0]["text"])
                            if isinstance(gemini_dict, dict):
                                for k, v in gemini_dict.items():
                                    if k in uncached_items and isinstance(v, str) and v.strip():
                                        trans_str = v.strip()
                                        translated_dict[k] = trans_str
                                        orig_str = uncached_items[k]
                                        _translation_cache[f"{source_lang}_{target_lang}_{orig_str}"] = trans_str
                                engine_used = "gemini-1.5-flash"
        except Exception as e:
            print(f"⚠️ Gemini 1.5 Flash batch translation exception: {e}. Falling back to parallel engine.")

    # 3. Fallback: Parallel asynchronous translation for any keys still missing
    missing_items = {k: v for k, v in uncached_items.items() if k not in translated_dict or translated_dict[k] == v}
    if missing_items:
        async with httpx.AsyncClient(timeout=6.0, headers=HTTP_HEADERS) as client:
            semaphore = asyncio.Semaphore(10)

            async def translate_single(k: str, orig_text: str):
                async with semaphore:
                    trans = await _translate_single_text(orig_text, source_lang, target_lang, client)
                    return k, orig_text, trans

            tasks = [translate_single(k, text_val) for k, text_val in missing_items.items()]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, tuple) and len(r) == 3:
                    k, orig_text, trans = r
                    translated_dict[k] = trans
                    if trans != orig_text:
                        _translation_cache[f"{source_lang}_{target_lang}_{orig_text}"] = trans
        if engine_used != "gemini-1.5-flash":
            engine_used = "gtx-parallel"

    return BatchTranslateResponse(
        translations=translated_dict,
        source_lang=source_lang,
        target_lang=target_lang,
        engine=engine_used
    )


@app.post("/certificate", response_model=CertificatePublic, status_code=status.HTTP_201_CREATED, tags=["Audit Certificates"], dependencies=[Depends(require_api_key)])
def create_certificate(request: CertificateCreateRequest, db: Session = Depends(get_db)):
    """
    Protected endpoint: Computes SHA-256 fingerprint over exact input parameters & attributions,
    persists full audit record in PostgreSQL / SQLite, and returns scoped public certificate metadata.
    """
    domain_cfg = DOMAINS[request.domain]
    score_result = score_domain_inputs(request.domain, request.inputs)
    full_sha256, short_id = compute_cert_hash(request.domain, request.inputs, score_result)

    cert_id = f"{domain_cfg['certPrefix']}/2026/{short_id}"

    # Try saving to database; if DB unreachable, return ephemeral certificate
    try:
        existing = db.query(CertificateRecord).filter(CertificateRecord.cert_id == cert_id).first()
        if existing:
            return CertificatePublic.model_validate(existing)

        record = CertificateRecord(
            cert_id=cert_id,
            domain=request.domain,
            inputs=request.inputs,
            coefficients=[f["coef"] for f in domain_cfg["fields"]],
            shap_values=score_result["shap_values"],
            baseline_prob=score_result["baseline_prob"],
            full_prob=score_result["full_prob"],
            verdict=score_result["verdict"],
            sha256_hash=full_sha256,
            created_at=datetime.now(timezone.utc)
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return CertificatePublic.model_validate(record)
    except Exception as db_err:
        print(f"Warning: Could not persist to database ({db_err}). Returning ephemeral certificate.")
        return CertificatePublic(
            cert_id=cert_id,
            domain=request.domain,
            verdict=score_result["verdict"],
            sha256_hash=full_sha256,
            created_at=datetime.now(timezone.utc)
        )


@app.get("/verify/{cert_id:path}", response_model=CertificatePublic, tags=["Audit Certificates"])
def verify_certificate(cert_id: str, db: Session = Depends(get_db)):
    """
    Public verification endpoint: Allows regulators, applicants, and auditors to verify
    the authentic existence and SHA-256 integrity of an issued compliance certificate.
    Returns scoped public fields only (cert_id, domain, verdict, sha256_hash, created_at).
    Does NOT leak private applicant inputs or proprietary model parameters under DPDP Act 2023.
    """
    try:
        record = db.query(CertificateRecord).filter(CertificateRecord.cert_id == cert_id).first()
        if record:
            return CertificatePublic.model_validate(record)
    except Exception as e:
        print(f"Database query error during verification: {e}")

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Certificate '{cert_id}' not found in audit registry"
    )


@app.post("/webhook/account-aggregator", response_model=AccountAggregatorResponse, tags=["Core Banking (CBS) & AA Webhook"])
def account_aggregator_webhook(payload: AccountAggregatorWebhookPayload):
    """
    Core Banking (CBS) & Account Aggregator (AA) Webhook Receiver.
    Simulates automated ingestion of verified banking statement artifacts (e.g. from Finacle / TCS BaNCS / Sahamati AA).
    Extracts underwriting financial parameters and returns instant explainable attribution scores.
    """
    domain = payload.domain
    domain_cfg = DOMAINS[domain]
    fin = payload.financial_data

    # Map incoming CBS/AA financial data to domain fields
    extracted_inputs = {}
    for f in domain_cfg["fields"]:
        key = f["key"]
        if key in fin:
            extracted_inputs[key] = float(fin[key])
        else:
            extracted_inputs[key] = float(f["base"])

    score_result = score_domain_inputs(domain, extracted_inputs)

    return AccountAggregatorResponse(
        status="PROCESSED_SUCCESSFULLY",
        consent_handle=payload.consent_handle,
        extracted_parameters=extracted_inputs,
        score_result=ScoreResponse(**score_result),
        verified_at=datetime.now(timezone.utc)
    )


VOICE_PARSER_SYSTEM_PROMPT = """You are the intelligent natural language voice parser for SPASHTA, India's explainable AI underwriting engine.
You understand spoken user commands in ANY Indian language or dialect (English, Hindi, Gujarati, Marathi, Tamil, Telugu, Bengali, Kannada, Malayalam, Urdu, Marwari, Hinglish, etc.).
You have full reasoning and thinking capabilities. Use your internal chain of thought to translate and deeply understand what the user is expressing.

Analyze the user's spoken sentence and output a single JSON object with the following fields:
1. "domain": One of "rbi", "irdai", "sebi", "pfrda", "ibbi", "nabard". If no authority/sector is mentioned, retain the user's current active domain.
   - rbi: credit card, personal loan, CIBIL, credit score, debt, salary, bank (कर्ज, लोन, बैंक, सिबिल, पगार, वेतन)
   - irdai: insurance, health/motor claim, policy vintage/tenure, network cashless hospital, pre-existing disease, anomaly/fraud (बीमा, विमा, क्लेम, पॉलिसी, दावा, अस्पताल)
   - sebi: stocks, mutual funds, investments, annual net worth/income, risk tolerance, portfolio concentration, horizon (शेयर, निवेश, स्टॉक, बाजार, संपत्ति, उत्पन्न)
   - pfrda: NPS, retirement, pension, age, monthly savings/contribution, equity allocation (पेंशन, पेन्शन, निवृत्ती, उम्र, वय, एनपीएस)
   - ibbi: corporate insolvency, resolution enterprise value (₹ Cr), liquidation coverage, timeline months, recovery (दिवालिया, समाधान, परिसमापन, एंटरप्राइज)
   - nabard: Kisan Credit Card, cultivable land (acres), harvest/crop yield, moneylender debt, irrigation, PMFBY crop insurance (किसान, शेती, जमीन, फसल, पीक, एकर, सिंचन)

2. "action": Optional action string or null. Allowed values: "compute", "reset", "speak", "stop_audio", "privacy".

3. "parameters": Dictionary of numeric field values extracted from speech.
   CRITICAL - MULTIPLE PARAMETER EXTRACTION:
   Extract ALL parameters mentioned in the sentence. If the user mentions 2, 3, or more parameters (e.g. credit score 780, monthly income 50000, loan 200000), include ALL of them in the parameters dictionary:
   {"score": 780, "income": 50000, "loan_amount": 200000}. Do NOT stop after the first parameter!

   TOGGLE CONTROLS (0 or 1) - Understand negation & affirmative across all languages:
   - irdai "network" (Hospital/Garage): "hospital is not there", "no network hospital", "गैर-नेटवर्क", "अस्पताल नहीं है", "दवाखाना नाही", "illai", "nathi" -> 0. "cashless network hospital", "नेटवर्क अस्पताल है" -> 1.
   - irdai "pre_existing": "no pre-existing disease", "clean record", "बीमारी नहीं है", "आजार नाही" -> 0. "has pre-existing disease", "बीमारी है" -> 1.
   - nabard "irrigation_status": "no irrigation", "rainfed", "सूखा", "पाणी नाही" -> 0. "irrigation available", "canal", "borewell", "सिंचाई है" -> 1.
   - nabard "crop_insurance": "no crop insurance", "uninsured", "बीमा नहीं है", "विमा नाही" -> 0. "PMFBY insured", "फसल बीमा है" -> 1.

   Supported numeric keys per domain:
   - rbi: score (300-900), loan_amount (₹), income (monthly ₹), foir (% 10-90), delinquency (0, 1, 2), emp_status (2, 1, 0.5, -0.5)
   - irdai: tenure (policy vintage in years, 0-15), amount (claim ₹), network (1 or 0), pre_existing (1 or 0), fraud_score (% 0-100)
   - sebi: risk_appetite (10-100), income (annual net worth ₹), concentration (% 5-90), horizon (years 1-20), risk_category (1, 3, 5)
   - pfrda: age (18-70), monthly_contribution (monthly ₹), equity_allocation (% 5-75), pension_target (target monthly ₹), corpus_index (10-100)
   - ibbi: ev_amount (resolution enterprise value in ₹ Crores directly, e.g. 500 cr -> 500), liquidation_coverage (% 50-200), timeline_months (3-36), op_creditor_recovery (% 10-100), promoter_track (3, 1, -1)
   - nabard: land_holding (cultivable land in Acres, e.g. 10), crop_value (annual harvest yield ₹), informal_debt (% 0-80), irrigation_status (1 or 0), crop_insurance (1 or 0)
   * Note on Indian units: 1 lakh = 100,000, 1 crore = 10,000,000, 1 thousand/hazar = 1,000.
   * Direct numbers: "income 700" -> 700.

4. "feedback": A concise, natural confirmation message in English summarizing what was done.

Respond ONLY with valid JSON. Do not include markdown tags, codeblocks, or extra text.
Example:
{"domain": "rbi", "action": null, "parameters": {"score": 780, "income": 50000, "loan_amount": 200000}, "feedback": "Set Credit Score to 780, Monthly Income to ₹50,000, and Loan Amount to ₹2,00,000"}"""


def _parse_multipliers_in_text(text: str) -> str:
    word_map = [
        ("zero", 0), ("shunya", 0), ("शून्य", 0),
        ("one", 1), ("ek", 1), ("एक", 1),
        ("two", 2), ("do", 2), ("don", 2), ("दो", 2), ("दोन", 2),
        ("three", 3), ("teen", 3), ("तीन", 3),
        ("four", 4), ("char", 4), ("चार", 4),
        ("five", 5), ("panch", 5), ("paanch", 5), ("paach", 5), ("पांच", 5), ("पाँच", 5), ("पाच", 5),
        ("six", 6), ("chhah", 6), ("saha", 6), ("छह", 6), ("सहा", 6),
        ("seven", 7), ("saat", 7), ("सात", 7),
        ("eight", 8), ("aath", 8), ("आठ", 8),
        ("nine", 9), ("nau", 9), ("नौ", 9), ("नऊ", 9),
        ("ten", 10), ("das", 10), ("daha", 10), ("दस", 10), ("दहा", 10),
        ("fifteen", 15), ("pandrah", 15), ("पंद्रह", 15), ("पंधरा", 15),
        ("twenty", 20), ("bees", 20), ("बीस", 20), ("वीस", 20),
        ("twenty five", 25), ("pachis", 25), ("पच्चीस", 25), ("पंचवीस", 25),
        ("thirty", 30), ("tees", 30), ("तीस", 30),
        ("forty", 40), ("chalis", 40), ("चालीस", 40), ("चाळीस", 40),
        ("fifty", 50), ("pachas", 50), ("पचास", 50), ("पन्नास", 50),
        ("seventy", 70), ("sattar", 70), ("सत्तर", 70),
        ("eighty", 80), ("assi", 80), ("अस्सी", 80),
        ("ninety", 90), ("nabbe", 90), ("नब्बे", 90),
        ("hundred", 100), ("sau", 100), ("shambhar", 100), ("सौ", 100), ("शंभर", 100)
    ]
    norm = text
    for w, v in word_map:
        norm = re.sub(r"(^|[^a-zA-Z0-9\u0900-\u097F])" + re.escape(w) + r"(?=$|[^a-zA-Z0-9\u0900-\u097F])", r"\g<1>" + str(v), norm, flags=re.IGNORECASE)
    return norm


def _extract_number_with_unit(segment: str) -> float | None:
    norm = _parse_multipliers_in_text(segment)
    crore_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:crore|crores|cr|करोड़|कोटी)", norm, re.IGNORECASE)
    if crore_m:
        return float(crore_m.group(1)) * 10000000
    lakh_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|लाख|लाखा|লাখ)", norm, re.IGNORECASE)
    if lakh_m:
        return float(lakh_m.group(1)) * 100000
    thousand_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands|हजार|हज़ार)", norm, re.IGNORECASE)
    if thousand_m:
        return float(thousand_m.group(1)) * 1000
    raw_m = re.search(r"(\d+(?:\.\d+)?)", norm)
    if raw_m:
        return float(raw_m.group(1))
    return None


def _extract_param_value(text: str, keywords: list[str]) -> float | None:
    for kw in keywords:
        # Pattern 1: Keyword followed by optional separator words then number (e.g. "income 50000", "loan of 2 lakhs", "civil score 800")
        p1 = rf"\b{re.escape(kw)}\b(?:\s+(?:is|was|hai|of|around|to|=|at|score|target))?\s*(\d+(?:\.\d+)?(?:\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|k|thousand|thousands|करोड़|कोटी|लाख|हजार|हज़ार))?)"
        m1 = re.search(p1, text, re.IGNORECASE)
        if m1:
            val = _extract_number_with_unit(m1.group(1))
            if val is not None:
                return val

        # Pattern 2: Number/multiplier followed by optional separator words then keyword (e.g. "5 lakh rupees income", "50000 salary", "40000 as loan", "23212 as monthly emi")
        p2 = rf"(\d+(?:\.\d+)?(?:\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|k|thousand|thousands|करोड़|कोटी|लाख|हजार|हज़ार))?)\s*(?:rupees|rs|inr|रुपये|per month|प्रति माह|दरमहा|as|of|for|monthly|towards)?\s*\b{re.escape(kw)}\b"
        m2 = re.search(p2, text, re.IGNORECASE)
        if m2:
            val = _extract_number_with_unit(m2.group(1))
            if val is not None:
                return val

    return None


def parse_voice_intent_heuristic(raw_text: str, current_domain: str = "rbi") -> VoiceIntentResponse:
    lower = raw_text.lower().strip()

    # Action detection
    if any(k in lower for k in ["compute", "calculate", "explain", "गणना", "हिसाब", "स्पष्टीकरण"]):
        return VoiceIntentResponse(action="compute", feedback="Computing Aumann-Shapley explanations...", engine="heuristic_fallback")
    if any(k in lower for k in ["reset", "clear", "रीसेट", "पूर्ववत"]):
        return VoiceIntentResponse(action="reset", feedback="Reset parameters to baseline defaults", engine="heuristic_fallback")
    if any(k in lower for k in ["play", "listen", "speak", "audio", "सुनाओ", "ऐका"]):
        return VoiceIntentResponse(action="speak", feedback="Playing audio explanation", engine="heuristic_fallback")
    if any(k in lower for k in ["stop", "pause", "शांत", "रोको"]):
        return VoiceIntentResponse(action="stop_audio", feedback="Audio playback stopped", engine="heuristic_fallback")
    if any(k in lower for k in ["privacy", "shield", "dpdp", "गोपनीयता"]):
        return VoiceIntentResponse(action="privacy", feedback="Toggled DPDP privacy mode", engine="heuristic_fallback")

    # Domain detection
    detected_domain = None
    if any(k in lower for k in ["sebi", "stock", "stocks", "trading", "invest", "portfolio", "शेयर", "शेअर", "बाजार", "निवेश", "गुंतवणूक"]):
        detected_domain = "sebi"
    elif any(k in lower for k in ["irdai", "insurance", "claim", "health", "hospital", "vintage", "बीमा", "विमा", "क्लेम", "दावा", "पॉलिसी"]):
        detected_domain = "irdai"
    elif any(k in lower for k in ["rbi", "reserve bank", "credit", "loan", "cibil", "civil", "cebil", "cibal", "बैंक", "बँक", "कर्ज", "ऋण", "लोन", "सिबिल", "सिविल", "emi", "foir"]):
        detected_domain = "rbi"
    elif any(k in lower for k in ["pfrda", "pension", "retirement", "nps", "annuity", "पेंशन", "पेन्शन", "निवृत्ती", "एनपीएस"]):
        detected_domain = "pfrda"
    elif any(k in lower for k in ["ibbi", "insolvency", "bankruptcy", "liquidation", "resolution", "enterprise", "दिवालिया", "दिवाळखोरी", "परिसमापन"]):
        detected_domain = "ibbi"
    elif any(k in lower for k in ["nabard", "kisan", "farmer", "agriculture", "agri", "kcc", "land", "crop", "किसान", "शेतकरी", "शेती", "कृषी", "जमीन", "फसल", "पीक"]):
        detected_domain = "nabard"

    target_domain = detected_domain or current_domain
    params = {}

    # 1. Check Toggle states (affirmative vs negative)
    # IRDAI Network Hospital
    if any(w in lower for w in ["hospital", "network hospital", "cashless", "अस्पताल", "रुग्णालय", "दवाखाना"]):
        target_domain = "irdai"
        if any(neg in lower for neg in ["not there", "no hospital", "no network", "not available", "non-network", "non network", "नहीं है", "नाही", "नसेल", "illai", "nathi", "without", "बिना"]):
            params["network"] = 0.0
        else:
            params["network"] = 1.0

    # IRDAI Pre-existing disease
    if any(w in lower for w in ["pre-existing", "pre existing", "ped", "disease", "illness", "बीमारी", "आजार", "रोग"]):
        target_domain = "irdai"
        if any(neg in lower for neg in ["no disease", "no pre-existing", "not have", "नहीं है", "नाही", "clean", "without", "बिना"]):
            params["pre_existing"] = 0.0
        else:
            params["pre_existing"] = 1.0

    # NABARD Irrigation Status
    if any(w in lower for w in ["irrigation", "सिंचाई", "सिंचन", "borewell", "canal"]):
        target_domain = "nabard"
        if any(neg in lower for neg in ["no irrigation", "dryland", "rainfed", "सूखा", "नहीं है", "नाही", "without"]):
            params["irrigation_status"] = 0.0
        else:
            params["irrigation_status"] = 1.0

    # NABARD Crop Insurance
    if any(w in lower for w in ["crop insurance", "pmfby", "फसल बीमा", "पीक विमा"]):
        target_domain = "nabard"
        if any(neg in lower for neg in ["no insurance", "uninsured", "नहीं है", "नाही", "without"]):
            params["crop_insurance"] = 0.0
        else:
            params["crop_insurance"] = 1.0

    # 2. Multi-parameter numerical extraction
    norm_text = _parse_multipliers_in_text(lower)

    # Score (RBI) - supports CIBIL, civil, cebil, etc.
    score_val = _extract_param_value(norm_text, ["score", "cibil", "credit score", "civil", "cebil", "cibal", "sebil", "sybil", "sibyl", "सिविल", "सिबिल", "क्रेडिट स्कोर", "स्कोर"])
    if score_val is not None:
        if 30 <= score_val <= 90:
            score_val = score_val * 10
        if 300 <= score_val <= 900:
            params["score"] = score_val
            target_domain = "rbi"

    # Loan Amount (RBI)
    loan_val = _extract_param_value(norm_text, ["loan", "borrow", "loan amount", "need a loan of", "pay as loan", "as loan", "debt", "कर्ज", "लोन", "ऋण"])
    if loan_val is not None and loan_val >= 1000:
        params["loan_amount"] = loan_val
        target_domain = "rbi"

    # Income / Net worth / Salary
    inc_val = _extract_param_value(norm_text, ["income", "earn", "earning", "salary", "net worth", "networth", "wealth", "पगार", "वेतन", "आय", "कमाई", "आमदनी", "आवक"])
    if inc_val is not None:
        params["income"] = inc_val

    # FOIR / Existing obligation / EMI (RBI)
    foir_val = _extract_param_value(norm_text, ["foir", "emi", "monthly emi", "obligation", "deducted", "deduction", "हप्ता", "ईएमआई", "हफ्ता"])
    if foir_val is not None:
        if foir_val <= 100:
            params["foir"] = foir_val
        else:
            # Absolute EMI amount deducted from monthly salary: calculate percentage
            inc = params.get("income", 50000.0)
            calc_foir = round((foir_val / inc) * 100)
            params["foir"] = min(90.0, max(5.0, float(calc_foir)))
        target_domain = "rbi"

    # Delinquency / DPD (RBI)
    dpd_val = _extract_param_value(norm_text, ["dpd", "delinquency", "default", "late", "delay", "डिफ़ॉल्ट", "देरी", "थकीत", "उशीर"])
    if dpd_val is not None and dpd_val <= 10:
        params["delinquency"] = dpd_val
        target_domain = "rbi"

    # Employment Category (RBI)
    if any(w in lower for w in ["salaried", "corporate", "govt", "government", "नोकरी", "नौकरी"]):
        params["emp_status"] = 1.0
        target_domain = "rbi"
    elif any(w in lower for w in ["self employed", "business", "freelance", "व्यवसाय"]):
        params["emp_status"] = 0.0
        target_domain = "rbi"

    # Policy Vintage / Tenure (IRDAI)
    vin_val = _extract_param_value(norm_text, ["vintage", "policy vintage", "policy age", "tenure"])
    if vin_val is None:
        yrs_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:years|year|yrs|साल|वर्ष|वर्षे)\s*(?:policy|vintage|tenure)?", norm_text, re.IGNORECASE)
        if yrs_m and ("vintage" in lower or "policy" in lower or target_domain == "irdai"):
            vin_val = float(yrs_m.group(1))
    if vin_val is not None and vin_val <= 20:
        params["tenure"] = vin_val
        target_domain = "irdai"

    # Claim Amount (IRDAI)
    claim_val = _extract_param_value(norm_text, ["claim", "claim amount", "bill", "दावा", "क्लेम", "खर्च"])
    if claim_val is not None and claim_val >= 1000:
        params["amount"] = claim_val
        target_domain = "irdai"

    # Land Holding (NABARD)
    land_val = _extract_param_value(norm_text, ["land", "farmland", "zameen", "sheti", "acre", "acres", "एकर", "एकड़", "एकड़", "जमीन", "शेती"])
    if land_val is not None and land_val <= 50:
        params["land_holding"] = land_val
        target_domain = "nabard"

    # Crop Value (NABARD)
    crop_val = _extract_param_value(norm_text, ["crop", "harvest", "yield", "produce", "crop value", "harvest yield", "फसल", "पीक", "धान्य"])
    if crop_val is not None and crop_val >= 1000:
        params["crop_value"] = crop_val
        target_domain = "nabard"

    # Enterprise Value (IBBI)
    ev_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:crore|crores|cr|करोड़)\s*(?:ev|enterprise|resolution)?", norm_text, re.IGNORECASE)
    if not ev_m:
        ev_m = re.search(r"(?:enterprise|resolution value|ev|एंटरप्राइज|संकल्प मूल्य)\s*(?:value|amount)?\s*(?:is|was|hai|of)?\s*(\d+(?:\.\d+)?)", norm_text, re.IGNORECASE)
    if ev_m and ("enterprise" in lower or "ev" in lower or "resolution" in lower or target_domain == "ibbi"):
        params["ev_amount"] = float(ev_m.group(1))
        target_domain = "ibbi"

    # Age (PFRDA)
    age_val = _extract_param_value(norm_text, ["age", "उम्र", "वय", "आयु"])
    if age_val is not None and 18 <= age_val <= 75:
        params["age"] = age_val
        target_domain = "pfrda"


    # Sanitize and clamp all extracted parameters
    domain_cfg = DOMAINS.get(target_domain, {})
    field_map = {f["key"]: f for f in domain_cfg.get("fields", [])}
    sanitized = {}
    for k, v in params.items():
        if k in field_map:
            f = field_map[k]
            min_v = f.get("min", float("-inf"))
            max_v = f.get("max", float("inf"))
            sanitized[k] = max(min_v, min(max_v, float(v)))

    feedback = f"Switched to {target_domain.upper()}"
    if sanitized:
        parts = [f"{k}: {v:g}" for k, v in sanitized.items()]
        feedback += " and updated " + ", ".join(parts)

    return VoiceIntentResponse(
        domain=target_domain,
        parameters=sanitized,
        feedback=feedback,
        engine="heuristic_fallback"
    )


@app.post("/voice-intent", response_model=VoiceIntentResponse, tags=["Multilingual Speech & Voice Intent"])
async def voice_intent_endpoint(payload: VoiceIntentRequest):
    """
    Campus LLM-powered Natural Language & Dialect Voice Parser with Thinking Mode.
    Connects to TCET Centre of Excellence (CoE) AI Gateway (NVIDIA DGX Spark workstation running Qwen3.6-35B-A3B)
    with deep chain-of-thought reasoning for multilingual and dialect comprehension.
    Gracefully falls back to heuristic engine if key is omitted or server busy.
    """
    coe_key = os.getenv("COE_AI_KEY") or os.getenv("AI_KEY") or os.getenv("TCET_AI_KEY")
    coe_base_url = os.getenv("COE_AI_BASE_URL", "https://ai.tcetcercd.in/v1").rstrip("/")

    if coe_key:
        try:
            req_body = {
                "model": "qwen3.6",
                "messages": [
                    {"role": "system", "content": VOICE_PARSER_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"User speech: '{payload.text}'. Current active domain: '{payload.current_domain}'. Spoken language code: '{payload.language}'."
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 1500,
                "extra_body": {
                    "chat_template_kwargs": {
                        "enable_thinking": True
                    }
                }
            }
            headers = {
                "Authorization": f"Bearer {coe_key.strip()}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(f"{coe_base_url}/chat/completions", json=req_body, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    msg = data.get("choices", [{}])[0].get("message", {})
                    raw_content = msg.get("content", "").strip()

                    # Strip <think>...</think> chain-of-thought tokens if present
                    clean_content = re.sub(r"<think>[\s\S]*?</think>", "", raw_content, flags=re.IGNORECASE).strip()

                    # Extract JSON payload (support markdown codeblock or raw json object)
                    json_match = re.search(r"\{[\s\S]*\}", clean_content)
                    if json_match:
                        clean_json_str = json_match.group(0).strip()
                    else:
                        clean_json_str = clean_content

                    parsed = json.loads(clean_json_str)

                    target_domain = parsed.get("domain") or payload.current_domain
                    if target_domain not in DOMAINS:
                        target_domain = payload.current_domain

                    sanitized_params = {}
                    domain_cfg = DOMAINS[target_domain]
                    field_map = {f["key"]: f for f in domain_cfg["fields"]}

                    for k, v in parsed.get("parameters", {}).items():
                        if k in field_map:
                            try:
                                float_v = float(v)
                                f = field_map[k]
                                min_v = f.get("min", float("-inf"))
                                max_v = f.get("max", float("inf"))
                                sanitized_params[k] = max(min_v, min(max_v, float_v))
                            except (ValueError, TypeError):
                                pass

                    return VoiceIntentResponse(
                        domain=target_domain,
                        action=parsed.get("action"),
                        parameters=sanitized_params,
                        feedback=parsed.get("feedback", f"Processed voice command for {target_domain.upper()}"),
                        engine="tcet_coe_qwen3.6"
                    )
        except Exception as e:
            print(f"Notice: CoE AI Gateway call failed or timed out ({e}). Falling back to heuristic voice parser.")

    # Graceful Fallback
    return parse_voice_intent_heuristic(payload.text, payload.current_domain)
