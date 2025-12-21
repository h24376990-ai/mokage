const enterBtn = document.getElementById("enterBtn");
const userNameInput = document.getElementById("userName");
const message = document.getElementById("message");

enterBtn.onclick = () => {
  const name = userNameInput.value.trim();
  if (!name) {
    message.textContent = "名前を入力してください";
    return;
  }
  location.href = `chat.html?name=${encodeURIComponent(name)}`;
};
