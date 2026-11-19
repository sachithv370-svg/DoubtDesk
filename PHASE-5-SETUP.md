# DOUBTDESK Phase 5: Payments

The paid-meeting checkout screen is now part of the app. It uses demo confirmation until a secure payment endpoint is connected.

## What is safe to configure

Never put a Stripe secret key (`sk_...`) in `index.html`, `app.js`, or any browser file. The frontend calls:

```text
POST /api/create-checkout-session
Body: { "meetingId": "mechanics-clinic-21nov" }
Response: { "url": "https://checkout.stripe.com/..." }
```

That server endpoint must create the Stripe Checkout Session using the secret key, validate the meeting price on the server, and return the Checkout URL. After payment, Stripe webhooks should confirm the booking before granting access to a paid meeting.

## Beginner-friendly options

1. Use Stripe Payment Links for the class demonstration. Create one link for each paid meeting and connect the button to that link.
2. For real dynamic pricing, deploy a small server or Firebase Cloud Function and use Stripe Checkout Sessions.

The current app deliberately falls back to a demo booking when `/api/create-checkout-session` is unavailable. This makes the frontend demonstrable without pretending that a payment was processed.
