"use client";

import { useState, useEffect, useCallback } from "react";
import { SummarizeForm } from "@/components/SummarizeForm";
import { SummaryCard } from "@/components/SummaryCard";
import { HistoryList } from "@/components/HistoryList";
import { SettingsPanel, loadSettings } from "@/components/SettingsPanel";
import { saveSummary, listSummaries } from "@/lib/db";
import type { SummarizeResponse, SummaryRecord } from "@/types";

type Tab = "summarize" | "history";

export default function Home() {
  const [tab, setTab] = useState<Tab>("summarize");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SummaryRecord | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [history, setHistory] = useState<SummaryRecord[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ apiKey: "", model: "" });

  // 設定をロード
  useEffect(() => {
    setSettings(loadSettings());
  }, [showSettings]);

  // 履歴をロード
  const reloadHistory = useCallback(async () => {
    const records = await listSummaries();
    setHistory(records);
  }, []);

  useEffect(() => {
    reloadHistory();
  }, [reloadHistory]);

  async function handleResult(res: SummarizeResponse, url: string) {
    const record: SummaryRecord = {
      id: crypto.randomUUID(),
      episodeUrl: url,
      title: res.title,
      channelTitle: res.channelTitle,
      publishedAt: res.publishedAt,
      thumbnail: res.thumbnail,
      summary: res.summary,
      savedAt: Date.now(),
      source: res.source,
    };
    setResult(record);
    setResultUrl(url);
    await saveSummary(record);
    await reloadHistory();
  }

  const hasApiKey = !!settings.apiKey;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-base">stand.fm 要約</h1>
          <button
            onClick={() => setShowSettings(true)}
            className={`text-sm px-3 py-1.5 rounded-lg transition ${
              hasApiKey
                ? "text-gray-500 hover:bg-gray-100"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {hasApiKey ? "設定" : "⚠ API キーを設定"}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* タブ */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["summarize", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                tab === t
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "summarize" ? "要約する" : `履歴（${history.length}件）`}
            </button>
          ))}
        </div>

        {tab === "summarize" && (
          <div className="space-y-4">
            <SummarizeForm
              apiKey={settings.apiKey}
              model={settings.model}
              onResult={handleResult}
              onError={setError}
              onLoading={setLoading}
              loading={loading}
            />

            {/* ローディング */}
            {loading && (
              <div className="bg-white rounded-2xl border p-8 flex flex-col items-center gap-3 text-gray-400">
                <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm">音声を解析中です（30秒〜3分）</p>
              </div>
            )}

            {/* エラー */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* 結果 */}
            {result && !loading && !error && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  要約結果
                </p>
                <SummaryCard record={result} episodeUrl={resultUrl} />
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <HistoryList records={history} onUpdate={reloadHistory} />
        )}
      </main>

      {/* 設定モーダル */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
