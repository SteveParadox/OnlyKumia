# OnlyKumia Core Flow Analysis

**Date**: November 11, 2025  
**Status**: COMPREHENSIVE AUDIT WITH BREAKS IDENTIFIED

---

## Executive Summary

The application has **partially implemented** the core flow with several critical breaks and incomplete features. Below is a detailed step-by-step analysis with identified breaks in the flow.

---

## 1) User Signup & Verification (Creator or Fan)

### ✅ IMPLEMENTED
- **User Signup**: Email/password signup for both creators and fans
  - Frontend: `CreatorSignUp.js`, `Signup.js`
  - Backend: `/auth/signUp`, `/creator/signup`
  - OAuth support: Google, Microsoft, Apple (Firebase)
  
- **Role Assignment**: Creator vs Fan differentiation
  - Creators: `CreatorSignUp.js` → `/creator-signup`
  - Fans: `Signup.js` → `/signup`
  - Backend stores `role` field in User model

- **User Database**: MongoDB User model stores basic profile
  - Fields: `uid`, `displayName`, `email`, `password`, `picture`, `role`, `verified_creator`, `kyc_status`

### ⚠️ PARTIAL/INCOMPLETE

#### **Rate Limiting & Bot Checks**
- **Status**: MINIMAL IMPLEMENTATION
- **Issue**: 
  - API Gateway has no rate limiting configured
  - Bot detection uses only honeypot field (`website` field in form)
  - No structured rate limiting middleware on signup endpoints
  - No sophisticated bot detection (CAPTCHA, IP reputation)
- **Location**: `CreatorSignUp.js:90-92`, `Signup.js:75-76`
- **Fix Needed**: Implement express-rate-limit on `/auth/signUp` and `/creator/signup` routes

#### **KYC Flow - CRITICAL BREAK**
- **Status**: INCOMPLETE/BROKEN
- **What's Implemented**:
  - Frontend collects ID file, selfie, metadata in `CreatorSignUp.js`
  - ID file hash computed (`computeSHA256`)
  - Backend KYC route exists: `Backend/Routes/KYC.js`
  - KYC status enum: `['not_started', 'pending', 'verified', 'rejected', 'flagged']`
  - Admin KYC approval/rejection: `/admin/kyc/:id/approve|reject`

- **What's MISSING/BROKEN**:
  - **No KYC Provider Integration**: The code has placeholders but no actual integration with:
    - Stripe Identity
    - Jumio
    - IDology
    - Persona
  - **No Age Verification**: Required for adult platform but not implemented
  - **No Identity Matching**: No face/ID matching validation
  - **No Secure Storage**: Raw documents should be encrypted and access-controlled; currently no encryption
  - **No Evidence Pointers**: Should store only hashed pointers, not raw docs
  - **No Signed Verification Tokens**: No JWT token issued upon KYC pass
  - **Flow**: User uploads ID → system should verify with provider → receive signed token → mark `verified_creator=true`
  - **Current Issue**: User can upload ID but no actual verification happens

- **Location**: `Backend/Routes/KYC.js`, `Backend/DB/KYC.js`
- **Flow Break Point**: After `/kyc/verify` endpoint, nothing connects verified status to auth tokens or content access

#### **Security Issues in KYC**
- ❌ Raw document files are NOT encrypted
- ❌ No access control on uploaded documents
- ❌ No hashing of evidence for tamper detection
- ❌ Files cleaned up after processing but not securely wiped

---

## 2) Content Upload → Moderation → Publish

### ✅ IMPLEMENTED
- **Upload Flow**: 
  - Frontend: `Upload.js` requests presigned S3 URL
  - Backend: `dataUpload.js` generates presigned URL
  - Content stored in "quarantine" status initially
  - File uploaded via PUT to S3 (or local simulated storage)

- **Upload Tracking**:
  - Content model stores: `filename`, `s3Key`, `fileHash`, `status`, `contentType`
  - Status transitions: `quarantine` → `processing` → `published|flagged|rejected`
  - Metadata stored with content record

- **Moderation Queue**:
  - Flagged content accessible via `/moderation/queue`
  - Admin review interface in `AdminConsole.js`
  - Manual approval/rejection tracked with `moderation.reviewedBy`, `reviewedAt`, `reviewNotes`
  - Audit logging for content actions

### ⚠️ PARTIAL/INCOMPLETE

#### **Automated Moderation - BROKEN**
- **Status**: PLACEHOLDER ONLY
- **What's Implemented**:
  - Status transitions based on `autoResult` in `dataUpload.js:113`
  - Simple check: if `contentType.startsWith('image/')` → `clean`, else → `flagged`
  
- **What's MISSING**:
  - ❌ **No ML Content Classification**: No detection for:
    - Sexually explicit content
    - Violence/gore
    - Minors in content
    - Privacy violations (faces, identifying info)
  - ❌ **No Hash-Based Detection**: No checking against known CSAM/illegal content hashes
  - ❌ **No File Type Validation**: Only checks mime type, not actual file integrity
  - ❌ **No Metadata Validation**: No check for malicious metadata
  - ❌ **No Watermarking**: No visible or invisible watermarking implemented
  - ❌ **No Traceability Stamping**: No metadata stamping for audit trail

- **Location**: `Backend/Routes/dataUpload.js:104-125`
- **Flow Break**: After upload, moderation is essentially non-functional beyond manual review

#### **HLS Transcoding & CDN - BROKEN**
- **Status**: NOT IMPLEMENTED
- **Missing**:
  - ❌ No video transcoding pipeline
  - ❌ No HLS/DASH wrapper generation
  - ❌ No thumbnail generation
  - ❌ No preview generation
  - ❌ No CDN integration
  - ❌ Content directly served without token gating (SECURITY ISSUE)

- **Current Issue**: Published content URL is directly accessible without entitlement checks

#### **Access Token System - BROKEN**
- **Status**: NOT IMPLEMENTED
- **Missing**:
  - ❌ No short-lived access tokens generated
  - ❌ No token TTL enforcement
  - ❌ No entitlement validation at content delivery
  - ❌ No DRM/signing system
  
- **Location**: Should be in new service, doesn't exist
- **Flow Break**: Content access not protected; anyone can access URLs directly

---

## 3) Subscription / PPV Purchase Flow

### ✅ IMPLEMENTED
- **Payment UI**:
  - `PurchaseModal.js` provides subscription, PPV, and token purchase options
  - Supports: Monthly subscription, single PPV, token packs
  - Frontend mock using localStorage

- **Mock Payment System**:
  - `mockPayments.js` simulates complete payment flow:
    - Order creation (`createOrder`)
    - Payment confirmation (`confirmPayment`)
    - Entitlement granting (`grantSubscription`, `grantPPV`)
    - Wallet management (`creditUserTokens`, `getUserTokenBalance`)
  - Entitlements stored in localStorage with expiry times
  - Commission split configurable

- **Entitlement Checking**:
  - `checkEntitlement()` validates subscription or PPV access
  - Time-based expiry enforcement
  - Differentiation between subscription (creator) and PPV (content)

- **Order Management**:
  - Orders created with userId, creatorId, type, amount
  - Status tracking: `pending` → `paid`
  - Transaction tokens generated

### ⚠️ PARTIAL/INCOMPLETE

#### **Backend Payment Integration - BROKEN**
- **Status**: MOCK ONLY, NOT PRODUCTION-READY
- **What's Implemented**:
  - `/payments/create-order` endpoint exists
  - `/payments/confirm` endpoint exists
  
- **What's MISSING**:
  - ❌ **No Real Payment Gateway**: No integration with:
    - Stripe
    - Skrill
    - Wise
    - Adult-friendly processor
    - Cryptocurrency (Bitcoin, Monero)
  - ❌ **No Payment Validation**: Confirm endpoint accepts any request without verification
  - ❌ **No PCI Compliance**: Payment data handling not secure
  - ❌ **No Webhook Handling**: Cannot process async payment confirmations
  - ❌ **No Refund Logic**: No cancellation/refund handling
  - ❌ **No Payment Reconciliation**: No settlement tracking

- **Location**: `Backend/Routes/payments.js`
- **Critical Issue**: Line 35 comment: "TODO: implement real payment validation & payout accounting"

#### **Revenue & Wallet Management - PARTIAL**
- **Status**: PARTIALLY IMPLEMENTED IN FRONTEND
- **What Works**:
  - Creator wallet balance tracked in `mockPayments.js`
  - Transaction history recorded in Wallet model
  - Commission percentage stored in env variable (`PLATFORM_FEE_PCT`)
  - Balance displayed in `CreatorDashboard.js`

- **What's Broken**:
  - ❌ **No Backend Wallet Persistence**: Mock wallets use localStorage (dev only)
  - ❌ **No Payout Scheduler**: No system to move funds creator bank/crypto
  - ❌ **No KYC Check on Payout**: Should verify creator KYC before payout
  - ❌ **No Tax Reporting**: No 1099/tax document generation
  - ❌ **No Compliance Check**: No jurisdiction/sanctions screening

- **Location**: `Backend/DB/Wallet.js`, `mockPayments.js`

#### **Entitlement Delivery - PARTIAL**
- **Status**: FRONTEND MOCK ONLY
- **Issue**: Entitlements granted locally but:
  - ❌ Not persisted to backend
  - ❌ No server-side validation when serving content
  - ❌ No token generation for content access
  - ❌ Frontend can be manipulated to grant false access

---

## 4) Live Streaming (Voice/Video Sessions)

### ✅ IMPLEMENTED
- **Stream Creation**:
  - `/streams/create` endpoint creates stream record
  - Returns ingest URL (RTMP) and playback URL (HLS)
  - Stream model stores: `title`, `creator`, `streamKey`, `ingestUrl`, `playbackUrl`, `status`

- **Stream Lifecycle**:
  - Status: `created` → `live` → `ended|killed`
  - Stream can be started (`/streams/:id/start`) and stopped (`/streams/:id/stop`)

- **Moderation Tracking**:
  - Stream flagging system: `/streams/ingest-webhook`
  - Moderation records stored in stream document
  - Critical issues trigger stream kill (`isFlagged`, `status='killed'`)
  - Audit trail recorded

- **WebSocket Support**:
  - Real-time chat relay via Socket.io
  - `joinStream` event joins room
  - `chatMessage` events broadcast to stream viewers
  - Tip relay implemented

### ⚠️ PARTIAL/INCOMPLETE

#### **RTMP Ingest & Transcoding - BROKEN**
- **Status**: NOT INTEGRATED
- **Missing**:
  - ❌ No RTMP ingest server configured
  - ❌ No transcoding pipeline (FFmpeg, etc.)
  - ❌ No multi-bitrate encoding
  - ❌ No HLS/DASH manifest generation
  - ❌ No CDN push integration
  - ❌ Ingest URL is placeholder: `rtmp://ingest.example.com/live`

- **Flow Break**: Creator can create stream but cannot actually stream

#### **Live Moderation - BROKEN**
- **Status**: PLACEHOLDER
- **Missing**:
  - ❌ No real-time content analysis
  - ❌ No low-latency flagging system
  - ❌ No automatic stream killing on critical issues
  - ❌ Current implementation only logs to stream document
  - ❌ No escalation to human moderators

- **Location**: `Backend/Routes/streams.js:60-90`

#### **Paid Stream Access - BROKEN**
- **Status**: NOT IMPLEMENTED
- **Missing**:
  - ❌ No access token generation for playback URL
  - ❌ No entitlement checks at CDN level
  - ❌ No streaming access controls
  - ❌ Playback URL directly accessible: `https://cdn.example.com/hls/{streamKey}/index.m3u8`

#### **Chat Moderation - MINIMAL**
- **Status**: BASIC ONLY
- **What Works**:
  - Rate limiting: 10 messages per 10 seconds
  - Simple banned word list
  - Messages flagged if banned content detected
  
- **What's Missing**:
  - ❌ No ML-based toxicity detection
  - ❌ No spam detection
  - ❌ No user blocking/muting system
  - ❌ No shadow-banning

---

## 5) Messaging & Tipping

### ✅ IMPLEMENTED
- **Direct Messaging**:
  - `/messages/send` endpoint accepts DMs
  - Message model stores: `from`, `toUser|toStream`, `content`, `status`, `timestamp`
  - Message history retrieval: `/messages/history`
  - Real-time delivery via Socket.io

- **Tipping System**:
  - `/tips` endpoint processes tips
  - Tip workflow:
    1. Find fan and creator wallets
    2. Verify balance (fan must have tokens)
    3. Calculate fee (configurable percentage)
    4. Debit fan, credit creator
    5. Return balance
  - Real-time tip notifications via Socket.io

- **Wallet Transactions**:
  - Each transaction recorded with type (debit/credit), amount, peer info
  - Balance updates persist to database

### ⚠️ PARTIAL/INCOMPLETE

#### **Message Moderation - MINIMAL**
- **Status**: VERY BASIC
- **What Works**:
  - Banned word list check
  - Flags message if banned content detected
  - Message stored with `status='flagged'` and `flaggedReason`

- **What's Missing**:
  - ❌ No ML toxicity detection
  - ❌ No spam detection (repeated messages, flooding)
  - ❌ No phishing link detection
  - ❌ No user reputation scoring
  - ❌ No automatic message deletion

- **Location**: `Backend/Routes/messages.js:13-20`

#### **Tip Fraud Prevention - BROKEN**
- **Status**: INSUFFICIENT
- **Issues**:
  - ❌ No duplicate detection (same tip sent twice)
  - ❌ No velocity checks (unusual tip patterns)
  - ❌ No chargeback protection
  - ❌ No reversal mechanism
  - ❌ No AML/CFT checks

#### **Spam & Rate Limiting - PARTIAL**
- **What Works**:
  - Express-rate-limit on messages: 10/10 seconds
  
- **What's Missing**:
  - ❌ No global spam filters
  - ❌ No per-user spam scoring
  - ❌ No coordinated spam detection
  - ❌ No account reputation system

---

## 6) Admin & Compliance

### ✅ IMPLEMENTED
- **Admin Console UI**:
  - `AdminConsole.js` provides tabs for:
    - Content Review: approve/reject flagged content
    - KYC Review: approve/reject KYC submissions, ban users
    - Audit Logs: view all admin actions
    - Financial: view wallet balances
  - Export functionality for CSV/JSON

- **Audit Logging**:
  - All admin actions logged to `AuditLog` collection
  - Fields: `action`, `actor`, `target`, `details`, `createdAt` (immutable)
  - Actions logged: `content_approved`, `content_rejected`, `kyc_approved`, `kyc_rejected`, `user_banned`, `user_unbanned`
  - Logs sorted chronologically, limited to 200 most recent

- **User Banning**:
  - `/admin/user/:id/ban` sets `isBlacklisted=true`
  - Banned users cannot log in (check in Login.js)
  - Unban capability available

- **Content Review Queue**:
  - `/admin/content/review` returns flagged/quarantine content
  - Admin can approve (→ `published`) or reject (→ `rejected`)
  - Actions logged to audit trail

- **KYC Review Queue**:
  - `/admin/kyc` returns pending KYC submissions
  - Admin can approve (→ user becomes `verified_creator`) or reject
  - User can be banned from KYC review page

- **WORM Storage**:
  - Immutable append-only storage for audit logs
  - Hash verification for tamper detection
  - Exports include verification hash
  - Location: `Backend/Utils/wormStorage.js`

### ⚠️ PARTIAL/INCOMPLETE

#### **Content Moderation Tools - MINIMAL**
- **Status**: VERY BASIC
- **What Works**:
  - Admin sees list of flagged content
  - Can approve or reject with notes
  - Action is logged

- **What's Missing**:
  - ❌ No preview/thumbnail viewing
  - ❌ No side-by-side comparison
  - ❌ No bulk actions
  - ❌ No filtering/sorting
  - ❌ No redaction tools (blurring, pixelating)
  - ❌ No escalation categories
  - ❌ No appeal system for users

- **Location**: `AdminConsole.js:105-131`

#### **Financial Audit - PARTIAL**
- **Status**: BASIC BALANCE VIEW ONLY
- **What Works**:
  - Wallet list with user, balance, earnings, spending
  - Can export financial data
  - Transaction history in wallet model

- **What's Missing**:
  - ❌ No reconciliation with actual payments processed
  - ❌ No payout history/status
  - ❌ No revenue split verification
  - ❌ No tax reporting
  - ❌ No dispute resolution
  - ❌ No suspicious activity detection

#### **Legal/Compliance - BROKEN**
- **Status**: MINIMAL/NOT IMPLEMENTED
- **Missing**:
  - ❌ No GDPR/CCPA data export for users
  - ❌ No right-to-be-forgotten implementation
  - ❌ No data retention policies
  - ❌ No jurisdiction-based content restrictions
  - ❌ No OFAC sanctions screening
  - ❌ No AML/CFT compliance checks
  - ❌ No automated reporting of illegal content to NCMEC/Thorn
  - ❌ No privacy policy enforcement
  - ❌ No terms of service acceptance tracking

#### **Export & Data Access - PARTIAL**
- **Status**: BASIC EXPORT ONLY
- **What Works**:
  - `/export/audit` - export audit logs (CSV/JSON) with WORM verification
  - `/export/financial` - export wallet data
  - `/export/users` - export user list (excludes passwords)
  - Export records hash-verified via WORM

- **What's Missing**:
  - ❌ No user data export for GDPR requests
  - ❌ No timeline for export delivery
  - ❌ No automatic scheduled exports
  - ❌ No encryption for exported data at rest
  - ❌ No retention policies (exports kept forever)

---

## Summary of Critical Breaks in Core Flow

| # | Flow Section | Issue | Severity | Impact |
|---|---|---|---|---|
| 1 | KYC Verification | No integration with identity providers | CRITICAL | Creators not actually verified |
| 2 | KYC Security | Documents not encrypted, no access control | CRITICAL | Privacy/compliance violation |
| 3 | Content Moderation | Auto-moderation is placeholder only | CRITICAL | CSAM/illegal content not detected |
| 4 | Content Access | No token gating or entitlement checks | CRITICAL | Paid content accessible without payment |
| 5 | HLS/Transcoding | Not implemented | CRITICAL | Video cannot be served securely |
| 6 | Payment Gateway | No real payment processor integrated | CRITICAL | Cannot process actual payments |
| 7 | RTMP Ingest | Not integrated | CRITICAL | Creators cannot stream |
| 8 | Live Moderation | Only placeholder webhooks | HIGH | No live content moderation |
| 9 | Payout System | Not implemented | HIGH | Creators cannot withdraw earnings |
| 10 | Rate Limiting | Minimal on signup | HIGH | Bot/spam risk |

---

## Data Flow Diagram of Current State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SIGNUP & AUTH FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

User → Signup Form → Email/OAuth → User Model (✅)
                     ↓
            Role Assignment (✅)
                     ↓
    Creator? → KYC Upload (⚠️ BROKEN - no verification)
              ↓
         No Real Verification → verified_creator=false ❌
         Should connect to identity provider ❌

┌─────────────────────────────────────────────────────────────────────────┐
│                       CONTENT UPLOAD FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

User → Upload File → Request Presign URL (✅)
         ↓
      PUT to S3 (✅)
         ↓
   Notify Complete (✅)
         ↓
   Auto-Moderation (⚠️ PLACEHOLDER)
      ↓        ↓
   Image→  Other→  
   Clean   Flag (but no ML detection!)
     ↓       ↓
   Publish   Manual Review (✅)
     ↓       ↓
   Status=published (❌ NO TOKEN GATING)
     ↓
   Content Directly Accessible (SECURITY ISSUE)
   ↓
   Should: Transcode→HLS→CDN→Token Gate ❌

┌─────────────────────────────────────────────────────────────────────────┐
│                     PURCHASE & PAYMENT FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

User → PurchaseModal → Select Type (✅)
         ↓
   Create Order (⚠️ MOCK)
         ↓
   Confirm Payment (❌ NO REAL GATEWAY)
         ↓
   Grant Entitlement (⚠️ FRONTEND ONLY, localStorage)
         ↓
   Credit Creator Wallet (⚠️ FRONTEND MOCK)
         ↓
   Should: Process via Stripe/Payment → Verify → Persist to DB → Payout ❌

┌─────────────────────────────────────────────────────────────────────────┐
│                       LIVE STREAM FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

Creator → Create Stream (✅)
           ↓
      Get Ingest URL (✅ placeholder: rtmp://ingest.example.com)
           ↓
      Should: Connect RTMP → Transcode → HLS → CDN ❌
           ↓
      Viewers access Playback URL (❌ NO TOKEN GATE)
           ↓
      Chat via WebSocket (✅ basic, minimal moderation)
           ↓
      Moderation (⚠️ WEBHOOK ONLY, no real-time detection)

┌─────────────────────────────────────────────────────────────────────────┐
│                      MESSAGING & TIPPING FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

Fan → Send Message (✅)
        ↓
    Rate Limited (⚠️ 10/10s only)
        ↓
    Moderation (⚠️ banned word list only)
        ↓
    Stored in DB (✅)
        ↓
    Delivered via WebSocket (✅)

Fan → Send Tip (✅)
        ↓
    Debit Fan Wallet (⚠️ FRONTEND MOCK)
        ↓
    Credit Creator (⚠️ FRONTEND MOCK)
        ↓
    Should: Fraud checks, KYC verify, settlement ❌
```

---

## Recommendations for Production

### Immediate Fixes (CRITICAL)
1. **Integrate Real KYC Provider** (Stripe Identity, Persona, IDology)
2. **Implement Content Token Gating** - No direct URL access
3. **Integrate Real Payment Processor** (Stripe, for adult services)
4. **Deploy Real RTMP/Transcoding** (Wowza, AWS MediaLive, or self-hosted FFmpeg)
5. **Implement ML Content Moderation** (AWS Rekognition, Google Vision, Clarifai)
6. **Encrypt Sensitive Documents** at rest and in transit

### High Priority
7. Implement payout system with bank/crypto integration
8. Add real rate limiting and bot detection
9. Implement entitlement persistence on backend
10. Add financial reconciliation and dispute resolution

### Medium Priority
11. Add GDPR/CCPA compliance features
12. Implement advanced moderation tools for admins
13. Add user appeal system
14. Implement tax reporting

---

## Files Needing Updates

| File | Status | Notes |
|------|--------|-------|
| `Backend/Routes/KYC.js` | NEEDS REWRITE | Add provider integration |
| `Backend/Routes/dataUpload.js` | NEEDS REWRITE | Add ML moderation |
| `Backend/Routes/payments.js` | NEEDS REWRITE | Add real payment gateway |
| `Backend/Routes/streams.js` | NEEDS REWRITE | Add RTMP/transcoding |
| `Backend/Routes/export.js` | ADD TO | GDPR/CCPA compliance |
| `zeevx/src/Components/PurchaseModal.js` | NEEDS UPDATE | Backend persistence |
| `zeevx/src/Utils/mockPayments.js` | DEPRECATE | Use real backend |
| `zeevx/src/Pages/AdminConsole.js` | NEEDS ENHANCEMENT | Better moderation UI |

