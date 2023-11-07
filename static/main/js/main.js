//scene,UI 객체화
let scene = document.querySelector("a-scene");
let ui = document.getElementById("ui");
// 채팅버튼 객체화
let chatbutton = document.querySelector("#chatbutton");
let button2 = document.querySelector("#button2");
let button3 = document.querySelector("#button3");

//내부 객체 오브넥트화
let friend = document.querySelector("#friend");
let profile = document.querySelector("#profile");
//초기 UI 위치 설정
const initialUIPosition = { x: 0, y: 0, z: -0.5 };
let currentUIPosition = {
  x: 0, // 초기 x 좌표
  y: 0, // 초기 y 좌표
  z: -0.5, // 초기 z 좌표
};
// 초기 상태에서 AR 버튼을 비활성화
var arButton = document.querySelector(".a-enter-ar-button");
if (arButton) {
  arButton.disabled = true; // 버튼 비활성화
}

//움직임 숫자 지정
const moveAmount = 0.1;
//HiduUI객체화
let hideUI = document.querySelector("#hideUIButton");
//동작패드
let xypad = document.querySelector("#xypad");
let zpad = document.querySelector("#zpad");
//채팅,UI 시각화 관련 변수 전역화
let isUIVisible = true;
let isChatVisible = false;

scene.addEventListener("enter-vr", function () {
  ui.setAttribute("visible", "true");
});

scene.addEventListener("exit-vr", function () {
  ui.setAttribute("visible", "false");
});
function toggleChat() {
  //채팅창 띄우기 및 감추기
  chat.setAttribute("visible", !isChatVisible);
  button2.setAttribute("visible", isChatVisible);
  button3.setAttribute("visible", isChatVisible);
  profile.setAttribute("visible", isChatVisible);
  if (isChatVisible == false) {
    enableChatButtons();
  } else {
    enableUIButtons();
  }
  isChatVisible = !isChatVisible;
  if (isChatVisible) {
    displayFriends();
  }
}
function toggleUIVisibility() {
  //UI전체 숨김 및 노출
  if (isUIVisible) {
    pauseall(ui);
    disableUIButtons();
    hideUI.setAttribute("visible", "true");
  } else {
    playall(ui);
    enableUIButtons();
    hideUI.setAttribute("visible", "false");
    ui.setAttribute("position", positionToString(initialUIPosition));
  }
  ui.setAttribute("visible", !isUIVisible);
  isUIVisible = !isUIVisible;
}

function pauseall(entity) {
  // 엔티티와 그 자식들을 일시 중지
  entity.pause();
  let children = entity.children;
  for (let i = 0; i < children.length; i++) {
    children[i].pause();
  }
}

function playall(entity) {
  // 엔티티와 그 자식들을 재개
  entity.play();
  let children = entity.children;
  for (let i = 0; i < children.length; i++) {
    children[i].play();
  }
}
function positionToString(position) {
  //포지션 환원 함수
  return `${position.x} ${position.y} ${position.z}`;
}
function disableUIButtons() {
  //UI 이동버튼 무력화
  const buttons = ["up", "down", "left", "right", "forward", "backward"];
  buttons.forEach((buttonId) => {
    const button = document.getElementById(buttonId);
    button.removeEventListener("click", moveUI);
    button.setAttribute("material", "opacity", 0);
  });
}

function enableUIButtons() {
  //UI 이동버튼 활성화
  const buttons = ["up", "down", "left", "right", "forward", "backward"];
  buttons.forEach((buttonId) => {
    const button = document.getElementById(buttonId);
    button.addEventListener("click", moveUI);
    // movechat 이벤트 리스너가 있으면 제거
    button.removeEventListener("click", movechat);
    button.setAttribute("material", "opacity", 1.0);
  });
}
function enableChatButtons() {
  //채팅 버튼으로 변환
  const buttonIds = ["up", "down", "left", "right", "forward", "backward"];
  buttonIds.forEach((buttonId) => {
    const button = document.getElementById(buttonId);
    button.removeEventListener("click", moveUI);
    button.addEventListener("click", movechat);
    button.setAttribute("material", "opacity", 0.5);
  });
}

function movechat(event) {
  switch (event.target.id) {
    case "up":
      if (selectedIndex > 0) {
        selectedIndex--;
        displayFriends();
      }
      break;
    case "down":
      if (selectedIndex < itemsPerPage - 1) {
        selectedIndex++;
        displayFriends();
      }
      break;
    case "left":
      if (currentPage > 0) {
        currentPage--;
        displayFriends();
      }
      break;
    case "right":
      if ((currentPage + 1) * itemsPerPage < friends.length) {
        currentPage++;
        displayFriends();
      }
      break;
    case "forward":
      displayConversation();
      break;
    case "backward":
      const friendsContainer = document.getElementById("friendsContainer");
      while (friendsContainer.firstChild) {
        friendsContainer.removeChild(friendsContainer.firstChild);
      }
      displayFriends();
      break;
  }
}
function moveUI(event) {
  const direction = event.target.id;
  switch (direction) {
    case "up":
      currentUIPosition.y += moveAmount;
      break;
    case "down":
      currentUIPosition.y -= moveAmount;
      break;
    case "left":
      currentUIPosition.x -= moveAmount;
      break;
    case "right":
      currentUIPosition.x += moveAmount;
      break;
    case "forward":
      currentUIPosition.z -= moveAmount;
      break;
    case "backward":
      currentUIPosition.z += moveAmount;
      break;
  }

  ui.setAttribute("position", positionToString(currentUIPosition));
}
// 친구 관련 의사코드
const friends = [
  { name: "dog", conversation: "dog bark bark" },
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
const MAX_WIDTH = 0.4; 
const MAX_HEIGHT = 0.35; 
const LINE_HEIGHT = 0.08; 

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
    entity.setAttribute("position", `0 ${0.07 * (2 - index)} 0`); 
    if (index === selectedIndex) {
      entity.setAttribute("text", `color: yellow`);
    }
    friendsContainer.appendChild(entity);
  });
}
function displayConversation() {
  const selectedFriend = friends[currentPage * itemsPerPage + selectedIndex];
  const friendsContainer = document.getElementById("friendsContainer");

  while (friendsContainer.firstChild) {
    friendsContainer.removeChild(friendsContainer.firstChild);
  }

  const conversations = document.createElement("a-entity");
  conversations.setAttribute(
    "text",
    `value: ${selectedFriend.conversation}; color: white; align: center;`
  );
  conversations.setAttribute("position", "0 0 0"); 
  friendsContainer.appendChild(conversations);

  document.getElementById("friendList").setAttribute("visible", "false");
}

scene.addEventListener("loaded", function () {
  var loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }

  var vrButton = document.querySelector(".a-enter-vr-button");
  if (vrButton) {
    vrButton.style.display = "none";
  }

  var arButton = document.querySelector(".a-enter-ar-button");
  if (arButton) {
    arButton.style.width = "150px";
    arButton.style.height = "50px";
    arButton.disabled = false; 
    arButton.addEventListener("click", function () {
      ui.setAttribute("visible", "true");
      hideUI.setAttribute("visible", "true");
      xypad.setAttribute("visible", "true");
      zpad.setAttribute("visible", "true");
    });
  }
  chatbutton.addEventListener("click", toggleChat);
  hideUI.addEventListener("click", toggleUIVisibility);
  enableUIButtons();
});
