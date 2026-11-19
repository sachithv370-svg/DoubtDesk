import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

let auth;
let firebase;

export async function getFirebaseAuth() {
  if (!isFirebaseConfigured) return null;
  if (auth) return auth;

  const appModule = await import("https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js");
  const authModule = await import("https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js");
  const app = appModule.initializeApp(firebaseConfig);
  auth = authModule.getAuth(app);
  firebase = authModule;
  return auth;
}

export function firebaseAuthMethods() { return firebase; }
export { isFirebaseConfigured };
