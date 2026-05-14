import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { getUserFromRequest } from "@/lib/server/auth";
import { parseIdFilter } from "@/lib/server/complaints";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const { id } = await params;
  const db = await getDb();
  const body = await request.json().catch(() => ({}));
  const rawComment = typeof body?.comment === "string" ? body.comment.trim() : "";
  const filter: any = parseIdFilter(id);
  if (!user.is_super_role) filter.employee_id = Number(user.id);
  await db.collection("core_cybercomplaint").updateOne(filter, {
    $set: {
      is_complete: true,
      completed_at: new Date(),
      comment: rawComment || null,
      edited_by_name: user.full_name,
      closed_by_name: user.full_name,
    },
  });
  return NextResponse.json({ status: "complaint closed" });
}
