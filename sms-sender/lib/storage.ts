import * as SQLite from "expo-sqlite";

export interface RecipientHistory {
  id: string;
  name: string;
  phone: string;
  status: string;
  errorCode?: string | null;
}

export interface SendHistoryEntry {
  id: number;
  message: string;
  timestamp: number;
  recipients: RecipientHistory[];
}

export interface HistoryRow {
  id: number;
  message: string;
  timestamp: number;
  recipients_json: string;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= createDatabase();
  return dbPromise;
}

async function createDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("sms-history.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS send_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      recipients_json TEXT NOT NULL
    );
  `);
  return db;
}

export async function initDatabase(): Promise<void> {
  await getDb();
}

export async function saveSendHistory(entry: Omit<SendHistoryEntry, "id">): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO send_history (message, timestamp, recipients_json) VALUES (?, ?, ?)",
    entry.message,
    entry.timestamp,
    JSON.stringify(entry.recipients)
  );
}

export async function getSendHistory(limit = 100): Promise<SendHistoryEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<HistoryRow>(
    "SELECT id, message, timestamp, recipients_json FROM send_history ORDER BY timestamp DESC LIMIT ?",
    limit
  );
  return rows.map((row) => ({
    id: row.id,
    message: row.message,
    timestamp: row.timestamp,
    recipients: parseRecipients(row.recipients_json),
  }));
}

export async function clearSendHistory(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM send_history");
}

function parseRecipients(json: string): RecipientHistory[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}
