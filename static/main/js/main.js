//scene,UI 객체화
let scene = document.querySelector("a-scene");
let ui = document.getElementById("ui");
// 채팅버튼 객체화
let chatbutton = document.querySelector("#chatbutton");
let button2 = document.querySelector("#button2");
let button3 = document.querySelector("#button3");
//카메라 락 버튼 지정
let cameralock = document.querySelector("#Cameralock");
let camera = document.querySelector("a-camera");
//초기 UI 위치 설정
let initialUIPosition = { x: 0.2, y: 0.1, z: -0.5 };
scene.addEventListener("enter-vr", function () {
  ui.setAttribute("visible", "true");
});

scene.addEventListener("exit-vr", function () {
  ui.setAttribute("visible", "false");
});
function initializeCameraLocking() {
  let lockToCamera = false;
  // cameralock 클릭 리스너 설정
  cameralock.addEventListener("click", function () {
    if (lockToCamera) {
      // UI 고정 해제
      lockToCamera = false;
      // 필요하다면 초기의 다른 위치나 상태로 UI를 복원
      ui.setAttribute(
        "position",
        `${initialUIPosition.x} ${initialUIPosition.y} ${initialUIPosition.z}`
      );
    } else {
      // UI를 카메라 앞에 고정
      attachUIToCamera();
      lockToCamera = true;
    }
  });

  // UI가 카메라에 고정된 상태에서 카메라가 움직일 때 UI 위치 업데이트
  camera.addEventListener("componentchanged", function (evt) {
    if (
      lockToCamera &&
      (evt.detail.name === "rotation" || evt.detail.name === "position")
    ) {
      attachUIToCamera();
    }
  });
}
function attachUIToCamera() {
  const distanceFromCamera = 1;

  let cameraPosition = camera.getAttribute("position");
  let cameraRotation = camera.getAttribute("rotation");

  let theta = (cameraRotation.y * Math.PI) / 180;

  // UI 위치를 계산합니다.
  let newUIPosition = {
    x: cameraPosition.x + distanceFromCamera * Math.sin(theta) + 0.2, // 0.3 값을 조절하여 우측 위치를 조정
    y: cameraPosition.y + 0.2, // 0.3 값을 조절하여 상단 위치를 조정
    z: cameraPosition.z - distanceFromCamera * Math.cos(theta),
  };

  ui.setAttribute(
    "position",
    `${newUIPosition.x} ${newUIPosition.y} ${newUIPosition.z}`
  );
  ui.setAttribute("rotation", `0 ${cameraRotation.y} 0`);
}

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
function initializehideUI() {
  //UI숨김버튼 선언
  let UIhide = document.querySelector("#hideUIButton");
  const initialPosition = "0.35 1 -0.5";
  // 버튼을 클릭할 때마다 UI의 visible 상태를 변경
  UIhide.addEventListener("click", function () {
    if (ui.getAttribute("visible")) {
      // UI가 현재 보이는 상태라면 숨기기
      ui.setAttribute("visible", false);
      pauseUI(ui); // 여기서 pauseUI 함수 호출
    } else {
      // UI가 현재 숨겨진 상태라면 보이게 하기
      ui.setAttribute("visible", true);
      playUI(ui); // 여기서 playUI 함수 호출
      ui.setAttribute("position", initialPosition);
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

scene.addEventListener("loaded", function () {
  var vrButton = document.querySelector(".a-enter-vr-button");
  if (vrButton) {
    vrButton.style.display = "none";
  }

  var arButton = document.querySelector(".a-enter-ar-button");
  if (arButton) {
    arButton.style.width = "150px";
    arButton.style.height = "50px";
    arButton.addEventListener("click", function () {
      ui.setAttribute("visible", "true");
    });
  }

  initializeCameraLocking();
  initializeChatUI();
  initializehideUI();
});
