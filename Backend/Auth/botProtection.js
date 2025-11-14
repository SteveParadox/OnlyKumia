import https from 'https';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

const botProtection = async (req, res, next) => {
  try {
    // Server-side honeypot: frontend uses `website` hidden field
    if (req.body && req.body.website) {
      return res.status(400).json({ error: 'Bot detected (honeypot)' });
    }

    const token = req.body?.recaptchaToken || req.headers['x-recaptcha-token'];
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (secret && token) {
      // Use global fetch if available (Node 18+), otherwise fall back to https request
      let verification = null;
      try {
        if (typeof fetch === 'function') {
          const resp = await fetch(RECAPTCHA_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`
          });
          verification = await resp.json();
        } else {
          // fallback: minimal https request
          verification = await new Promise((resolve, reject) => {
            const postData = `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`;
            const reqOptions = new URL(RECAPTCHA_VERIFY_URL);
            const req = https.request({
              hostname: reqOptions.hostname,
              path: reqOptions.pathname,
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
              }
            }, (res) => {
              let data = '';
              res.on('data', (chunk) => (data += chunk));
              res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
              });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
          });
        }
      } catch (err) {
        console.warn('reCAPTCHA verification failed (skipped):', err.message || err);
      }

      if (verification) {
        const threshold = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5');
        if (!verification.success || (verification.score !== undefined && verification.score < threshold)) {
          return res.status(403).json({ error: 'Failed reCAPTCHA verification' });
        }
      }
    }

    // TODO: IP reputation check can be added here when API keys are configured

    return next();
  } catch (error) {
    console.error('botProtection error:', error);
    return res.status(500).json({ error: 'Bot protection failure' });
  }
};

export default botProtection;
