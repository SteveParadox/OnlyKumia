// /config/firebaseAdmin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let firebaseApp;

if (!admin.apps.length) {
  try {
    let credential;

    // Candidate paths for service account
    const candidates = [];
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      candidates.push(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    }
    candidates.push(path.resolve(process.cwd(), 'Backend', 'Keys', 'serviceAccountKey.json'));
    candidates.push(path.resolve(process.cwd(), 'Keys', 'serviceAccountKey.json'));

    try {
      const fileUrl = new URL(import.meta.url).pathname;
      const dir = path.dirname(fileUrl);
      candidates.push(path.resolve(dir, '..', 'Keys', 'serviceAccountKey.json'));
    } catch (_) {}

    let svcPathFound = null;
    for (const c of candidates) {
      if (!c) continue;
      try {
        if (fs.existsSync(c)) { svcPathFound = c; break; }
      } catch (_) {}
    }

    if (svcPathFound) {
      const raw = fs.readFileSync(svcPathFound, "utf8");
      const parsed = JSON.parse(raw);
      credential = admin.credential.cert(parsed);
    } else {
      // Fallback to ENV variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          "Firebase service account is not configured. Provide a service account file or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env"
        );
      }

      credential = admin.credential.cert({ projectId, clientEmail, privateKey });
    }

    firebaseApp = admin.initializeApp({ credential });
    console.log("✅ Firebase Admin initialized successfully");

  } catch (err) {
    console.error("❌ Failed to initialize Firebase Admin:", err.message);
    throw err;
  }
}

// Export initialized admin app
export default admin;
