# DOUBTDESK

DOUBTDESK is a responsive online tutoring platform prototype with courses, notes, meetings, community discussions, demo checkout, Firebase-ready authentication, and a Nova study assistant.

## Run locally

Install Node.js, then open the project folder in VS Code and run:

```bash
npm start
```

Open `http://localhost:5500`.

The built-in server provides `/api/health`, `/api/ai-study`, and `/api/create-checkout-session`. Without credentials, the AI and payment routes safely use demo behavior.

## Optional production services

- Firebase Authentication and Firestore: configure `firebase-config.js`.
- Stripe: implement the secure Checkout Session endpoint described in `PHASE-5-SETUP.md`.
- OpenAI: set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in the server environment. Never put the key in frontend files.

## Publish

For the complete version, use Netlify. The included `netlify.toml` configures the static site, Netlify Functions, and `/api/*` routes. Connect the GitHub repository to Netlify and add `OPENAI_API_KEY` as a secret in the Site configuration. The included `render.yaml` remains available if you later choose Render instead.
