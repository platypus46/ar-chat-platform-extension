# app/routing.py
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/lobby/<str:username>/', consumers.LobbyConsumer.as_asgi()),
]