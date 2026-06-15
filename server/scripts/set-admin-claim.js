/**
 * Grant Firebase custom claim role: "admin" to a user by email.
 *
 * Usage:
 *   node scripts/set-admin-claim.js admin@example.com
 *
 * Requires Firebase Admin credentials (same as server startup).
 * The user must sign out and sign back in for the claim to take effect in the client.
 */
import "../config/loadEnv.js";
import { auth } from "../config/firebaseAdmin.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/set-admin-claim.js <email>");
  process.exit(1);
}

try {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, role: "admin" });
  console.log(`Admin claim set for ${email} (uid: ${user.uid})`);
  console.log("User must sign out and sign back in for the claim to apply.");
  process.exit(0);
} catch (error) {
  console.error("Failed to set admin claim:", error.message);
  process.exit(1);
}
