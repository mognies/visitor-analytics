"use client";

import { useEffect, useState } from "react";

interface VisitorPath {
  path: string;
  duration: number;
  timestamp: number;
}

interface Visitor {
  visitorId: string;
  totalDuration: number;
  visitCount: number;
  uniquePaths: number;
  firstVisit: number;
  lastVisit: number;
  paths: VisitorPath[];
}

interface VisitorAnalyticsData {
  visitors: Visitor[];
  totalVisitors: number;
}

export default function VisitorAnalytics() {
  const [data, setData] = useState<VisitorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [analyzingIntent, setAnalyzingIntent] = useState(false);
  const [intentAnalysis, setIntentAnalysis] = useState<string | null>(null);
  const [generatingGreeting, setGeneratingGreeting] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [useCustomPrompt, setUseCustomPrompt] = useState<boolean>(false);

  const defaultPrompt = intentAnalysis
    ? `以下の訪問者の意図分析をもとに、この訪問者に対する1行の接客文章を生成してください。

# AI Intent Analysis:

{intentAnalysis}

このデータをもとに、以下の要件を満たす接客文章を生成してください:
1. 訪問者の関心事やニーズを的確に捉えた内容にする
2. 1行（60文字以内）で完結させる
3. 訪問者の次のアクションを促すような内容にする
4. AI Botの立場として声をかける
5. セカンドアプローチとしての、接客文章のみを返す。（余計な説明や挨拶は不要）
`
    : `以下の訪問者の行動履歴をもとに、この訪問者に対する接客文章を生成してください。
## 日付別の訪問履歴:

{visitHistory}

このデータをもとに、以下の要件を満たす接客文章を生成してください:
1. 訪問者の関心事やニーズを的確に捉えた内容にする
2. 1行（60文字以内）で完結させる
3. 訪問者の次のアクションを促すような内容にする
4. AI Botの立場として声をかける
5. セカンドアプローチとしての、接客文章のみを返す。（余計な説明や挨拶は不要）`;

  const closeModal = () => {
    setSelectedVisitor(null);
    setIntentAnalysis(null);
    setGreetingMessage(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/visitors");
      if (!response.ok) throw new Error("Failed to fetch visitor analytics");
      const result = await response.json();
      // Sort visitors by lastVisit descending (most recent first)
      result.visitors.sort((a: Visitor, b: Visitor) => b.lastVisit - a.lastVisit);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  // Group consecutive same paths
  const groupConsecutivePaths = (paths: VisitorPath[]) => {
    if (paths.length === 0) return [];

    const grouped: Array<{
      path: string;
      count: number;
      totalDuration: number;
      firstTimestamp: number;
      lastTimestamp: number;
    }> = [];

    let current = {
      path: paths[0].path,
      count: 1,
      totalDuration: paths[0].duration,
      firstTimestamp: paths[0].timestamp,
      lastTimestamp: paths[0].timestamp,
    };

    for (let i = 1; i < paths.length; i++) {
      if (paths[i].path === current.path) {
        // Same path, merge
        current.count++;
        current.totalDuration += paths[i].duration;
        current.lastTimestamp = paths[i].timestamp;
      } else {
        // Different path, save current and start new
        grouped.push({ ...current });
        current = {
          path: paths[i].path,
          count: 1,
          totalDuration: paths[i].duration,
          firstTimestamp: paths[i].timestamp,
          lastTimestamp: paths[i].timestamp,
        };
      }
    }

    // Don't forget the last group
    grouped.push(current);

    return grouped;
  };

  const handleAnalyzeIntent = async () => {
    if (!selectedVisitor) return;

    setAnalyzingIntent(true);
    setIntentAnalysis(null);

    try {
      const response = await fetch("/api/analyze-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId: selectedVisitor.visitorId,
          paths: selectedVisitor.paths,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze intent");
      }

      const data = await response.json();
      setIntentAnalysis(data.analysis);
    } catch (error) {
      console.error("Failed to analyze intent:", error);
      setIntentAnalysis("Failed to analyze visitor intent. Please try again.");
    } finally {
      setAnalyzingIntent(false);
    }
  };

  const handleGenerateGreeting = async () => {
    if (!selectedVisitor) return;

    setGeneratingGreeting(true);
    setGreetingMessage(null);

    try {
      const requestBody: {
        visitorId: string;
        paths: VisitorPath[];
        model: string;
        intentAnalysis?: string;
        customPrompt?: string;
      } = {
        visitorId: selectedVisitor.visitorId,
        paths: selectedVisitor.paths,
        model: selectedModel,
        intentAnalysis: intentAnalysis || undefined,
      };

      if (useCustomPrompt && customPrompt.trim()) {
        requestBody.customPrompt = customPrompt;
      }

      const response = await fetch("/api/generate-greeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to generate greeting");
      }

      const data = await response.json();
      setGreetingMessage(data.greeting);
    } catch (error) {
      console.error("Failed to generate greeting:", error);
      setGreetingMessage("接客文章の生成に失敗しました。もう一度お試しください。");
    } finally {
      setGeneratingGreeting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading visitor analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-600 text-center">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.visitors.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mt-4 text-slate-500 font-medium">No visitor data available yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Visit some pages to see visitor analytics here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Total Visitors</p>
              <p className="text-3xl font-bold">{data.totalVisitors}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Page Views</p>
              <p className="text-3xl font-bold">
                {data.visitors.reduce((sum, v) => sum + v.visitCount, 0)}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Total Time Spent</p>
              <p className="text-3xl font-bold">
                {formatDuration(data.visitors.reduce((sum, v) => sum + v.totalDuration, 0))}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Visitor List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-xl font-bold text-slate-900">Visitor Details</h2>
          <p className="text-sm text-slate-600 mt-1">
            Individual visitor behavior and engagement metrics
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Visitor ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Total Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Page Views
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Unique Pages
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  First Visit
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {data.visitors.map((visitor) => (
                <tr
                  key={visitor.visitorId}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedVisitor(visitor)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {visitor.visitorId.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="ml-3 text-sm font-mono text-slate-600">
                        {visitor.visitorId.substring(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                    {formatDuration(visitor.totalDuration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {visitor.visitCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {visitor.uniquePaths}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatRelativeTime(visitor.firstVisit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatRelativeTime(visitor.lastVisit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVisitor(visitor);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Detail Modal */}
      {selectedVisitor && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Visitor Journey</h3>
                <p className="text-sm text-blue-100 font-mono mt-1">
                  ID: {selectedVisitor.visitorId}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto bg-slate-50">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow p-4 border border-slate-200">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {formatDuration(selectedVisitor.totalDuration)}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-1">Total Time</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border border-slate-200">
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                    {selectedVisitor.visitCount}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-1">Page Views</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border border-slate-200">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                    {selectedVisitor.uniquePaths}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-1">Unique Pages</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border border-slate-200">
                  <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    {Math.floor(selectedVisitor.totalDuration / selectedVisitor.visitCount) / 1000}s
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-1">Avg per Page</div>
                </div>
              </div>

              {/* AI Intent Analysis */}
              <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-purple-600"
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
                    AI Intent Analysis
                  </h4>
                  <button
                    onClick={handleAnalyzeIntent}
                    disabled={analyzingIntent}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      analyzingIntent
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                    }`}
                  >
                    {analyzingIntent ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
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
                        Analyze Intent
                      </span>
                    )}
                  </button>
                </div>

                {intentAnalysis ? (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-purple-600"
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
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-slate-900 mb-2">
                          Visitor Intent
                        </h5>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {intentAnalysis}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-6 border-2 border-dashed border-slate-200 rounded-lg text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-slate-300 mb-3"
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
                    <p className="text-sm text-slate-500 font-medium">
                      Click "Analyze Intent" to understand visitor behavior
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      AI will analyze the visit timeline to identify patterns and intent
                    </p>
                  </div>
                )}
              </div>

              {/* AI Greeting Message Generator */}
              <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      接客文章生成
                    </h4>
                    {intentAnalysis && (
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Intent分析済み
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={generatingGreeting}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                    </select>
                    <button
                      onClick={handleGenerateGreeting}
                      disabled={generatingGreeting}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        generatingGreeting
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                      }`}
                    >
                      {generatingGreeting ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                          生成中...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                          接客文章を作成
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Custom Prompt Toggle */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomPrompt}
                      onChange={(e) => setUseCustomPrompt(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      カスタムプロンプトを使用
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      高度な設定
                    </span>
                  </label>
                </div>

                {/* Custom Prompt Input */}
                {useCustomPrompt && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      プロンプトテンプレート
                      <span className="ml-2 text-slate-500 font-normal">
                        (プレースホルダー: {"{intentAnalysis}"}, {"{visitHistory}"})
                      </span>
                    </label>
                    <textarea
                      value={customPrompt || defaultPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-mono text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      💡 ヒント:{" "}
                      <code className="bg-slate-100 px-1 py-0.5 rounded">{"{intentAnalysis}"}</code>{" "}
                      は分析結果に、
                      <code className="bg-slate-100 px-1 py-0.5 rounded ml-1">
                        {"{visitHistory}"}
                      </code>{" "}
                      は訪問履歴に置き換えられます
                    </p>
                  </div>
                )}

                {greetingMessage ? (
                  <div className="mt-4 p-5 bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-300 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-slate-900 mb-2">
                          生成された接客文章
                        </h5>
                        <p className="text-base text-slate-800 leading-relaxed font-medium">
                          {greetingMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-6 border-2 border-dashed border-slate-200 rounded-lg text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-slate-300 mb-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <p className="text-sm text-slate-500 font-medium">
                      「接客文章を作成」をクリックして訪問者に合わせた接客文を生成
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      訪問履歴から訪問者の関心事を分析し、最適な接客文を1行で提案します
                    </p>
                  </div>
                )}
              </div>

              {/* Visit Timeline */}
              <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Visit Timeline
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {groupConsecutivePaths(selectedVisitor.paths).map((group, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {group.path}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {group.count > 1
                                  ? `${formatDate(group.firstTimestamp)} - ${formatDate(group.lastTimestamp)}`
                                  : formatDate(group.firstTimestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            {formatDuration(group.totalDuration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
