import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { ensureDefaultHeadManager, getUserFromRequest, hashDjangoPassword } from "@/lib/server/auth";

function normalizeEmployeeDoc(doc: any) {
  return {
    id: String(doc.id ?? doc._id ?? ""),
    phone_number: String(doc.phone_number || ""),
    full_name: String(doc.full_name || ""),
    is_super_role: Boolean(doc.is_super_role),
    is_active: doc.is_active !== false,
  };
}

function toNumericId(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });

  await ensureDefaultHeadManager();
  const db = await getDb();
  const rows = await db.collection("core_employee").find({ is_active: { $ne: false } }).sort({ id: 1 }).toArray();
  if (!user.is_super_role) {
    const self = rows.find((r) => String(r.id) === String(user.id));
    return NextResponse.json(self ? [normalizeEmployeeDoc(self)] : []);
  }
  return NextResponse.json(rows.map(normalizeEmployeeDoc));
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || !user.is_super_role) return NextResponse.json({ detail: "Only Head Manager can create employees." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const phone = String(body?.phone_number || "").trim();
  const fullName = String(body?.full_name || "").trim();
  const password = String(body?.password || "");
  const email = String(body?.email || `${phone}@employee.local`).trim().toLowerCase();
  if (!phone || !fullName || password.length < 4) {
    return NextResponse.json({ detail: "full_name, phone_number and valid password are required." }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.collection("core_employee").findOne({ phone_number: phone });
  if (existing) return NextResponse.json({ detail: "Phone number already exists." }, { status: 400 });
  const existingEmail = await db.collection("core_employee").findOne({ email });
  if (existingEmail) return NextResponse.json({ detail: "Email already exists. Try different phone number." }, { status: 400 });

  const rows = await db.collection("core_employee").find({}, { projection: { id: 1 } }).toArray();
  const maxId = rows.reduce((max, row) => Math.max(max, toNumericId(row?.id)), 0);
  const nextId = maxId + 1;
  const doc = {
    id: nextId,
    phone_number: phone,
    email,
    full_name: fullName,
    password: hashDjangoPassword(password),
    is_super_role: Boolean(body?.is_super_role),
    is_active: body?.is_active !== false,
    created_at: new Date(),
  };
  try {
    await db.collection("core_employee").insertOne(doc);
    return NextResponse.json(normalizeEmployeeDoc(doc), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Failed to create employee." }, { status: 500 });
  }
}
