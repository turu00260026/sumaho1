import { GoogleGenerativeAI } from "@google/generative-ai";

export const DEFAULT_MODEL = "gemini-2.5-flash";

/** 文字起こし済みテキストを500字に要約（安価） */
export async function summarizeText(
  text: string,
  apiKey: string,
  model = DEFAULT_MODEL
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({ model });

  const prompt = `以下はポッドキャストの文字起こしです。
内容を500文字以内の日本語で要約してください。
箇条書きではなく、読みやすい文章形式で出力してください。
要約のみ返してください（前置き・後書き不要）。

--- 文字起こし ---
${text.slice(0, 30_000)}`;

  const result = await m.generateContent(prompt);
  return result.response.text().trim();
}

/** 音声ファイルを文字起こしして500字に要約 */
export async function summarizeAudio(
  audioUrl: string,
  apiKey: string,
  model = DEFAULT_MODEL
): Promise<string> {
  // 音声ファイルをダウンロード
  const audioRes = await fetch(audioUrl, {
    signal: AbortSignal.timeout(60_000),
  });
  if (!audioRes.ok) {
    throw new Error(`音声ファイルの取得に失敗しました (${audioRes.status})`);
  }

  const contentType = audioRes.headers.get("content-type") ?? "audio/mpeg";
  const mimeType = normalizeMime(contentType);

  const buffer = await audioRes.arrayBuffer();
  const sizeMb = buffer.byteLength / 1024 / 1024;

  if (sizeMb > 18) {
    throw new Error(
      `音声ファイルが大きすぎます (${sizeMb.toFixed(1)}MB)。18MB 以下のエピソードに対応しています。`
    );
  }

  const base64 = Buffer.from(buffer).toString("base64");

  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({ model });

  const prompt =
    "この音声を日本語で文字起こしし、500文字以内の読みやすい文章で要約してください。要約のみ返してください（前置き・後書き不要）。";

  const result = await m.generateContent([
    { inlineData: { mimeType, data: base64 } },
    prompt,
  ]);

  return result.response.text().trim();
}

function normalizeMime(contentType: string): string {
  if (contentType.includes("mpeg") || contentType.includes("mp3"))
    return "audio/mpeg";
  if (contentType.includes("mp4")) return "audio/mp4";
  if (contentType.includes("ogg")) return "audio/ogg";
  if (contentType.includes("wav")) return "audio/wav";
  if (contentType.includes("aac")) return "audio/aac";
  return "audio/mpeg";
}
