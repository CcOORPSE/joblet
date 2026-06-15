// Test: can we parse what Vercel passes as FIREBASE_SERVICE_ACCOUNT_JSON?
const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!rawJson) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON not set!");
  process.exit(1);
}

console.log("Length:", rawJson.length);
console.log("First 50 chars:", rawJson.substring(0, 50));

try {
  let jsonStr = rawJson.trim();
  if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
    jsonStr = jsonStr.slice(1, -1);
    console.log("Stripped surrounding single quotes");
  }
  const parsed = JSON.parse(jsonStr);
  console.log("✅ JSON parse OK. project_id:", parsed.project_id);
  
  // Fix private key newlines
  const fixedKey = parsed.private_key.replace(/\\n/g, "\n");
  console.log("Has BEGIN PRIVATE KEY:", fixedKey.includes("-----BEGIN PRIVATE KEY-----"));
  console.log("Has actual newlines:", fixedKey.includes("\n"));
  console.log("✅ Private key format looks good");
} catch (e) {
  console.error("❌ JSON parse ERROR:", e.message);
}
