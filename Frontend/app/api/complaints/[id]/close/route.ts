import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { getUserFromRequest } from "@/lib/server/auth";
import { parseIdFilter } from "@/lib/server/complaints";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const { id } = await params;
  const db = await getDb();
  const filter: any = parseIdFilter(id);
  if (!user.is_super_role) filter.employee_id = Number(user.id);
  await db.collection("core_cybercomplaint").updateOne(filter, { $set: { is_complete: true, completed_at: new Date() } });
  return NextResponse.json({ status: "complaint closed" });
}

