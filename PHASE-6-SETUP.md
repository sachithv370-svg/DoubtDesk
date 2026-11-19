# DOUBTDESK Phase 6: Community and Nova

## Community

The community page currently includes sample discussions, new-post creation, likes, and reply placeholders. To make it persistent, store posts in a Firestore `communityPosts` collection and restrict create/update operations to authenticated users with Firestore Security Rules.

## Nova AI endpoint

The browser sends study questions to:

```text
POST /api/ai-study
Body: { "message": "Explain integration by parts simply" }
Response: { "reply": "..." }
```

The API key must stay in a server environment variable such as `OPENAI_API_KEY`. The browser must never call OpenAI directly with the secret key.

The current frontend falls back to a small demo response when that endpoint is unavailable, so Nova remains demonstrable locally.

For a real endpoint, use the OpenAI Responses API from a server-side Node function with the official `openai` package. Add rate limits, authenticate the user, and avoid sending private student data unless the user has clearly chosen to share it.
