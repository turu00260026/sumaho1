"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { SummaryRecord, ChannelMapping } from "@/types";

const DB_NAME = "standfm-summarizer";
const DB_VERSION = 1;

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("summaries")) {
        const store = db.createObjectStore("summaries", { keyPath: "id" });
        store.createIndex("by-savedAt", "savedAt");
      }
      if (!db.objectStoreNames.contains("channels")) {
        db.createObjectStore("channels", { keyPath: "id" });
      }
    },
  });
}

// Summaries
export async function saveSummary(record: SummaryRecord): Promise<void> {
  const db = await getDB();
  await db.put("summaries", record);
}

export async function listSummaries(): Promise<SummaryRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("summaries", "by-savedAt");
  return all.reverse();
}

export async function deleteSummary(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("summaries", id);
}

export async function clearAllSummaries(): Promise<void> {
  const db = await getDB();
  await db.clear("summaries");
}

// Channel mappings
export async function saveChannel(channel: ChannelMapping): Promise<void> {
  const db = await getDB();
  await db.put("channels", channel);
}

export async function listChannels(): Promise<ChannelMapping[]> {
  const db = await getDB();
  return db.getAll("channels");
}

export async function deleteChannel(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("channels", id);
}

export async function findChannelByStandFmId(
  standfmChannelId: string
): Promise<ChannelMapping | undefined> {
  const channels = await listChannels();
  return channels.find((c) => c.standfmChannelId === standfmChannelId);
}
