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

    socket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        const message = data['message'];
        const fromFullName = data['from_full_name'];
        const notificationId = data['notification_id'];

        if (message === 'friend_request') {
            const notificationElement = document.createElement('li');
            notificationElement.innerHTML = `${fromFullName}님이 친구 요청을 보냈습니다. <button data-id="${notificationId}" class="acceptFriendRequest">수락</button> <button data-id="${notificationId}" class="closeNotification">닫기</button>`;
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

            
             // 수락 버튼에 이벤트 리스너 추가
            const acceptButton = notificationElement.querySelector('.acceptFriendRequest');
            acceptButton.addEventListener('click', function() {
                socket.send(JSON.stringify({
                    'message': 'friend_request_accepted',
                    'notification_id': notificationId
                }));
                // 알림 삭제
                notificationElement.parentNode.removeChild(notificationElement);
            });
        } else if (message === 'new_friend_added') {
            const newFriendName = data['new_friend_name'];
            const friendList = document.getElementById('friendNames');
            const newFriendElement = document.createElement('li');
            newFriendElement.innerText = newFriendName;
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
    const acceptButton = notificationElement.querySelector('.acceptFriendRequest');
    acceptButton.addEventListener('click', function() {
        socket.send(JSON.stringify({
            'message': 'friend_request_accepted',
            'notification_id': notificationId
        }));
        notificationElement.parentNode.removeChild(notificationElement);
    });   
});