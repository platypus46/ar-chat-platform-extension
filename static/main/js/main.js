//scene,UI 객체화
let scene = document.querySelector("a-scene");
let ui = document.getElementById("ui");
// 채팅버튼 객체화
let chatbutton = document.querySelector("#chatbutton");
let button2 = document.querySelector("#button2");
let button3 = document.querySelector("#button3");
//카메라 락 버튼 지정
let cameralock = document.querySelector("#Cameralock");
let camera = document.querySelector("#camera");
let lockToCamera = false;
//초기 UI 위치 설정
let initialUIPosition = { x: 0, y: 0.15, z: -0.5 };
//움직임 숫자 지정
const moveAmount = 0.1;

//동작패드
let xypad = document.querySelector("#xypad");
let zpad = document.querySelector("#zpad");

scene.addEventListener("enter-vr", function () {
  ui.setAttribute("visible", "true");
});

scene.addEventListener("exit-vr", function () {
  ui.setAttribute("visible", "false");
});
function initializeChatUI() {
  // 채팅창 기본 선언
  let chat = document.querySelector("#chat");
  chat.setAttribute("visible", false);
  let isChatVisible = false;
  let profile = document.querySelector("#profile");
  // chatbutton 클릭 리스너 설정
  chatbutton.addEventListener("click", function () {
    if (isChatVisible) {
      // 채팅창이 보이는 상태에서 버튼을 눌렀을 때 원래 상태로 복원
      chat.setAttribute("visible", false); // 채팅창 숨김
      button2.setAttribute("visible", true); // 버튼 2 보이게 함
      button3.setAttribute("visible", true); // 버튼 3 보이게 함
      profile.setAttribute("visible", true); // 프로필 보이게 함
      isChatVisible = false; // 상태 업데이트
    } else {
      // 채팅창이 숨겨진 상태에서 버튼을 눌렀을 때 채팅 UI로 전환
      chat.setAttribute("visible", true); // 채팅창 보이게 함
      button2.setAttribute("visible", false); // 버튼 2 숨김
      button3.setAttribute("visible", false); // 버튼 3 숨김
      profile.setAttribute("visible", false); // 프로필 숨김
      isChatVisible = true; // 상태 업데이트
    }
  });
}
function initializeCameraLocking() {
  // 카메라 락 버튼 클릭 리스너 설정
  cameralock.addEventListener("click", function () {
    if (lockToCamera) {
      // 종속성 해제
      lockToCamera = false;
      ui.removeAttribute("look-at"); // look-at 컴포넌트 제거
      enableUIButtons(); // UI 이동 버튼 활성화
    } else {
      // UI를 카메라를 바라보게 설정
      ui.setAttribute("look-at", "[camera]"); // 카메라의 ID가 'camera'라고 가정
      lockToCamera = true;
      disableUIButtons(); // UI 이동 버튼 비활성화
    }
  });
}
function initializehideUI() {
  //UI숨김버튼 선언
  let UIhide = document.querySelector("#hideUIButton");

  // 버튼을 클릭할 때마다 UI의 visible 상태를 변경
  UIhide.addEventListener("click", function () {
    if (ui.getAttribute("visible")) {
      // UI가 현재 보이는 상태라면 숨기기
      ui.setAttribute("visible", false);
      xypad.setAttribute("visible", false);
      zpad.setAttribute("visible", false);
      pauseUI(ui); // 여기서 pauseUI 함수 호출
      // 만약 lockToCamera가 활성화되어 있다면 해제
      if (lockToCamera) {
        lockToCamera = false;
        ui.removeAttribute("look-at"); // look-at 컴포넌트 제거
        enableUIButtons(); // UI 이동 버튼 활성화
      }
    } else {
      // UI가 현재 숨겨진 상태라면 보이게 하기
      ui.setAttribute("visible", true);
      xypad.setAttribute("visible", true);
      zpad.setAttribute("visible", true);
      playUI(ui); // 여기서 playUI 함수 호출
      ui.setAttribute("position", positionToString(initialUIPosition));
    }
  });
}
function pauseUI(entity) {
  // 엔티티와 그 자식들을 일시 중지
  entity.pause();
  let children = entity.children;
  for (let i = 0; i < children.length; i++) {
    children[i].pause();
  }
}

function playUI(entity) {
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
    button.setAttribute("material", "opacity", 0.5);
  });
}

function enableUIButtons() {
  //UI 이동버튼 활성화
  const buttons = ["up", "down", "left", "right", "forward", "backward"];
  buttons.forEach((buttonId) => {
    const button = document.getElementById(buttonId);
    button.addEventListener("click", moveUI);
    button.setAttribute("material", "opacity", 1.0);
  });
}
function moveUI(event) {
  const direction = event.target.id;
  const currentPosition = ui.getAttribute("position");
  switch (direction) {
    case "up":
      ui.setAttribute("position", {
        x: currentPosition.x,
        y: currentPosition.y + moveAmount,
        z: currentPosition.z,
      });
      break;
    case "down":
      ui.setAttribute("position", {
        x: currentPosition.x,
        y: currentPosition.y - moveAmount,
        z: currentPosition.z,
      });
      break;
    case "left":
      ui.setAttribute("position", {
        x: currentPosition.x - moveAmount,
        y: currentPosition.y,
        z: currentPosition.z,
      });
      break;
    case "right":
      ui.setAttribute("position", {
        x: currentPosition.x + moveAmount,
        y: currentPosition.y,
        z: currentPosition.z,
      });
      break;
    case "forward":
      ui.setAttribute("position", {
        x: currentPosition.x,
        y: currentPosition.y,
        z: currentPosition.z - moveAmount,
      });
      break;
    case "backward":
      ui.setAttribute("position", {
        x: currentPosition.x,
        y: currentPosition.y,
        z: currentPosition.z + moveAmount,
      });
      break;
  }
}
window.addEventListener("DOMContentLoaded", function () {
  var arButton = document.querySelector(".a-enter-ar-button");
  if (arButton) {
    arButton.disabled = true;
  }
});
scene.addEventListener("loaded", function () {
  // 로딩 스크린 숨기기
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
    arButton.disabled = false; // 버튼 활성화
    arButton.addEventListener("click", function () {
      ui.setAttribute("visible", "true");
    });
  }
  initializeCameraLocking();
  initializeChatUI();
  initializehideUI();
  enableUIButtons();
});
