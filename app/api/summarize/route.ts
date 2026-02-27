import { NextRequest, NextResponse } from "next/server";
import { fetchStandFmEpisode } from "@/lib/standfm";
import { fetchListenTranscript } from "@/lib/listen";
import { summarizeText, summarizeAudio, DEFAULT_MODEL } from "@/lib/gemini";
import type { SummarizeRequest, SummarizeResponse } from "@/types";

export const maxDuration = 120; // Vercel / Next.js timeout (seconds)

export async function POST(req: NextRequest) {
  let body: SummarizeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストが不正です" }, { status: 400 });
  }

  const { url, apiKey, listenRssUrl, model = DEFAULT_MODEL } = body;

  if (!url) {
    return NextResponse.json({ error: "URL を入力してください" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API キーを設定してください" },
      { status: 400 }
    );
  }

  // 1. stand.fm エピソード情報を取得
  let episode;
  try {
    episode = await fetchStandFmEpisode(url);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 422 }
    );
  }

  // 2. Listen で文字起こし取得を試みる
  let summary: string | null = null;
  let source: "listen" | "gemini" = "gemini";

  if (listenRssUrl && episode.title) {
    try {
      const transcript = await fetchListenTranscript(
        episode.title,
        episode.publishedAt,
        listenRssUrl
      );
      if (transcript) {
        summary = await summarizeText(transcript, apiKey, model);
        source = "listen";
      }
    } catch {
      // Listen 失敗 → Gemini フォールバックへ
    }
  }

  // 3. Gemini 音声処理にフォールバック
  if (!summary) {
    if (!episode.audioUrl) {
      return NextResponse.json(
        {
          error:
            "音声URLを取得できませんでした。Listen RSS URLを設定するか、別のエピソードをお試しください。",
        },
        { status: 422 }
      );
    }
    try {
      summary = await summarizeAudio(episode.audioUrl, apiKey, model);
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 500 }
      );
    }
  }

  const response: SummarizeResponse = {
    title: episode.title,
    channelTitle: episode.channelTitle,
    publishedAt: episode.publishedAt,
    thumbnail: episode.thumbnail,
    summary,
    source,
  };

  return NextResponse.json(response);
}
