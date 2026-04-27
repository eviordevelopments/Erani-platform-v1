// ─── File Processors ─────────────────────────────────────────────────────────
// Parses raw file content by detected source platform.
// All parsers return a normalized ParsedFile object.

export type FileSource = "jira" | "slack" | "notion" | "clickup" | "generic";

export interface ParsedTask {
  id: string;
  title: string;
  status: string;
  timeEstimate?: number;   // seconds
  timeSpent?: number;      // seconds
  priority?: string;
  assignee?: string;
  tags?: string[];
  createdAt?: string;
  hasEstimate: boolean;
  isScopeCreep?: boolean;
}

export interface ParsedMessage {
  id: string;
  text: string;
  user: string;
  timestamp: string;
  reactions?: number;
  mentionsScopeKeywords?: boolean;
}

export interface ParsedFile {
  source: FileSource;
  tasks: ParsedTask[];
  messages: ParsedMessage[];
  rawRowCount: number;
  fileName: string;
}

// ─── Scope Creep keyword detector ────────────────────────────────────────────
const SCOPE_KEYWORDS = [
  "cambio de alcance", "scope change", "out of scope", "fuera de alcance",
  "adicional", "additional", "nuevo requerimiento", "new requirement",
  "no estaba en el plan", "not in the plan", "agregar", "add this",
  "también podría", "could we also", "y si también", "what if we",
];

function hasScopeKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return SCOPE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

// ─── Jira JSON Parser ─────────────────────────────────────────────────────────
// Supports Jira Cloud export format: { issues: [{ id, fields: {...} }] }
export function parseJiraJSON(content: string, fileName: string): ParsedFile {
  const data = JSON.parse(content);
  const issues: unknown[] = Array.isArray(data) ? data : (data.issues ?? data.data ?? []);

  const tasks: ParsedTask[] = issues.map((issue: unknown) => {
    const i = issue as Record<string, unknown>;
    const fields = (i.fields ?? i) as Record<string, unknown>;
    const summary = String(fields.summary ?? fields.title ?? fields.name ?? i.key ?? "Unknown");
    const status = String(
      (fields.status as Record<string, unknown>)?.name ?? fields.status ?? "unknown"
    );
    const estimate = Number(fields.timeoriginalestimate ?? fields.timeEstimate ?? 0);
    const spent = Number(fields.timespent ?? fields.timeSpent ?? 0);
    const priority = String(
      (fields.priority as Record<string, unknown>)?.name ?? fields.priority ?? "medium"
    );
    return {
      id: String(i.id ?? i.key ?? Math.random()),
      title: summary,
      status: status.toLowerCase(),
      timeEstimate: estimate,
      timeSpent: spent,
      priority: priority.toLowerCase(),
      assignee: String(
        (fields.assignee as Record<string, unknown>)?.displayName ?? "unassigned"
      ),
      hasEstimate: estimate > 0,
      isScopeCreep: hasScopeKeyword(summary),
    };
  });

  return { source: "jira", tasks, messages: [], rawRowCount: issues.length, fileName };
}

// ─── Slack JSON Parser ────────────────────────────────────────────────────────
// Supports Slack export format: array of message objects or { messages: [] }
export function parseSlackJSON(content: string, fileName: string): ParsedFile {
  const data = JSON.parse(content);
  const msgs: unknown[] = Array.isArray(data) ? data : (data.messages ?? []);

  const messages: ParsedMessage[] = msgs
    .filter((m: unknown) => {
      const msg = m as Record<string, unknown>;
      return msg.type === "message" || msg.text;
    })
    .map((m: unknown) => {
      const msg = m as Record<string, unknown>;
      const text = String(msg.text ?? "");
      const reactions = Array.isArray(msg.reactions)
        ? (msg.reactions as unknown[]).reduce((acc: number, r: unknown) => {
            return acc + Number((r as Record<string, unknown>).count ?? 1);
          }, 0)
        : 0;
      return {
        id: String(msg.client_msg_id ?? msg.ts ?? Math.random()),
        text,
        user: String(msg.user ?? msg.username ?? "unknown"),
        timestamp: String(msg.ts ?? ""),
        reactions,
        mentionsScopeKeywords: hasScopeKeyword(text),
      };
    });

  // Also extract any pseudo-tasks from messages (pinned items, etc.)
  const tasks: ParsedTask[] = msgs
    .filter((m: unknown) => {
      const msg = m as Record<string, unknown>;
      return msg.subtype === "pinned_item" || String(msg.text ?? "").startsWith("TODO:");
    })
    .map((m: unknown) => {
      const msg = m as Record<string, unknown>;
      return {
        id: String(msg.ts ?? Math.random()),
        title: String(msg.text ?? "").replace("TODO:", "").trim(),
        status: "open",
        hasEstimate: false,
        isScopeCreep: hasScopeKeyword(String(msg.text ?? "")),
      };
    });

  return { source: "slack", tasks, messages, rawRowCount: msgs.length, fileName };
}

// ─── Notion CSV Parser ────────────────────────────────────────────────────────
export function parseNotionCSV(content: string, fileName: string): ParsedFile {
  const rows = parseCSV(content);
  const tasks: ParsedTask[] = rows.map((row, i) => {
    const title =
      row["Name"] ?? row["Title"] ?? row["Task"] ?? row["Page"] ?? `Row ${i + 1}`;
    const status = (row["Status"] ?? row["State"] ?? "pending").toLowerCase();
    const tags = (row["Tags"] ?? row["Labels"] ?? "").split("|").map((t) => t.trim()).filter(Boolean);
    return {
      id: String(i),
      title,
      status,
      hasEstimate: !!row["Due Date"] || !!row["Estimate"],
      tags,
      isScopeCreep: hasScopeKeyword(title),
    };
  });

  return { source: "notion", tasks, messages: [], rawRowCount: rows.length, fileName };
}

// ─── ClickUp CSV Parser ───────────────────────────────────────────────────────
export function parseClickUpCSV(content: string, fileName: string): ParsedFile {
  const rows = parseCSV(content);
  const tasks: ParsedTask[] = rows.map((row, i) => {
    const title = row["Task Name"] ?? row["Name"] ?? row["Task"] ?? `Task ${i + 1}`;
    const status = (row["Status"] ?? "pending").toLowerCase();
    const estimateStr = row["Time Estimate"] ?? row["Estimate"] ?? "0";
    const spentStr = row["Time Tracked"] ?? row["Time Spent"] ?? "0";
    // Convert "1h 30m" → seconds
    const parseTime = (s: string): number => {
      if (!s) return 0;
      const h = s.match(/(\d+)\s*h/)?.[1] ?? "0";
      const m = s.match(/(\d+)\s*m/)?.[1] ?? "0";
      return (parseInt(h) * 3600) + (parseInt(m) * 60);
    };
    const estimate = parseTime(estimateStr) || Number(estimateStr) || 0;
    const spent = parseTime(spentStr) || Number(spentStr) || 0;
    return {
      id: row["Task ID"] ?? String(i),
      title,
      status,
      timeEstimate: estimate,
      timeSpent: spent,
      priority: (row["Priority"] ?? "normal").toLowerCase(),
      hasEstimate: estimate > 0,
      isScopeCreep: hasScopeKeyword(title),
    };
  });

  return { source: "clickup", tasks, messages: [], rawRowCount: rows.length, fileName };
}

// ─── Generic Parser ───────────────────────────────────────────────────────────
export function parseGeneric(content: string, fileName: string): ParsedFile {
  let tasks: ParsedTask[] = [];
  const isJson = content.trim().startsWith("{") || content.trim().startsWith("[");

  if (isJson) {
    const data = JSON.parse(content);
    const items: unknown[] = Array.isArray(data) ? data : Object.values(data);
    tasks = items.map((item: unknown, i) => {
      const it = item as Record<string, unknown>;
      return {
        id: String(it.id ?? i),
        title: String(it.name ?? it.title ?? it.summary ?? it.task ?? `Item ${i + 1}`),
        status: String(it.status ?? "unknown").toLowerCase(),
        hasEstimate: !!(it.estimate ?? it.timeEstimate ?? it.hours),
      };
    });
  } else {
    const rows = parseCSV(content);
    tasks = rows.map((row, i) => {
      const vals = Object.values(row);
      return {
        id: String(i),
        title: vals[0] ?? `Row ${i + 1}`,
        status: vals[1]?.toLowerCase() ?? "unknown",
        hasEstimate: false,
      };
    });
  }

  return { source: "generic", tasks, messages: [], rawRowCount: tasks.length, fileName };
}

// ─── Auto-detect file source ──────────────────────────────────────────────────
export function detectSource(fileName: string, content: string): FileSource {
  const lower = fileName.toLowerCase();
  if (lower.includes("jira")) return "jira";
  if (lower.includes("slack")) return "slack";
  if (lower.includes("notion")) return "notion";
  if (lower.includes("clickup") || lower.includes("click_up")) return "clickup";

  // Try to infer from content structure
  try {
    const data = JSON.parse(content);
    if (data.issues || (Array.isArray(data) && data[0]?.fields)) return "jira";
    if (data.messages || (Array.isArray(data) && data[0]?.ts && data[0]?.type === "message")) return "slack";
  } catch {
    // CSV - check headers
    const firstLine = content.split("\n")[0].toLowerCase();
    if (firstLine.includes("time estimate") || firstLine.includes("time tracked")) return "clickup";
    if (firstLine.includes("notion") || firstLine.includes("database")) return "notion";
  }

  return "generic";
}

// ─── Master dispatcher ────────────────────────────────────────────────────────
export function parseFile(content: string, fileName: string, forceSource?: FileSource): ParsedFile {
  const source = forceSource ?? detectSource(fileName, content);
  const isJson = content.trim().startsWith("{") || content.trim().startsWith("[");

  switch (source) {
    case "jira":    return parseJiraJSON(content, fileName);
    case "slack":   return parseSlackJSON(content, fileName);
    case "notion":  return isJson ? parseGeneric(content, fileName) : parseNotionCSV(content, fileName);
    case "clickup": return isJson ? parseGeneric(content, fileName) : parseClickUpCSV(content, fileName);
    default:        return parseGeneric(content, fileName);
  }
}
