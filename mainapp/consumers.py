import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import CustomUser, FriendRequest, Friendship, Notification, ChatRoom, ChatMessage
from channels.exceptions import DenyConnection
from django.core.files.base import ContentFile
import base64

CustomUser = get_user_model()

@database_sync_to_async
def get_or_create_chatroom(participant1, participant2):
    participant1_obj = CustomUser.objects.get(username=participant1)
    participant2_obj = CustomUser.objects.get(username=participant2)

    room_name = f"{participant1}_{participant2}" if participant1 < participant2 else f"{participant2}_{participant1}"
    room, created = ChatRoom.objects.get_or_create(
        name=room_name, 
        participant1=participant1_obj, 
        participant2=participant2_obj
    )
    return room

@database_sync_to_async
def get_user_details(username):
    user = CustomUser.objects.get(username=username)
    return {
        'full_name': user.full_name,
        'username': user.username,
        'profile_picture_url': user.profile_picture.url if user.profile_picture else None
    }

@database_sync_to_async  # 이 데코레이터 추가
def check_user_in_room(scope_user, room):
    allowed_users = [str(room.participant1.username), str(room.participant2.username), 'admin']
    return str(scope_user.username) in allowed_users

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
            if not notification_id:
                return
            await self.close_notification(notification_id)

        elif message_type == 'delete_friend':
            from_user = text_data_json['from_user']
            friend_user = text_data_json['friend_user']
            await self.handle_delete_friend(from_user, friend_user)

    async def send_notification(self, event):
        message = event['message']
        from_full_name = event.get('from_full_name', '')
        notification_id = event.get('notification_id', '')
        friend_username = event.get('friend_username', '')

        await self.send(text_data=json.dumps({
            'message': message,
            'from_full_name': from_full_name,
            'notification_id': notification_id,
            'friend_username': friend_username
        }))

    @database_sync_to_async
    def create_friend_request(self, from_user, to_user):
        from_user_object = CustomUser.objects.get(username=from_user)
        to_user_object = CustomUser.objects.get(username=to_user)
        friend_request = FriendRequest.objects.create(from_user=from_user_object, to_user=to_user_object)
        notification = Notification.objects.create(user=to_user_object, message=f"{from_user_object.full_name}님이 친구 요청을 보냈습니다.", related_request=friend_request)
        return notification, from_user_object  
    

    async def update_friend_list(self, event):
        new_friend_username = event.get('new_friend_username', '') 
        user_details = await get_user_details(new_friend_username)
        await self.send(text_data=json.dumps({
            'message': 'new_friend_added',
            'new_friend_name': user_details['full_name'],
            'new_friend_username': user_details['username'],
            'new_friend_profile_picture_url': user_details['profile_picture_url']
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
               'new_friend_name': friend_request.from_user.full_name,
               'new_friend_username': friend_request.from_user.username
            }
        )
        
        # 친구 추가 알림을 상대방에게도 보내는 부분
        await self.channel_layer.group_send(
            friend_request.from_user.username,
            {
                'type': 'update_friend_list',
                'new_friend_name': friend_request.to_user.full_name,
                'new_friend_username': friend_request.to_user.username
            }
        )

        # 이 부분은 상대방에게 친구 요청이 수락되었다는 알림을 보냅니다.
        await self.channel_layer.group_send(
            friend_request.from_user.username,
            {
                'type': 'send_notification',
                'message': 'friend_request_accepted', 
                'from_full_name': friend_request.to_user.full_name,
                'new_friend_username': friend_request.to_user.username
            }
        )

    @database_sync_to_async  # 동기 함수
    def delete_friend(self, from_username, friend_username):
        from_user = CustomUser.objects.get(username=from_username)
        friend_user = CustomUser.objects.get(username=friend_username)

        # Refresh the state from the database
        from_user.refresh_from_db()
        friend_user.refresh_from_db()

        # DB에서 친구 관계를 삭제
        deleted1 = Friendship.objects.filter(user=from_user, friend=friend_user).delete()
        deleted2 = Friendship.objects.filter(user=friend_user, friend=from_user).delete()
    
        return deleted1 and deleted2

    async def handle_delete_friend(self, from_username, friend_username):
        is_deleted = await self.delete_friend(from_username, friend_username)
        if is_deleted:  # 실제로 삭제되었다면 알림을 전송
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'send_notification',
                    'message': 'friend_deleted',
                    'friend_username': friend_username,
                }
            )   
            await self.channel_layer.group_send(
                friend_username,
                {
                    'type': 'send_notification',
                    'message': 'friend_deleted',
                    'friend_username': from_username,
                }
            )

        
    @database_sync_to_async
    def close_notification(self, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.delete()
        except Notification.DoesNotExist:
            print(f"No notification found with ID: {notification_id}")
        except Exception as e:
            print(f"An error occurred: {e}")


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.room_name = self.scope['url_route']['kwargs']['room_name']
            self.room_group_name = f'chat_{self.room_name}'
            participant1, participant2 = self.room_name.split("_")

            room = await get_or_create_chatroom(participant1, participant2)

            is_user_in_room = await check_user_in_room(self.scope["user"], room)  

            if not is_user_in_room:
                raise DenyConnection("Not allowed to join this room")

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
            await self.fetch_past_messages() 
        except Exception as e:
            raise DenyConnection(str(e))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message', None)
        image_data = text_data_json.get('image', None)
        sender = text_data_json.get('sender', self.scope["user"].username)


        image_url = None
        if image_data:
            format, imgstr = image_data.split(';base64,') 
            ext = format.split('/')[-1] 
            image_data = ContentFile(base64.b64decode(imgstr), name='temp.' + ext)
            image_url = await self.save_message(self.room_name, sender, message, image_data)
        else:
            await self.save_message(self.room_name, sender, message)
    
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender,
                'image_url': image_url 
            }
        )

    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']
        image_url = event.get('image_url', None) 

        await self.send(text_data=json.dumps({
            'message_type': 'new_message',
            'message': message,
            'sender': sender,
             'image_url': image_url
        }))

    @database_sync_to_async
    def get_last_50_messages(self, room_name):
        try:
            room = ChatRoom.objects.get(name=room_name)
            messages = ChatMessage.objects.filter(chat_room=room).order_by('-timestamp')[:50]
            return [
                {
                    'sender': msg.sender.username, 
                    'message': msg.message,
                    'image_url': msg.image.url if msg.image else None
                } 
                for msg in reversed(messages) 
                if msg.sender.username in [room.participant1.username, room.participant2.username]
            ]
        except ChatRoom.DoesNotExist:
        # 채팅방이 없는 경우 빈 리스트 반환
            return []
    
    async def fetch_past_messages(self):
        last_50_messages = await self.get_last_50_messages(self.room_name)
        await self.send(text_data=json.dumps({
            'message_type': 'load_messages',
            'messages': last_50_messages
        }))

    @database_sync_to_async
    def save_message(self, room_name, sender, message, image_data=None): 
        room = ChatRoom.objects.get(name=room_name)
        user = CustomUser.objects.get(username=sender)
        message_obj = ChatMessage.objects.create(chat_room=room, sender=user, message=message)
    
        if image_data:
            message_obj.image.save(name=image_data.name, content=image_data)
            return message_obj.image.url
        return None