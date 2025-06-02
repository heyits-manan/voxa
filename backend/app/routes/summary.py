from fastapi import APIRouter, HTTPException, Query
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
import google.generativeai as genai
from app.utils import is_valid_video_id, extract_video_id_from_url
from app.config import GEMINI_API_KEY


router = APIRouter()

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

@router.get("/")
def get_summary(url: str = Query(..., description="YouTube video URL or video ID")):


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
                "message": "This video's transcript exceeds the free tier limit. Please upgrade to generate a summary."
            }
        
        # Generate summary using Gemini
        prompt = f"Please provide a concise summary of the following video transcript in 3-4 paragraphs:\n\n{full_text}"
        response = model.generate_content(prompt)
        
        
        return {
            "summary": response.text,
            "video_id": video_id
        }
    except TranscriptsDisabled:
        raise HTTPException(status_code=404, detail="Transcript not available for this video.")
    except Exception as e:
        
        raise HTTPException(status_code=500, detail=str(e)) 