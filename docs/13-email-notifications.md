# 13 — Email Notification System

> Back to [README](./README.md) · Previous: [Chat & Messaging System](./12-chat-messaging.md)

---

## Email Types & Templates

| Email | Trigger | Template |
|-------|---------|----------|
| **OTP Verification** | `POST /auth/register/send-otp` | Branded HTML with large OTP code |
| **Password Reset** | `POST /auth/forgot-password` | Branded HTML with reset code |
| **New Message** | Available but not directly triggered (via digest) | Product-specific CTA |
| **Request Offer** | Available but not directly triggered (via digest) | "Someone has your item" |
| **Daily Digest** | Cron at midnight IST | Summary: X inbox messages, Y offers |

---

## Dev Mode Behavior

All email functions check for the dummy API key `re_your_api_key_here`:

- If **dummy + development:** Log to terminal, return `{ success: true }`. (Used for local OTP testing).
- If **dummy + production:** Return `{ success: false, error: 'not configured' }`.
- If **real key:** Send via Resend API.

---

## Daily Digest Cron Job (`emailDigestCron.js`)

- **Schedule:** `0 0 * * *` (midnight daily) in `Asia/Kolkata` timezone.
- **Process:** 
  1. Reads all `NotificationQueue` entries.
  2. Groups them by user.
  3. Sends one digest email per user summarizing activity.
  4. Clears the queue.
- **Bundling:** Counts inbox messages and request offers separately in the email body.

---

*Next: [Security Analysis →](./14-security.md)*
