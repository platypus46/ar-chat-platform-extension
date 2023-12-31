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
  let ui_info = document.getElementById("ui-info");
  // 채팅버튼 객체화
  let chatbutton = document.querySelector("#chatbutton");
  let Miscbutton = document.querySelector("#Miscbutton");

  let friend = document.querySelector("#friend");
  let profile = document.querySelector("#profile");
  let misc = document.querySelector("#Misc");

  let Text = document.querySelector("#Text");
  let talkpad = document.querySelector("#talkpad");
  let roundBox = document.querySelector("#roundBox");
  let talkUIbox = document.querySelector("#talkUIbox");
  let talkToolbar = document.querySelector("#talkToolbar");

  let specialCharacters = document.querySelector("#specialCharacters");
  let charPagerToolbar = document.querySelector("#charPagerToolbar");
  let currentPosition = charPagerToolbar .getAttribute("position");
  let spaceBar = document.querySelector("#spaceBar");

  let emojiButton =  document.querySelector("#emojiButton");
  let emojiToolbar = document.querySelector("#emojiPagerToolbar");
  let chatText = document.querySelector("#chatbutton a-text");
  let miscText = document.querySelector("#Miscbutton a-text");

  const entreeImage = document.querySelector('#entreeImage');
  const undoImage = document.querySelector('#undoImage');

  const forwardImage = document.querySelector('#forwardImage');
  const backwardImage = document.querySelector('#backwardImage');

  specialCharacters.addEventListener('click', function() {
    emojiToolbar.setAttribute('visible', false);
    charPagerToolbar.setAttribute('visible', !charPagerToolbar.getAttribute('visible'));
    
    updateToolbarPositions();
    updateSpaceBarVisibility();
    updateToolbarAccessibility();
  });

  emojiButton.addEventListener('click', function() {
    charPagerToolbar.setAttribute('visible', false);
    emojiToolbar.setAttribute('visible', !emojiToolbar.getAttribute('visible'));
    
    updateToolbarPositions();
    updateSpaceBarVisibility();
    updateToolbarAccessibility();
  });

  function updateToolbarPositions() {
    charPagerToolbar.setAttribute("position", {x: currentPosition.x, y: currentPosition.y, z: charPagerToolbar.getAttribute('visible') ? 0.012 : 0.009});
    emojiToolbar.setAttribute("position", {x: currentPosition.x, y: currentPosition.y, z: emojiToolbar.getAttribute('visible') ? 0.012 : 0.009});
  }

  function updateSpaceBarVisibility() {
    spaceBar.setAttribute('visible', !charPagerToolbar.getAttribute('visible') && !emojiToolbar.getAttribute('visible'));
  }

  function updateToolbarAccessibility() {
    canClickCharPagerButtons = charPagerToolbar.getAttribute('visible');
    canClickEmojiPagerButtons = emojiToolbar.getAttribute('visible');
    canClickSpaceBar = !canClickCharPagerButtons && !canClickEmojiPagerButtons;
  }


  language_mode.addEventListener("click", function() {
    if (currentLanguage === "ko-kr") {
        currentLanguage = "en";
        language_text.setAttribute("value", "EN");

        // 항목 이름을 영어로 변경
        displayMiscFeatures[0].name = "Questions and Answers(AR)";
        displayMiscFeatures[1].name = "Length Measurement";
        displayMiscFeatures[2].name = "Post-It";

        // 버튼 텍스트를 영어로 변경
        chatText.setAttribute("value", "chat");
        miscText.setAttribute("value", "misc");

        document.querySelector("#input-button a-text").setAttribute("value", "INPUT");
        document.querySelector("#eraser-button a-text").setAttribute("value", "DEL");
        document.querySelector("#friendHeader a-entity").setAttribute("troika-text", "value: Friends List; font: /static/lobby/font/NanumGothic-Bold.ttf; fontSize: 0.015; color: black;");
    } else {
        currentLanguage = "ko-kr";
        language_text.setAttribute("value", "KR");

        // 항목 이름을 한국어로 변경
        displayMiscFeatures[0].name = "질문하기";
        displayMiscFeatures[1].name = "길이 측정";
        displayMiscFeatures[2].name = "포스트잇";

        // 버튼 텍스트를 한국어로 변경
        chatText.setAttribute("value", "채팅");
        miscText.setAttribute("value", "기타 도구");

        document.querySelector("#input-button a-text").setAttribute("value", "입력");
        document.querySelector("#eraser-button a-text").setAttribute("value", "삭제");
        document.querySelector("#friendHeader a-entity").setAttribute("troika-text", "value: 친구목록; font: /static/lobby/font/NanumGothic-Bold.ttf; fontSize: 0.015; color: black;");
    }
  });

  
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
    roundBox.setAttribute("visible", "true");
    talkToolbar.setAttribute("visible", "true");
    talkUIbox.setAttribute("visible", "true");
  });
  scene.addEventListener("exit-vr", function () {
    ui.setAttribute("visible", "false");
    hideUI.setAttribute("visible", "false");
    xypad.setAttribute("visible", "false");
    zpad.setAttribute("visible", "false");
    sttText.setAttribute("visible", "false");
    roundBox.setAttribute("visible", "false");
    talkToolbar.setAttribute("visible", "false");
    talkUIbox.setAttribute("visible", "false");
    talkpad.setAttribute("visible", "false");
    p_pad.setAttribute("visible", "false");
    colorSelectorGroup.setAttribute('visible', "false");
    pagenation.setAttribute("visible","false");
    ui_info.setAttribute("visible","false");
  });

  function toggleChat() {
    if (isMiscVisible) {
      return;
    }
    entreeImage.setAttribute("visible", !isChatVisible);
    undoImage.setAttribute("visible", !isChatVisible);

    forwardImage.setAttribute("visible", isChatVisible);
    backwardImage.setAttribute("visible", isChatVisible);

    //채팅창 띄우기 및 감추기
    friend.setAttribute("visible", !isChatVisible);
    Miscbutton.setAttribute("visible", isChatVisible);
    profile.setAttribute("visible", isChatVisible);
    if (isChatVisible === false) {
      selectedIndex = 0;
      enableChatButtons();
      sttText.setAttribute("troika-text","value", "Chat mode");
      pagenation.setAttribute("visible","true");
      ui_info.setAttribute("visible","false");
      playall(friend);
    } else{
      isMiscVisible=false;
      if (currentLanguage === "ko-kr") {
        document.querySelector("#friendHeader a-entity").setAttribute("troika-text", "value: 친구목록; font: /static/lobby/font/NanumGothic-Bold.ttf; fontSize: 0.015; color: black;");
      } else {
        document.querySelector("#friendHeader a-entity").setAttribute("troika-text", "value: Friends List; font: /static/lobby/font/NanumGothic-Bold.ttf; fontSize: 0.015; color: black;");
      }
      enableUIButtons();
      sttText.setAttribute("troika-text","value", "No mode");
      pagenation.setAttribute("visible","false");
      ui_info.setAttribute("visible","true");
      pauseall(friend);
    }
    isChatVisible = !isChatVisible;
    if (isChatVisible) {
      displayFriends();
    }
  }
  function toggleUIVisibility() {
    //시연을 위한 임시 코드
    if(isMiscVisible){
      toggleMisc();
    }

    if(isChatVisible){
      toggleChat();
    }


    //UI전체 숨김 및 노출
    if (isUIVisible) {
      pauseall(ui);
      disableUIButtons();
    } else {
      playall(ui);
      enableUIButtons();
      ui.setAttribute("position", positionToString(initialUIPosition));
    }
    ui.setAttribute("visible", !isUIVisible);
    isUIVisible = !isUIVisible;
  }

  function toggleMisc() {
    if (isChatVisible) {
      return;
    }
    entreeImage.setAttribute("visible", !isMiscVisible);
    undoImage.setAttribute("visible", !isMiscVisible);

    forwardImage.setAttribute("visible", isMiscVisible);
    backwardImage.setAttribute("visible", isMiscVisible);

    // Misc 화면 띄우기 및 감추기
    misc.setAttribute("visible", !isMiscVisible);
    chatbutton.setAttribute("visible", isMiscVisible);
    profile.setAttribute("visible", isMiscVisible);

    if (isMiscVisible === false) {
      selectedIndex = 0;
      enableMiscButtons();
      sttText.setAttribute("troika-text", "value", "Misc Mode");
      ui_info.setAttribute("visible","false");
      playall(misc);
      pagenation.setAttribute("visible","true");
    } else{
      isChatVisible = false;
      enableUIButtons();
      sttText.setAttribute("troika-text", "value", "No mode");
      ui_info.setAttribute("visible","true");
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
    ];
    buttons.forEach((buttonId) => {
      const button = document.getElementById(buttonId);
      button.setAttribute("visible", "false");
    });

    const uiButtons = document.querySelectorAll("#uibuttons .clickable");
    uiButtons.forEach(button => {
        button.classList.remove("clickable");
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
    ];
    buttons.forEach((buttonId) => {
      const button = document.getElementById(buttonId);
      button.setAttribute("visible", "true");
      button.removeEventListener("click", movechat);
      button.removeEventListener("click", moveFeature);
      button.addEventListener("click", moveUI);
    });

    const uiButtons = document.querySelectorAll("#uibuttons a-entity");
    uiButtons.forEach(button => {
        button.classList.add("clickable");
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
        selectedIndex = 0;
        if (currentPage > 0) {
          currentPage--;
          displayFriends();
        }
        break;
      case "right":
        selectedIndex = 0;
        if (currentPage < Math.ceil(friends.length / itemsPerPage) - 1) {
          currentPage++;
          displayFriends();
        }
        break;
      case "forward":
        selectedFriend = friends[currentPage * itemsPerPage + selectedIndex];
        pagenation.setAttribute("visible","false");
        displayConversation();
        if (currentLanguage === "ko-kr") {
          document.querySelector("#friendHeader a-entity").setAttribute("troika-text", "value: 1:1 채팅; font: /static/lobby/font/NanumGothic-Bold.ttf; fontSize: 0.015; color: black;");
        } else {
          document.querySelector("#friendHeader a-entity").setAttribute("troika-text", "value: 1:1 Chatting; font: /static/lobby/font/NanumGothic-Bold.ttf; fontSize: 0.015; color: black;");
        }
        break;
      case "backward":
        const friendsContainer = document.getElementById("friendsContainer");
        while (friendsContainer.firstChild) {
          friendsContainer.removeChild(friendsContainer.firstChild);
        }
        pagenation.setAttribute("visible","true");
        ui_info.setAttribute("visible","false");
        chatToolBox.setAttribute('visible', 'false');
        displayFriends();

        if (currentLanguage === "ko-kr") {
          document.querySelector("#friendHeader a-entity").setAttribute("troika-text", "value: 친구목록; font: /static/lobby/font/NanumGothic-Bold.ttf; fontSize: 0.015; color: black;");
        } else {
          document.querySelector("#friendHeader a-entity").setAttribute("troika-text", "value: Friends List; font: /static/lobby/font/NanumGothic-Bold.ttf; fontSize: 0.015; color: black;");
        }

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
        ui_info.setAttribute("visible","false");

        if (!isBoxVisible) {
          subTextbar.setAttribute("troika-text","value","Misc Mode");
          }
        else {
          subTextbar.setAttribute("troika-text","value", "");
        }
        
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

    // 세로선 높이를 전역 변수로 설정
    const verticalLineHeight = 0.002;

    currentFriends.forEach((friend, index) => {
      const entity = document.createElement("a-entity");
      entity.setAttribute(
        "text",
        `value: ${friend.name}; color: white; align: center;`
      );

      // 위치 계산 수정
      let positionY = 0.15 - (index * 0.03);
      entity.setAttribute("position", `0 ${positionY} 0`);

      if (index === selectedIndex) {
        entity.setAttribute("text", `color: yellow`); // 선택된 친구
        const animation = document.createElement("a-animation");
        animation.setAttribute("attribute", "material.opacity");
        animation.setAttribute("from", "0.5"); // 시작 투명도 (반투명)
        animation.setAttribute("to", "1"); // 끝 투명도 (완전 불투명)
        animation.setAttribute("dur", "1500"); // 지속 시간 (1.5초)
        animation.setAttribute("repeat", "indefinite"); // 무한 반복
        animation.setAttribute("direction", "alternate"); // 애니메이션 방향 전환 (어두워졌다 밝아짐)
        entity.appendChild(animation);
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

      // 가로선, 세로선 및 아래 뚜껑 추가
      if (index === 0 || index === currentFriends.length - 1 || currentFriends.length === 1) {
        const lineEntity = document.createElement("a-box");
        lineEntity.setAttribute("height", "0.002");
        lineEntity.setAttribute("width", "0.13");
        lineEntity.setAttribute("depth", "0.01");
        lineEntity.setAttribute("color", "white");
        lineEntity.setAttribute("position", `0 ${positionY + (index === 0 ? 0.016 : -0.016)} 0`);
        friendsContainer.appendChild(lineEntity);

        for (let i = -1; i <= 1; i += 2) {
          const verticalLineEntity = document.createElement("a-box");
          verticalLineEntity.setAttribute("height", verticalLineHeight);
          verticalLineEntity.setAttribute("width", "0.002");
          verticalLineEntity.setAttribute("depth", "0.01");
          verticalLineEntity.setAttribute("color", "white");
          verticalLineEntity.setAttribute("position", `${0.055 * i} ${positionY + (index === 0 ? 0.016 : -0.016)} 0`);
          friendsContainer.appendChild(verticalLineEntity);
        }
      }

      if (index < currentFriends.length - 1) {
        const lineEntity = document.createElement("a-box");
        lineEntity.setAttribute("height", "0.002");
        lineEntity.setAttribute("width", "0.13");
        lineEntity.setAttribute("depth", "0.01");
        lineEntity.setAttribute("color", "white");
        lineEntity.setAttribute("position", `0 ${positionY - 0.016} 0`);
        friendsContainer.appendChild(lineEntity);

        const verticalLineHeightBetween = 0.06;
        for (let i = -1; i <= 1; i += 2) {
          const verticalLineEntity = document.createElement("a-box");
          verticalLineEntity.setAttribute("height", verticalLineHeightBetween);
          verticalLineEntity.setAttribute("width", "0.004");
          verticalLineEntity.setAttribute("depth", "0.01");
          verticalLineEntity.setAttribute("color", "white");
          verticalLineEntity.setAttribute("position", `${0.065 * i} ${positionY - 0.016} 0`);
          friendsContainer.appendChild(verticalLineEntity);
        }
      }

      if (currentFriends.length === 1 && index === 0) {
        let bottomPositionY = positionY - 0.03;
        const bottomLineEntity = document.createElement("a-box");
        bottomLineEntity.setAttribute("height", "0.002");
        bottomLineEntity.setAttribute("width", "0.13");
        bottomLineEntity.setAttribute("depth", "0.01");
        bottomLineEntity.setAttribute("color", "white");
        bottomLineEntity.setAttribute("position", `0 ${bottomPositionY} 0`);
        friendsContainer.appendChild(bottomLineEntity);

        for (let i = -1; i <= 1; i += 2) {
          const bottomVerticalLineEntity = document.createElement("a-box");
          bottomVerticalLineEntity.setAttribute("height", verticalLineHeight);
          bottomVerticalLineEntity.setAttribute("width", "0.002");
          bottomVerticalLineEntity.setAttribute("depth", "0.01");
          bottomVerticalLineEntity.setAttribute("color", "white");
          bottomVerticalLineEntity.setAttribute("position", `${0.055 * i} ${bottomPositionY} 0`);
          friendsContainer.appendChild(bottomVerticalLineEntity);
        }
      }
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

  let currentSelectedBalloon = null;
  let currentSelectedBalloonColor = '';

  function displayChatMessage(message, sender, positionY) {
    const friendsContainer = document.getElementById("friendsContainer");
    const chatToolBox = document.getElementById("chatToolBox"); 
    let content = message.substring(message.indexOf(':') + 1).trim();

    const chunkedContent = [];
    for(let i = 0; i < content.length; i += 12) {
        chunkedContent.push(content.substring(i, i + 12));
    }
    
    const linesPerPage = 3;
    const pages = [];
    for(let i = 0; i < chunkedContent.length; i += linesPerPage) {
        pages.push(chunkedContent.slice(i, i + linesPerPage).join('\n'));
    }

    const numberOfLines = Math.min(linesPerPage, chunkedContent.length); 
    const height = 0.01 * numberOfLines;

    const maxLength = Math.max(...chunkedContent.map(line => line.length));
    const width = 0.008 * maxLength + 0.004;

    const color = sender === username ? '#AEADD6' : '#FFEE95';

    const balloonEntity = document.createElement('a-entity');
    const meshMaterial = new THREE.MeshBasicMaterial({ color: color });
    const roundedBoxGeom = new THREE.RoundedBoxGeometry(width, height, 0.01, 0.005); 
    
    if (sender === username) {
        roundedBoxGeom.translate(-width / 2, 0, 0);
    } else {
        roundedBoxGeom.translate(width / 2, 0, 0);
    }

    const balloonMesh = new THREE.Mesh(roundedBoxGeom, meshMaterial);

    balloonEntity.setObject3D('mesh', balloonMesh);
    const positionStr = sender === username ? `0.08 ${positionY} 0` : `-0.08 ${positionY} 0`;
    balloonEntity.setAttribute('position', positionStr);
    balloonEntity.setAttribute('class', 'clickable');

    const textEntity = document.createElement("a-troika-text");
    textEntity.setAttribute('value', pages[0]); 
    textEntity.setAttribute('color', '#603A36'); 
    textEntity.setAttribute('align', 'center'); 
    textEntity.setAttribute('width', width-0.02); 
    textEntity.setAttribute('font', '/static/lobby/font/NanumGothic-Bold.ttf'); 
    textEntity.setAttribute("fontsize", "0.04");
    textEntity.setAttribute('scale', '0.04 0.04 0.04'); 
    textEntity.setAttribute('anchor', 'center'); 
    textEntity.setAttribute('baseline', 'center');
    
    const textPositionStr = sender === username ? `-${width / 2} 0 0.01` : `${width / 2} 0 0.01`;
    textEntity.setAttribute("position", textPositionStr);

    friendsContainer.appendChild(balloonEntity);
    balloonEntity.appendChild(textEntity);

    balloonEntity.setAttribute('data-page', 0); 
    balloonEntity.setAttribute('data-pages', pages.join('|')); 

    balloonEntity.addEventListener('click', function() {
      if (currentSelectedBalloon && currentSelectedBalloon !== balloonEntity) {
        currentSelectedBalloon.getObject3D('mesh').material.color.set(currentSelectedBalloonColor);
        currentSelectedBalloon.classList.remove('selected');
        chatToolBox.setAttribute('visible', 'false');
        
        currentSelectedBalloon.setAttribute('data-page', 0);
        const prevTextEntity = currentSelectedBalloon.querySelector("a-troika-text");
        const prevPages = currentSelectedBalloon.getAttribute('data-pages').split('|');
        prevTextEntity.setAttribute('value', prevPages[0]);
      }
    
      if (balloonEntity.classList.contains('selected')) {
        balloonMesh.material.color.set(color);
        balloonEntity.classList.remove('selected');
        currentSelectedBalloon = null;
        chatToolBox.setAttribute('visible', 'false');
    
        balloonEntity.setAttribute('data-page', 0);
        const textEntity = balloonEntity.querySelector("a-troika-text");
        const pages = balloonEntity.getAttribute('data-pages').split('|');
        textEntity.setAttribute('value', pages[0]);
        return;
      }
    
      balloonMesh.material.color.set('orange');
      balloonEntity.classList.add('selected');
      currentSelectedBalloon = balloonEntity;
      currentSelectedBalloonColor = color;
      chatToolBox.setAttribute('visible', 'true'); 
    });
  }

  function navigatePage(direction) {
    if (!currentSelectedBalloon) return;
    if (!currentSelectedBalloon) {
      chatToolBox.setAttribute('visible', 'false'); // 챗 박스 숨기기
      return;
    }

    const textEntity = currentSelectedBalloon.querySelector("a-troika-text");
    const pages = currentSelectedBalloon.getAttribute('data-pages').split('|');
    const currentPage = parseInt(currentSelectedBalloon.getAttribute('data-page'), 10);
    let newPage = currentPage + direction;
    newPage = Math.max(0, Math.min(pages.length - 1, newPage));

    currentSelectedBalloon.setAttribute('data-page', newPage);
    textEntity.setAttribute('value', pages[newPage]);
  }

  document.getElementById("chatUpButton").addEventListener('click', function() {
    navigatePage(-1);
  });
  document.getElementById("chatDownButton").addEventListener('click', function() {
    navigatePage(1);
  });

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
        displayChatMessage(message, sender, 0.03 * (4 - index)+0.05);
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
       displayChatMessage(message, sender, 0.03 * (4 - index)+0.05);
    });
  }

  const subscriptionItems = document.querySelectorAll('.subscriber-item');
  const displayMiscFeatures = [];
  let currentFeaturePage = 0;

  subscriptionItems.forEach(item => {
    const subscriptionTypes = item.dataset.types.split(',');  // data-types를 가져와서 쉼표로 나눕니다.
    if(subscriptionTypes.includes('3D')) {  // '3D' 타입만 고려합니다.
        const subscriptionName = item.textContent.trim();
        const images = Array.from(item.querySelectorAll('img')).map(img => img.alt);
        displayMiscFeatures.push({ name: subscriptionName, images: images });
    }
  });

  function displayMisc() {
    const start = currentFeaturePage * itemsPerPage;
    const end = start + itemsPerPage;
    const currentdisplayMisc = displayMiscFeatures.slice(start, end);
    sttText.setAttribute("troika-text","value", "Misc Mode");

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
      const yPos = 0.03 * (2 - index);  // y 좌표를 변수로 추출
      entity.setAttribute("position", `0 ${yPos} 0`);
    
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
        
        // 이미지 추가
        feature.images.forEach((imageAlt, imgIndex) => {
          const imageEntity = document.createElement("a-image");
          let imagePath = "";
          switch (imageAlt) {
            case "Hand":
              imagePath = "/static/lobby/img/hand.png";
              break;
            case "Controller":
              imagePath = "/static/lobby/img/controller.png";
              break;
            case "3D":
              imagePath = "/static/lobby/img/3d.png";  // 3D 타입에 대한 이미지 경로 추가
              break;
          }
          imageEntity.setAttribute("src", imagePath);
    
          // 이미지의 y 좌표를 텍스트의 y 좌표와 동일하게 설정
          imageEntity.setAttribute("position", `${0.03 * (imgIndex)} -0.02 0`);
    
          imageEntity.setAttribute("width", "0.02"); 
          imageEntity.setAttribute("height", "0.02");
    
      
          entity.appendChild(imageEntity);
        });
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
    if (selectedFeature.name === "Questions and Answers(AR)"||selectedFeature.name === "질문하기") {
      if (currentLanguage === "en") {
        sttText.setAttribute("troika-text",'value', 'Ask a Question');
        if (!isBoxVisible) {
          subTextbar.setAttribute("troika-text","value", "Ask a Question");
        }
        else {
          subTextbar.setAttribute("troika-text","value", "");
        }
      } else if (currentLanguage === "ko-kr") {
        sttText.setAttribute("troika-text",'value', '질문하기');

        if (!isBoxVisible) {
          subTextbar.setAttribute("troika-text","value", "질문하기");
        }
        else {
          subTextbar.setAttribute("troika-text","value", "");
        }
      }
      GPTQuestion();
      return; // 추가된 부분: GPTQuestion 함수를 실행한 후 함수를 종료
    } else if (selectedFeature.name === "Length Measurement"||selectedFeature.name === "길이 측정") {
      lengthMeasurement();
      return;
    } else if(selectedFeature.name === "Post-It"||selectedFeature.name === "포스트잇"){
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
      arButton.style.zIndex = 1000;
      arButton.disabled = false; // 버튼 활성화
      arButton.addEventListener("click", function () {
        ui.setAttribute("visible", "true");
        xypad.setAttribute("visible", "true");
        zpad.setAttribute("visible", "true");
        talkpad.setAttribute("visible", "true");
        Text.setAttribute("visible", "true");
        p_pad.setAttribute("visible", "true");
        hideUI.setAttribute("visible", "true");
        pagenation.setAttribute("visible","false");

        pauseall(friend);
        pauseall(misc);
      });
    }
    chatbutton.addEventListener("click", function () {
      chatToolBox.setAttribute('visible', 'false');
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
    const message = sttText.getAttribute("troika-text").value.replace(/\n/g, "");
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

    else if (isValidExpression(message)) {
      try {
          let result = eval(message);
          sttText.setAttribute("troika-text",'value', result.toString());
      } catch (e) {
          console.error("Error in evaluating the expression:", e);
      }
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

  function isValidExpression(expr) {
    return /^[0-9+\-*/() ]+$/.test(expr); 
  }
});