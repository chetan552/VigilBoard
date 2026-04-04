import { NextRequest, NextResponse } from "next/server";

// Proxy a GET request to an external JSON URL and return the parsed body.
// This avoids CORS issues when the widget fetches from the browser.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https — no file://, ftp://, etc.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only http/https URLs are allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
      // next.js fetch cache — revalidate based on widget's own refresh interval
      next: { revalidate: 0 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json({ data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
