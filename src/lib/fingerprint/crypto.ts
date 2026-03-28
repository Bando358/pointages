"use server";

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.FINGERPRINT_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error("FINGERPRINT_ENCRYPTION_KEY must be at least 32 characters");
  }
  return Buffer.from(key.slice(0, 32), "utf-8");
}

export async function encryptTemplate(base64Template: string): Promise<string> {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(base64Template, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export async function decryptTemplate(encryptedData: string): Promise<string> {
  const key = getKey();
  const [ivHex, tagHex, data] = encryptedData.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
