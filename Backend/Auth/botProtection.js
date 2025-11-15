import https from "https";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

const botProtection = async (req, res, next) => {
  try {
    // Honeypot trap
    if (req.body?.website) {
      return res.status(400).json({ error: "Bot detected (honeypot)" });
    }

    const token = req.body?.recaptchaToken || req.headers["x-recaptcha-token"];
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (!secret || !token) {
      // No verification when missing data, just continue
      return next();
    }

    const verifyBody = `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`;

    let verification;
    try {
      // Native fetch if available
      if (typeof fetch === "function") {
        const resp = await fetch(VERIFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: verifyBody
        });
        verification = await resp.json();
      } else {
        // Fallback to https module
        verification = await new Promise((resolve, reject) => {
          const url = new URL(VERIFY_URL);

          const reqVerify = https.request(
            {
              hostname: url.hostname,
              path: url.pathname,
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(verifyBody)
              }
            },
            resp => {
              let data = "";
              resp.on("data", chunk => (data += chunk));
              resp.on("end", () => {
                try {
                  resolve(JSON.parse(data));
                } catch (e) {
                  reject(e);
                }
              });
            }
          );

          reqVerify.on("error", reject);
          reqVerify.write(verifyBody);
          reqVerify.end();
        });
      }
    } catch (err) {
      console.warn("reCAPTCHA verification error:", err.message || err);
      // Fail open: do NOT block legit users due to network issues
      return next();
    }

    const threshold = Number(process.env.RECAPTCHA_THRESHOLD || 0.5);

    if (
      !verification?.success ||
      (verification.score !== undefined && verification.score < threshold)
    ) {
      return res.status(403).json({
        error: "Failed reCAPTCHA verification",
        score: verification?.score
      });
    }

    return next();
  } catch (error) {
    console.error("botProtection fatal error:", error);
    return res.status(500).json({ error: "Bot protection failure" });
  }
};

export default botProtection;
