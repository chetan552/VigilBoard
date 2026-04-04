import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { NextRequest, NextResponse } from "next/server";

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const saved: string[] = [];

    for (const file of files) {
      const ext = extname(file.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) continue;
      if (file.size > MAX_SIZE) continue;

      // Sanitize filename and make unique
      const base = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(ext, "");
      const filename = `${base}_${Date.now()}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(join(UPLOADS_DIR, filename), buffer);
      saved.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ saved });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
