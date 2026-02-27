"use client";

import { useState } from "react";
import type { SummaryRecord } from "@/types";
import { SummaryCard } from "./SummaryCard";
import { deleteSummary, clearAllSummaries } from "@/lib/db";

interface Props {
  records: SummaryRecord[];
  onUpdate: () => void;
}

export function HistoryList({ records, onUpdate }: Props) {
  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = query.trim()
    ? records.filter(
        (r) =>
          r.title.includes(query) ||
          r.summary.includes(query) ||
          r.channelTitle.includes(query)
      )
    : records;

  async function handleDelete(id: string) {
    await deleteSummary(id);
    onUpdate();
  }

  async function handleClearAll() {
    await clearAllSummaries();
    setConfirmClear(false);
    onUpdate();
  }

  if (records.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        まだ履歴がありません
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* 検索 + 全削除 */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          placeholder="タイトル・要約を検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-xs text-red-400 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition whitespace-nowrap"
          >
            全削除
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleClearAll}
              className="text-xs bg-red-500 text-white px-3 py-2 rounded-xl hover:bg-red-600 transition"
            >
              実行
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="text-xs border px-3 py-2 rounded-xl hover:bg-gray-50 transition"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          「{query}」に一致する履歴がありません
        </p>
      ) : (
        filtered.map((r) => (
          <SummaryCard
            key={r.id}
            record={r}
            episodeUrl={r.episodeUrl}
            onDelete={() => handleDelete(r.id)}
          />
        ))
      )}
    </div>
  );
}
