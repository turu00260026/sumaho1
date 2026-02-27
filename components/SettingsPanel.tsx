"use client";

import { useState, useEffect } from "react";
import { DEFAULT_MODEL } from "@/lib/gemini";

interface Settings {
  apiKey: string;
  model: string;
}

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const [settings, setSettings] = useState<Settings>({
    apiKey: "",
    model: DEFAULT_MODEL,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("standfm_settings");
    if (raw) {
      try {
        setSettings(JSON.parse(raw));
      } catch {}
    }
  }, []);

  function handleSave() {
    localStorage.setItem("standfm_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <h2 className="text-lg font-bold">設定</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Gemini API キー
          </label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="AIza..."
            value={settings.apiKey}
            onChange={(e) =>
              setSettings((s) => ({ ...s, apiKey: e.target.value }))
            }
          />
          <p className="text-xs text-gray-400">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Google AI Studio
            </a>{" "}
            で取得できます
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Gemini モデル
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={settings.model}
            onChange={(e) =>
              setSettings((s) => ({ ...s, model: e.target.value }))
            }
          >
            <option value="gemini-2.5-flash">gemini-2.5-flash（推奨）</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition"
          >
            {saved ? "保存しました" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return { apiKey: "", model: DEFAULT_MODEL };
  try {
    const raw = localStorage.getItem("standfm_settings");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { apiKey: "", model: DEFAULT_MODEL };
}
