import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { getUserFromRequest } from "@/lib/server/auth";
import { normalizeComplaintDoc } from "@/lib/server/complaints";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const db = await getDb();
  const filter: any = { is_complete: { $ne: true } };
  if (!user.is_super_role) filter.employee_id = Number(user.id);
  const rows = await db.collection("core_cybercomplaint").find(filter).sort({ created_at: -1 }).toArray();
  return NextResponse.json(rows.map(normalizeComplaintDoc));
}

