document.addEventListener("DOMContentLoaded", function () {
  const ws_protocol =
    window.location.protocol === "https:" ? "wss://" : "ws://";
  const socket = new WebSocket(
    ws_protocol + window.location.host + "/ws/lobby/" + username + "/"
  );
  function chatWithFriend(friendUsername) {
    if (chatSocket && chatSocket.readyState !== WebSocket.CLOSED) {
      chatSocket.close();
      return;
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
          displayMessage(msg.sender, msg.message);
        });
      } else if (data.message_type === "new_message") {
        displayMessage(data.sender, data.message);
      }
    };

    chatSocket.onclose = function (e) {
      console.error("Chat socket closed unexpectedly");
    };

    document.querySelector("#chatInput").onkeyup = function (e) {
      if (e.keyCode === 13) {
        const messageInputDom = document.querySelector("#chatInput");
        const message = messageInputDom.value;
        chatSocket.send(
          JSON.stringify({
            message: message,
            sender: username,
          })
        );
        messageInputDom.value = "";
      }
    };

    document
      .querySelector("#sendChatMessage")
      .addEventListener("click", function () {
        const messageInputDom = document.querySelector("#chatInput");
        const message = messageInputDom.value;
        // WebSocket이 열려 있을 때만 메시지를 보냄
        if (message && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
          chatSocket.send(
            JSON.stringify({
              message: message,
              sender: username,
            })
          );
          messageInputDom.value = "";
        }
      });
    openchatWindow(friendUsername);
  }

  function displayMessage(sender, message) {
    const chatMessages = document.getElementById("chatMessages");
    const messageElement = document.createElement("p");
    messageElement.innerHTML = `<strong>${sender}</strong>: ${message}`;
    chatMessages.appendChild(messageElement);
  }

  function openchatWindow(friendUsername) {
    document.getElementById("chatWindow").style.display = "block";
    document.getElementById("chatFriendName").innerText = friendUsername; // 디스플레이 용도로만 사용
  }

  document
    .getElementById("closechatWindowButton")
    .addEventListener("click", function () {
      document.getElementById("chatWindow").style.display = "none";
      document.getElementById("chatMessages").innerHTML = "";
      if (chatSocket && chatSocket.readyState !== WebSocket.CLOSED) {
        chatSocket.close();
      }
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
      const newFriendUsername = data["new_friend_username"]; // 수정된 부분
      const friendList = document.getElementById("friendList");
      const newFriendElement = document.createElement("li");

      const friendNameSpan = document.createElement("span");
      friendNameSpan.innerText = data["new_friend_name"]; // 디스플레이 이름은 full_name을 사용할 수 있습니다.
      newFriendElement.appendChild(friendNameSpan);

      const deleteButton = document.createElement("button");
      deleteButton.innerText = "삭제";
      deleteButton.className = "deleteFriendButton";
      deleteButton.setAttribute("data-username", newFriendUsername); // 수정된 부분
      deleteButton.addEventListener("click", function () {
        socket.send(
          JSON.stringify({
            message: "delete_friend",
            from_user: username,
            friend_user: newFriendUsername, // 수정된 부분
          })
        );
        newFriendElement.remove();
      });
      newFriendElement.appendChild(deleteButton);

      const chatButton = document.createElement("button");
      chatButton.innerText = "채팅";
      chatButton.addEventListener("click", function () {
        chatWithFriend(newFriendUsername); // 수정된 부분
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
    // 모든 페이지와 메인 박스를 숨깁니다.
    document
      .querySelectorAll(".page, #Main_Box")
      .forEach((elem) => (elem.style.display = "none"));

    // 선택한 페이지만 보여줍니다.
    document.getElementById(pageId).style.display = "block";
  }
  document.getElementById("Chat_Box").addEventListener("click", function () {
    showPage("Chat_Page");
  });
  document
    .getElementById("Subscribe_Box")
    .addEventListener("click", function () {
      showPage("Subscribe_Page");
    });
  document.getElementById("Setting_Box").addEventListener("click", function () {
    showPage("Setting_Page");
  });
  document.querySelectorAll(".goBackButton").forEach((button) => {
    button.addEventListener("click", function () {
      // 모든 페이지를 숨기고 메인 박스만 보여줍니다.
      document
        .querySelectorAll(".page")
        .forEach((page) => (page.style.display = "none"));
      document.getElementById("Main_Box").style.display = "block";
    });
  });
});
