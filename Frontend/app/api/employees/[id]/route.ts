import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/server/mongo";
import { getUserFromRequest, hashDjangoPassword } from "@/lib/server/auth";

function parseEmployeeFilter(id: string) {
  const trimmed = String(id || "").trim();
  const asNumber = Number(trimmed);
  const numericCandidates = Number.isFinite(asNumber) ? [{ id: asNumber }, { id: trimmed }] : [{ id: trimmed }];
  if (ObjectId.isValid(trimmed)) return { $or: [{ _id: new ObjectId(trimmed) }, ...numericCandidates] };
  return { $or: numericCandidates };
}

function normalizeEmployeeDoc(doc: any) {
  return {
    id: String(doc.id ?? doc._id ?? ""),
    phone_number: String(doc.phone_number || ""),
    full_name: String(doc.full_name || ""),
    is_super_role: Boolean(doc.is_super_role),
    is_active: doc.is_active !== false,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const db = await getDb();
  const filter: any = parseEmployeeFilter(id);

  if (!user.is_super_role) {
    filter.id = Number(user.id);
  }

  const update: any = {};
  if (typeof body?.full_name === "string") update.full_name = body.full_name.trim();
  if (typeof body?.phone_number === "string") update.phone_number = body.phone_number.trim();

  if (user.is_super_role) {
    if (typeof body?.is_super_role === "boolean") update.is_super_role = body.is_super_role;
    if (typeof body?.is_active === "boolean") update.is_active = body.is_active;
    if (typeof body?.password === "string" && body.password.trim().length >= 4) {
      update.password = hashDjangoPassword(body.password.trim());
    }
  } else if (typeof body?.password === "string" && body.password.trim()) {
    return NextResponse.json({ detail: "Only Head Manager can change passwords." }, { status: 403 });
  }

  if (!Object.keys(update).length) return NextResponse.json({ detail: "No fields to update." }, { status: 400 });
  const updated = await db.collection("core_employee").findOneAndUpdate(filter, { $set: update }, { returnDocument: "after" });
  if (!updated) return NextResponse.json({ detail: "Employee not found." }, { status: 404 });
  return NextResponse.json(normalizeEmployeeDoc(updated));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user || !user.is_super_role) return NextResponse.json({ detail: "Only Head Manager can delete employees." }, { status: 403 });
  const { id } = await params;
  const db = await getDb();
  const filter = parseEmployeeFilter(id);
  await db.collection("core_employee").updateOne(filter, { $set: { is_active: false } });
  return NextResponse.json({ success: true });
}
