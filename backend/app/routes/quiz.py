from fastapi import APIRouter, HTTPException, Query
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
import google.generativeai as genai
from app.utils import is_valid_video_id, extract_video_id_from_url
from app.config import GEMINI_API_KEY
import json

router = APIRouter()

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

@router.get("/")
def get_quiz(url: str = Query(..., description="YouTube video URL or video ID")):
    try:
        # Extract video ID from URL or validate if it's already a video ID
        video_id = extract_video_id_from_url(url)
        
        if not is_valid_video_id(video_id):
            raise HTTPException(status_code=400, detail="Invalid YouTube video ID extracted from URL.")
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # Get the transcript
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Combine all transcript text
        full_text = " ".join([entry["text"] for entry in transcript])
        
        # Check if text exceeds token limit (rough estimation: 1 token ≈ 4 characters)
        if len(full_text) > 12000:  # 3000 tokens * 4 characters
            return {
                "error": "transcript_too_long",
                "message": "This video's transcript exceeds the free tier limit. Please upgrade to generate a quiz."
            }
        
        # Generate quiz using Gemini
        prompt = f"""You are a quiz generator. Based on the following video transcript, generate exactly 3 multiple choice questions.
        Each question must have exactly 4 options, with only one correct answer.
        Your response must be a valid JSON array containing exactly 3 objects.
        Each object must have exactly these fields: "question", "options" (array of 4 strings), and "correctAnswer" (integer 0-3).
        
        Example format:
        [
            {{
                "question": "What is the main topic discussed in the video?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0
            }},
            {{
                "question": "Which technology is mentioned as the most important?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 2
            }},
            {{
                "question": "What is the recommended approach according to the speaker?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 1
            }}
        ]

        Important:
        1. Return ONLY the JSON array, no other text
        2. Make sure the JSON is valid and properly formatted
        3. Each question should test understanding of key concepts
        4. The correctAnswer must be an integer between 0 and 3
        5. Each options array must have exactly 4 strings
        
        Video transcript:
        {full_text}"""
        
        response = model.generate_content(prompt)
        
        # Clean the response text to ensure it's valid JSON
        response_text = response.text.strip()
        # Remove any markdown code block markers if present
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        try:
            questions = json.loads(response_text)
            
            # Validate the structure
            if not isinstance(questions, list) or len(questions) != 3:
                raise ValueError("Invalid response format: expected exactly 3 questions")
                
            for q in questions:
                if not all(k in q for k in ["question", "options", "correctAnswer"]):
                    raise ValueError("Invalid question format: missing required fields")
                if not isinstance(q["options"], list) or len(q["options"]) != 4:
                    raise ValueError("Invalid options format: expected exactly 4 options")
                if not isinstance(q["correctAnswer"], int) or q["correctAnswer"] not in range(4):
                    raise ValueError("Invalid correctAnswer: must be integer 0-3")
            
            return {
                "questions": questions,
                "video_id": video_id
            }
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON: {response_text}")
            raise HTTPException(status_code=500, detail=f"Failed to parse quiz questions: {str(e)}")
        except ValueError as e:
            print(f"Invalid response format: {response_text}")
            raise HTTPException(status_code=500, detail=f"Invalid quiz format: {str(e)}")
            
    except TranscriptsDisabled:
        raise HTTPException(status_code=404, detail="Transcript not available for this video.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 