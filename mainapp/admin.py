
from django.contrib import admin
from .models import CustomUser, Friendship, ChatMessage

admin.site.register(CustomUser)
admin.site.register(Friendship)
admin.site.register(ChatMessage)
# Register your models here.