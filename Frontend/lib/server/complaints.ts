import { ObjectId } from "mongodb";

export function isCompleteLike(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["1", "true", "yes", "y", "on"].includes(value.trim().toLowerCase());
  return false;
}

export function normalizeComplaintDoc(doc: any) {
  return {
    ...doc,
    _id: doc._id?.toString?.() ?? doc._id,
    id: String(doc.id ?? ""),
    is_complete: isCompleteLike(doc.is_complete),
  };
}

export function parseIdFilter(id: string) {
  const trimmed = String(id || "").trim();
  const asNumber = Number(trimmed);
  const numericCandidates = Number.isFinite(asNumber) ? [{ id: asNumber }, { id: trimmed }] : [{ id: trimmed }];
  if (ObjectId.isValid(trimmed)) {
    return { $or: [{ _id: new ObjectId(trimmed) }, ...numericCandidates] };
  }
  return { $or: numericCandidates };
}
