import { prisma } from "@/lib/prisma";
import { parseICS, parseCanvasSummary, inferSubject, formatICSDate, parseICSDate } from "@/lib/ics";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { assignee, url } = await req.json();
    if (!assignee || !url) {
      return NextResponse.json({ error: "Missing assignee or url" }, { status: 400 });
    }

    let icsText: string;
    try {
      const res = await fetch(url, { headers: { Accept: "text/calendar" } });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Calendar feed returned ${res.status}` },
          { status: 502 }
        );
      }
      icsText = await res.text();
    } catch (err) {
      return NextResponse.json(
        { error: `Could not fetch feed: ${err instanceof Error ? err.message : String(err)}` },
        { status: 502 }
      );
    }

    const events = parseICS(icsText);

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const event of events) {
      if (!event.uid) {
        skipped++;
        continue;
      }
      const { title, course } = parseCanvasSummary(event.summary);
      const subject = inferSubject(course || event.summary);
      const rawDate = event.dtstart || event.dtend;
      const dueDate = formatICSDate(rawDate);
      const dueAt = parseICSDate(rawDate);

      try {
        const existing = await prisma.homework.findUnique({
          where: { externalId: event.uid },
        });
        if (existing) {
          // Preserve completed status; update title/subject/dueDate/dueAt if changed
          const dueAtChanged = (existing.dueAt?.getTime() ?? null) !== (dueAt?.getTime() ?? null);
          if (
            existing.title !== title ||
            existing.subject !== subject ||
            existing.dueDate !== dueDate ||
            existing.assignee !== assignee ||
            dueAtChanged
          ) {
            await prisma.homework.update({
              where: { externalId: event.uid },
              data: { title, subject, dueDate, dueAt, assignee },
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          await prisma.homework.create({
            data: { title, subject, dueDate, dueAt, assignee, externalId: event.uid },
          });
          imported++;
        }
      } catch (err) {
        console.warn(`[import-ics] failed on event "${event.summary}":`, err);
        skipped++;
      }
    }

    // Update lastSynced timestamp in the feed config
    const row = await prisma.config.findUnique({ where: { key: "homework_ics_feeds" } });
    if (row) {
      type Feed = { assignee: string; url: string; lastSynced: string | null };
      const feeds: Feed[] = JSON.parse(row.value);
      const updatedFeeds = feeds.map((f) =>
        f.assignee === assignee && f.url === url
          ? { ...f, lastSynced: new Date().toISOString() }
          : f
      );
      await prisma.config.update({
        where: { key: "homework_ics_feeds" },
        data: { value: JSON.stringify(updatedFeeds) },
      });
    }

    return NextResponse.json({
      total: events.length,
      imported,
      updated,
      skipped,
    });
  } catch (err) {
    console.error("[import-ics] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
