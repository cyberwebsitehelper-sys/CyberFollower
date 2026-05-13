import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const db = await getDb();
  const filter = user.is_super_role ? {} : { employee_id: Number(user.id) };
  const rows = await db.collection("core_advfeeentry").find(filter).sort({ created_at: -1 }).toArray();
  return NextResponse.json(rows.map((r: any) => ({ ...r, _id: r._id?.toString?.(), id: String(r.id ?? r._id) })));
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const body = await request.json();
  const db = await getDb();
  const last = await db.collection("core_advfeeentry").find({}).sort({ id: -1 }).limit(1).toArray();
  const doc = {
    id: Number(last?.[0]?.id || 0) + 1,
    name: String(body?.name || ""),
    fees: Number(body?.fees || 0),
    created_at: new Date(),
    employee_id: Number(user.id),
  };
  await db.collection("core_advfeeentry").insertOne(doc);
  return NextResponse.json(doc, { status: 201 });
}

