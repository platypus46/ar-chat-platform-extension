import os
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


def profile_pic_directory_path(instance, filename):
    extension = filename.split('.')[-1]
    
    filename_1 = f"profile/{instance.username}_1.{extension}"
    filename_2 = f"profile/{instance.username}_2.{extension}"
    
    full_path_1 = os.path.join(settings.MEDIA_ROOT, filename_1)
    full_path_2 = os.path.join(settings.MEDIA_ROOT, filename_2)
    
    if os.path.exists(full_path_1):
        os.remove(full_path_1)
        return filename_2
    elif os.path.exists(full_path_2):
        os.remove(full_path_2)
        return filename_1
    else:
        return filename_1

class CustomUser(AbstractUser):
    full_name = models.CharField(max_length=100, default='')
    profile_picture = models.ImageField(upload_to=profile_pic_directory_path, null=True, blank=True)
    is_on_call = models.BooleanField(default=False)

class Subscription(models.Model):
    user = models.ForeignKey(CustomUser, related_name='subscriptions', on_delete=models.CASCADE)
    subscribed_to = models.ForeignKey(CustomUser, related_name='subscribers', on_delete=models.CASCADE)

class Friendship(models.Model):
    user = models.ForeignKey(CustomUser, related_name='friendships', on_delete=models.CASCADE)
    friend = models.ForeignKey(CustomUser, related_name='friends', on_delete=models.CASCADE)

class ChatRoom(models.Model):
    participants = models.ManyToManyField(CustomUser, related_name='chat_rooms')

class ChatMessage(models.Model):
    chat_room = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE, null=True)
    sender = models.ForeignKey(CustomUser, related_name='sent_messages', on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def is_visible_to(self, user):
        return user in self.chat_room.participants.all()
