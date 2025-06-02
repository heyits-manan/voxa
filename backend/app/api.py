from fastapi import APIRouter
from app.routes import transcript, summary, quiz

router = APIRouter()

# Include the transcript, summary, and quiz routes
router.include_router(transcript.router, prefix="/transcript", tags=["transcript"])
router.include_router(summary.router, prefix="/summary", tags=["summary"])
router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])