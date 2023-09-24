let chatSocket;
let room_name;
let selectedFriend;

const urlParts = window.location.pathname.split("/");
const username = urlParts[urlParts.length - 2];
const ws_protocol = window.location.protocol === "https:" ? "wss://" : "ws://";

let friends = [];

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
  let initialUIPosition = { x: 0.1, y: 0, z: -0.5 };
  let currentUIPosition = {
    x: 0.1, // 초기 x 좌표
    y: 0, // 초기 y 좌표
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

  let pagenation = document.querySelector("#pagenation")

  //채팅,UI 시각화 관련 변수 전역화
  let isUIVisible = true;
  let isChatVisible = false;
  let isMiscVisible = false;

  //페이지 내부 인덱스
  let currentPage = 0;
  let selectedIndex = 0;
  const itemsPerPage = 5;

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
    colorSelectorGroup.setAttribute('visible', "false");
    pagenation.setAttribute("visible","false");
  });

  function toggleChat() {
    if (isMiscVisible) {
      return;
    }

    //채팅창 띄우기 및 감추기
    friend.setAttribute("visible", !isChatVisible);
    button2.setAttribute("visible", isChatVisible);
    Miscbutton.setAttribute("visible", isChatVisible);
    profile.setAttribute("visible", isChatVisible);
    if (isChatVisible === false) {
      selectedIndex = 0;
      enableChatButtons();
      sttText.setAttribute("value", "Chat mode");
      pagenation.setAttribute("visible","true");
      playall(friend);
    } else{
      isMiscVisible=false;
      enableUIButtons();
      sttText.setAttribute("value", "No mode");
      pagenation.setAttribute("visible","false");
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
    if (isChatVisible) {
      return;
    }

    // Misc 화면 띄우기 및 감추기
    misc.setAttribute("visible", !isMiscVisible);
    button2.setAttribute("visible", isMiscVisible);
    chatbutton.setAttribute("visible", isMiscVisible);
    profile.setAttribute("visible", isMiscVisible);

    if (isMiscVisible === false) {
      selectedIndex = 0;
      enableMiscButtons();
      sttText.setAttribute("value", "Misc mode");
      playall(misc);
      pagenation.setAttribute("visible","true");
    } else{
      isChatVisible = false;
      enableUIButtons();
      sttText.setAttribute("value", "No mode");
      pagenation.setAttribute("visible","false");
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
        pagenation.setAttribute("visible","false");
        displayConversation();
        break;
      case "backward":
        const friendsContainer = document.getElementById("friendsContainer");
        while (friendsContainer.firstChild) {
          friendsContainer.removeChild(friendsContainer.firstChild);
        }
        pagenation.setAttribute("visible","true");
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
    const upbutton = document.getElementById("up");
    const downbutton = document.getElementById("down");
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
        downbutton.removeEventListener("click", moveFeature);
        upbutton.removeEventListener("click", moveFeature);
        displayMiscdetail();
        pagenation.setAttribute("visible","false");
        break;
      case "backward":
        const miscContainer = document.getElementById("MiscContainer"); // 수정된 부분
        downbutton.addEventListener("click", moveFeature);
        upbutton.addEventListener("click", moveFeature);
        while (miscContainer.firstChild) {
          miscContainer.removeChild(miscContainer.firstChild);
        }
        displayMisc();
        ui.setAttribute("visible", "true");
        talkpad.setAttribute("visible", "true");
        Text.setAttribute("visible", "true");
        xypad.setAttribute("visible", "true");
        pagenation.setAttribute("visible","true");
        onBackwardButtonClick();
        break;
      default:
        break;
    }
  }

  function displayFriends() {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const currentFriends = friends.slice(start, end);

    const totalPages = Math.ceil(friends.length / itemsPerPage);
    document.getElementById("pageInfo").setAttribute("text", `value: ${currentPage + 1}/${totalPages}; color: white;`);

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
      entity.setAttribute("position", `0 ${0.03 * (5 - index)} 0`); // 위치 조절
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
      // 프로필 사진 추가
      if (friend.profile_picture) {
        const imgEntity = document.createElement("a-image");
        imgEntity.setAttribute("src", friend.profile_picture);
        imgEntity.setAttribute("width", "0.1");
        imgEntity.setAttribute("height", "0.1");
        imgEntity.setAttribute("position", "0.08 0.02 0.015");  // 위치를 조절해야 할 수도 있습니다.

        if (index !== selectedIndex) {
          imgEntity.setAttribute("visible", "false");
        
        }
        entity.appendChild(imgEntity);
      }

      friendsContainer.appendChild(entity);
    });
  }

  THREE.RoundedBoxGeometry = function(width, height, depth, radius){
    var shape = new THREE.Shape();

    shape.moveTo(-width/2 + radius, -height/2);
    shape.lineTo(width/2 - radius, -height/2);
    shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
    shape.lineTo(width/2, height/2 - radius);
    shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    shape.lineTo(-width/2 + radius, height/2);
    shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
    shape.lineTo(-width/2, -height/2 + radius);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

    var extrudeSettings = {
        depth: depth,
        bevelEnabled: false
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  };

  function displayChatMessage(message, sender, positionY) {
    const friendsContainer = document.getElementById("friendsContainer");

    let content = message.substring(message.indexOf(':') + 1).trim();

    // 12글자마다 줄바꿈 추가
    const chunkedContent = [];
    for(let i = 0; i < content.length; i += 12) {
      chunkedContent.push(content.substring(i, i + 12));
    }
    content = chunkedContent.join('\n');

    // 줄바꿈 횟수에 따라 말풍선 높이 조정
    const numberOfLines = chunkedContent.length;
    const height = 0.017 * numberOfLines;

    // 가장 긴 줄의 길이를 기준으로 말풍선의 폭을 결정
    const maxLength = Math.max(...chunkedContent.map(line => line.length));
    const width = 0.01 * maxLength + 0.01;  // 한 글자당 약 0.007 단위 폭을 가정하고 약간의 여유 공간을 추가

    const color = sender === username ? 'blue' : 'yellow';

    const balloonEntity = document.createElement('a-entity');
    const meshMaterial = new THREE.MeshBasicMaterial({ color: color });
    const roundedBoxGeom = new THREE.RoundedBoxGeometry(width, height, 0.01, 0.01, 5); 
    const balloonMesh = new THREE.Mesh(roundedBoxGeom, meshMaterial);

    balloonEntity.setObject3D('mesh', balloonMesh);
    const positionStr = sender === username ? `0.03 ${positionY} 0` : `-0.05 ${positionY} 0`;
    balloonEntity.setAttribute('position', positionStr);

    friendsContainer.appendChild(balloonEntity);

    const textEntity = document.createElement("a-entity");
    textEntity.setAttribute("text", `value: ${content}; color: white; align: center; width: ${width - 0.02};`);  // 텍스트의 폭을 말풍선 폭에 맞춤
    textEntity.setAttribute("position", "0 0 0.01");

    balloonEntity.appendChild(textEntity);
}


  // displayConversation 함수 수정
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

    const messages = selectedFriend.conversation.split("\n").slice(-5);
    messages.forEach((message, index) => {
        // 발신자 이름 추출
        const sender = message.substring(0, message.indexOf(':'));
        displayChatMessage(message, sender, 0.03 * (4 - index));
    });


    document.getElementById("friendList").setAttribute("visible", "false");
  } 

  // 현재대화내역 업데이트 함수 수정
  function updateConversation(conversation) {
    const friendsContainer = document.getElementById("friendsContainer");
    while (friendsContainer.firstChild) {
      friendsContainer.removeChild(friendsContainer.firstChild);
    }

    const messages = conversation.split("\n").slice(-5); // 마지막 5개의 메시지만 가져옴
    messages.forEach((message, index) => {
       // 발신자 이름 추출
       const sender = message.substring(0, message.indexOf(':'));
       displayChatMessage(message, sender, 0.03 * (4 - index));
    });
  }

  const displayMiscFeatures = [
    {
      name: "GPT",
    },
    {
      name: "길이측정",
    },
    {
      name: "포스트잇",
    },
    {
      name: "캘린더",
    },
    // ... 다른 항목들 ...
  ];
  let currentFeaturePage = 0;


  function displayMisc() {
    const start = currentFeaturePage * itemsPerPage;
    const end = start + itemsPerPage;
    const currentdisplayMisc = displayMiscFeatures.slice(start, end); // 수정된 부분
    sttText.setAttribute("value", "misc mode");

    const totalPages = Math.ceil(displayMiscFeatures.length / itemsPerPage);
    document.getElementById("pageInfo").setAttribute("text", `value: ${currentFeaturePage + 1}/${totalPages}; color: white;`);

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
      entity.setAttribute("position", `0 ${0.03 * (2 - index)} 0`);

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
      sttText.setAttribute('value','질문하기')
      GPTQuestion();
      return; // 추가된 부분: GPTQuestion 함수를 실행한 후 함수를 종료
    } else if (selectedFeature.name === "길이측정") {
      lengthMeasurement();
      return;
    } else if(selectedFeature.name === "포스트잇"){
      postIt();
      return;
    }

    // 다른 항목들에 대한 처리 (예: 친구 목록 표시 등)
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
        pagenation.setAttribute("visible","false");
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

    else if (message ==="스크린샷"){
      const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
      const canvas = scene.components.screenshot.getCanvas('perspective');
      const imageDataURL = canvas.toDataURL('image/jpeg', 0.8);
      
      fetch('/save_screenshot/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken 
        },
        body: JSON.stringify({ image: imageDataURL })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Success:', data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }
  });
});