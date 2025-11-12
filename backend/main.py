from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI API configuration
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Debug: Check if API key is loaded
if not OPENAI_API_KEY:
    print("WARNING: OPENAI_API_KEY not found in environment variables!")
else:
    print(f"API Key loaded: {OPENAI_API_KEY[:20]}...")

class TextInput(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: float
    keywords: list[str]
    emotion: str

@app.get("/")
async def root():
    return {"message": "Sentiment Aura Backend is running!"}

@app.post("/process_text")
async def process_text(input_data: TextInput):
    """
    Receives text from frontend, analyzes it with OpenAI,
    returns sentiment and keywords
    """
    try:
        # Construct prompt for OpenAI
        prompt = f"""Analyze the sentiment and extract keywords from this text: "{input_data.text}"

Return ONLY a valid JSON object with this exact format (no markdown, no explanation):
{{
  "sentiment": <number between -1 and 1>,
  "keywords": [<array of 2-5 relevant keywords>],
  "emotion": "<one word: joy, sadness, anger, fear, surprise, or neutral>"
}}

Rules:
- sentiment: -1 is very negative, 0 is neutral, +1 is very positive
- keywords: extract the most meaningful words/topics
- emotion: pick the primary emotion detected"""

        # Call OpenAI API
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a sentiment analysis assistant. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": 200
        }
        
        response = requests.post(OPENAI_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        # Extract response
        openai_response = response.json()
        response_text = openai_response["choices"][0]["message"]["content"].strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        # Parse JSON
        result = json.loads(response_text)
        
        return {
            "sentiment": result.get("sentiment", 0.0),
            "keywords": result.get("keywords", []),
            "emotion": result.get("emotion", "neutral")
        }
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Response was: {response_text}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    
    except requests.exceptions.RequestException as e:
        print(f"OpenAI API error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response body: {e.response.text}")
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
    
    except Exception as e:
        print(f"Error processing text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)