def test_translate_same_language_early_return(client):
    payload = {
        "text": "Hello World",
        "source_lang": "en",
        "target_lang": "en"
    }
    response = client.post("/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["translated_text"] == "Hello World"
    assert data["cached"] is False


def test_translate_empty_text(client):
    payload = {
        "text": "",
        "source_lang": "en",
        "target_lang": "hi"
    }
    response = client.post("/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["translated_text"] == ""


from unittest.mock import patch, MagicMock
import json
import httpx


def test_translate_live_or_cache(client):
    payload = {
        "text": "CREDIT APPROVED",
        "source_lang": "en",
        "target_lang": "hi"
    }
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = [[["क्रेडिट स्वीकृत", "CREDIT APPROVED"]]]

    with patch("httpx.AsyncClient.get", return_value=mock_response):
        # First call (fetches or returns text)
        resp1 = client.post("/translate", json=payload)
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert len(data1["translated_text"]) > 0
        assert data1["translated_text"] == "क्रेडिट स्वीकृत"

        # Second call (must be served from memory cache)
        resp2 = client.post("/translate", json=payload)
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["cached"] is True
        assert data2["translated_text"] == data1["translated_text"]


def test_translate_batch_same_language(client):
    payload = {
        "texts": {"title": "Loan Underwriting", "cibil": "CIBIL Score"},
        "source_lang": "en",
        "target_lang": "en"
    }
    response = client.post("/translate/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["translations"]["title"] == "Loan Underwriting"
    assert data["translations"]["cibil"] == "CIBIL Score"
    assert data["engine"] == "identity"


def test_translate_batch_empty(client):
    payload = {
        "texts": {},
        "source_lang": "en",
        "target_lang": "hi"
    }
    response = client.post("/translate/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["translations"] == {}
    assert data["engine"] == "noop"


def test_translate_batch_with_mock_parallel(client):
    payload = {
        "texts": {
            "btn1": "Compute Explanations",
            "btn2": "Reset Defaults"
        },
        "source_lang": "en",
        "target_lang": "hi"
    }
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = [[["स्पष्टीकरण निकालें", "Compute Explanations"]]]

    with patch("httpx.AsyncClient.get", return_value=mock_response):
        response = client.post("/translate/batch", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "btn1" in data["translations"]
        assert "btn2" in data["translations"]
        assert data["engine"] in ["gtx-parallel", "cache"]


def test_translate_batch_with_gemini(client):
    payload = {
        "texts": {
            "lbl1": "Monthly Income",
            "lbl2": "Loan Amount"
        },
        "source_lang": "en",
        "target_lang": "mr"
    }
    mock_gemini_resp = MagicMock(spec=httpx.Response)
    mock_gemini_resp.status_code = 200
    mock_gemini_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": json.dumps({
                                "lbl1": "मासिक उत्पन्न",
                                "lbl2": "कर्जाची रक्कम"
                            })
                        }
                    ]
                }
            }
        ]
    }

    with patch.dict("os.environ", {"GEMINI_API_KEY": "test-gemini-key"}):
        with patch("httpx.AsyncClient.post", return_value=mock_gemini_resp):
            response = client.post("/translate/batch", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["translations"]["lbl1"] == "मासिक उत्पन्न"
            assert data["translations"]["lbl2"] == "कर्जाची रक्कम"
            assert data["engine"] == "gemini-1.5-flash"


