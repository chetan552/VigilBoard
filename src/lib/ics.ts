// Lightweight iCalendar (RFC 5545) parser — extracts VEVENT entries.
// Handles line unfolding, parameterized fields (e.g. DTSTART;VALUE=DATE), and
// basic value unescaping. Not a full implementation — covers what we need for
// importing Canvas/Google Calendar feeds.

export type ICSEvent = {
  uid: string;
  summary: string;
  description?: string;
  dtstart?: string; // raw value, e.g. "20250115T235900Z" or "20250115"
  dtend?: string;
  url?: string;
};

const SUBJECT_KEYWORDS: Array<[RegExp, string]> = [
  [/\bmath|algebra|geometry|calculus|trigonometry|pre-?calc\b/i, "Math"],
  [/\bscience|biology|chemistry|physics|earth science|stem\b/i, "Science"],
  [/\benglish|language arts|grammar|literature|spelling|vocabulary\b/i, "English"],
  [/\bhistory|social studies|geography|civics|government\b/i, "History"],
  [/\breading\b/i, "Reading"],
  [/\bwriting|composition|essay\b/i, "Writing"],
  [/\bart\b/i, "Art"],
  [/\bmusic|band|orchestra|choir\b/i, "Music"],
  [/\bp\.?\s?e\.?\b|physical education|gym|fitness/i, "PE"],
];

export function inferSubject(text: string): string {
  for (const [re, subject] of SUBJECT_KEYWORDS) {
    if (re.test(text)) return subject;
  }
  return "Other";
}

// Canvas SUMMARY format: "Assignment Title [Course Name]"
// Strips the trailing course bracket, returning { title, course }.
export function parseCanvasSummary(summary: string): { title: string; course?: string } {
  // Trailing bracketed course name
  const trailing = summary.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
  if (trailing) return { title: trailing[1].trim(), course: trailing[2].trim() };
  return { title: summary.trim() };
}

function unescapeValue(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// Parse an ICS DTSTART value into a Date object (UTC midnight of the due day).
// Accepts "20250115T235900Z" or "20250115".
export function parseICSDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(parseInt(y), parseInt(mo) - 1, parseInt(d)));
  return isNaN(date.getTime()) ? null : date;
}

// Format an ICS DTSTART value into a short human-readable date string.
// Accepts "20250115T235900Z" or "20250115" → "Jan 15"
export function formatICSDate(raw: string | undefined): string | null {
  const date = parseICSDate(raw);
  if (!date) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function parseICS(text: string): ICSEvent[] {
  // Unfold lines: per RFC 5545, a CRLF followed by a single space or tab
  // continues the previous line.
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);

  const events: ICSEvent[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current && current.SUMMARY) {
        events.push({
          uid: current.UID || "",
          summary: unescapeValue(current.SUMMARY),
          description: current.DESCRIPTION ? unescapeValue(current.DESCRIPTION) : undefined,
          dtstart: current.DTSTART,
          dtend: current.DTEND,
          url: current.URL,
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const keyPart = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);
    const key = keyPart.split(";")[0]; // strip params like ";VALUE=DATE-TIME"
    if (key) current[key] = value;
  }

  return events;
}
