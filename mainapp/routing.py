# app/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/main/(?P<username>\w+)/$', consumers.FriendConsumer.as_asgi()),
    re_path(r'',consumers.CallConsumer.as_asgi()),
]