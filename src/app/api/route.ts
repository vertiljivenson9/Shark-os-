import { NextResponse } from "next/server";

// Force static export for Cloudflare Pages
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}