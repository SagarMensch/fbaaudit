"""
Basic Vision Model Test
========================
Tests if OpenRouter and Groq vision models are responding correctly.
Uses a tiny 1x1 red pixel image to minimize payload size.
"""

import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

# Create a minimal 1x1 red PNG image (89 bytes)
TINY_RED_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

def test_openrouter():
    """Test OpenRouter with Gemini 2.0 Flash"""
    print("\n=== Testing OpenRouter ===")
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ OPENROUTER_API_KEY not found!")
        return False
    
    print(f"✅ API Key found: {api_key[:15]}...")
    
    models = [
        "google/gemini-2.0-flash-exp:free",
        "qwen/qwen-2.5-vl-7b-instruct:free"
    ]
    
    for model in models:
        print(f"\nTrying model: {model}")
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "http://localhost:8000",
                    "X-Title": "LedgerOne Test",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "What color is this image? Reply with just the color name."},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/png;base64,{TINY_RED_PNG_B64}"}
                                }
                            ]
                        }
                    ]
                },
                timeout=30
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                print(f"✅ SUCCESS! Response: {content}")
                return True
            elif response.status_code == 429:
                print(f"⚠️ Rate limited: {response.text[:200]}")
            else:
                print(f"❌ Error: {response.text[:200]}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    return False


def test_groq():
    """Test Groq API (text only, no vision)"""
    print("\n=== Testing Groq ===")
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found!")
        return False
    
    print(f"✅ API Key found: {api_key[:15]}...")
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "user", "content": "Say 'Hello, I am working!' and nothing else."}
                ]
            },
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            print(f"✅ SUCCESS! Response: {content}")
            return True
        else:
            print(f"❌ Error: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    return False


if __name__ == "__main__":
    print("=" * 50)
    print("BASIC VISION MODEL CONNECTIVITY TEST")
    print("=" * 50)
    
    openrouter_ok = test_openrouter()
    groq_ok = test_groq()
    
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"OpenRouter Vision: {'✅ WORKING' if openrouter_ok else '❌ FAILED'}")
    print(f"Groq Text: {'✅ WORKING' if groq_ok else '❌ FAILED'}")
