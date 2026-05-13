import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const db = await getDb();
  const complaintFilter = user.is_super_role ? {} : { employee_id: Number(user.id) };
  const feeFilter = user.is_super_role ? {} : { employee_id: Number(user.id) };

  const complaints = await db.collection("core_cybercomplaint").find(complaintFilter).toArray();
  const adv = await db.collection("core_advfeeentry").find(feeFilter).toArray();
  const cyber = await db.collection("core_cyberfeeentry").find(feeFilter).toArray();

  const active_count = complaints.filter((c: any) => !c.is_complete).length;
  const closed_count = complaints.filter((c: any) => !!c.is_complete).length;
  const adv_fee_total = adv.reduce((s: number, r: any) => s + Number(r.fees || 0), 0);
  const cyber_fee_total = cyber.reduce((s: number, r: any) => s + Number(r.fees || 0), 0);
  return NextResponse.json({
    active_count,
    closed_count,
    adv_fee_total,
    cyber_fee_total,
    grand_total_fees: adv_fee_total + cyber_fee_total,
  });
}

