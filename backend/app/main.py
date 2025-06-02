from fastapi import FastAPI
from app.api import router

app = FastAPI(title="YouTube Transcript Downloader")

app.include_router(router)
