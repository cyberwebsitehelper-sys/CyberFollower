import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { getUserFromRequest } from "@/lib/server/auth";
import { normalizeComplaintDoc } from "@/lib/server/complaints";
import { uploadToCloudinary } from "@/lib/server/cloudinary";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(String(value ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });

  const db = await getDb();
  const filter = user.is_super_role ? {} : { employee_id: Number(user.id) };
  const rows = await db.collection("core_cybercomplaint").find(filter).sort({ created_at: -1 }).toArray();
  return NextResponse.json(rows.map(normalizeComplaintDoc));
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });

  const db = await getDb();
  const form = await request.formData();
  const now = new Date();

  const noc = form.get("noc_file");
  let nocPath = "";
  if (noc instanceof File && noc.size > 0) {
    const uploaded = await uploadToCloudinary(noc, "noc");
    nocPath = uploaded.url;
  }

  const last = await db.collection("core_cybercomplaint").find({}).sort({ id: -1 }).limit(1).toArray();
  const nextId = Number(last?.[0]?.id || 0) + 1;

  const doc: any = {
    id: nextId,
    bank_name: String(form.get("bank_name") || ""),
    ack_number: String(form.get("ack_number") || ""),
    ifsc_code: String(form.get("ifsc_code") || ""),
    state_name: String(form.get("state_name") || ""),
    district: String(form.get("district") || ""),
    layer: String(form.get("layer") || ""),
    txn_amount: parseNumber(form.get("txn_amount")),
    dispute_amount: parseNumber(form.get("dispute_amount")),
    utr_number: String(form.get("utr_number") || ""),
    police_station: String(form.get("police_station") || ""),
    vendor_name: String(form.get("vendor_name") || ""),
    noc_file: nocPath,
    is_complete: !!nocPath,
    created_at: now,
    completed_at: nocPath ? now : null,
    employee_id: Number(user.id),
  };

  try {
    await db.collection("core_cybercomplaint").insertOne(doc);
    return NextResponse.json(normalizeComplaintDoc(doc), { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.ack_number) {
      return NextResponse.json({ detail: "ack_number must be unique." }, { status: 400 });
    }
    return NextResponse.json({ detail: error?.message || "Failed to create complaint." }, { status: 500 });
  }
}
