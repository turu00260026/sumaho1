import { XMLParser } from "fast-xml-parser";
import { parse as parseHtml } from "node-html-parser";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface RssEpisode {
  title: string;
  pubDate: string;
  transcriptUrl: string | null;
  enclosureUrl: string | null;
}

async function fetchRss(rssUrl: string): Promise<RssEpisode[]> {
  const res = await fetch(rssUrl, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Listen RSS 取得失敗 (${res.status})`);

  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const feed = parser.parse(xml);
  const items: unknown[] = [feed?.rss?.channel?.item ?? []].flat();

  return items.map((item: unknown) => {
    const i = item as Record<string, unknown>;
    // podcast:transcript タグ
    const transcript = (i["podcast:transcript"] ?? null) as
      | Record<string, string>
      | null;
    const transcriptUrl = transcript?.["@_url"] ?? null;

    const enclosure = (i["enclosure"] ?? null) as Record<string, string> | null;
    const enclosureUrl = enclosure?.["@_url"] ?? null;

    return {
      title: String(i["title"] ?? ""),
      pubDate: String(i["pubDate"] ?? ""),
      transcriptUrl,
      enclosureUrl,
    };
  });
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s　]+/g, " ").trim();
}

function isSameDate(a: string, b: string): boolean {
  try {
    const da = new Date(a).toDateString();
    const db = new Date(b).toDateString();
    return da === db;
  } catch {
    return false;
  }
}

/** Listen の RSS から対応エピソードの文字起こしテキストを返す */
export async function fetchListenTranscript(
  episodeTitle: string,
  episodeDate: string,
  listenRssUrl: string
): Promise<string | null> {
  let episodes: RssEpisode[];
  try {
    episodes = await fetchRss(listenRssUrl);
  } catch {
    return null;
  }

  // タイトル一致 or 配信日一致で探す
  const normTitle = normalize(episodeTitle);
  const match =
    episodes.find((e) => normalize(e.title) === normTitle) ??
    episodes.find((e) => isSameDate(e.pubDate, episodeDate)) ??
    null;

  if (!match?.transcriptUrl) return null;

  return fetchTranscriptPage(match.transcriptUrl);
}

async function fetchTranscriptPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;

    const html = await res.text();

    // __NEXT_DATA__ から transcript フィールドを試みる
    const m = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
    );
    if (m) {
      try {
        const data = JSON.parse(m[1]);
        const props = data?.props?.pageProps;
        const transcript =
          props?.episode?.transcript ??
          props?.episode?.transcription ??
          props?.transcript;
        if (typeof transcript === "string" && transcript.length > 50) {
          return transcript;
        }
      } catch {
        // fall through
      }
    }

    // DOM パース: article や .transcript クラスのテキストを取得
    const root = parseHtml(html);

    const candidates = [
      root.querySelector("article"),
      root.querySelector('[class*="transcript"]'),
      root.querySelector('[class*="Transcript"]'),
      root.querySelector("main"),
    ];

    for (const el of candidates) {
      if (!el) continue;
      const text = el.structuredText.trim();
      if (text.length > 100) return text;
    }

    return null;
  } catch {
    return null;
  }
}
