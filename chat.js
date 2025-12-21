import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0R2KYt2MgJHaiYQ9oM8IMXhX9oj-Ky_c",
  authDomain: "anon-chat-de585.firebaseapp.com",
  projectId: "anon-chat-de585",
  storageBucket: "anon-chat-de585.firebasestorage.app",
  messagingSenderId: "1035093625910",
  appId: "1:1035093625910:web:65ba2370a79f73e23b9c97"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const chatArea = document.getElementById("chatArea");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const myName = new URLSearchParams(location.search).get("name") || "名無し";

sendBtn.onclick = async () => {
  const text = messageInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "messages"), {
    name: myName,
    text,
    timestamp: serverTimestamp()
  });

  messageInput.value = "";
};

const msgQuery = query(collection(db, "messages"), orderBy("timestamp"), limit(50));
onSnapshot(msgQuery, snap => {
  chatArea.innerHTML = "";
  snap.forEach(docSnap => {
    const m = docSnap.data();
    const div = document.createElement("div");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = m.name;
    nameSpan.style.color = "blue";
    div.appendChild(nameSpan);
    div.append(`：${m.text}`);

    chatArea.appendChild(div);
  });
  chatArea.scrollTop = chatArea.scrollHeight;
});
