import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0R2KYt2MgJHaiYQ9oM8IMXhX9oj-Ky_c",
  authDomain: "anon-chat-de585.firebaseapp.com",
  projectId: "anon-chat-de585"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// URLパラメータ
const params = new URLSearchParams(location.search);
const userName = params.get("name");
const age = params.get("age");
const sex = params.get("sex");

const roomList = document.getElementById("roomList");
const messagesDiv = document.getElementById("messages");
const currentRoomTitle = document.getElementById("currentRoom");

let currentRoomId = null;
let unsubscribe = null;

// ルーム一覧
onSnapshot(collection(db, "public_rooms"), snap => {
  roomList.innerHTML = "";
  snap.forEach(doc => {
    const li = document.createElement("li");
    li.textContent = doc.data().name;
    li.onclick = () => enterRoom(doc.id, doc.data().name);
    roomList.appendChild(li);
  });
});

// 箱作成
document.getElementById("createRoom").onclick = async () => {
  const name = document.getElementById("roomName").value.trim();
  if (!name) return;

  await addDoc(collection(db, "public_rooms"), {
    name,
    createdAt: serverTimestamp()
  });

  document.getElementById("roomName").value = "";
};

// ルーム入室
function enterRoom(roomId, roomName) {
  currentRoomId = roomId;
  currentRoomTitle.textContent = roomName;
  messagesDiv.innerHTML = "";

  if (unsubscribe) unsubscribe();

  const q = query(
    collection(db, "public_rooms", roomId, "messages"),
    orderBy("createdAt", "asc"),
    limit(50)
  );

  unsubscribe = onSnapshot(q, snap => {
    messagesDiv.innerHTML = "";
    snap.forEach(doc => {
      const d = doc.data();
      const div = document.createElement("div");
      div.textContent = `${d.name} (${d.age}/${d.sex})：${d.text}`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// 送信
document.getElementById("sendBtn").onclick = async () => {
  if (!currentRoomId) return;

  const text = document.getElementById("messageInput").value.trim();
  if (!text) return;

  await addDoc(
    collection(db, "public_rooms", currentRoomId, "messages"),
    {
      name: userName,
      age,
      sex,
      text,
      createdAt: serverTimestamp()
    }
  );

  document.getElementById("messageInput").value = "";
};
