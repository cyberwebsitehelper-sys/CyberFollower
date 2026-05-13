import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { signAccessToken, verifyDjangoPassword } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = String(body?.phone_number || "").trim();
    const password = String(body?.password || "");
    if (!phone || !password) {
      return NextResponse.json({ detail: "phone_number and password are required." }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("core_employee").findOne({ phone_number: phone, is_active: { $ne: false } });
    if (!user || !verifyDjangoPassword(password, String(user.password || ""))) {
      return NextResponse.json({ detail: "Invalid phone number or password." }, { status: 400 });
    }

    const sessionUser = {
      id: String(user.id ?? user._id),
      phone_number: String(user.phone_number || ""),
      full_name: String(user.full_name || ""),
      is_super_role: Boolean(user.is_super_role),
    };
    const access = signAccessToken(sessionUser);
    return NextResponse.json({
      access,
      refresh: access,
      user: {
        id: sessionUser.id,
        phone_number: sessionUser.phone_number,
        full_name: sessionUser.full_name,
        is_super_role: sessionUser.is_super_role,
        is_active: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Login failed." }, { status: 500 });
  }
}

