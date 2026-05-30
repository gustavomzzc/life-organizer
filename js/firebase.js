// ── Firebase Config ───────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc }
  from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDp08JJxxcIEqFge-KWoZA1lTMtJTl8MtQ",
  authDomain: "life-organizer-123.firebaseapp.com",
  projectId: "life-organizer-123",
  storageBucket: "life-organizer-123.firebasestorage.app",
  messagingSenderId: "287801934711",
  appId: "1:287801934711:web:74af62ad6191f64ba15772"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── Auth ──────────────────────────────────────────────────
export async function loginGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}

export function currentUser() {
  return auth.currentUser;
}

// ── Helpers ───────────────────────────────────────────────
function userDoc(uid) {
  return doc(db, "users", uid);
}

// ── Tasks ─────────────────────────────────────────────────
export async function getTasks() {
  const user = auth.currentUser;
  if (!user) return JSON.parse(localStorage.getItem('tasks') || '[]');
  const snap = await getDoc(userDoc(user.uid));
  return snap.exists() ? (snap.data().tasks || []) : [];
}

export async function saveTasks(tasks) {
  const user = auth.currentUser;
  if (!user) { localStorage.setItem('tasks', JSON.stringify(tasks)); return; }
  await setDoc(userDoc(user.uid), { tasks }, { merge: true });
}

// ── Streak ────────────────────────────────────────────────
export async function getStreak() {
  const user = auth.currentUser;
  if (!user) return JSON.parse(localStorage.getItem('streak_data') || '{"days":[],"count":0}');
  const snap = await getDoc(userDoc(user.uid));
  return snap.exists() ? (snap.data().streak || { days: [], count: 0 }) : { days: [], count: 0 };
}

export async function saveStreak(streak) {
  const user = auth.currentUser;
  if (!user) { localStorage.setItem('streak_data', JSON.stringify(streak)); return; }
  await setDoc(userDoc(user.uid), { streak }, { merge: true });
}

// ── Daily Quote ───────────────────────────────────────────
export async function getDailyQuote() {
  const user = auth.currentUser;
  if (!user) return JSON.parse(localStorage.getItem('daily_quote') || 'null');
  const snap = await getDoc(userDoc(user.uid));
  return snap.exists() ? (snap.data().daily_quote || null) : null;
}

export async function saveDailyQuote(quote) {
  const user = auth.currentUser;
  if (!user) { localStorage.setItem('daily_quote', JSON.stringify(quote)); return; }
  await setDoc(userDoc(user.uid), { daily_quote: quote }, { merge: true });
}

// ── Profile ───────────────────────────────────────────────
export async function getProfile() {
  const user = auth.currentUser;
  if (!user) return {};
  const snap = await getDoc(userDoc(user.uid));
  const saved = snap.exists() ? (snap.data().profile || {}) : {};
  // Preenche com dados do Google se ainda não foram salvos
  if (!saved.name)        saved.name        = user.displayName || '';
  if (!saved.email)       saved.email       = user.email || '';
  if (!saved.googlePhoto) saved.googlePhoto = user.photoURL || null;
  return saved;
}

export async function saveProfile(profile) {
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(userDoc(user.uid), { profile }, { merge: true });
}