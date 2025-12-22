const enterBtn = document.getElementById("enterBtn");
const msg = document.getElementById("msg");

enterBtn.onclick = () => {
  const name = document.getElementById("name").value.trim();
  const age = document.getElementById("age").value.trim();
  const sex = document.getElementById("sex").value.trim();

  if (!name || !age || !sex) {
    msg.textContent = "すべて入力してください";
    return;
  }

  location.href =
    `chat.html?name=${encodeURIComponent(name)}&age=${age}&sex=${encodeURIComponent(sex)}`;
};
