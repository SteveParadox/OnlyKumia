# Critical Breaks - Code Evidence & Fixes

## 1️⃣ KYC VERIFICATION BROKEN

### Evidence
**File**: `Backend/Routes/KYC.js`
```javascript
// Current: Just accepts files, no real verification
router.post('/verify', multer, authMiddleware, async (req, res) => {
  try {
    // ... file upload handling ...
    const kyc = await KYC.create({
      userId: req.user._id,
      status: 'pending',  // ← ALWAYS pending, never actually verified
      documentHash: docHash,
      // ... no integration with provider ...
    });
    
    res.status(201).json({
      message: 'KYC verification initiated',
      status: 'pending',  // ← stays here forever
      kycId: kyc._id
    });
  }
});
```

### What's Missing
1. No integration with: Stripe Identity, Persona, IDology, Jumio
2. No age verification
3. No face/ID matching
4. No signed verification tokens
5. No connected callback from provider

### Required Fix
```javascript
// Pseudo-code for proper implementation
router.post('/verify', multer, authMiddleware, async (req, res) => {
  // 1. Save encrypted documents
  const encryptedDoc = encryptAES256(docFile);
  const encryptedSelfie = encryptAES256(selfieFile);
  
  // 2. Send to provider
  const response = await stripeIdentity.createVerificationSession({
    type: 'document',
    document: Buffer.from(encryptedDoc),
    metadata: { userId: req.user._id }
  });
  
  // 3. Create KYC record with pending provider response
  const kyc = await KYC.create({
    userId: req.user._id,
    status: 'pending',
    providerId: response.id,
    documentHash: sha256(docFile),  // hash only, not raw
    selfieHash: sha256(selfieFile),
    encryptedDocumentPointer: response.id,  // pointer, not file
  });
  
  // 4. When provider calls webhook with verification result
  app.post('/webhooks/kyc', (req, res) => {
    const { kycId, verified, age, name } = req.body;
    const kyc = await KYC.findById(kycId);
    
    if (verified) {
      kyc.status = 'verified';
      await User.updateOne(
        { _id: kyc.userId },
        { verified_creator: true }
      );
      
      // Issue signed verification token
      const verificationToken = jwt.sign(
        { userId: kyc.userId, verified: true },
        process.env.JWT_SECRET,
        { expiresIn: '1y' }
      );
      kyc.verificationToken = verificationToken;
    } else {
      kyc.status = 'rejected';
    }
    await kyc.save();
  });
});
```

### Risk If Not Fixed
- **Creators not actually verified** → anyone can create creator account
- **No age verification** → illegal in many jurisdictions
- **Privacy violation** → raw documents exposed

---

## 2️⃣ CONTENT ACCESS NOT GATED

### Evidence
**File**: `Backend/Routes/dataUpload.js:90-130`
```javascript
router.post('/complete', authMiddleware, async (req, res) => {
  const { uploadId, metadata, fileHash, publicUrl } = req.body;
  
  const content = await Content.findById(uploadId);
  content.metadata = metadata;
  content.status = 'published';
  // ❌ PROBLEM: Returns direct URL
  res.json({
    message: 'Published',
    status: 'published',
    publicUrl: publicUrl  // ← Anyone can access this URL!
  });
});

// When user views published content in Explore
// File: zeevx/src/User/NewExplore.js
<img src={content.mediaUrl} />  // ← Direct access, no token!
```

### What's Missing
1. No access token generation
2. No subscription check
3. No PPV check  
4. No token expiry
5. No signature verification
6. Content directly accessible at S3/CDN

### Required Fix
```javascript
// Step 1: Create Access Token Service
const generateAccessToken = (userId, contentId, expiresIn = '1h') => {
  const payload = {
    userId,
    contentId,
    iat: Date.now(),
    exp: Date.now() + ms(expiresIn)
  };
  
  const signature = hmacSHA256(
    JSON.stringify(payload),
    process.env.ACCESS_TOKEN_SECRET
  );
  
  return Buffer.from(JSON.stringify({ ...payload, sig: signature }))
    .toString('base64');
};

// Step 2: When viewer requests content
router.get('/content/:contentId/access', authMiddleware, async (req, res) => {
  const { contentId } = req.params;
  const userId = req.user.uid;
  
  // Check entitlement
  const entitlement = await mockPayments.checkEntitlement(
    userId,
    contentId,
    null
  );
  
  if (!entitlement.granted) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Generate short-lived token
  const token = generateAccessToken(userId, contentId, '30m');
  
  // Return signed URL (if using S3)
  const signedUrl = S3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: `content/${contentId}`,
    Expires: 1800,  // 30 minutes
    ResponseMetadata: {
      'x-access-token': token
    }
  });
  
  res.json({ signedUrl, expiresIn: 1800 });
});

// Step 3: Validate token on CDN/reverse proxy
// If using Cloudflare Workers or Lambda@Edge
app.use('/cdn/content/:contentId', (req, res, next) => {
  const token = req.headers['x-access-token'];
  
  if (!token) return res.status(403).send('Forbidden');
  
  try {
    const { userId, contentId, exp, sig } = JSON.parse(
      Buffer.from(token, 'base64').toString()
    );
    
    if (exp < Date.now()) return res.status(403).send('Expired');
    
    const validSig = hmacSHA256(
      JSON.stringify({ userId, contentId, iat: exp - ms('1h'), exp }),
      process.env.ACCESS_TOKEN_SECRET
    );
    
    if (sig !== validSig) return res.status(403).send('Invalid');
    
    next();
  } catch (err) {
    return res.status(403).send('Forbidden');
  }
});
```

### Risk If Not Fixed
- **All paid content free** → zero revenue
- **Copyright violation** → content can be scraped/shared
- **Payment fraud** → users get free access

---

## 3️⃣ CONTENT MODERATION IS BROKEN

### Evidence
**File**: `Backend/Routes/dataUpload.js:104-125`
```javascript
// Current implementation
const autoResult = (content.contentType || '').startsWith('image/')
  ? 'clean'
  : 'flagged';

if (autoResult === 'clean') {
  content.status = 'published';  // ❌ No actual moderation!
} else {
  content.status = 'flagged';    // ❌ Just marks as flagged
  content.moderation.autoResult = autoResult;
  await content.save();
}
```

### What's Missing
1. No CSAM hash detection
2. No sexual content detection
3. No violence/gore detection
4. No face detection for age verification
5. No metadata validation
6. No watermarking

### Required Fix
```javascript
// Step 1: Integrate AWS Rekognition (or Google Vision)
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition();

const analyzeContent = async (contentType, s3Key) => {
  if (!contentType.startsWith('image/')) {
    // For video, use Rekognition Video
    const videoResponse = await rekognition.startLabelDetection({
      Video: { S3Object: { Bucket: S3_BUCKET, Name: s3Key } }
    }).promise();
    
    const jobId = videoResponse.JobId;
    // Poll for results...
    return await getVideoAnalysisResults(jobId);
  }
  
  // For images
  const response = await rekognition.detectModerationLabels({
    Image: { S3Object: { Bucket: S3_BUCKET, Name: s3Key } }
  }).promise();
  
  return response.ModerationLabels;
};

// Step 2: Check against CSAM hash database (PhotoDNA, NCMEC)
const checkCSAMHash = async (fileBuffer) => {
  const hash = photoHash(fileBuffer);  // perceptual hash
  
  const match = await CSAMDatabase.find({ hash });
  if (match) {
    return {
      flagged: true,
      reason: 'csam',
      severity: 'critical'
    };
  }
};

// Step 3: Full moderation pipeline
router.post('/complete', authMiddleware, async (req, res) => {
  const { uploadId, metadata, fileHash, publicUrl } = req.body;
  
  const content = await Content.findById(uploadId);
  
  // 1. Check CSAM
  const csamCheck = await checkCSAMHash(
    await downloadFromS3(content.s3Key)
  );
  
  if (csamCheck.flagged && csamCheck.severity === 'critical') {
    content.status = 'rejected';
    content.moderation.autoResult = 'csam_detected';
    await content.save();
    
    // TODO: Report to NCMEC/Thorn
    await reportToNCMEC(content._id);
    
    return res.json({
      message: 'Content rejected',
      status: 'rejected'
    });
  }
  
  // 2. ML moderation analysis
  const labels = await analyzeContent(content.contentType, content.s3Key);
  
  const hasProblems = labels.some(label => {
    return UNSAFE_LABELS.includes(label.Name) &&
           label.Confidence > 80;
  });
  
  if (hasProblems) {
    content.status = 'flagged';
    content.moderation.autoResult = 'ml_flagged';
    content.moderation.labels = labels;
    await content.save();
    
    return res.json({
      message: 'Content flagged for review',
      status: 'flagged'
    });
  }
  
  // 3. If clean, add watermark and publish
  const watermarked = await addWatermark(
    content.s3Key,
    { creatorId: content.user, timestamp: Date.now() }
  );
  
  // 4. Transcode video if needed
  if (content.contentType.startsWith('video/')) {
    await startTranscodeJob(content._id, content.s3Key);
  }
  
  content.status = 'published';
  content.moderation.autoResult = 'clean';
  content.moderation.watermarked = watermarked;
  await content.save();
  
  res.json({
    message: 'Content published',
    status: 'published'
  });
});

const UNSAFE_LABELS = [
  'Explicit Nudity',
  'Graphic Male Nudity',
  'Graphic Female Nudity',
  'Sexual Activity',
  'Illustrated Explicit Nudity',
  'Adult Toys',
  'Violence',
  'Graphic Violence',
  'Physical Violence Against Children'
];
```

### Risk If Not Fixed
- **CSAM and illegal content not detected** → major legal liability
- **Platform becomes haven for abuse** → regulatory action

---

## 4️⃣ PAYMENT PROCESSING IS MOCK

### Evidence
**File**: `zeevx/src/Utils/mockPayments.js`
```javascript
// All processing happens in browser!
export async function createOrder({ userId, type, amount, creatorId, contentId }) {
  const orders = read(ORDERS_KEY);  // ← Reading from localStorage
  const order = { id: id(), userId, type, amount, status: 'pending' };
  orders.push(order);
  write(ORDERS_KEY, orders);  // ← Writing to localStorage
  return { orderId: order.id };
}

export async function confirmPayment(orderId) {
  const orders = read(ORDERS_KEY);  // ← Manipulable!
  const o = orders.find(x => x.id === orderId);
  o.status = 'paid';  // ← No actual payment validation!
  write(ORDERS_KEY, orders);
  
  // Grant entitlement (also just localStorage)
  grantSubscription(o.userId, o.creatorId, ...);
}

// When component uses it:
// File: zeevx/src/Components/PurchaseModal.js
const doPurchase = async () => {
  const { orderId } = await mockPayments.createOrder({...});
  await mockPayments.confirmPayment(orderId);  // ← Instant "success"
};
```

### What's Missing
1. No Stripe/real payment gateway integration
2. No payment validation
3. No transaction ID from processor
4. No webhook handling for async confirmations
5. No refund/chargeback handling
6. No PCI compliance

### Required Fix
```javascript
// Backend payment integration
router.post('/create-order', authMiddleware, async (req, res) => {
  const { type, creatorId, contentId, amount } = req.body;
  const userId = req.user.uid;
  
  try {
    if (type === 'subscription') {
      // Create Stripe Subscription
      const subscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,  // Must exist
        items: [{
          price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID,
          quantity: 1
        }],
        metadata: {
          userId,
          creatorId,
          type: 'creator_subscription'
        }
      });
      
      return res.json({
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscriptionId: subscription.id
      });
    }
    
    if (type === 'ppv') {
      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),  // cents
        currency: 'usd',
        metadata: {
          userId,
          contentId,
          type: 'ppv'
        },
        description: `PPV access to content ${contentId}`
      });
      
      return res.json({
        clientSecret: paymentIntent.client_secret,
        intentId: paymentIntent.id
      });
    }
  } catch (err) {
    console.error('Payment error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Webhook handler for payment confirmations
router.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const { userId, contentId, type } = event.data.object.metadata;
      
      if (type === 'ppv') {
        // Grant access to content
        await mockPayments.grantPPV(userId, contentId, 7 * 24 * 3600 * 1000);
        
        // Credit creator
        const content = await Content.findById(contentId);
        const creator = await User.findById(content.user);
        const wallet = await Wallet.findOne({ user: creator._id });
        wallet.balance += event.data.object.amount / 100 * 0.9;  // 90/10 split
        await wallet.save();
      }
      break;
      
    case 'customer.subscription.updated':
      const { userId: subUserId, creatorId } = event.data.object.metadata;
      const creator = await User.findById(creatorId);
      const creatorWallet = await Wallet.findOne({ user: creator._id });
      
      // Monthly subscription charge
      creatorWallet.balance += 9.99 * 0.9;  // 90/10 split
      await creatorWallet.save();
      
      // Grant subscription entitlement
      await mockPayments.grantSubscription(subUserId, creatorId, 30 * 24 * 3600 * 1000);
      break;
  }
  
  res.json({ received: true });
});
```

### Risk If Not Fixed
- **No actual payments processed** → zero revenue
- **Anyone can manipulate localStorage** → fraud
- **No transaction records** → regulatory violation

---

## 5️⃣ RTMP INGEST NOT DEPLOYED

### Evidence
**File**: `Backend/Routes/streams.js:1-50`
```javascript
function genKey() {
  return crypto.randomBytes(16).toString('hex');
}

router.post('/create', authMiddleware, async (req, res) => {
  const { title } = req.body;
  const streamKey = genKey();
  const ingestHost = process.env.RTMP_INGEST_HOST || 
    'rtmp://ingest.example.com/live';  // ← PLACEHOLDER!
  const ingestUrl = `${ingestHost}/${streamKey}`;
  
  // Playback is also placeholder
  const playbackUrl = (process.env.CDN_BASE || 'https://cdn.example.com') +
    `/hls/${streamKey}/index.m3u8`;  // ← DOESN'T EXIST!
  
  const s = await Stream.create({
    title,
    creator,
    streamKey,
    ingestUrl,
    playbackUrl,
    status: 'created'
  });
  
  res.json({ s });
});
```

### What's Missing
1. No actual RTMP server deployed
2. No connection validation
3. No transcoding pipeline
4. No HLS manifest generation
5. No CDN integration
6. No origin server

### Required Fix (High-level)
```
Deployment Architecture:
┌─────────────┐
│   Creator   │
│  OBS/XSplit │
└──────┬──────┘
       │ RTMP stream
       ▼
┌────────────────────────┐
│  RTMP Ingest Server    │
│  (Wowza / AWS Media)   │
│  rtmp://ingest.xxx/    │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Transcoding Engine    │
│  (AWS MediaLive /      │
│   FFmpeg + Segmenter)  │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  HLS Origin Server     │
│  (Nginx + ts-recorder) │
│  /hls/{streamKey}/     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  CDN (CloudFlare /     │
│  AWS CloudFront)       │
│  Token gated access    │
└────────────────────────┘

Corrected Code:
```javascript
router.post('/create', authMiddleware, async (req, res) => {
  const streamKey = genKey();
  
  // Real RTMP ingest from deployed server
  const ingestUrl = `rtmp://${process.env.RTMP_INGEST_HOST}/live/${streamKey}`;
  
  // Playback URL will be HLS from origin
  const playbackUrl = `https://${process.env.HLS_ORIGIN}/hls/${streamKey}/index.m3u8`;
  
  // Notify transcoding service
  await transcodingService.addStream({
    streamKey,
    sourceUrl: ingestUrl,
    outputPath: `/hls/${streamKey}`,
    bitrates: ['1000k', '2500k', '5000k'],
    resolution: ['720p', '1080p', '1440p']
  });
  
  const s = await Stream.create({...});
  res.json({ s });
});

// When starting stream, validate ingest connection
router.post('/:id/start', authMiddleware, async (req, res) => {
  const stream = await Stream.findById(req.params.id);
  
  // Check if RTMP connection is active
  const isConnected = await rtmpServer.checkConnection(stream.streamKey);
  
  if (!isConnected) {
    return res.status(400).json({
      error: 'No active RTMP connection. Start streaming to your RTMP URL.'
    });
  }
  
  stream.status = 'live';
  stream.startedAt = Date.now();
  await stream.save();
  
  res.json({ message: 'Stream started', stream });
});
```

### Risk If Not Fixed
- **Creators cannot stream** → main feature broken
- **No revenue from subscriptions** → business model failure

---

## Summary: All 5 Critical Breaks

| # | Issue | Current | Required | Est. Time |
|---|-------|---------|----------|-----------|
| 1 | KYC Verification | No provider integration | Stripe Identity | 1 week |
| 2 | Content Gating | Direct URL access | Token-based access | 1 week |
| 3 | Moderation | File type only | ML + CSAM detection | 2 weeks |
| 4 | Payment | localStorage mock | Stripe backend | 2 weeks |
| 5 | RTMP Streaming | Placeholder config | Deployed RTMP server | 2 weeks |

**Total: 8 weeks to production-ready**

