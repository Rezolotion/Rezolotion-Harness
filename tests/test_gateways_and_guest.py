"""
Automated Integration Tests for G-CAT Gateway, Custom Gateway & Guest Mode Simulation
"""
import httpx
import os

BASE_URL = "http://localhost:8000"

def test_guest_mode_providers_zero_connected():
    with httpx.Client(base_url=BASE_URL, timeout=5.0) as client:
        # In guest mode, all providers must report connected: False
        res = client.get("/api/auth/providers", headers={"X-Guest-Mode": "true"})
        assert res.status_code == 200
        data = res.json()
        assert "gcat" in data
        assert "custom" in data
        for pid, pdata in data.items():
            assert pdata.get("connected") is False, f"Provider {pid} was connected in guest mode!"
            assert "Guest Mode" in pdata.get("details", "")

def test_guest_mode_models_empty():
    with httpx.Client(base_url=BASE_URL, timeout=5.0) as client:
        res = client.get("/api/models", headers={"X-Guest-Mode": "true"})
        assert res.status_code == 200
        data = res.json()
        assert data.get("models") == []

def test_gcat_test_connectivity_live():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        # Test missing key
        res = client.post("/api/auth/test", json={"provider_id": "gcat", "key": ""})
        assert res.status_code == 200
        assert res.json().get("success") is False
        assert "Missing" in res.json().get("message", "")

        # Test live check to https://llm.gcat.ir/v1/models with dummy key
        res = client.post("/api/auth/test", json={"provider_id": "gcat", "key": "invalid_test_key"})
        assert res.status_code == 200
        # GCat returns 401 for invalid key
        assert res.json().get("success") is False
        assert "Invalid G-CAT API key" in res.json().get("message", "")

def test_custom_gateway_connectivity_live():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        # Test missing base url
        res = client.post("/api/auth/test", json={"provider_id": "custom", "endpoint": ""})
        assert res.status_code == 200
        assert res.json().get("success") is False
        assert "Missing" in res.json().get("message", "")

        # Test with real OpenAI endpoint but dummy key
        res = client.post("/api/auth/test", json={
            "provider_id": "custom",
            "endpoint": "https://api.openai.com/v1",
            "key": "invalid_test_key"
        })
        assert res.status_code == 200
        assert res.json().get("success") is False
        assert "Unauthorized" in res.json().get("message", "")

def test_configure_provider_gcat():
    with httpx.Client(base_url=BASE_URL, timeout=5.0) as client:
        res = client.post("/api/auth/configure", json={
            "provider_id": "gcat",
            "api_key": "test_gcat_save_key",
            "endpoint": "https://llm.gcat.ir/v1"
        })
        assert res.status_code == 200
        assert res.json().get("success") is True

if __name__ == "__main__":
    print("Running gateway and guest mode tests...")
    test_guest_mode_providers_zero_connected()
    print("✓ Guest Mode 0-Connected Providers passed.")
    test_guest_mode_models_empty()
    print("✓ Guest Mode Empty Models passed.")
    test_gcat_test_connectivity_live()
    print("✓ G-CAT Live Verification passed.")
    test_custom_gateway_connectivity_live()
    print("✓ Custom Gateway Live Verification passed.")
    test_configure_provider_gcat()
    print("✓ Configure Provider passed.")
    print("\n==================================================")
    print("ALL GATEWAY & GUEST TESTS PASSED SUCCESSFULLY! 100%")
    print("==================================================")
