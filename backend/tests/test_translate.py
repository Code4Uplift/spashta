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

