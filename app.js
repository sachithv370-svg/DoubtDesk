import { getFirebaseAuth, firebaseAuthMethods, isFirebaseConfigured } from "./firebase.js";
import { courses, renderCourses, renderNotes, renderCourseDetails, meetings, renderMeetings, renderMeetingRoom, renderCheckout, renderPaymentSuccess, renderCommunity, renderAssistant, renderSettings } from "./content.js";

const toast = document.getElementById("toast");
const authOverlay = document.getElementById("authOverlay");
const sidebar = document.getElementById("sidebar");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const pageContent = document.getElementById("pageContent");
const homeMarkup = pageContent.innerHTML;
let activeCheckoutMeetingId = null;
let demoUser = (() => { try { return JSON.parse(localStorage.getItem("doubtdesk-demo-user")) || null; } catch (_) { return null; } })();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function setError(form, message) {
  let error = form.querySelector(".auth-error");
  if (!error) { error = document.createElement("p"); error.className = "auth-error"; form.prepend(error); }
  error.textContent = message;
}

function openAuth(tab = "login") {
  authOverlay.classList.add("open");
  authOverlay.setAttribute("aria-hidden", "false");
  switchAuth(tab);
}
function closeAuth() { authOverlay.classList.remove("open"); authOverlay.setAttribute("aria-hidden", "true"); }
function switchAuth(tab) {
  document.querySelectorAll(".auth-tab").forEach(button => button.classList.toggle("active", button.dataset.auth === tab));
  loginForm.classList.toggle("hidden", tab !== "login");
  registerForm.classList.toggle("hidden", tab !== "register");
}
function friendlyAuthError(error) {
  const messages = { "auth/invalid-credential": "That email or password is not correct.", "auth/email-already-in-use": "An account already exists with this email.", "auth/weak-password": "Use a password with at least 6 characters.", "auth/invalid-email": "Please enter a valid email address.", "auth/popup-closed-by-user": "The Google sign-in window was closed." };
  return messages[error.code] || "Something went wrong. Please try again.";
}
function updateUserName(user) {
  if (!user) return;
  const name = user.displayName || user.email?.split("@")[0] || "Student";
  const heading = document.querySelector(".welcome-row h1");
  if (heading) heading.innerHTML = `Good morning, ${name.split(" ")[0]} <span class="wave">✦</span>`;
  const profileName = document.querySelector(".sidebar-user strong");
  if (profileName) profileName.textContent = name;
  const initials = name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
  document.querySelectorAll(".avatar-purple").forEach(avatar => { avatar.textContent = initials; });
}
function saveDemoUser(name, email) { demoUser = { name, email }; localStorage.setItem("doubtdesk-demo-user", JSON.stringify(demoUser)); updateUserName({ displayName: name, email }); }
function launchJitsi(roomId) {
  const container = document.getElementById("jitsiRoom");
  if (!container) return;
  const start = () => {
    if (!window.JitsiMeetExternalAPI) return showToast("The meeting service could not be loaded. Check your internet connection.");
    container.innerHTML = "";
    new window.JitsiMeetExternalAPI("meet.jit.si", { roomName: `DOUBTDESK-${roomId}`, width: "100%", height: 560, parentNode: container, userInfo: { displayName: document.querySelector(".sidebar-user strong")?.textContent || "DOUBTDESK Student" }, configOverwrite: { prejoinPageEnabled: true }, interfaceConfigOverwrite: { HIDE_INVITE_MORE_HEADER: true } });
  };
  if (window.JitsiMeetExternalAPI) return start();
  const script = document.createElement("script"); script.src = "https://meet.jit.si/external_api.js"; script.onload = start; script.onerror = () => showToast("Meeting service unavailable right now."); document.head.appendChild(script);
}
function escapeHtml(value) { return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]); }
function demoNovaReply(message) {
  const lower = message.toLowerCase();
  if (lower.includes("quiz") || lower.includes("test")) return "Here’s a quick starter quiz: 1) What is the net force when acceleration is zero? 2) Which rule helps you choose u in integration by parts? 3) What unit is used for force? Reply with your answers and I’ll check them.";
  if (lower.includes("summar")) return "A good summary has three parts: the main idea, the important supporting details, and one example. Try writing each as a single sentence before adding anything else.";
  if (lower.includes("plan")) return "Try this 10-minute plan: 2 minutes recall what you know, 5 minutes solve one focused problem, then 3 minutes review the mistake and write one takeaway.";
  return "Think of it in two steps: first identify the idea the question is testing, then choose the smallest rule or example that proves it. If you share the exact problem, I can guide you through it step by step.";
}
function addChatMessage(text, type) { const messages = document.getElementById("chatMessages"); if (!messages) return; const bubble = document.createElement("div"); bubble.className = `chat-bubble ${type}`; bubble.innerHTML = escapeHtml(text).replace(/\n/g, "<br>"); messages.appendChild(bubble); messages.scrollTop = messages.scrollHeight; }
async function askNova(message) {
  addChatMessage(message, "student");
  try {
    const response = await fetch("/api/ai-study", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
    if (response.ok) { const result = await response.json(); if (result.reply) { addChatMessage(result.reply, "nova"); return; } }
  } catch (_) { /* Local demo mode has no AI server yet. */ }
  setTimeout(() => addChatMessage(demoNovaReply(message), "nova"), 450);
}
async function handleLogin() {
  const email = loginForm.querySelector('input[type="email"]').value.trim();
  const password = loginForm.querySelector('input[type="password"]').value;
  if (!email || !password) return setError(loginForm, "Enter your email and password to continue.");
  if (!isFirebaseConfigured) { saveDemoUser(email.split("@")[0], email); closeAuth(); return showToast("Demo login successful. Your session is saved locally."); }
  try {
    const auth = await getFirebaseAuth();
    const { signInWithEmailAndPassword } = firebaseAuthMethods();
    await signInWithEmailAndPassword(auth, email, password);
    closeAuth(); showToast("Welcome back to DOUBTDESK.");
  } catch (error) { setError(loginForm, friendlyAuthError(error)); }
}
async function handleRegister() {
  const inputs = registerForm.querySelectorAll("input");
  const name = inputs[0].value.trim(), email = inputs[1].value.trim(), password = inputs[2].value;
  if (!name || !email || !password) return setError(registerForm, "Complete all fields to create your account.");
  if (!isFirebaseConfigured) { saveDemoUser(name, email); closeAuth(); return showToast("Demo account created. Your session is saved locally."); }
  try {
    const auth = await getFirebaseAuth();
    const { createUserWithEmailAndPassword, updateProfile } = firebaseAuthMethods();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    updateUserName(result.user); closeAuth(); showToast("Account created. Welcome to DOUBTDESK.");
  } catch (error) { setError(registerForm, friendlyAuthError(error)); }
}
async function handleGoogle() {
  if (!isFirebaseConfigured) return showToast("Add Firebase config to enable Google sign-in.");
  try {
    const auth = await getFirebaseAuth();
    const { GoogleAuthProvider, signInWithPopup } = firebaseAuthMethods();
    await signInWithPopup(auth, new GoogleAuthProvider());
    closeAuth(); showToast("Welcome to DOUBTDESK.");
  } catch (error) { setError(loginForm, friendlyAuthError(error)); }
}

document.getElementById("closeAuth").addEventListener("click", closeAuth);
authOverlay.addEventListener("click", event => { if (event.target === authOverlay) closeAuth(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeAuth(); });
document.querySelectorAll(".auth-tab").forEach(button => button.addEventListener("click", () => switchAuth(button.dataset.auth)));
document.querySelectorAll("[data-view]").forEach(link => link.addEventListener("click", event => {
  event.preventDefault(); const view = link.dataset.view; const label = link.textContent.trim().replace(/^[^A-Za-z]+/, "").replace(/\s+\d+$/, "");
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
  document.getElementById("pageTitle").textContent = label; sidebar.classList.remove("open");
  if (view === "home") pageContent.innerHTML = homeMarkup;
  if (view === "courses") pageContent.innerHTML = renderCourses();
  if (view === "notes") pageContent.innerHTML = renderNotes();
  if (view === "meetings") pageContent.innerHTML = renderMeetings();
  if (view === "community") pageContent.innerHTML = renderCommunity();
  if (view === "assistant") pageContent.innerHTML = renderAssistant();
  if (view === "settings") pageContent.innerHTML = renderSettings();
  if (view !== "home" && view !== "courses" && view !== "notes" && view !== "meetings" && view !== "community" && view !== "assistant" && view !== "settings") showToast(`${label} is planned for a later phase.`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}));
document.getElementById("mobileMenu").addEventListener("click", () => sidebar.classList.toggle("open"));
document.getElementById("createButton").addEventListener("click", () => openAuth("register"));
document.getElementById("continueButton").addEventListener("click", () => showToast("Your next lesson is Calculus: Integration basics."));
document.getElementById("loginButton").addEventListener("click", handleLogin);
document.getElementById("registerButton").addEventListener("click", handleRegister);
document.querySelector("#loginForm .social-button").addEventListener("click", handleGoogle);
document.querySelectorAll(".password-field button").forEach(button => button.addEventListener("click", () => { const input = button.previousElementSibling; input.type = input.type === "password" ? "text" : "password"; button.textContent = input.type === "password" ? "Show" : "Hide"; }));
document.querySelectorAll(".button-outline").forEach(button => button.addEventListener("click", () => showToast(`${button.textContent} action will connect to meetings in Phase 4.`)));
document.getElementById("searchTrigger").addEventListener("click", () => showToast("Global search will be connected to courses and notes in Phase 3."));
pageContent.addEventListener("click", event => {
  const courseButton = event.target.closest("[data-course]");
  if (courseButton) { const course = courses.find(item => item.id === courseButton.dataset.course); if (course) { pageContent.innerHTML = renderCourseDetails(course); document.getElementById("pageTitle").textContent = course.title; window.scrollTo({ top: 0, behavior: "smooth" }); } return; }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "back-courses") { pageContent.innerHTML = renderCourses(); document.getElementById("pageTitle").textContent = "My courses"; }
  if (action === "enroll") showToast("Course saved to your learning space.");
  if (action === "lesson") showToast("Lesson viewer will be connected in the next content step.");
  if (action === "new-course") showToast("Course suggestions will be connected to your tutor workspace.");
  if (action === "upload-note") showToast("Note uploads will connect to Firebase Storage in the next step.");
  if (action === "save-settings") { const name = document.getElementById("settingsName")?.value.trim(); if (name) { saveDemoUser(name, demoUser?.email || "student@example.com"); showToast("Your settings were saved."); } }
  if (action === "back-meetings") { pageContent.innerHTML = renderMeetings(); document.getElementById("pageTitle").textContent = "Meetings"; }
  if (action === "host-meeting") showToast("Tutor meeting creation will be connected in the tutor workspace.");
  if (action === "launch-jitsi") launchJitsi(event.target.closest("[data-room]").dataset.room);
  const meetingButton = event.target.closest("[data-meeting]");
  if (meetingButton) { const meeting = meetings.find(item => item.id === meetingButton.dataset.meeting); if (meeting?.type === "Paid") { activeCheckoutMeetingId = meeting.id; pageContent.innerHTML = renderCheckout(meeting); document.getElementById("pageTitle").textContent = "Secure checkout"; window.scrollTo({ top: 0, behavior: "smooth" }); return; } if (meeting) { pageContent.innerHTML = renderMeetingRoom(meeting); document.getElementById("pageTitle").textContent = "Live meeting"; window.scrollTo({ top: 0, behavior: "smooth" }); } }
  const note = event.target.closest("[data-note]");
  if (note) showToast(`Opening ${note.dataset.note}.`);
});
pageContent.addEventListener("click", event => { const filter = event.target.closest("[data-meeting-filter]"); if (filter) { document.querySelectorAll("[data-meeting-filter]").forEach(item => item.classList.remove("active")); filter.classList.add("active"); const type = filter.dataset.meetingFilter; document.querySelectorAll(".meeting-card").forEach(card => { card.hidden = type !== "All" && card.dataset.meetingType !== type; }); } });
pageContent.addEventListener("input", event => {
  if (event.target.id === "courseSearch") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll("#courseGrid .catalog-card").forEach(card => { card.hidden = !card.textContent.toLowerCase().includes(query); });
  }
  if (event.target.id === "noteSearch") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll("#notesList .note-row").forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
  }
});
pageContent.addEventListener("click", event => {
  const filter = event.target.closest("[data-filter]");
  if (filter) { document.querySelectorAll("[data-filter]").forEach(item => item.classList.remove("active")); filter.classList.add("active"); const category = filter.dataset.filter; document.querySelectorAll("#courseGrid .catalog-card").forEach(card => { card.hidden = category !== "All" && !card.textContent.toLowerCase().includes(category.toLowerCase()); }); }
  const noteFilter = event.target.closest("[data-note-filter]");
  if (noteFilter) { document.querySelectorAll("[data-note-filter]").forEach(item => item.classList.remove("active")); noteFilter.classList.add("active"); const type = noteFilter.dataset.noteFilter; document.querySelectorAll("#notesList .note-row").forEach(row => { row.hidden = type !== "All" && !row.textContent.includes(type); }); }
});
pageContent.addEventListener("submit", async event => {
  if (event.target.id === "assistantForm") { event.preventDefault(); const input = event.target.querySelector("input[name=message]"); const message = input.value.trim(); if (message) { input.value = ""; await askNova(message); } return; }
  if (event.target.id === "postForm") { event.preventDefault(); const input = event.target.querySelector("input[name=post]"); const text = input.value.trim(); if (!text) return; const list = document.getElementById("postList"); const post = document.createElement("article"); post.className = "post-card"; post.innerHTML = `<div class="post-head"><div class="avatar avatar-purple">AK</div><div><strong>Alex Kumar</strong><span>Just now · Community</span></div><button class="icon-button">•••</button></div><h3>${escapeHtml(text)}</h3><p>Thanks for starting the conversation. Other learners can reply below.</p><div class="post-actions"><button data-like="0">♡ 0</button><button data-comment="0">◌ 0 replies</button><button>↗ Share</button></div>`; list.prepend(post); input.value = ""; showToast("Your post is live in the community."); return; }
  if (event.target.id !== "checkoutForm") return;
  event.preventDefault();
  const meeting = meetings.find(item => item.id === activeCheckoutMeetingId);
  if (!meeting) return;
  const submit = event.target.querySelector("button[type=submit]"); submit.disabled = true; submit.innerHTML = "Preparing checkout…";
  try {
    const response = await fetch("/api/create-checkout-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ meetingId: meeting.id }) });
    if (response.ok) { const result = await response.json(); if (result.url) return window.location.assign(result.url); }
  } catch (_) { /* Local demo mode has no payment server yet. */ }
  pageContent.innerHTML = renderPaymentSuccess(meeting); document.getElementById("pageTitle").textContent = "Booking confirmed"; window.scrollTo({ top: 0, behavior: "smooth" });
});
pageContent.addEventListener("click", event => {
  const prompt = event.target.closest("[data-prompt]"); if (prompt) { const input = document.querySelector("#assistantForm input[name=message]"); if (input) { input.value = prompt.dataset.prompt; input.focus(); } }
  const like = event.target.closest("[data-like]"); if (like) { const count = Number(like.dataset.like) + 1; like.dataset.like = count; like.textContent = `♥ ${count}`; }
  const comment = event.target.closest("[data-comment]"); if (comment) showToast("Replies will be connected to Firestore in the community backend step.");
});
document.getElementById("logoutButton").addEventListener("click", async () => { if (isFirebaseConfigured) { const auth = await getFirebaseAuth(); await firebaseAuthMethods().signOut(auth); } localStorage.removeItem("doubtdesk-demo-user"); demoUser = null; updateUserName({ displayName: "Alex Kumar", email: "" }); showToast("You have been logged out."); });
if (isFirebaseConfigured) getFirebaseAuth().then(auth => firebaseAuthMethods().onAuthStateChanged(auth, updateUserName)).catch(() => showToast("Firebase could not be reached. Check your configuration."));
if (!isFirebaseConfigured && demoUser) updateUserName({ displayName: demoUser.name, email: demoUser.email });
