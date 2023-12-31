document.addEventListener("DOMContentLoaded", function () {
  const notificationElements = document.querySelectorAll('.notificationElementClass');

  // 각 알림 요소에 대해서 이벤트 리스너를 추가합니다.
  notificationElements.forEach(notificationElement => {
    const notificationId = notificationElement.getAttribute('data-id');
    addAcceptAndCloseButtonListeners(notificationElement, notificationId);
  });
  
  //구독서비스 상태관리
  let serviceStates = {
    "Questions and Answers(AR)": false,
    "Length Measurement": false,
    "Post-It": false,
    "Emotion Detection": false,
    "Questions and Answers": false
  };
  let typingTimer;  // 타이핑 애니메이션의 setTimeout을 저장하기 위한 변수

  function displayLoadingAnimation() {
    const loadingElement = document.getElementById("loadingAnimation");
    loadingElement.textContent = ""; 
    const loadingText = "Generating Answer...";

    // 이미 실행 중인 타이핑 애니메이션의 setTimeout을 취소
    if (typingTimer) {
        clearTimeout(typingTimer);
    }

    function type(index) {  // index를 파라미터로 받음
        if (index < loadingText.length) {
            loadingElement.textContent += loadingText[index];
            index++;
            typingTimer = setTimeout(() => type(index), 100);  // index 값을 전달
        } else {
            loadingElement.textContent = "";
            typingTimer = setTimeout(() => type(0), 500);  // index를 0으로 초기화하여 전달
        }
    }

    type(0);  // 초기 index 값 0으로 시작
}

function stopLoadingAnimation() {
    // 타이핑 애니메이션의 setTimeout을 취소
    if (typingTimer) {
        clearTimeout(typingTimer);
    }
    document.getElementById("loadingAnimation").style.display = "none";
}
  

  function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  function clearChatMessages() {
    const messagesContainer = document.getElementById("chatMessages");
    messagesContainer.innerHTML = '';
  }
  const ws_protocol =
    window.location.protocol === "https:" ? "wss://" : "ws://";
  const socket = new WebSocket(
    ws_protocol + window.location.host + "/ws/lobby/" + username + "/"
  );
  function chatWithFriend(friendUsername) {
    clearChatMessages()
    if (chatSocket && chatSocket.readyState !== WebSocket.CLOSED) {
      chatSocket.close();
    }

    document.querySelector("#chatInput").onkeyup = null;
    document.querySelector("#sendChatMessage").onclick = null;

    room_name =
      friendUsername < username
        ? `${friendUsername}_${username}`
        : `${username}_${friendUsername}`;
    chatSocket = new WebSocket(
      ws_protocol + window.location.host + "/ws/chat/" + room_name + "/"
    );

    chatSocket.onmessage = function (e) {
      const data = JSON.parse(e.data);
  
      if (data.message_type === "load_messages") {
          data.messages.forEach((msg) => {
            displayMessage(msg.sender, msg.message, msg.image_url);  
        });
      } else if (data.message_type === "new_message") {
        if (data.sender !== username) {
          displayMessage(data.sender, data.message, data.image_url);
          updateScroll();  
        }
      }
    };
    function updateScroll() {
      const messagesContainer = document.getElementById("chatMessages");
      if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
  }
    chatSocket.onclose = function (e) {
      console.error("Chat socket closed unexpectedly");
    };

    function sendChatMessage() {
      const messageInputDom = document.querySelector("#chatInput");
      const message = messageInputDom.value;
    
      if (message && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        if (serviceStates["Questions and Answers"]) {
          document.getElementById("loadingAnimation").style.display = "inline";
          displayLoadingAnimation();  
          fetch('/get_gpt_answer/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ question: message })
          })
          .then(response => response.json())
          .then(data => {
            displayMessage(username, '[Question]<br>' + message + '<br><br>[Answer]<br>' + data.answer);
    
            chatSocket.send(
              JSON.stringify({
                message: '[Question]<br>' + message + '<br><br>[Answer]<br>' + data.answer,
                sender: username,
              })
            );
            stopLoadingAnimation();  
            document.getElementById("loadingAnimation").style.display = "none";

            aiIcon.style.display = "none";
            serviceStates["Questions and Answers"] = false;
          });
        } else {
          displayMessage(username, message);
          chatSocket.send(
            JSON.stringify({
              message: message,
              sender: username,
            })
          );
        }
        
        messageInputDom.value = "";
      }
    }

    document.querySelector("#chatInput").onkeyup = function (e) {
      if (e.keyCode === 13) {
        sendChatMessage();
      }
    };

    document.querySelector("#sendChatMessage").addEventListener("click", function () {
      sendChatMessage();
    });


    openchatWindow(friendUsername);
  }
  let selectedMessage = null;

  const aiIcon = document.getElementById("AI_Icon");

  function displayServiceList(type) {
    const serviceList = document.getElementById("service-list");
    serviceList.innerHTML = "";
    const subscriptionItems = document.querySelectorAll(".subscriber-item");

    subscriptionItems.forEach(item => {
        const subscriptionTypes = item.dataset.types.split(',');
  

        if (subscriptionTypes.includes("2D") && subscriptionTypes.includes(type)) {
          const serviceItem = document.createElement("li");
          serviceItem.innerText = item.textContent.trim();
          
          serviceItem.onclick = function() {
              if (item.textContent.trim() === "Questions and Answers") {
                  aiIcon.style.display = "block";
                  serviceStates["Questions and Answers"] = true;
                  changeInputStyle("2px solid #000000");  
              } else if (item.textContent.trim() === "Emotion Detection") {
                fetch('/get_emotion/', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json', 
                      'X-Requested-With': 'XMLHttpRequest',
                      'X-CSRFToken': getCookie('csrftoken')
                  },
                  body: JSON.stringify({text: selectedMessage.textContent.trim()}) 
                })
                .then(response => response.json())
                .then(data => {
                  if(data.error) {
                      alert(data.error);
                  } else {
                      alert(`Text Emotion: ${data.emotion}`);
                  }
                })
                .catch(error => {
                  console.error('Error:', error);
                  alert('An error occurred while trying to detect the emotion.');
                });
              } else {
                  alert(`${item.textContent.trim()} clicked!`);
              }
          };
          serviceList.appendChild(serviceItem);
        }
    });
  }

  // AI 버튼 클릭 이벤트
  document.getElementById("AI").addEventListener("click", function() {
    serviceWindow.style.display = "block";
    displayServiceList("Prompt");

    document.querySelector(".close-button").addEventListener("click", function(event) {
      event.stopPropagation();
      serviceWindow.style.display = "none";
      resetInputStyle();
    });
  });
    function changeInputStyle(borderStyle) {
        const chatInput = document.getElementById("chatInput");
        chatInput.style.border = borderStyle;
    }

    function resetInputStyle() {
        const chatInput = document.getElementById("chatInput");
        chatInput.style.border = "";  
    }
  function displayMessage(sender, message, imageUrl) {
      const chatMessages = document.getElementById("chatMessages");
      const messageElement = document.createElement("p");

      let originalColor;  
      if (sender === username) {
        messageElement.className = "message me";
        originalColor = "#FDE1DB";  
      }  else {
        messageElement.className = "message other";
        originalColor = "#D5DBDB";  
      }
      
      messageElement.innerHTML = `${message}`;
    
  
      
      // 메시지 클릭 이벤트 리스너: 서비스 윈도우 표시
      messageElement.addEventListener("click", function() {
        serviceWindow.style.display = "block";

        if (selectedMessage) {
            selectedMessage.style.backgroundColor = selectedMessage.dataset.originalColor;
        }

        messageElement.style.backgroundColor = "#FFEE96";
        selectedMessage = messageElement;
        selectedMessage.dataset.originalColor = originalColor;

        displayServiceList("Chat");

        for (const service in serviceStates) {
            serviceStates[service] = false;
        }

        aiIcon.style.display = "none";
    });
  
      document.querySelector(".close-button").addEventListener("click", function(event) {
        event.stopPropagation();
        serviceWindow.style.display = "none";
        if (selectedMessage) {
            selectedMessage.style.backgroundColor = selectedMessage.dataset.originalColor;
        }
      });

      if (imageUrl) {
        const imgElement = document.createElement("img");
        imgElement.onload = function() {
          const width = this.width;
          if (width > 150) {
            messageElement.style.maxWidth = '150px';
          } else {
            messageElement.style.maxWidth = `${width}px`;
          }
        };
        imgElement.src = imageUrl;
        imgElement.className = "chat-image";  
        messageElement.appendChild(imgElement);
      }
  
      chatMessages.appendChild(messageElement);
      }

  const imageInput = document.getElementById("imageInput");
  const imageButton = document.getElementById("imageButton");

  imageButton.addEventListener("click", function() {
      imageInput.click();
  });

  imageInput.addEventListener("change", function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const imageAsBase64 = evt.target.result;

            displayMessage(username, "", imageAsBase64);

            chatSocket.send(
              JSON.stringify({
                  image: imageAsBase64,
                  message: "",  
                  sender: username
              })
          );
        }
        reader.readAsDataURL(file);
    }
  });


  function openchatWindow(friendUsername) {
    document.getElementById("chatWindow").style.display = "block";
    document.getElementById("chatControlPannel").style.display="block"
    document.getElementById("chatFriendName").innerText = friendUsername; 
  }

  // 채팅창 숨김
  function closeChatWindow() {
    document.getElementById("chatWindow").style.display = "none";
    document.getElementById("chatControlPannel").style.display = "none";
  
    document.getElementById("chatMessages").innerHTML = "";
  
    if (chatSocket && chatSocket.readyState !== WebSocket.CLOSED) {
      chatSocket.close();
    }
  }
  document
    .getElementById("closechatWindowButton")
    .addEventListener("click", function () {
      closeChatWindow()
    });

  addFriendButton.addEventListener("click", function () {
    const newFriendName = document.getElementById("newFriendName").value;
    if (newFriendName) {
      socket.send(
        JSON.stringify({
          message: "friend_request",
          from_user: username,
          to_user: newFriendName,
        })
      );
      document.getElementById("newFriendName").value = "";
    }
  });
  document
    .getElementById("notificationIcon")
    .addEventListener("click", function () {
      const notificationList = document.getElementById("notificationList");
      notificationList.style.display =
        notificationList.style.display === "none" ? "block" : "none";
    });

  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("deleteFriendButton")) {
      const friendUsername = e.target.getAttribute("data-username");
      socket.send(
        JSON.stringify({
          message: "delete_friend",
          from_user: username,
          friend_user: friendUsername,
        })
      );
      e.target.parentNode.remove();
    } else if (e.target.classList.contains("chatFriendButton")) {
      let friendUsername = e.target.id.replace("chatWithFriend_", "");
      chatWithFriend(friendUsername);
    }
  });

  socket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    const message = data["message"];
    const fromFullName = data["from_full_name"];
    const notificationId = data["notification_id"];
    console.log('Received data:', data);
    
    if (message === "friend_request" || message === "friend_request_accepted") {
      const notificationElement = document.createElement("li");
      if (message === "friend_request") {
        notificationElement.innerHTML = `${fromFullName}님이 친구 요청을 보냈습니다. <button data-id="${notificationId}" class="acceptFriendRequest">수락</button> <button data-id="${notificationId}" class="closeNotification">닫기</button>`;
      } else {
        notificationElement.innerHTML = `${fromFullName}님이 친구 요청을 수락하였습니다. <button data-id="${notificationId}" class="closeNotification">닫기</button>`;
      }
      const notificationList = document.getElementById("notificationList");
      notificationList.appendChild(notificationElement);

      addAcceptAndCloseButtonListeners(notificationElement, notificationId);
    } else if (message === "new_friend_added") {
      const newFriendUsername = data["new_friend_username"]; 
      const newFriendProfilePictureUrl = data["new_friend_profile_picture_url"];
      const friendList = document.getElementById("friendList");
      const newFriendElement = document.createElement("li");
      newFriendElement.classList.add("visible");

      if (newFriendProfilePictureUrl) {
        const profilePictureImg = document.createElement("img");
        profilePictureImg.src = newFriendProfilePictureUrl;
        profilePictureImg.alt = data["new_friend_name"] + "의 프로필 사진";
        profilePictureImg.width = "50";
        profilePictureImg.height = "50";
        newFriendElement.appendChild(profilePictureImg);
      }

      const friendNameSpan = document.createElement("span");
      friendNameSpan.innerText = data["new_friend_name"];
      friendNameSpan.className = "friend-name";
      newFriendElement.appendChild(friendNameSpan);
     
      const deleteButton = document.createElement("button");
      deleteButton.innerText = "삭제";
      deleteButton.className = "deleteFriendButton";
      deleteButton.setAttribute("data-username", newFriendUsername);
      deleteButton.style.marginRight = "10px";
      deleteButton.addEventListener("click", function () {
        socket.send(
          JSON.stringify({
            message: "delete_friend",
            from_user: username,
            friend_user: newFriendUsername, 
          })
        );
        newFriendElement.remove();
      });
      newFriendElement.appendChild(deleteButton);

      const chatButton = document.createElement("button");
      chatButton.innerText = "채팅";

      chatButton.addEventListener("click", function () {
        chatWithFriend(newFriendUsername); 
      });
      newFriendElement.appendChild(chatButton);

      friendList.appendChild(newFriendElement);
    } else if (message === "friend_deleted") {
      const deletedFriendUsername = data["friend_username"];
      const friendList = document.getElementById("friendList");
      const friendItems = friendList.getElementsByTagName("li");

      for (let i = 0; i < friendItems.length; i++) {
        const btn = friendItems[i].querySelector(".deleteFriendButton");
        if (
          btn &&
          btn.getAttribute("data-username") === deletedFriendUsername
        ) {
          friendItems[i].remove();
          break;
        }
      }
    }
  };

  function addAcceptAndCloseButtonListeners(
    notificationElement,
    notificationId
  ) {
    const closeButton = notificationElement.querySelector(".closeNotification");
    closeButton.addEventListener("click", function () {
      socket.send(
        JSON.stringify({
          message: "close_notification",
          notification_id: notificationId,
        })
      );
      notificationElement.parentNode.removeChild(notificationElement);
    });

    const acceptButton = notificationElement.querySelector(
      ".acceptFriendRequest"
    );
    if (acceptButton) {
      acceptButton.addEventListener("click", function () {
        socket.send(
          JSON.stringify({
            message: "friend_request_accepted",
            notification_id: notificationId,
          })
        );
        notificationElement.parentNode.removeChild(notificationElement);
      });
    }
  }
   

  // 페이지 전환 로직
  function showPage(pageId) {
    document
      .querySelectorAll(".page, #Main_Box")
      .forEach((elem) => (elem.style.display = "none"));

    document.getElementById(pageId).style.display = "block";
  }
  document.querySelector('#friend-pagination-controls button:nth-child(1)').addEventListener('click', function() {
    prevPaginationPage('friend');
    closeChatWindow()
});

document.querySelector('#friend-pagination-controls button:nth-child(3)').addEventListener('click', function() {
    nextPaginationPage('friend');
    closeChatWindow()
});

document.querySelector('#subscription-pagination-controls button:nth-child(1)').addEventListener('click', function() {
    prevPaginationPage('subscription');
});

document.querySelector('#subscription-pagination-controls button:nth-child(3)').addEventListener('click', function() {
    nextPaginationPage('subscription');
});
  const itemsPerPage = 5;
  const currentPage = {
  'friend': 1,
  'subscription': 1
  };
  function showPaginationPage(listSelector, pageNumberSelector, page) {
    const listItems = document.querySelectorAll(listSelector);
    const pageNumberEl = document.getElementById(pageNumberSelector);
  
    for (let i = 0; i < listItems.length; i++) {
      listItems[i].classList.remove('visible');
    }
    
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    for (let i = start; i < end && i < listItems.length; i++) {
      listItems[i].classList.add('visible');
    }
    
    pageNumberEl.textContent = page;
}
function nextPaginationPage(pageType) {
  const listSelector = pageType === 'friend' ? '#friendList li' : '.subscriber-item';
  const pageNumberSelector = pageType === 'friend' ? 'friend-page-number' : 'subscription-page-number';
  const listItems = document.querySelectorAll(listSelector);
  
  if (currentPage[pageType] * itemsPerPage < listItems.length) {
      currentPage[pageType]++;
      showPaginationPage(listSelector, pageNumberSelector, currentPage[pageType]);
  }
}

function prevPaginationPage(pageType) {
  const listSelector = pageType === 'friend' ? '#friendList li' : '.subscriber-item';
  const pageNumberSelector = pageType === 'friend' ? 'friend-page-number' : 'subscription-page-number';
  
  if (currentPage[pageType] > 1) {
      currentPage[pageType]--;
      showPaginationPage(listSelector, pageNumberSelector, currentPage[pageType]);
  }
}
 
  document.getElementById("Chat_Box").addEventListener("click", function () {
    showPage("Chat_Page");
    showPaginationPage('#friendList li', 'friend-page-number', 1);
  });
  document
    .getElementById("Subscribe_Box")
    .addEventListener("click", function () {
      showPage("Subscribe_Page");
      showPaginationPage('.subscriber-list .subscriber-item', 'subscription-page-number', 1);
    });
  document.getElementById("Setting_Box").addEventListener("click", function () {
    showPage("Setting_Page");
  });
  document.querySelectorAll(".goBackButton").forEach((button) => {
    button.addEventListener("click", function () {
      document
        .querySelectorAll(".page")
        .forEach((page) => (page.style.display = "none"));
      document.getElementById("Main_Box").style.display = "block";
      closeChatWindow()
    });
  });
});
