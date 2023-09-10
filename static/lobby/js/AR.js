let chatSocket;
let room_name;
let selectedFriend;

const urlParts = window.location.pathname.split("/");
const username = urlParts[urlParts.length - 2];
const ws_protocol = window.location.protocol === "https:" ? "wss://" : "ws://";

let friends = [];

let dotEntity = null;
let lineEntity = null;
let lineMaterial = null;
let isFirstMeasurement = true;

let measureEventListener;
let eraserEventListener;

function createDot(scene, position) {
  dotEntity = document.createElement("a-sphere");
  dotEntity.setAttribute("radius", 0.01);
  dotEntity.setAttribute("color", "black");
  dotEntity.setAttribute("position", position);
  scene.appendChild(dotEntity);
}

function createLine(scene, start, end) {
  lineEntity = document.createElement("a-entity");
  lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const points = [];
  points.push(new THREE.Vector3(start.x, start.y, start.z));
  points.push(new THREE.Vector3(end.x, end.y, end.z));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, lineMaterial);
  lineEntity.setObject3D("mesh", line);
  scene.appendChild(lineEntity);
}

function updateLine(start, end) {
  const points = [];
  points.push(new THREE.Vector3(start.x, start.y, start.z));
  points.push(new THREE.Vector3(end.x, end.y, end.z));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  lineEntity.getObject3D("mesh").geometry = geometry;
}

function calculateDistance(start, end) {
  return start.distanceTo(end) * 100;
}

document.addEventListener("DOMContentLoaded", function () {
  //scene,UI 객체화
  let scene = document.querySelector("a-scene");
  let ui = document.getElementById("ui");
  // 채팅버튼 객체화
  let chatbutton = document.querySelector("#chatbutton");
  let button2 = document.querySelector("#button2");
  let Miscbutton = document.querySelector("#Miscbutton");

  let friend = document.querySelector("#friend");
  let profile = document.querySelector("#profile");
  let misc = document.querySelector("#Misc");

  let Text = document.querySelector("#Text");
  let talkpad = document.querySelector("#talkpad");

  //초기 UI 위치 설정
  let initialUIPosition = { x: 0.2, y: 0.15, z: -0.45 };
  let currentUIPosition = {
    x: 0.2, // 초기 x 좌표
    y: 0.15, // 초기 y 좌표
    z: -0.45, // 초기 z 좌표
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
  let isMiscVisible = false;

  //페이지 내부 인덱스
  let currentPage = 0;
  let selectedIndex = 0;
  const itemsPerPage = 5;

  let measureButton;
  let eraserButton;
  let measureEventListener;
  let eraserEventListener;

  function initializeFriends() {
    // Ajax를 이용해 서버에서 친구 목록과 대화를 가져옴
    fetch("/get_friends_and_conversations/")
      .then((response) => response.json())
      .then((data) => {
        friends = data.friends;
        displayFriends(); // 친구 목록을 화면에 표시
      });
  }

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
    Miscbutton.setAttribute("visible", isChatVisible);
    profile.setAttribute("visible", isChatVisible);
    if (isChatVisible === false && isMiscVisible === false) {
      enableChatButtons();
      sttText.setAttribute("value", "Chat mode");
      playall(friend);
    } else if (isChatVisible == true) {
      enableUIButtons();
      sttText.setAttribute("value", "No mode");
      pauseall(friend);
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
  function toggleMisc() {
    // Misc 화면 띄우기 및 감추기
    misc.setAttribute("visible", !isMiscVisible);
    button2.setAttribute("visible", isMiscVisible);
    chatbutton.setAttribute("visible", isMiscVisible);
    profile.setAttribute("visible", isMiscVisible);

    if (isMiscVisible === false && isChatVisible === false) {
      enableMiscButtons();
      sttText.setAttribute("value", "Misc mode");
      playall(misc);
    } else if (isMiscVisible == true) {
      enableUIButtons();
      sttText.setAttribute("value", "No mode");
      pauseall(misc);
    }

    isMiscVisible = !isMiscVisible;

    if (isMiscVisible) {
      displayMisc();
    }
    selectedIndex = 0;
  }
  function pauseall(entity) {
    if (entity.pause) {
      entity.pause();
    }

    let children = entity.children;
    for (let i = 0; i < children.length; i++) {
      pauseall(children[i]); // 재귀적 호출
    }
  }

  function playall(entity) {
    if (entity.play) {
      entity.play();
    }

    let children = entity.children;
    for (let i = 0; i < children.length; i++) {
      playall(children[i]); // 재귀적 호출
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
      button.removeEventListener("click", movechat);
      button.removeEventListener("click", moveFeature);
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
  function enableMiscButtons() {
    //Miscbutton 버튼으로 전환
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
      button.addEventListener("click", moveFeature);
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
        selectedFriend = friends[currentPage * itemsPerPage + selectedIndex];
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
  function moveFeature(event) {
    //부가기능 움직이기
    switch (event.target.id) {
      case "up":
        if (selectedIndex > 0) {
          selectedIndex--;
          displayMisc();
        }
        break;
      case "down":
        if (selectedIndex < itemsPerPage - 1) {
          selectedIndex++;
          displayMisc();
        }
        break;
      case "left":
        if (currentFeaturePage > 0) {
          currentFeaturePage--;
          displayMisc();
        }
        break;
      case "right":
        if (
          (currentFeaturePage + 1) * itemsPerPage <
          displayMiscFeatures.length
        ) {
          // 수정된 부분
          currentFeaturePage++;
          displayMisc();
        }
        break;
      case "forward":
        displayMiscdetail();
        break;
      case "backward":
        const miscContainer = document.getElementById("MiscContainer"); // 수정된 부분
        while (miscContainer.firstChild) {
          miscContainer.removeChild(miscContainer.firstChild);
        }
        displayMisc();
        ui.setAttribute("visible", "true");
        talkpad.setAttribute("visible", "true");
        Text.setAttribute("visible", "true");
        xypad.setAttribute("visible", "true");
        onBackwardButtonClick();
        break;
      default:
        break;
    }
  }

  function displayFriends() {
    selectedIndex = 0;
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
    if (!selectedFriend) {
      console.error("selectedFriend is not set.");
      return;
    }
    selectedFriend = friends[currentPage * itemsPerPage + selectedIndex];
    const friendsContainer = document.getElementById("friendsContainer");
    const friendList = document.getElementById("friendList");

    // friendList가 있는지 확인
    if (friendList) {
      friendList.setAttribute("visible", "false");
    }

    // 이전 내용 지우기
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

  function updateConversation(conversation) {
    const friendsContainer = document.getElementById("friendsContainer");
    while (friendsContainer.firstChild) {
      friendsContainer.removeChild(friendsContainer.firstChild);
    }

    const messages = conversation.split("\n").slice(-5); // 마지막 5개의 메시지만 가져옴
    messages.forEach((message, index) => {
      const newMessageEntity = document.createElement("a-entity");
      newMessageEntity.setAttribute(
        "text",
        `value: ${message}; color: white; align: center;`
      );
      newMessageEntity.setAttribute("position", `0 ${0.07 * (2 - index)} 0`); // 위치 조정
      friendsContainer.appendChild(newMessageEntity);
    });
  }

  const displayMiscFeatures = [
    {
      name: "GPT",
    },
    {
      name: "길이측정",
    },
    // ... 다른 항목들 ...
  ];
  let currentFeaturePage = 0;
  let totalFeaturePages = 0;

  function displayMisc() {
    const start = currentFeaturePage * itemsPerPage;
    const end = start + itemsPerPage;
    const currentdisplayMisc = displayMiscFeatures.slice(start, end); // 수정된 부분
    sttText.setAttribute("value", "misc mode");
    const miscContainer = document.getElementById("MiscContainer");
    while (miscContainer.firstChild) {
      miscContainer.removeChild(miscContainer.firstChild);
    }

    currentdisplayMisc.forEach((feature, index) => {
      const entity = document.createElement("a-entity");
      entity.setAttribute(
        "text",
        `value: ${feature.name}; color: white; align: center;`
      );
      entity.setAttribute("position", `0 ${0.07 * (2 - index)} 0`);

      if (index === selectedIndex) {
        entity.setAttribute("text", `color: yellow`);
        const animation = document.createElement("a-animation");
        animation.setAttribute("attribute", "material.opacity");
        animation.setAttribute("from", "0.5");
        animation.setAttribute("to", "1");
        animation.setAttribute("dur", "1500");
        animation.setAttribute("repeat", "indefinite");
        animation.setAttribute("direction", "alternate");
        entity.appendChild(animation);
      }
      miscContainer.appendChild(entity);
    });
  }

  function displayMiscdetail() {
    const selectedFeature =
      displayMiscFeatures[currentFeaturePage * itemsPerPage + selectedIndex];
    const miscContainer = document.getElementById("MiscContainer");

    while (miscContainer.firstChild) {
      miscContainer.removeChild(miscContainer.firstChild);
    }

    // "GPT" 항목이 선택된 경우
    if (selectedFeature.name === "GPT") {
      GPTQuestion();
      return; // 추가된 부분: GPTQuestion 함수를 실행한 후 함수를 종료
    } else if (selectedFeature.name === "길이측정") {
      lengthMeasurement();
      return;
    }

    // 다른 항목들에 대한 처리 (예: 친구 목록 표시 등)
  }
  let currentQuestionPage = 0;
  let currentAnswerPage = 0;

  function GPTQuestion() {
    let gptsttText = document.querySelector("#sttText");
    let gptinputButton = document.querySelector("#input-button");
    const miscContainer = document.getElementById("MiscContainer");

    const maxCharsPerLine = 20; // 예: 각 줄에 20자까지만 표시
    // 임의의 장문 질문
    let longQuestion = gptsttText.getAttribute("value") || "질문";

    setInterval(function () {
      const newQuestion = gptsttText.getAttribute("value");
      if (longQuestion !== newQuestion) {
        longQuestion = newQuestion;
        const questionPages = paginateText(longQuestion, maxCharsPerLine, 2);
        updateQuestionPage(questionPages);
      }
    }, 500);

    gptinputButton.addEventListener("click", function () {
      fetch("/get_gpt_answer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"), // Django CSRF token
        },
        body: JSON.stringify({ question: longQuestion }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Received data from server:", data); // 추가
          longAnswer = data.answer;
          const answerPages = paginateText(longAnswer, maxCharsPerLine, 5);
          updateAnswerPage(answerPages);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });

    // Django의 CSRF 토큰을 가져오는 함수
    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === name + "=") {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }

    // 임의의 장문 대답
    let longAnswer = "대답";

    // 텍스트를 여러 페이지로 분할하는 함수
    function paginateText(text, charsPerLine, linesPerPage) {
      const words = text.split(" ");
      let lines = [];
      let currentLine = "";

      words.forEach((word) => {
        if ((currentLine + word).length > charsPerLine) {
          lines.push(currentLine.trim());
          currentLine = "";
        }
        currentLine += word + " ";
      });
      if (currentLine) lines.push(currentLine.trim());

      let pages = [];
      for (let i = 0; i < lines.length; i += linesPerPage) {
        pages.push(lines.slice(i, i + linesPerPage).join("\n"));
      }

      return pages;
    }

    const questionPages = paginateText(longQuestion, maxCharsPerLine, 2);
    const answerPages = paginateText(longAnswer, maxCharsPerLine, 5);

    const totalQuestionPages = questionPages.length;
    const totalAnswerPages = answerPages.length;

    // 질문 칸 생성
    const questionEntity = document.createElement("a-entity");
    questionEntity.setAttribute("id", "question-text");
    questionEntity.setAttribute(
      "text",
      `value: ${questionPages[currentQuestionPage]}; color: white; align: center; width: 0.35;`
    );
    questionEntity.setAttribute(
      "geometry",
      "primitive: plane; width: 0.30; height: 0.1"
    );
    questionEntity.setAttribute("position", `-0.025 0.05 0.01`); // z값 조절
    miscContainer.appendChild(questionEntity);

    // 대답 칸 생성
    const answerEntity = document.createElement("a-entity");
    answerEntity.setAttribute("id", "answer");
    answerEntity.setAttribute(
      "text",
      `value: Answer: ${answerPages[currentAnswerPage]}; color: white; align: center; width: 0.35;`
    );
    answerEntity.setAttribute(
      "geometry",
      "primitive: plane; width: 0.30; height: 0.25"
    );
    answerEntity.setAttribute("position", `-0.025 -0.15 0.01`); // 수정된 부분
    miscContainer.appendChild(answerEntity);
    //버튼 만들기 펑션
    function createButton(textValue, position, clickCallback) {
      const buttonEntity = document.createElement("a-entity");
      buttonEntity.setAttribute(
        "geometry",
        "primitive: plane; width: 0.1; height: 0.05"
      );
      buttonEntity.setAttribute("material", "color: #333");
      buttonEntity.setAttribute("position", position);
      buttonEntity.setAttribute("class", "clickable");
      buttonEntity.addEventListener("click", clickCallback);

      const textEntity = document.createElement("a-entity");
      textEntity.setAttribute(
        "text",
        `value: ${textValue}; color: white; align: center; width: 0.5;` // width를 0.09로 조절하여 텍스트 크기를 조정
      );
      textEntity.setAttribute("position", "0 0 0.01"); // Slightly in front of the button plane for visibility
      buttonEntity.appendChild(textEntity);

      return buttonEntity;
    }
    // 질문에 대한 페이지네이션 버튼
    const questionPrevButton = createButton(
      "이전",
      `0.175 0.05 0.01`,
      function () {
        if (currentQuestionPage > 0) {
          currentQuestionPage--;
          updateQuestionPage();
        }
      }
    );
    questionEntity.appendChild(questionPrevButton);

    const questionNextButton = createButton(
      "다음",
      `0.175 -0.05 0.01`,
      function () {
        if (currentQuestionPage < totalQuestionPages - 1) {
          currentQuestionPage++;
          updateQuestionPage();
        }
      }
    );
    questionEntity.appendChild(questionNextButton);

    const answerPrevButton = createButton(
      "이전",
      `0.175 0.05 0.01`,
      function () {
        if (currentAnswerPage > 0) {
          currentAnswerPage--;
          updateAnswerPage();
        }
      }
    );
    answerEntity.appendChild(answerPrevButton);

    const answerNextButton = createButton(
      "다음",
      `0.175 -0.05 0.01`,
      function () {
        if (currentAnswerPage < totalAnswerPages - 1) {
          currentAnswerPage++;
          updateAnswerPage();
        }
      }
    );
    answerEntity.appendChild(answerNextButton);
    // 페이지 업데이트 함수 수정
    function updateQuestionPage(questionPages) {
      const questionEntity = document.getElementById("question-text");
      if (questionEntity) {
        const textComponent = questionEntity.getAttribute("text");
        textComponent.value = questionPages[currentQuestionPage];
        questionEntity.setAttribute("text", textComponent);
      }
    }

    function updateAnswerPage(answerPages) {
      const answerEntity = document.getElementById("answer");
      if (answerEntity) {
        const textComponent = answerEntity.getAttribute("text");
        textComponent.value = "Answer: " + answerPages[currentAnswerPage];
        answerEntity.setAttribute("text", textComponent);
      }
    }
  }

  function lengthMeasurement() {
    ui.setAttribute("visible", "false");
    talkpad.setAttribute("visible", "false");
    xypad.setAttribute("visible", "false");
    console.log("길이측정 활성화");

    let measurementText = document.querySelector("#sttText");
    measurementText.setAttribute("value", "현재 길이: 계산 중...");

    measureButton = document.querySelector("#input-button");
    eraserButton = document.querySelector("#eraser-button");

    const scene = document.querySelector("a-scene");

    measureEventListener = () => {
      const rightHandEntity = document.querySelector("#rightHand");
      if (rightHandEntity) {
        const handTrackingExtras =
          rightHandEntity.components["hand-tracking-extras"];
        if (handTrackingExtras && handTrackingExtras.getJoints) {
          const joints = handTrackingExtras.getJoints();
          if (joints && joints.getIndexTip) {
            const indexTip = joints.getIndexTip();
            const position = new THREE.Vector3();
            indexTip.getPosition(position);

            if (isFirstMeasurement) {
              createDot(scene, position);
              isFirstMeasurement = false;
            } else {
              if (dotEntity && !lineEntity) {
                createLine(scene, dotEntity.getAttribute("position"), position);
              }
              if (lineEntity) {
                updateLine(dotEntity.getAttribute("position"), position);
                const length = calculateDistance(
                  new THREE.Vector3(
                    dotEntity.getAttribute("position").x,
                    dotEntity.getAttribute("position").y,
                    dotEntity.getAttribute("position").z
                  ),
                  position
                );
                measurementText.setAttribute(
                  "value",
                  `현재 길이: ${length.toFixed(2)} cm`
                );
              }
            }
          }
        }
      }
    };

    eraserEventListener = () =>  {
      if (dotEntity) {
        scene.removeChild(dotEntity);
        scene.removeChild(lineEntity);
        dotEntity = null;
        lineEntity = null;
        isFirstMeasurement = true; // Reset the flag
        measurementText.setAttribute("value", "현재 길이: 초기화됨");
      }
    };

    measureButton.addEventListener("click", measureEventListener);
    eraserButton.addEventListener("click", eraserEventListener);
  }

  function onBackwardButtonClick() {
    // 이벤트 리스너 제거
    if (measureButton && measureEventListener) {
      measureButton.removeEventListener("click", measureEventListener);
    }
    if (eraserButton && eraserEventListener) {
      eraserButton.removeEventListener("click", eraserEventListener);
    }

    const scene = document.querySelector("a-scene");
    if (dotEntity) {
      scene.removeChild(dotEntity);
      dotEntity = null;
    }
    if (lineEntity) {
      scene.removeChild(lineEntity);
      lineEntity = null;
    }

    isFirstMeasurement = true;
  }

  window.addEventListener("DOMContentLoaded", function () {
    var arButton = document.querySelector(".a-enter-ar-button");
    if (arButton) {
      arButton.disabled = true;
      fetchFriendsAndConversations();
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
        xypad.setAttribute("visible", "true");
        zpad.setAttribute("visible", "true");
        talkpad.setAttribute("visible", "true");
        Text.setAttribute("visible", "true");
        p_pad.setAttribute("visible", "true");
        hideUI.setAttribute("visible", "false");
        pauseall(friend);
        pauseall(misc);
      });
    }
    chatbutton.addEventListener("click", function () {
      initializeFriends(); // 친구 목록 초기화
      toggleChat();
    });
    hideUI.addEventListener("click", toggleUIVisibility);
    Miscbutton.addEventListener("click", function () {
      toggleMisc();
    });
    enableUIButtons();
  });

  // 여기서부터 명령어 관련 코드라고 생각하면 됨.
  let sttText = document.querySelector("#sttText");
  let inputButton = document.querySelector("#input-button");

  inputButton.addEventListener("click", function () {
    const message = sttText.getAttribute("value");
    // Only run the following logic when the chat page is visible
    if (isChatVisible) {
      if (chatSocket) {
        chatSocket.close();
      }
      if (!selectedFriend) {
        console.error("selectedFriend is undefined.");
        return;
      }

      room_name =
        selectedFriend.username < username
          ? `${selectedFriend.username}_${username}`
          : `${username}_${selectedFriend.username}`;
      chatSocket = new WebSocket(
        ws_protocol + window.location.host + "/ws/chat/" + room_name + "/"
      );

      chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        if (data.message_type === "new_message") {
          // Update the chat in real-time
          selectedFriend.conversation += `\n${data.sender}: ${data.message}`;
          updateConversation(selectedFriend.conversation);
        }
      };

      chatSocket.onclose = function (e) {
        console.error("Chat socket closed unexpectedly");
      };

      chatSocket.onerror = function (e) {
        console.error("Chat socket encountered an error");
      };

      chatSocket.addEventListener("open", function () {
        const sender = username;

        if (message) {
          chatSocket.send(
            JSON.stringify({
              message: message,
              sender: sender,
            })
          );
        }
        selectedFriend.conversation += `\n${data.sender}: ${data.message}`;
        updateConversation(selectedFriend.conversation);
      });
    }

    // "초기화" 메시지 처리
    else if (message === "초기화") {
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
AFRAME.registerComponent("scene-debounced-click", {
  // 클릭 이벤트 중복 방지 코드
  init: function () {
    this.lastClickTime = 0;
    this.debounceDuration = 500; // 500ms

    // 씬에 클릭 이벤트 리스너 추가
    this.el.addEventListener("click", this.handleClick.bind(this));
  },

  handleClick: function (evt) {
    const currentTime = new Date().getTime();

    if (currentTime - this.lastClickTime < this.debounceDuration) {
      // 이전 클릭 이후로 충분한 시간이 지나지 않았으므로 이벤트를 무시합니다.
      evt.stopPropagation(); // 추가 이벤트 처리를 중지
      return;
    }

    this.lastClickTime = currentTime;
  },
});
