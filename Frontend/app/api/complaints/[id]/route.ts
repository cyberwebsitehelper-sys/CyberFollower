import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { getUserFromRequest } from "@/lib/server/auth";
import { normalizeComplaintDoc, parseIdFilter } from "@/lib/server/complaints";
import { uploadToCloudinary } from "@/lib/server/cloudinary";

function parseNullableString(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? str : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const { id } = await params;
  const db = await getDb();
  const form = await request.formData();
  const filter: any = parseIdFilter(id);
  if (!user.is_super_role) filter.employee_id = Number(user.id);

  const update: any = {
    bank_name: String(form.get("bank_name") || ""),
    ack_number: String(form.get("ack_number") || ""),
    ifsc_code: String(form.get("ifsc_code") || ""),
    state_name: String(form.get("state_name") || ""),
    district: String(form.get("district") || ""),
    layer: String(form.get("layer") || ""),
    txn_amount: Number(form.get("txn_amount") || 0),
    dispute_amount: Number(form.get("dispute_amount") || 0),
    utr_number: parseNullableString(form.get("utr_number")),
    police_station: parseNullableString(form.get("police_station")),
    vendor_name: parseNullableString(form.get("vendor_name")),
    comment: parseNullableString(form.get("comment")),
  };

  const noc = form.get("noc_file");
  if (noc instanceof File && noc.size > 0) {
    const uploaded = await uploadToCloudinary(noc, "noc");
    update.noc_file = uploaded.url;
    update.is_complete = true;
    update.completed_at = new Date();
  }

  const res = await db.collection("core_cybercomplaint").findOneAndUpdate(filter, { $set: update }, { returnDocument: "after" });
  if (!res) return NextResponse.json({ detail: "Not found." }, { status: 404 });
  return NextResponse.json(normalizeComplaintDoc(res));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const { id } = await params;
  const db = await getDb();
  const filter: any = parseIdFilter(id);
  if (!user.is_super_role) filter.employee_id = Number(user.id);
  await db.collection("core_cybercomplaint").deleteOne(filter);
  return NextResponse.json({ success: true });
}
