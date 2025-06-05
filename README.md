 # Voxa - YouTube Transcript Downloader

Voxa is a web application that allows users to download and process YouTube video transcripts. The application uses AI to summarize the video based on the Transcript and generates quizes. The application consists of a Next.js frontend and a FastAPI backend.

## Tech Stack

### Frontend
- Next.js 15.3.2
- React 19
- TypeScript
- TailwindCSS
- Framer Motion
- Lucide React

### Backend
- FastAPI
- Python 3.x
- YouTube Transcript API
- Google Generative AI
- Uvicorn

## Prerequisites

- Node.js (Latest LTS version recommended)
- Python 3.x
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd voxa
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows, use: .\venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Environment Variables

#### Backend (.env)
Create a `.env` file in the backend directory with the following variables:
```
GOOGLE_API_KEY=your_google_api_key
```
Get the Gemini API key from: https://aistudio.google.com/apikey


#### Frontend (.env.local)
Create a `.env.local` file in the frontend directory with the following variables:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Note: Sometimes the port 8000 might be occupied. In that case use any other port number.

### 5. Running the Application

#### Option 1: Using the Development Script
The easiest way to start both frontend and backend servers is to use the provided script:

```bash
chmod +x start-dev.sh
./start-dev.sh
```

This will start:
- Backend server at http://localhost:8000
- Frontend server at http://localhost:3000
- API documentation at http://localhost:8000/docs

#### Option 2: Manual Start

Start the backend:
```bash
cd backend
source venv/bin/activate  # On Windows, use: .\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Start the frontend:
```bash
cd frontend
npm run dev
```

## Development

- Backend API documentation is available at http://localhost:8000/docs
- Frontend development server includes hot reloading
- The application uses TypeScript for type safety
- TailwindCSS is used for styling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
