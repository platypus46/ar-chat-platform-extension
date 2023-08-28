document.addEventListener("DOMContentLoaded", function () {
  //scene,UI 객체화
  let scene = document.querySelector("a-scene");
  let ui = document.getElementById("ui");
  // 채팅버튼 객체화
  let chatbutton = document.querySelector("#chatbutton");
  let button2 = document.querySelector("#button2");
  let button3 = document.querySelector("#button3");

  let friend = document.querySelector("#friend");
  let profile = document.querySelector("#profile");

  let Text = document.querySelector("#Text");
  let talkpad = document.querySelector("#talkpad");

  //초기 UI 위치 설정
  let initialUIPosition = { x: 0.2, y: 0.13, z: -0.5 };
  let currentUIPosition = {
    x: 0.2, // 초기 x 좌표
    y: 0.13, // 초기 y 좌표
    z: -0.5, // 초기 z 좌표
  };
  //움직임 숫자 지정
  const moveAmount = 0.1;
  //HiduUI객체화
  let hideUI = document.querySelector("#hideUIButton");
  //동작패드
  let xypad = document.querySelector("#xypad");
  let zpad = document.querySelector("#zpad");

  //텍스트 입력 및 지우기 버튼
  let p_pad = document.querySelector("#p-pad");

  //채팅,UI 시각화 관련 변수 전역화
  let isUIVisible = true;
  let isChatVisible = false;

  scene.addEventListener("enter-vr", function () {
    ui.setAttribute("visible", "true");
  });
  scene.addEventListener("exit-vr", function () {
    ui.setAttribute("visible", "false");
    hideUI.setAttribute("visible", "false");
    xypad.setAttribute("visible", "false");
    zpad.setAttribute("visible", "false");
    sttText.setAttribute("visible", "false");
    talkpad.setAttribute("visible", "false");
    p_pad.setAttribute("visible", "false");
  });

  function toggleChat() {
    //채팅창 띄우기 및 감추기
    friend.setAttribute("visible", !isChatVisible);
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
    const buttons = [
      "up",
      "down",
      "left",
      "right",
      "forward",
      "backward",
      "recordButton",
      "sttText",
      "recordText",
      "input-button",
      "eraser-button",
    ];
    buttons.forEach((buttonId) => {
      const button = document.getElementById(buttonId);
      button.setAttribute("visible", "false");
    });
  }
  function enableUIButtons() {
    //UI 이동버튼 활성화
    const buttons = [
      "up",
      "down",
      "left",
      "right",
      "forward",
      "backward",
      "recordButton",
      "sttText",
      "recordText",
      "input-button",
      "eraser-button",
    ];
    buttons.forEach((buttonId) => {
      const button = document.getElementById(buttonId);
      button.setAttribute("visible", "true");
      button.addEventListener("click", moveUI);
    });
  }

  function enableChatButtons() {
    //채팅 버튼으로 변환
    const buttonIds = [
      "up",
      "down",
      "left",
      "right",
      "forward",
      "backward",
      "recordButton",
      "sttText",
      "recordText",
      "input-button",
      "eraser-button",
    ];
    buttonIds.forEach((buttonId) => {
      const button = document.getElementById(buttonId);
      button.removeEventListener("click", moveUI);
      button.addEventListener("click", movechat);
      button.setAttribute("visible", "true");
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
      default:
        break;
    }
  }

  function moveUI(event) {
    //3차원 좌표부터 변경(실제 UI 움직이기 전)
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
      default:
        break;
    }
    // 실제 UI의 위치를 변경
    ui.setAttribute("position", positionToString(currentUIPosition));
  }

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
        hideUI.setAttribute("visible", "true");
        xypad.setAttribute("visible", "true");
        zpad.setAttribute("visible", "true");
        talkpad.setAttribute("visible", "true");
        Text.setAttribute("visible", "true");
        p_pad.setAttribute("visible", "true");
        hideUI.setAttribute("visible", "false");
      });
    }
    chatbutton.addEventListener("click", toggleChat);
    hideUI.addEventListener("click", toggleUIVisibility);
    enableUIButtons();
  });

  // 여기서부터 명령어 관련 코드라고 생각하면 됨.
  let sttText = document.querySelector("#sttText");
  let inputButton = document.querySelector("#input-button");

  inputButton.addEventListener("click", function () {
    if (sttText.getAttribute("value") === "초기화") {
      toggleUIVisibility();
    }
  });
  /** 한글 폰트 지정 */
  AFRAME.registerComponent("auto-font", {
    schema: {
      font: { type: "string", default: "" },
      fontImage: { type: "string", default: "" },
    },

    init: function () {
      const scene = document.querySelector("a-scene");

      this.data.font = this.data.font || scene.getAttribute("data-font-json");
      this.data.fontImage =
        this.data.fontImage || scene.getAttribute("data-font-png");

      // 초기 엔터티에 폰트 적용
      this.applyFontToEntities(this.el.querySelectorAll("[text]"));

      // 새로 추가되는 엔터티에 대한 이벤트 리스너
      this.el.sceneEl.addEventListener(
        "child-attached",
        this.childAttached.bind(this)
      );
    },

    pause: function () {
      this.el.sceneEl.removeEventListener(
        "child-attached",
        this.childAttached.bind(this)
      );
    },

    childAttached: function (evt) {
      if (evt.detail.el.hasAttribute("text")) {
        this.applyFontToEntities([evt.detail.el]);
      }
    },

    applyFontToEntities: function (entities) {
      entities.forEach((textEl) => {
        textEl.setAttribute("text", "font", this.data.font);
        textEl.setAttribute("text", "fontImage", this.data.fontImage);
        textEl.setAttribute("text", "shader", "msdf"); // MSDF 쉐이더 적용
      });
    },
  });
});
