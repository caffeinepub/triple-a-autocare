import { Ed25519KeyIdentity } from "@dfinity/identity";

export async function deriveIdentityFromCredentials(
  email: string,
  password: string,
): Promise<Ed25519KeyIdentity> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(`triple-a-autocare:${email.toLowerCase().trim()}`),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return Ed25519KeyIdentity.fromSecretKey(new Uint8Array(derivedBits));
}
