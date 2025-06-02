"use client";

import { useState } from "react";
import { Wand2, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  videoId: string;
}

export default function Quiz({ videoId }: QuizProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/quiz?videoId=${videoId}`);
      const data = await response.json();
      setQuestions(data.questions);
      setShowQuiz(true);
      setCurrentQuestion(0);
      setScore(0);
      setQuizCompleted(false);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setQuizCompleted(true);
    }
  };

  if (!showQuiz) {
    return (
      <button
        onClick={fetchQuiz}
        disabled={isLoading}
        className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm shadow-lg hover:shadow-purple-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wand2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
        {isLoading ? "Generating Quiz..." : "Take Quiz"}
      </button>
    );
  }

  if (quizCompleted) {
    return (
      <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Quiz Completed!</h2>
        </div>
        <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5 mb-6">
          <p className="text-2xl font-bold text-white mb-2">
            Your Score: {score} out of {questions.length}
          </p>
          <p className="text-white/70">
            {score === questions.length
              ? "Perfect score! 🎉"
              : score >= questions.length / 2
              ? "Good job! Keep learning! 💪"
              : "Keep practicing! You'll get better! 📚"}
          </p>
        </div>
        <button
          onClick={fetchQuiz}
          className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm shadow-lg hover:shadow-purple-500/25 hover:scale-105"
        >
          <Wand2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Quiz</h2>
          <p className="text-white/70">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
      </div>

      <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5 mb-6">
        <p className="text-xl text-white mb-6">
          {questions[currentQuestion].question}
        </p>
        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                selectedAnswer === index
                  ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white"
                  : "bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-white/70 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {selectedAnswer !== null && (
        <button
          onClick={handleNextQuestion}
          className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm shadow-lg hover:shadow-purple-500/25 hover:scale-105"
        >
          {currentQuestion < questions.length - 1 ? (
            <>
              Next Question
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <>
              Finish Quiz
              <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
