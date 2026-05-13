import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/mongo";
import { getUserFromRequest } from "@/lib/server/auth";
import { normalizeComplaintDoc, parseIdFilter } from "@/lib/server/complaints";
import { uploadToCloudinary } from "@/lib/server/cloudinary";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("noc_file");
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ detail: "noc_file is required." }, { status: 400 });
  }
  const uploaded = await uploadToCloudinary(file, "noc");
  const db = await getDb();
  const filter: any = parseIdFilter(id);
  if (!user.is_super_role) filter.employee_id = Number(user.id);
  const row = await db.collection("core_cybercomplaint").findOneAndUpdate(
    filter,
    { $set: { noc_file: uploaded.url, is_complete: true, completed_at: new Date() } },
    { returnDocument: "after" }
  );
  if (!row) return NextResponse.json({ detail: "Not found." }, { status: 404 });
  return NextResponse.json(normalizeComplaintDoc(row));
}

