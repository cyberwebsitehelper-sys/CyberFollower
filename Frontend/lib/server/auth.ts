import crypto from "crypto";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { getDb } from "@/lib/server/mongo";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "dev-secret";

export type SessionUser = {
  id: string;
  phone_number: string;
  full_name: string;
  is_super_role: boolean;
};

export function signAccessToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

export function getUserFromRequest(req: NextRequest): SessionUser | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyAccessToken(token);
}

export function verifyDjangoPassword(rawPassword: string, encodedPassword: string): boolean {
  if (!rawPassword || !encodedPassword) return false;
  // Django pbkdf2 format: pbkdf2_sha256$iterations$salt$hash
  const parts = encodedPassword.split("$");
  if (parts.length !== 4) return false;
  const [algorithm, iterationsStr, salt, hashB64] = parts;
  if (algorithm !== "pbkdf2_sha256") return false;
  const iterations = Number(iterationsStr);
  if (!iterations || !salt || !hashB64) return false;

  const derived = crypto.pbkdf2Sync(rawPassword, salt, iterations, 32, "sha256").toString("base64");
  return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hashB64));
}

export function hashDjangoPassword(rawPassword: string): string {
  const iterations = 260000;
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.pbkdf2Sync(rawPassword, salt, iterations, 32, "sha256").toString("base64");
  return `pbkdf2_sha256$${iterations}$${salt}$${derived}`;
}

export async function ensureDefaultHeadManager() {
  const db = await getDb();
  const phone = "9876543210";
  const existing = await db.collection("core_employee").findOne({ phone_number: phone });
  if (existing) {
    await db.collection("core_employee").updateOne(
      { _id: existing._id },
      {
        $set: {
          full_name: "Head Manager",
          email: "9876543210@employee.local",
          is_super_role: true,
          is_active: true,
          password: hashDjangoPassword(phone),
        },
      }
    );
    return;
  }

  const last = await db.collection("core_employee").find({}).sort({ id: -1 }).limit(1).toArray();
  const nextId = Number(last?.[0]?.id || 0) + 1;
  await db.collection("core_employee").insertOne({
    id: nextId,
    phone_number: phone,
    email: "9876543210@employee.local",
    full_name: "Head Manager",
    password: hashDjangoPassword(phone),
    is_super_role: true,
    is_active: true,
    created_at: new Date(),
  });
}
