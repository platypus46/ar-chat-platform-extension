from django.contrib import admin
from .models import CustomUser, Friendship, ChatMessage, Subscription, ChatRoom, Notification

admin.site.register(CustomUser)
admin.site.register(Friendship)
admin.site.register(Subscription)
admin.site.register(ChatMessage)
admin.site.register(ChatRoom)
admin.site.register(Notification)
