document.addEventListener("DOMContentLoaded", function() {
    //scene,UI 객체화
    let scene = document.querySelector("a-scene");
    let ui = document.getElementById("ui");
    // 채팅버튼 객체화
    let chatbutton = document.querySelector("#chatbutton");
    let button2 = document.querySelector("#button2");
    let button3 = document.querySelector("#button3");
 
    let chat = document.querySelector("#chat");
    let profile = document.querySelector("#profile");

    let recordButton = document.querySelector("#recordButton");

    //초기 UI 위치 설정
    let initialUIPosition = { x: 0, y: 0.15, z: -0.5 };
    let currentUIPosition = {
      x: 0, // 초기 x 좌표
      y: 0.15, // 초기 y 좌표
      z: -0.5, // 초기 z 좌표
    };
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
      hideUI.setAttribute("visible", "false");
      xypad.setAttribute("visible", "false");
      zpad.setAttribute("visible", "false");
      recordButton.setAttribute("visible", "false");
    });
    function toggleChat() {
      //채팅창 띄우기 및 감추기
      chat.setAttribute("visible", !isChatVisible);
      button2.setAttribute("visible", isChatVisible);
      button3.setAttribute("visible", isChatVisible);
      profile.setAttribute("visible", isChatVisible);
      isChatVisible = !isChatVisible;
    }
    function toggleUIVisibility() {
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
      const buttons = ["up", "down", "left", "right", "forward", "backward","recordButton"];
      buttons.forEach((buttonId) => {
        const button = document.getElementById(buttonId);
        button.removeEventListener("click", moveUI);
        button.setAttribute("material", "opacity", 0);
      });
    }
    function enableUIButtons() {
      //UI 이동버튼 활성화
      const buttons = ["up", "down", "left", "right", "forward", "backward","recordButton"];
      buttons.forEach((buttonId) => {
        const button = document.getElementById(buttonId);
        button.addEventListener("click", moveUI);
        button.setAttribute("material", "opacity", 1.0);
      });
    }
    //친구 추가 및 삭제 코드
    function addFriend(event) {
      event.preventDefault();
      let friendName = document.getElementById("friendName").value;
      // `data-friend-name` 속성을 추가한 친구 항목 생성
      let newFriendItem = `<div data-friend-name="${friendName}">${friendName} <button onclick='removeFriend("${friendName}")'>X</button></div>`;
      let currentList = document.querySelector("#friendList").innerHTML;
      let newList = currentList + newFriendItem;
      document.querySelector("#friendList").innerHTML = newList;
      updateScroll();
      // 추가된 버튼에 이벤트 리스너 연결
      const deleteButton = document.querySelector(
        `[data-friend-name="${friendName}"] button`
      );
      deleteButton.addEventListener("click", function () {
        removeFriend(friendName);
      });
    }
    function showDeleteButtons() {
      let currentList = document.querySelector("#friendList").innerHTML;
      let modifiedList = currentList.replace(
        /<\/div>/g,
        ' <button class="dynamicDeleteButton">X</button></div>'
      );
      document.querySelector("#friendList").innerHTML = modifiedList;
      const deleteButtons = document.querySelectorAll(".dynamicDeleteButton");
      deleteButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
          const name = event.target.closest("div").getAttribute("data-friend-name");
          removeFriend(name);
        });
      });
      updateScroll();
    }
    function removeFriend(name) {
      let currentList = document.querySelector("#friendList").innerHTML;
      let modifiedList = currentList.replace(
        new RegExp(
          `<div>${name} <button onclick='removeFriend("${name}")'>X</button></div>`
        ),
        ""
      );
      document.querySelector("#friendList").innerHTML = modifiedList;
      updateScroll();
    }
    function updateScroll() {
      const list = document.querySelector("#friendList");
      const container = document.querySelector("#friendListContainer");
      // 스타일 속성에서 높이 가져오기
      const styleAttributes = container.getAttribute("style").split(";");
      let containerHeightInMeters;
      // 각 스타일 속성을 순회하면서 높이를 찾기
      for (let attr of styleAttributes) {
        if (attr.trim().startsWith("height")) {
          containerHeightInMeters = parseFloat(attr.split(":")[1]);
          break;
        }
      }
      // width 1m = 987 height 1m = 739
      // 메터를 픽셀로 변환
      const containerHeightInPx = containerHeightInMeters * 739;
      list.style.maxHeight = `${containerHeightInPx}px`;
      if (list.scrollHeight > list.clientHeight) {
        list.style.overflowY = "scroll";
      } else {
        list.style.overflowY = "hidden";
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
      }
      // 실제 UI의 위치를 변경
      ui.setAttribute("position", positionToString(currentUIPosition));
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
          recordButton.setAttribute("visible", "true");
        });
      }
      chatbutton.addEventListener("click", toggleChat);
      hideUI.addEventListener("click", toggleUIVisibility);
      enableUIButtons();
    });
    document.querySelector("#chat").addEventListener("loaded", function () {
      const addButton = document.getElementById("addButton");
      const showDeleteButton = document.querySelector(
        "#chatHeader button[onclick='showDeleteButtons()']"
      );
      if (addButton) {
        addButton.addEventListener("click", addFriend); //updatescroll() 있음
      }
      if (showDeleteButton) {
        showDeleteButton.addEventListener("click", showDeleteButtons); //updatescroll() 있음
      }
      updateScroll(); // 초기 스크롤 업데이트
    });
});