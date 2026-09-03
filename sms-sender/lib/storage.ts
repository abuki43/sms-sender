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

export interface ContactGroup {
  id: string;
  name: string;
  createdAt: number;
  memberCount: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  name: string;
  phone: string;
  createdAt: number;
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
    CREATE TABLE IF NOT EXISTS contact_groups (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY NOT NULL,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members (group_id);
  `);
  return db;
}

export async function initDatabase(): Promise<void> {
  await getDb();
}

export async function saveSendHistory(
  entry: Omit<SendHistoryEntry, "id">
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO send_history (message, timestamp, recipients_json) VALUES (?, ?, ?)",
    entry.message,
    entry.timestamp,
    JSON.stringify(entry.recipients)
  );
}

export async function getSendHistory(
  limit = 100
): Promise<SendHistoryEntry[]> {
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

// ---------------------------------------------------------------------------
// Contact Groups CRUD API
// ---------------------------------------------------------------------------

export async function createGroup(
  name: string,
  members: { name: string; phone: string }[]
): Promise<ContactGroup> {
  const db = await getDb();
  const groupId = "grp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const now = Date.now();

  await db.runAsync(
    "INSERT INTO contact_groups (id, name, created_at) VALUES (?, ?, ?)",
    groupId,
    name.trim() || "Untitled Group",
    now
  );

  for (const m of members) {
    const memberId = "mem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    await db.runAsync(
      "INSERT INTO group_members (id, group_id, name, phone, created_at) VALUES (?, ?, ?, ?, ?)",
      memberId,
      groupId,
      m.name.trim() || "Contact",
      m.phone.trim(),
      now
    );
  }

  return {
    id: groupId,
    name: name.trim() || "Untitled Group",
    createdAt: now,
    memberCount: members.length,
  };
}

export async function getGroups(): Promise<ContactGroup[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    created_at: number;
    member_count: number;
  }>(`
    SELECT g.id, g.name, g.created_at, COUNT(m.id) as member_count
    FROM contact_groups g
    LEFT JOIN group_members m ON g.id = m.group_id
    GROUP BY g.id, g.name, g.created_at
    ORDER BY g.created_at DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    memberCount: r.member_count,
  }));
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    group_id: string;
    name: string;
    phone: string;
    created_at: number;
  }>(
    "SELECT id, group_id, name, phone, created_at FROM group_members WHERE group_id = ? ORDER BY name ASC",
    groupId
  );

  return rows.map((r) => ({
    id: r.id,
    groupId: r.group_id,
    name: r.name,
    phone: r.phone,
    createdAt: r.created_at,
  }));
}

export async function deleteGroup(groupId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM group_members WHERE group_id = ?", groupId);
  await db.runAsync("DELETE FROM contact_groups WHERE id = ?", groupId);
}

export async function removeGroupMember(memberId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM group_members WHERE id = ?", memberId);
}
