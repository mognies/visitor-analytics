"use client";

import { useChat } from "ai/react";
import { useState } from "react";

interface AIInsightsProps {
  visitorId?: string;
  mode: "overall" | "visitor";
}

export default function AIInsights({ visitorId, mode }: AIInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { messages, append, isLoading } = useChat({
    api: "/api/ai-insights",
    body: { visitorId },
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await append({
      role: "user",
      content: "Analyze this data",
    });
    setIsAnalyzing(false);
  };

  const lastMessage = messages[messages.length - 1];
  const hasAnalysis = lastMessage && lastMessage.role === "assistant";

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg p-2">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Insights</h3>
            <p className="text-sm text-slate-600">
              {mode === "overall"
                ? "Powered by GPT-4 • Overall analytics"
                : "Powered by GPT-4 • Visitor journey"}
            </p>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Generate Insights</span>
            </>
          )}
        </button>
      </div>

      {hasAnalysis && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
              {lastMessage.content}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>AI-generated insights may not always be accurate</span>
            </div>
            <button
              onClick={handleAnalyze}
              className="text-purple-600 hover:text-purple-800 font-medium cursor-pointer"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {!hasAnalysis && !isLoading && (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <p className="text-slate-600 font-medium mb-2">
            No insights generated yet
          </p>
          <p className="text-sm text-slate-500">
            Click "Generate Insights" to analyze {mode === "overall" ? "your analytics data" : "this visitor's journey"} with AI
          </p>
        </div>
      )}
    </div>
  );
}
