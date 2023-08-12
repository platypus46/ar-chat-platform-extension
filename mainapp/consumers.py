import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from .models import Friendship, ChatMessage
from channels.generic.websocket import WebsocketConsumer

class FriendConsumer(AsyncWebsocketConsumer):
    # WebSocket 연결 시 호출되는 메서드
    async def connect(self):
        self.username = self.scope['url_route']['kwargs']['username']
        self.user = await self.get_user(self.username)
        await self.channel_layer.group_add(
            self.username,
            self.channel_name
        )

        await self.accept()
        self.first_chat_request = True
        self.chat_friend = None  # 채팅 상대를 저장하는 변수 초기화

    # WebSocket 연결 해제 시 호출되는 메서드
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.username,
            self.channel_name
        )

    # 클라이언트로부터 메시지 수신 시 호출되는 메서드
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        if 'friend_add' in text_data_json:
            # 친구 추가 요청 처리
            friend_username = text_data_json['friend_add']
            friend = await self.get_user(friend_username)
            if friend:
                await self.create_friendship(self.user, friend)
                await self.channel_layer.group_send(
                    self.username,
                    {
                        'type': 'friend_add_message',
                        'friend_add': friend_username
                    }
                )
                await self.channel_layer.group_send(
                    friend_username,
                    {
                        'type': 'friend_add_message',
                        'friend_add': self.username
                    }
                )
        elif 'friend_delete' in text_data_json:
            # 친구 삭제 요청 처리
            friend_username = text_data_json['friend_delete']
            friend = await self.get_user(friend_username)
            if friend:
                await self.delete_friendship(self.user, friend)
                await self.channel_layer.group_send(
                    self.username,
                    {
                        'type': 'friend_delete_message',
                        'friend_delete': friend_username
                    }
                )
                await self.channel_layer.group_send(
                    friend_username,
                    {
                        'type': 'friend_delete_message',
                        'friend_delete': self.username
                    }
                )
        elif 'chat_start' in text_data_json:
            # 채팅 시작 요청 처리
            self.chat_friend_username = text_data_json['chat_start']
            self.chat_friend = await self.get_user(self.chat_friend_username)
            if self.chat_friend and self.first_chat_request:
                self.first_chat_request = False

                # 채팅방의 group 이름을 결정하는 코드 수정
                sorted_usernames = sorted([self.username, self.chat_friend_username])
                self.chat_group_name = "_".join(sorted_usernames)  # 구분자 변경

                await self.channel_layer.group_add(
                    self.chat_group_name,
                    self.channel_name
                )

        elif 'chat_message' in text_data_json:
            # 채팅 메시지 전송 처리
            chat_message = text_data_json['chat_message']
            if self.chat_friend:
                await self.create_chat_message(self.user, self.chat_friend, chat_message)
            
                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        'type': 'chat_message_message',
                        'chat_message': chat_message,
                        'sender': self.username
                    }
                )

    # 친구 추가 메시지를 처리하는 메서드
    async def friend_add_message(self, event):
        friend_add = event['friend_add']

        # 메시지를 WebSocket으로 전송
        await self.send(text_data=json.dumps({
            'friend_add': friend_add
        }))

    # 친구 삭제 메시지를 처리하는 메서드
    async def friend_delete_message(self, event):
        friend_delete = event['friend_delete']

        # 메시지를 WebSocket으로 전송
        await self.send(text_data=json.dumps({
            'friend_delete': friend_delete
        }))

    # 유저 정보를 데이터베이스에서 가져오는 비동기 메서드
    @database_sync_to_async
    def get_user(self, username):
        User = get_user_model()
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

    # 친구 관계를 생성하는 비동기 메서드
    @database_sync_to_async
    def create_friendship(self, user, friend):
        friendship1, created1 = Friendship.objects.get_or_create(
            user=user,
            friend=friend
        )
        friendship2, created2 = Friendship.objects.get_or_create(
            user=friend,
            friend=user
        )
        return friendship1, friendship2

    # 친구 관계를 삭제하는 비동기 메서드
    @database_sync_to_async
    def delete_friendship(self, user, friend):
        Friendship.objects.filter(user=user, friend=friend).delete()
        Friendship.objects.filter(user=friend, friend=user).delete()

    # 채팅 시작 메시지를 처리하는 메서드
    async def chat_start_message(self, event):
        chat_start = event['chat_start']
        await self.send(text_data=json.dumps(chat_start))

    # 채팅 메시지를 데이터베이스에 저장하는 비동기 메서드
    @database_sync_to_async
    def create_chat_message(self, sender, receiver, message):
        chat_message = ChatMessage(
            sender=sender,
            receiver=receiver,
            message=message,
        )
        chat_message.save()

    # 채팅 메시지를 처리하는 메서드
    async def chat_message_message(self, event):
        chat_message = event['chat_message']
        sender = event['sender']

        # 메시지를 WebSocket으로 전송
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'chat_message': chat_message,
            'sender': sender
        }))


class CallConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

        # response to client, that we are connected.
        self.send(text_data=json.dumps({
            'type': 'connection',
            'data': {
                'message': "Connected"
            }
        }))

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.my_name,
            self.channel_name
        )

    # Receive message from client WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        # print(text_data_json)

        eventType = text_data_json['type']

        if eventType == 'login':
            name = text_data_json['data']['name']

            # we will use this as room name as well
            self.my_name = name

            # Join room
            async_to_sync(self.channel_layer.group_add)(
                self.my_name,
                self.channel_name
            )
        
        if eventType == 'call':
            name = text_data_json['data']['name']
            print(self.my_name, "is calling", name);
            # print(text_data_json)


            # to notify the callee we sent an event to the group name
            # and their's groun name is the name
            async_to_sync(self.channel_layer.group_send)(
                name,
                {
                    'type': 'call_received',
                    'data': {
                        'caller': self.my_name,
                        'rtcMessage': text_data_json['data']['rtcMessage']
                    }
                }
            )

        if eventType == 'answer_call':
            # has received call from someone now notify the calling user
            # we can notify to the group with the caller name
            
            caller = text_data_json['data']['caller']
            # print(self.my_name, "is answering", caller, "calls.")

            async_to_sync(self.channel_layer.group_send)(
                caller,
                {
                    'type': 'call_answered',
                    'data': {
                        'rtcMessage': text_data_json['data']['rtcMessage']
                    }
                }
            )

        if eventType == 'ICEcandidate':

            user = text_data_json['data']['user']

            async_to_sync(self.channel_layer.group_send)(
                user,
                {
                    'type': 'ICEcandidate',
                    'data': {
                        'rtcMessage': text_data_json['data']['rtcMessage']
                    }
                }
            )

    def call_received(self, event):

        # print(event)
        print('Call received by ', self.my_name )
        self.send(text_data=json.dumps({
            'type': 'call_received',
            'data': event['data']
        }))


    def call_answered(self, event):

        # print(event)
        print(self.my_name, "'s call answered")
        self.send(text_data=json.dumps({
            'type': 'call_answered',
            'data': event['data']
        }))


    def ICEcandidate(self, event):
        self.send(text_data=json.dumps({
            'type': 'ICEcandidate',
            'data': event['data']
        }))