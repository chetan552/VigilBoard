import { prisma } from "@/lib/prisma";
import { parseICS, parseCanvasSummary, inferSubject, formatICSDate, parseICSDate } from "@/lib/ics";
import { NextResponse } from "next/server";

type IcsFeed = {
  assignee: string;
  url: string;
  lastSynced: string | null;
};

// Syncs every configured ICS feed. Designed to be called periodically (~hourly)
// from the live screen. Failures on individual feeds don't stop the others.
export async function POST() {
  const row = await prisma.config.findUnique({ where: { key: "homework_ics_feeds" } });
  if (!row) return NextResponse.json({ feeds: 0, imported: 0, updated: 0 });

  const feeds: IcsFeed[] = (() => {
    try { return JSON.parse(row.value); } catch { return []; }
  })();
  if (feeds.length === 0) return NextResponse.json({ feeds: 0, imported: 0, updated: 0 });

  let totalImported = 0;
  let totalUpdated = 0;
  let succeeded = 0;
  const errors: string[] = [];

  for (const feed of feeds) {
    try {
      const fetchRes = await fetch(feed.url, { headers: { Accept: "text/calendar" } });
      if (!fetchRes.ok) {
        errors.push(`${feed.assignee}: HTTP ${fetchRes.status}`);
        continue;
      }
      const text = await fetchRes.text();
      const events = parseICS(text);

      for (const event of events) {
        if (!event.uid) continue;
        const { title, course } = parseCanvasSummary(event.summary);
        const subject = inferSubject(course || event.summary);
        const rawDate = event.dtstart || event.dtend;
        const dueDate = formatICSDate(rawDate);
        const dueAt = parseICSDate(rawDate);

        const existing = await prisma.homework.findUnique({ where: { externalId: event.uid } });
        if (existing) {
          const dueAtChanged = (existing.dueAt?.getTime() ?? null) !== (dueAt?.getTime() ?? null);
          if (
            existing.title !== title ||
            existing.subject !== subject ||
            existing.dueDate !== dueDate ||
            existing.assignee !== feed.assignee ||
            dueAtChanged
          ) {
            await prisma.homework.update({
              where: { externalId: event.uid },
              data: { title, subject, dueDate, dueAt, assignee: feed.assignee },
            });
            totalUpdated++;
          }
        } else {
          await prisma.homework.create({
            data: { title, subject, dueDate, dueAt, assignee: feed.assignee, externalId: event.uid },
          });
          totalImported++;
        }
      }
      succeeded++;
    } catch (err) {
      errors.push(`${feed.assignee}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Update lastSynced timestamps for all feeds we successfully fetched
  if (succeeded > 0) {
    const now = new Date().toISOString();
    const updatedFeeds = feeds.map((f) =>
      errors.find((e) => e.startsWith(`${f.assignee}:`)) ? f : { ...f, lastSynced: now }
    );
    await prisma.config.update({
      where: { key: "homework_ics_feeds" },
      data: { value: JSON.stringify(updatedFeeds) },
    });
  }

  return NextResponse.json({
    feeds: feeds.length,
    succeeded,
    imported: totalImported,
    updated: totalUpdated,
    errors: errors.length > 0 ? errors : undefined,
  });
}
