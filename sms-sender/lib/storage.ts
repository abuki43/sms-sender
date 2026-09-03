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
  groupName?: string | null;
  recipients: RecipientHistory[];
}

export interface HistoryRow {
  id: number;
  message: string;
  timestamp: number;
  group_name?: string | null;
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
  customFields?: Record<string, string>;
  createdAt: number;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
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
      group_name TEXT,
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
      custom_fields_json TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS message_templates (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members (group_id);
  `);

  // Safe migrations
  try {
    await db.execAsync("ALTER TABLE send_history ADD COLUMN group_name TEXT;");
  } catch {}
  try {
    await db.execAsync("ALTER TABLE group_members ADD COLUMN custom_fields_json TEXT;");
  } catch {}

  // Seed default starter templates if table is empty
  try {
    const existing = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM message_templates"
    );
    if (!existing || existing.count === 0) {
      const now = Date.now();
      await db.runAsync(
        "INSERT INTO message_templates (id, title, content, created_at) VALUES (?, ?, ?, ?)",
        "tpl_welcome",
        "Welcome Greeting",
        "Hello {first_name}, welcome to our community! We are excited to have you with us.",
        now
      );
      await db.runAsync(
        "INSERT INTO message_templates (id, title, content, created_at) VALUES (?, ?, ?, ?)",
        "tpl_invoice",
        "Payment Reminder",
        "Dear {name}, this is a gentle reminder regarding your balance of {Amount}. Please call us at {phone}.",
        now + 1
      );
      await db.runAsync(
        "INSERT INTO message_templates (id, title, content, created_at) VALUES (?, ?, ?, ?)",
        "tpl_appointment",
        "Appointment Confirmation",
        "Hi {first_name}, your appointment is confirmed for tomorrow. We look forward to seeing you!",
        now + 2
      );
    }
  } catch {}

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
    "INSERT INTO send_history (message, timestamp, group_name, recipients_json) VALUES (?, ?, ?, ?)",
    entry.message,
    entry.timestamp,
    entry.groupName ?? null,
    JSON.stringify(entry.recipients)
  );
}

export async function getSendHistory(
  limit = 100
): Promise<SendHistoryEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<HistoryRow>(
    "SELECT id, message, timestamp, group_name, recipients_json FROM send_history ORDER BY timestamp DESC LIMIT ?",
    limit
  );
  return rows.map((row) => ({
    id: row.id,
    message: row.message,
    timestamp: row.timestamp,
    groupName: row.group_name ?? null,
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
  members: { name: string; phone: string; customFields?: Record<string, string> }[]
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
      "INSERT INTO group_members (id, group_id, name, phone, custom_fields_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      memberId,
      groupId,
      m.name.trim() || "Contact",
      m.phone.trim(),
      m.customFields ? JSON.stringify(m.customFields) : null,
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
    custom_fields_json?: string | null;
    created_at: number;
  }>(
    "SELECT id, group_id, name, phone, custom_fields_json, created_at FROM group_members WHERE group_id = ? ORDER BY name ASC",
    groupId
  );

  return rows.map((r) => {
    let customFields: Record<string, string> | undefined;
    if (r.custom_fields_json) {
      try {
        customFields = JSON.parse(r.custom_fields_json);
      } catch {}
    }
    return {
      id: r.id,
      groupId: r.group_id,
      name: r.name,
      phone: r.phone,
      customFields,
      createdAt: r.created_at,
    };
  });
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

// ---------------------------------------------------------------------------
// Message Templates CRUD API
// ---------------------------------------------------------------------------

export async function createTemplate(
  title: string,
  content: string
): Promise<MessageTemplate> {
  const db = await getDb();
  const id = "tpl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const now = Date.now();

  await db.runAsync(
    "INSERT INTO message_templates (id, title, content, created_at) VALUES (?, ?, ?, ?)",
    id,
    title.trim() || "Untitled Template",
    content.trim(),
    now
  );

  return {
    id,
    title: title.trim() || "Untitled Template",
    content: content.trim(),
    createdAt: now,
  };
}

export async function getTemplates(): Promise<MessageTemplate[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    title: string;
    content: string;
    created_at: number;
  }>("SELECT id, title, content, created_at FROM message_templates ORDER BY created_at DESC");

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    createdAt: r.created_at,
  }));
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM message_templates WHERE id = ?", id);
}
