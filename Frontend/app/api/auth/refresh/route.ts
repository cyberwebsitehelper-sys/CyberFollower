import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, signAccessToken } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refresh = String(body?.refresh || "");
    if (!refresh) {
      return NextResponse.json({ detail: "refresh is required." }, { status: 400 });
    }
    const user = verifyAccessToken(refresh);
    if (!user) {
      return NextResponse.json({ detail: "Invalid refresh token." }, { status: 401 });
    }
    const access = signAccessToken(user);
    return NextResponse.json({ access });
  } catch {
    return NextResponse.json({ detail: "Invalid request." }, { status: 400 });
  }
}
