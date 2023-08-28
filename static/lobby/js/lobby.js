document.addEventListener('DOMContentLoaded', function() {
    const urlParts = window.location.pathname.split('/');
    const username = urlParts[urlParts.length - 2];
    const ws_protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const socket = new WebSocket(ws_protocol + window.location.host + '/ws/lobby/' + username + '/');

    const addFriendButton = document.getElementById('addFriendButton');
    addFriendButton.addEventListener('click', function() {
        const newFriendName = document.getElementById('newFriendName').value;
        if (newFriendName) {
            socket.send(JSON.stringify({
                'message': 'friend_request',
                'from_user': username,
                'to_user': newFriendName
            }));
            document.getElementById('newFriendName').value = '';
        }
    });

    const closeButtons = document.querySelectorAll('.closeNotification');
    closeButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        const notificationId = button.getAttribute('data-id');
        if (!notificationId || notificationId === '') {
            console.error("Invalid notification ID");
            return;
        }
        socket.send(JSON.stringify({
            'message': 'close_notification',
            'notification_id': notificationId
        }));
    });
});

    document.getElementById('notificationIcon').addEventListener('click', function() {
        const notificationList = document.getElementById('notificationList');
        notificationList.style.display = notificationList.style.display === 'none' ? 'block' : 'none';
    });

    

    function addAcceptAndCloseButtonListeners(notificationElement, notificationId) {
        const closeButton = notificationElement.querySelector('.closeNotification');
        closeButton.addEventListener('click', function() {
            socket.send(JSON.stringify({
                'message': 'close_notification',
                'notification_id': notificationId
            }));
            notificationElement.parentNode.removeChild(notificationElement);
        });

        const acceptButton = notificationElement.querySelector('.acceptFriendRequest');
        if (acceptButton) {  // '수락' 버튼이 있을 경우에만 이벤트 리스너 추가
            acceptButton.addEventListener('click', function() {
                socket.send(JSON.stringify({
                    'message': 'friend_request_accepted',
                    'notification_id': notificationId
                }));
                notificationElement.parentNode.removeChild(notificationElement);
            });
        }
    }

    // 친구 삭제 버튼 이벤트 추가
    document.addEventListener('click', function(e) {
        if(e.target.classList.contains('deleteFriendButton')) {
            const friendUsername = e.target.getAttribute('data-username');
            socket.send(JSON.stringify({
                'message': 'delete_friend',
                'from_user': username,
                'friend_user': friendUsername
            }));
            // UI에서 친구 삭제
            e.target.parentNode.remove();
        }
    });


    socket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        const message = data['message'];
        const fromFullName = data['from_full_name'];
        const notificationId = data['notification_id'];

        if (message === 'friend_request' || message === 'friend_request_accepted') {
            const notificationElement = document.createElement('li');
            if (message === 'friend_request') {
                notificationElement.innerHTML = `${fromFullName}님이 친구 요청을 보냈습니다. <button data-id="${notificationId}" class="acceptFriendRequest">수락</button> <button data-id="${notificationId}" class="closeNotification">닫기</button>`;
            } else {
                notificationElement.innerHTML = `${fromFullName}님이 친구 요청을 수락하였습니다. <button data-id="${notificationId}" class="closeNotification">닫기</button>`;
            }
            const notificationList = document.getElementById('notificationList');
            notificationList.appendChild(notificationElement);
            
            addAcceptAndCloseButtonListeners(notificationElement, notificationId);  
        } else if (message === 'new_friend_added') {
            const newFriendName = data['new_friend_name'];
            const friendList = document.getElementById('friendNames');
            const newFriendElement = document.createElement('li');
        
            // 친구 이름 표시
            const friendNameSpan = document.createElement('span');
            friendNameSpan.innerText = newFriendName;
            newFriendElement.appendChild(friendNameSpan);
        
            // '삭제' 버튼 추가
            const deleteButton = document.createElement('button');
            deleteButton.innerText = '삭제';
            deleteButton.className = 'deleteFriendButton';
            deleteButton.setAttribute('data-username', newFriendName);

            // 여기서 이벤트 리스너를 할당합니다.
            deleteButton.addEventListener('click', function() {
                socket.send(JSON.stringify({
                    'message': 'delete_friend',
                    'from_user': username,
                    'friend_user': newFriendName
                }));
                newFriendElement.remove();
            });

            newFriendElement.appendChild(deleteButton);
        
            // '채팅' 버튼 추가
            const chatButton = document.createElement('button');
            chatButton.innerText = '채팅';
            chatButton.addEventListener('click', function() {
                // 채팅 로직을 여기에 작성
                console.log(`${newFriendName}과(와) 채팅을 시작합니다.`);
            });
            newFriendElement.appendChild(chatButton);
        
            // 친구 목록에 새 요소 추가
            friendList.appendChild(newFriendElement);
        }  else if (message === 'friend_request_accepted') {
            const notificationElement = document.createElement('li');
            notificationElement.innerHTML = `${fromFullName}님이 친구 요청을 수락하였습니다. <button data-id="${notificationId}" class="closeNotification">닫기</button>`;
            const notificationList = document.getElementById('notificationList');
            notificationList.appendChild(notificationElement);
        
            // 닫기 버튼에 이벤트 리스너 추가
            const closeButton = notificationElement.querySelector('.closeNotification');
            closeButton.addEventListener('click', function() {
                socket.send(JSON.stringify({
                    'message': 'close_notification',
                    'notification_id': notificationId
                }));
                // 알림 삭제
                notificationElement.parentNode.removeChild(notificationElement);
            });
            addAcceptAndCloseButtonListeners(notificationElement, notificationId);
        } else if (message === 'friend_deleted') {
            const deletedFriendUsername = data['friend_username'];
            const friendList = document.getElementById('friendNames');
            const friendItems = friendList.getElementsByTagName('li');
            
            for (let i = 0; i < friendItems.length; i++) {
                const btn = friendItems[i].querySelector('.deleteFriendButton');
                if (btn && btn.getAttribute('data-username') === deletedFriendUsername) {
                    // 친구 목록에서 해당 친구를 삭제
                    friendItems[i].remove();
                    break;
                }
            }
        }
    };

    document.addEventListener('click', function(e) {
        if(e.target.classList.contains('closeNotification')) {
            const notificationId = e.target.getAttribute('data-id');
            socket.send(JSON.stringify({
                'message': 'close_notification',
                'notification_id': notificationId
            }));
            // 알림 삭제
            e.target.parentNode.remove();
        }
    });
    const existingNotifications = document.querySelectorAll('.notificationElementClass'); // 알림 엘리먼트에 공통적으로 적용할 클래스
    existingNotifications.forEach(function(notificationElement) {
        const notificationId = notificationElement.getAttribute('data-id');
        addAcceptAndCloseButtonListeners(notificationElement, notificationId);
    });  
});