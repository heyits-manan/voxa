from fastapi import APIRouter, HTTPException, Query
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from app.utils import is_valid_video_id, extract_video_id_from_url

router = APIRouter()

@router.get("/")
def get_transcript(url: str = Query(..., description="YouTube video URL or video ID")):
    try:
        # Extract video ID from URL or validate if it's already a video ID
        video_id = extract_video_id_from_url(url)
        
        if not is_valid_video_id(video_id):
            raise HTTPException(status_code=400, detail="Invalid YouTube video ID extracted from URL.")
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # Get available transcripts
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        available_languages = [t.language_code for t in transcript_list]
        
        # Get the transcript
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        
        return {
            "transcript": transcript,
            "video_id": video_id,
            "available_languages": available_languages
        }
    except TranscriptsDisabled:
        raise HTTPException(status_code=404, detail="Transcript not available for this video.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 