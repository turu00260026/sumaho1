"use client";

import { useState } from "react";
import type { SummaryRecord } from "@/types";

interface Props {
  record: SummaryRecord;
  episodeUrl?: string;
  onDelete?: () => void;
}

export function SummaryCard({ record, episodeUrl, onDelete }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(record.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const dateStr = record.publishedAt
    ? new Date(record.publishedAt).toLocaleDateString("ja-JP")
    : "";

  const savedStr = new Date(record.savedAt).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
      {/* ヘッダー */}
      <div className="flex gap-3 items-start">
        {record.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={record.thumbnail}
            alt=""
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-snug line-clamp-2">
            {record.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {record.channelTitle}
            {dateStr && ` ・ ${dateStr}`}
          </p>
        </div>
        <span
          className={`ml-auto flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
            record.source === "listen"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-violet-100 text-violet-700"
          }`}
        >
          {record.source === "listen" ? "Listen" : "Gemini"}
        </span>
      </div>

      {/* 要約本文 */}
      <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
        {record.summary}
      </p>

      {/* フッター */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-300 flex-1">保存: {savedStr}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-indigo-500 hover:text-indigo-700 transition px-2 py-1 rounded hover:bg-indigo-50"
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
        {episodeUrl && (
          <a
            href={episodeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1 rounded hover:bg-gray-50"
          >
            元の配信 ↗
          </a>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-600 transition px-2 py-1 rounded hover:bg-red-50"
          >
            削除
          </button>
        )}
      </div>
    </div>
  );
}
