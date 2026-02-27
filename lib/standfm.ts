import type { StandFmEpisode } from "@/types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function parseEpisodeId(url: string): string | null {
  const m = url.match(/stand\.fm\/episodes\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export async function fetchStandFmEpisode(
  url: string
): Promise<StandFmEpisode> {
  if (!parseEpisodeId(url)) {
    throw new Error("stand.fm のエピソードURLを入力してください");
  }

  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`stand.fm ページの取得に失敗しました (${res.status})`);
  }

  const html = await res.text();

  // __NEXT_DATA__ から取得
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (m) {
    try {
      const data = JSON.parse(m[1]);
      const ep =
        data?.props?.pageProps?.episode ?? data?.props?.pageProps?.data?.episode;
      if (ep) {
        return {
          id: ep.id ?? "",
          title: ep.title ?? "",
          description: ep.body ?? ep.description ?? "",
          audioUrl: ep.audio_url ?? ep.audioUrl ?? "",
          publishedAt: ep.published_at ?? ep.publishedAt ?? "",
          channelId: ep.channel_id ?? ep.channelId ?? ep.channel?.id ?? "",
          channelTitle: ep.channel?.title ?? "",
          thumbnail: ep.channel?.image_url ?? ep.channel?.thumbnail ?? undefined,
        };
      }
    } catch {
      // fall through
    }
  }

  // フォールバック: OGP meta タグ
  const title =
    html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ?? "";
  const thumbnail =
    html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? undefined;

  if (!title) {
    throw new Error("stand.fm ページからエピソード情報を取得できませんでした");
  }

  return {
    id: parseEpisodeId(url) ?? "",
    title: decodeHTMLEntities(title),
    description: "",
    audioUrl: "",
    publishedAt: "",
    channelId: "",
    channelTitle: "",
    thumbnail,
  };
}

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
