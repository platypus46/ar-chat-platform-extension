let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let sttText = document.querySelector("#sttText");


function eraseText() {
  let sttText = document.querySelector("#sttText");
  sttText.setAttribute("value", "");
  sttText.setAttribute("width", "0.7");
}


async function initRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob);
    
    const response = await fetch("/transcribe/", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    
    if (data.transcription) {
      const sttText = document.querySelector("#sttText");
      sttText.setAttribute("value", data.transcription);
      sttText.setAttribute("width", "0.7");
    }
    audioChunks = [];
  };
}

window.addEventListener("DOMContentLoaded", (event) => {
  initRecorder();

  const recordButton = document.getElementById("recordButton");
  const recordText = document.getElementById("recordText");
  const eraserButton = document.getElementById("eraser-button");

  recordButton.addEventListener("click", () => {
    if (isRecording) {
      mediaRecorder.stop();
      recordText.setAttribute("value", "not recording");
      isRecording = false;
    } else {
      mediaRecorder.start();
      recordText.setAttribute("value", "recording...");
      isRecording = true;
    }
  });
  eraserButton.addEventListener("click", eraseText);
});

 // 친구 관련 의사코드
 let friends = [
  { name: "개", conversation: "개 멍 멍" },
  { name: "cat", conversation: "cat meow" },
  { name: "bird", conversation: "bird singing" },
  { name: "lion", conversation: "lion growls" },
  { name: "elephant", conversation: "elephant nose is long" },
  { name: "giraff", conversation: "giraffs neck is long " },
  { name: "bear", conversation: "bear likes honey" },
];

let currentPage = 0;
let selectedIndex = 0;
const itemsPerPage = 5;

function displayFriends() {
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const currentFriends = friends.slice(start, end);

  const friendsContainer = document.getElementById("friendsContainer");
  while (friendsContainer.firstChild) {
    friendsContainer.removeChild(friendsContainer.firstChild);
  }

  currentFriends.forEach((friend, index) => {
    const entity = document.createElement("a-entity");
    entity.setAttribute(
      "text",
      `value: ${friend.name}; color: white; align: center;`
    );
    entity.setAttribute("position", `0 ${0.07 * (2 - index)} 0`); // 위치 조절
    if (index === selectedIndex) {
      entity.setAttribute("text", `color: yellow`); // 선택된 친구
      const animation = document.createElement("a-animation");
      animation.setAttribute("attribute", "material.opacity");
      animation.setAttribute("from", "0.5"); // 시작 투명도 (반투명)
      animation.setAttribute("to", "1"); // 끝 투명도 (완전 불투명)
      animation.setAttribute("dur", "1500"); // 지속 시간 (1초)
      animation.setAttribute("repeat", "indefinite"); // 무한 반복
      animation.setAttribute("direction", "alternate"); // 애니메이션 방향 전환 (어두워졌다 밝아짐)
    }
    friendsContainer.appendChild(entity);
  });
}
function displayConversation() {
  const selectedFriend = friends[currentPage * itemsPerPage + selectedIndex];
  const friendsContainer = document.getElementById("friendsContainer");

  // Clear previous content
  while (friendsContainer.firstChild) {
    friendsContainer.removeChild(friendsContainer.firstChild);
  }

  const conversations = document.createElement("a-entity");
  conversations.setAttribute(
    "text",
    `value: ${selectedFriend.conversation}; color: white; align: center;`
  );
  conversations.setAttribute("position", "0 0 0"); //중앙에 텍스트 배치
  friendsContainer.appendChild(conversations);

  document.getElementById("friendList").setAttribute("visible", "false");
}
window.addEventListener("DOMContentLoaded", function () {
  var arButton = document.querySelector(".a-enter-ar-button");
  if (arButton) {
    arButton.disabled = true;
  }
});