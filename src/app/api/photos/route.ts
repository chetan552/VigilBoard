import { readdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

export async function GET() {
  try {
    const files = await readdir(UPLOADS_DIR);
    const images = files
      .filter((f) => ALLOWED_EXT.has(f.slice(f.lastIndexOf(".")).toLowerCase()))
      .map((f) => `/uploads/${f}`);
    return NextResponse.json({ photos: images });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
