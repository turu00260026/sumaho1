"use client";

import { useState } from "react";
import type { SummarizeResponse } from "@/types";

interface Props {
  apiKey: string;
  model: string;
  onResult: (res: SummarizeResponse, url: string) => void;
  onError: (msg: string) => void;
  onLoading: (v: boolean) => void;
  loading: boolean;
}

export function SummarizeForm({
  apiKey,
  model,
  onResult,
  onError,
  onLoading,
  loading,
}: Props) {
  const [url, setUrl] = useState("");
  const [listenRss, setListenRss] = useState("");
  const [showListen, setShowListen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    if (!apiKey) {
      onError("右上の設定から Gemini API キーを入力してください");
      return;
    }

    onLoading(true);
    onError("");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          apiKey,
          model,
          listenRssUrl: listenRss.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "エラーが発生しました");
      } else {
        onResult(data as SummarizeResponse, url.trim());
      }
    } catch {
      onError("通信エラーが発生しました");
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          placeholder="https://stand.fm/episodes/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
        >
          {loading ? "処理中..." : "要約する"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowListen((v) => !v)}
        className="text-xs text-indigo-500 hover:underline"
      >
        {showListen ? "▲" : "▼"} Listen RSS URL を使う（無料・高速）
      </button>

      {showListen && (
        <div className="space-y-1">
          <input
            type="url"
            className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            placeholder="https://listen.style/p/channelname/rss"
            value={listenRss}
            onChange={(e) => setListenRss(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-gray-400">
            配信者の Listen ページの RSS URL を貼り付けると文字起こしを直接取得します（Gemini
            音声処理より安く高速）
          </p>
        </div>
      )}
    </form>
  );
}
