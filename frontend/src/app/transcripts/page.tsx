"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  Sparkles,
  Volume2,
  Wand2,
  Zap,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Quiz from "@/components/Quiz";

interface TranscriptEntry {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptData {
  video_id: string;
  title?: string;
  transcript: TranscriptEntry[];
}

interface SummaryData {
  summary?: string;
  error?: string;
  message?: string;
}

function TranscriptContent() {
  const searchParams = useSearchParams();
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(
    null
  );
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    const videoId = searchParams.get("videoId");
    if (!videoId) {
      setError("No video ID provided");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [transcriptResponse, summaryResponse] = await Promise.all([
          fetch(
            `/api/transcript?url=https://www.youtube.com/watch?v=${videoId}`
          ),
          fetch(`/api/summary?url=https://www.youtube.com/watch?v=${videoId}`),
        ]);

        const transcriptData = await transcriptResponse.json();
        const summaryData = await summaryResponse.json();

        setTranscriptData(transcriptData);
        setSummaryData(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const fetchSummary = async (videoId: string) => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await fetch(
        `/api/summary?url=https://www.youtube.com/watch?v=${videoId}`
      );
      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Failed to fetch summary"
      );
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!transcriptData) return;
    const text = transcriptData.transcript.map((entry) => entry.text).join(" ");
    navigator.clipboard.writeText(text);
  };

  const downloadAsFile = (format: "txt" | "srt") => {
    if (!transcriptData) return;

    let content = "";
    const filename = `transcript_${transcriptData.video_id}.${format}`;

    if (format === "txt") {
      if (includeTimestamps) {
        content = transcriptData.transcript
          .map((entry) => {
            const timestamp = formatTime(entry.start);
            return `[${timestamp}] ${entry.text}`;
          })
          .join("\n");
      } else {
        content = transcriptData.transcript
          .map((entry) => entry.text)
          .join("\n");
      }
    } else if (format === "srt") {
      content = transcriptData.transcript
        .map((entry, index) => {
          const start = formatTime(entry.start);
          const end = formatTime(entry.start + entry.duration);
          return `${index + 1}\n${start} --> ${end}\n${entry.text}\n`;
        })
        .join("\n");
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms
      .toString()
      .padStart(3, "0")}`;
  };

  const seekToTime = (seconds: number) => {
    setActiveTimestamp(seconds);
    const iframe = document.querySelector("iframe");
    if (iframe) {
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "seekTo",
          args: [seconds, true],
        }),
        "*"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div
            className="absolute inset-2 w-16 h-16 border-4 border-cyan-500/20 border-b-cyan-500 rounded-full animate-spin"
            style={{ animationDirection: "reverse" }}
          ></div>
          <div className="absolute inset-4 w-12 h-12 border-4 border-pink-500/20 border-l-pink-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Something went wrong
          </h2>
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!transcriptData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            No Content Found
          </h2>
          <p className="text-gray-400 text-lg">No transcript data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Ultra-modern grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-cyan-500/15 to-blue-600/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-emerald-500/10 to-teal-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-12">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              Voxa
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Talk to your videos.
            </span>
          </h1>

          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Transform video content into interactive, searchable transcripts
            with AI-powered insights and seamless navigation
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Video Section - 5 columns */}
          <div className="col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-700"></div>
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${transcriptData.video_id}?enablejsapi=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-2xl"
                ></iframe>
              </div>
            </motion.div>

            {/* Video Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-all duration-700"></div>
              <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
                <h2 className="text-2xl font-bold text-white mb-4 leading-tight">
                  {transcriptData.title}
                </h2>
                <div className="flex items-center gap-6 text-white/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="font-medium text-sm">Audio Ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="font-medium text-sm">
                      {Math.ceil(
                        transcriptData.transcript[
                          transcriptData?.transcript?.length - 1
                        ]?.start / 60
                      ) || 0}{" "}
                      minutes
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={copyToClipboard}
                    className="group px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/10 hover:border-white/20 hover:scale-105 font-medium text-sm"
                  >
                    <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Copy Text
                  </button>

                  <button
                    onClick={() => downloadAsFile("txt")}
                    className="group px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 hover:scale-105 shadow-lg hover:shadow-emerald-500/25 font-medium text-sm"
                  >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    TXT
                  </button>

                  <button
                    onClick={() => downloadAsFile("srt")}
                    className="group px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 hover:scale-105 shadow-lg hover:shadow-blue-500/25 font-medium text-sm"
                  >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    SRT
                  </button>

                  <button
                    onClick={() => setIncludeTimestamps(!includeTimestamps)}
                    className={`group px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 hover:scale-105 font-medium text-sm ${
                      includeTimestamps
                        ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg hover:shadow-orange-500/25"
                        : "bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white border border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Timestamps
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Transcript Section - 7 columns */}
          <div className="col-span-7">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="group relative h-[calc(100vh-16rem)]"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-all duration-700"></div>
              <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        Interactive Transcript
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-white/50">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="font-medium text-sm">Live</span>
                    </div>
                  </div>
                </div>

                {/* Transcript Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <div className="p-4 space-y-3">
                    {transcriptData.transcript.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-500 hover:scale-[1.02] ${
                          activeTimestamp === entry.start
                            ? "bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 border border-purple-400/30 shadow-lg shadow-purple-500/10"
                            : "bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/10"
                        }`}
                        onClick={() => seekToTime(entry.start)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center gap-2">
                            <div
                              className={`px-2 py-1 rounded-lg font-mono text-xs font-medium ${
                                activeTimestamp === entry.start
                                  ? "bg-purple-400/20 text-purple-200 border border-purple-400/30"
                                  : "bg-white/10 text-white/50 border border-white/10"
                              }`}
                            >
                              {Math.floor(entry.start / 60)}:
                              {(entry.start % 60).toFixed(0).padStart(2, "0")}
                            </div>
                            {activeTimestamp === entry.start && (
                              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-white/90 leading-relaxed text-base group-hover:text-white transition-colors">
                              {entry.text}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                        </div>

                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/5 via-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Summary Section - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-all duration-700"></div>
            <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">AI Summary</h3>
                </div>
                {!summaryData?.summary && !isSummaryLoading && (
                  <button
                    onClick={() => fetchSummary(transcriptData?.video_id || "")}
                    className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                  >
                    <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Generate Summary
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isSummaryLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-8"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                      <div
                        className="absolute inset-1 w-8 h-8 border-4 border-pink-500/20 border-b-pink-500 rounded-full animate-spin"
                        style={{ animationDirection: "reverse" }}
                      ></div>
                    </div>
                  </motion.div>
                ) : summaryError ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="mb-3 text-sm">{summaryError}</p>
                      <button
                        onClick={() =>
                          fetchSummary(transcriptData?.video_id || "")
                        }
                        className="text-sm text-red-300 hover:text-red-200 font-medium transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </motion.div>
                ) : summaryData?.error === "transcript_too_long" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-xl p-6 border border-purple-400/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2">
                          Upgrade to Premium
                        </h4>
                        <p className="text-white/70 mb-4 text-sm leading-relaxed">
                          {summaryData.message}
                        </p>
                        <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-purple-500/25 hover:scale-105">
                          Upgrade Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : summaryData?.summary ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                      <p className="text-white/80 leading-relaxed text-base whitespace-pre-line mb-4">
                        {summaryData.summary}
                      </p>
                      <button
                        onClick={() =>
                          fetchSummary(transcriptData?.video_id || "")
                        }
                        className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 font-medium text-sm"
                      >
                        <Wand2 className="w-4 h-4" />
                        Regenerate
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                      <Wand2 className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-white/50 mb-6 text-sm">
                      Generate an AI-powered summary of this video
                    </p>
                    <button
                      onClick={() =>
                        fetchSummary(transcriptData?.video_id || "")
                      }
                      className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all duration-300 flex items-center gap-3 font-semibold text-sm mx-auto shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                    >
                      <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Generate Summary
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              label: "Total Segments",
              value: transcriptData.transcript.length.toLocaleString(),
              color: "from-purple-600 to-pink-600",
              icon: BarChart3,
            },
            {
              label: "Duration",
              value: `${
                Math.ceil(
                  transcriptData.transcript[
                    transcriptData.transcript.length - 1
                  ]?.start / 60
                ) || 0
              } min`,
              color: "from-blue-600 to-cyan-600",
              icon: Clock,
            },
            {
              label: "Total Words",
              value: transcriptData.transcript
                .reduce((acc, entry) => acc + entry.text.split(" ").length, 0)
                .toLocaleString(),
              color: "from-emerald-600 to-teal-600",
              icon: FileText,
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="group relative"
            >
              <div
                className={`absolute -inset-1 bg-gradient-to-r ${stat.color} rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-700`}
              ></div>
              <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} bg-opacity-20 flex items-center justify-center`}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div
                      className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-white/50 font-medium text-sm">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quiz Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Quiz Section */}
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-blue-400" />
              Quiz
            </h2>
            {transcriptData?.video_id && (
              <Quiz videoId={transcriptData.video_id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TranscriptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <div
              className="absolute inset-2 w-16 h-16 border-4 border-cyan-500/20 border-b-cyan-500 rounded-full animate-spin"
              style={{ animationDirection: "reverse" }}
            ></div>
            <div className="absolute inset-4 w-12 h-12 border-4 border-pink-500/20 border-l-pink-500 rounded-full animate-spin"></div>
          </div>
        </div>
      }
    >
      <TranscriptContent />
    </Suspense>
  );
}
