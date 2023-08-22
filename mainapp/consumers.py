import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import CustomUser, FriendRequest, Friendship, Notification

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['username']
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json['message']

        if message_type == 'friend_request':
            from_user = text_data_json['from_user']
            to_user = text_data_json['to_user']
            notification, from_user_object = await self.create_friend_request(from_user, to_user)  # 이 부분 수정

            # to_user에게만 알림을 보냅니다.
            await self.channel_layer.group_send(
                to_user,
                {
                    'type': 'send_notification',
                    'message': 'friend_request',
                    'from_full_name': from_user_object.full_name,  # 이 부분을 수정
                    'notification_id': notification.id
                }
            )

        elif message_type == 'friend_request_accepted':
            notification_id = text_data_json['notification_id']
            await self.handle_accept_friend_request(notification_id)

        elif message_type == 'close_notification':
            notification_id = text_data_json['notification_id']
            await self.close_notification(notification_id)

    async def send_notification(self, event):
        message = event['message']
        from_full_name = event.get('from_full_name', '')
        notification_id = event.get('notification_id', '')

        await self.send(text_data=json.dumps({
            'message': message,
            'from_full_name': from_full_name,
            'notification_id': notification_id
        }))

    @database_sync_to_async
    def create_friend_request(self, from_user, to_user):
        from_user_object = CustomUser.objects.get(username=from_user)
        to_user_object = CustomUser.objects.get(username=to_user)
        friend_request = FriendRequest.objects.create(from_user=from_user_object, to_user=to_user_object)
        notification = Notification.objects.create(user=to_user_object, message=f"{from_user_object.full_name}님이 친구 요청을 보냈습니다.", related_request=friend_request)
        return notification, from_user_object  

    async def update_friend_list(self, event):
        new_friend_name = event['new_friend_name']
        await self.send(text_data=json.dumps({
            'message': 'new_friend_added',
            'new_friend_name': new_friend_name
        }))

    # consumers.py
    @database_sync_to_async
    def accept_friend_request(self, notification_id):
        notification = Notification.objects.get(id=notification_id)
        friend_request = FriendRequest.objects.get(id=notification.related_request.id)
        friend_request.is_accepted = True
        friend_request.save()

        # 중복 체크 추가
        if not Friendship.objects.filter(user=friend_request.from_user, friend=friend_request.to_user).exists():
            Friendship.objects.create(user=friend_request.from_user, friend=friend_request.to_user)

        if not Friendship.objects.filter(user=friend_request.to_user, friend=friend_request.from_user).exists():
            Friendship.objects.create(user=friend_request.to_user, friend=friend_request.from_user)

        notification.is_read = True
        notification.save()
        
        return friend_request


    async def handle_accept_friend_request(self, notification_id):
        friend_request = await self.accept_friend_request(notification_id)

        # 친구 목록 업데이트
        await self.channel_layer.group_send(
            self.room_name,
            {
               'type': 'update_friend_list',
               'new_friend_name': friend_request.from_user.full_name
               
            }
        )
        
        # 친구 추가 알림을 상대방에게도 보내는 부분
        await self.channel_layer.group_send(
            friend_request.from_user.username,
            {
                'type': 'update_friend_list',
                'new_friend_name': friend_request.to_user.full_name
            }
        )

        # 이 부분은 상대방에게 친구 요청이 수락되었다는 알림을 보냅니다.
        await self.channel_layer.group_send(
            friend_request.from_user.username,
            {
                'type': 'send_notification',
                'message': 'friend_request_accepted', 
                'from_full_name': friend_request.to_user.full_name
            }
        )

        
    @database_sync_to_async
    def close_notification(self, notification_id):
        notification = Notification.objects.get(id=notification_id)
        notification.delete()