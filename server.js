const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5500);
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".md": "text/plain; charset=utf-8", ".json": "application/json; charset=utf-8" };

function json(response, status, body) { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); response.end(JSON.stringify(body)); }
function readBody(request) { return new Promise((resolve, reject) => { let data = ""; request.on("data", chunk => { data += chunk; if (data.length > 20000) request.destroy(); }); request.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (error) { reject(error); } }); request.on("error", reject); }); }
function demoReply(message) { const lower = String(message || "").toLowerCase(); if (lower.includes("quiz") || lower.includes("test")) return "Here’s a quick starter quiz: 1) What is the net force when acceleration is zero? 2) Which rule helps you choose u in integration by parts? 3) What unit is used for force? Reply with your answers and I’ll check them."; if (lower.includes("summar")) return "A good summary has three parts: the main idea, the important supporting details, and one example. Try writing each as a single sentence before adding anything else."; return "Start by identifying the idea the question is testing, then choose the smallest rule or example that proves it. Share the exact problem and I can guide you step by step."; }
async function aiReply(message) {
  if (!process.env.OPENAI_API_KEY) return demoReply(message);
  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", instructions: "You are Nova, a friendly tutoring assistant. Explain clearly, encourage learning, and do not do graded work dishonestly.", input: String(message || "").slice(0, 4000) }) });
    if (!apiResponse.ok) return demoReply(message);
    const result = await apiResponse.json(); return result.output_text || demoReply(message);
  } catch (_) { return demoReply(message); }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/ai-study") { const body = await readBody(request); return json(response, 200, { reply: await aiReply(body.message) }); }
    if (request.method === "POST" && request.url === "/api/create-checkout-session") return json(response, 200, { demo: true, message: "Demo booking recorded. Configure Stripe Checkout on the server for real payments." });
    if (request.method === "GET" && request.url === "/api/health") return json(response, 200, { ok: true, service: "doubtdesk" });
    const requested = decodeURIComponent((request.url || "/").split("?")[0]);
    const safePath = requested === "/" ? "/index.html" : requested;
    const filePath = path.resolve(root, `.${safePath}`);
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return json(response, 404, { error: "Not found" });
    response.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" }); fs.createReadStream(filePath).pipe(response);
  } catch (error) { json(response, 500, { error: "Server error" }); }
});
server.listen(port, "0.0.0.0", () => console.log(`DOUBTDESK running at http://localhost:${port}`));
