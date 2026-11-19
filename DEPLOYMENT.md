# Publish DOUBTDESK

## Easiest public demo

1. Create a GitHub repository and upload this folder.
2. Import the repository into Vercel or Netlify.
3. Set the build command to blank and the publish directory to `.` for the static-only version.
4. Deploy and share the generated URL with your teacher.

## Full version on Netlify

The repository includes `netlify.toml` and `netlify/functions/`. In Netlify, choose **Add new site → Import an existing project**, connect GitHub, and use the repository defaults. Netlify will publish the frontend and deploy the three functions automatically.

Add `OPENAI_API_KEY` under **Site configuration → Environment variables**. Leave it blank to use Nova’s safe demo responses. Stripe still needs a server-side Checkout implementation inside `netlify/functions/create-checkout-session.js` before accepting real payments.

Netlify’s function routes are mapped to `/api/ai-study`, `/api/create-checkout-session`, and `/api/health` by `netlify.toml`. See the [Netlify Functions documentation](https://docs.netlify.com/build/functions/configuration/).

## Full version on Render

The repository includes `render.yaml`. In Render, choose **New → Blueprint**, connect the GitHub repository, and confirm the `doubtdesk` web service. Render will use `npm install`, `npm start`, and `/api/health` automatically.

Add `OPENAI_API_KEY` under the service’s Environment settings. Keep it secret. The optional `OPENAI_MODEL` value is already provided by the blueprint.

Render provides a public `onrender.com` URL and supports custom domains. The official Render setup uses a Node start command and HTTP health-check path. See the [Render web service documentation](https://render.com/docs/web-services).

## Full version details

The Node server in `server.js` is needed for `/api/ai-study` and `/api/create-checkout-session`. Deploy it as a Node service and set:

- `PORT` — supplied by the hosting provider
- `OPENAI_API_KEY` — optional server secret
- `OPENAI_MODEL` — optional model name

Configure Firebase authorized domains to include the deployed frontend domain. Configure Stripe webhook URLs on the payment server before accepting real payments.

## Before sharing

- Replace the Firebase placeholders in `firebase-config.js`.
- Confirm Firebase Security Rules are enabled.
- Use Stripe test mode first.
- Add the deployed Node API URL to the frontend API calls if frontend and server use different domains.
- Test registration, login, course navigation, notes, meetings, community posts, and Nova on a phone-sized browser window.
