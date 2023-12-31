from django.contrib.auth.models import AbstractUser
from django.db import models
import os
from django.conf import settings

def profile_pic_directory_path(instance, filename):
    extension = 'jpg'
    
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
    gpt_api_key=models.CharField(max_length=100, default='')
    is_online = models.BooleanField(default=False)  
    is_system_user = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        is_new = not self.pk  # 새로운 사용자인지 확인
        super().save(*args, **kwargs) 

        if is_new:  
            hand_type = SubscriptionType.objects.get_or_create(name="Hand")[0]
            controller_type = SubscriptionType.objects.get_or_create(name="Controller")[0]


            two_d_type = SubscriptionType.objects.get_or_create(name="2D")[0]
            three_d_type = SubscriptionType.objects.get_or_create(name="3D")[0]
            prompt_type = SubscriptionType.objects.get_or_create(name="Prompt")[0]
            chat_type = SubscriptionType.objects.get_or_create(name="Chat")[0]

            qa_service = Service.objects.get_or_create(name="Questions and Answers(AR)")[0]
            length_service = Service.objects.get_or_create(name="Length Measurement")[0]
            post_it_service = Service.objects.get_or_create(name="Post-It")[0]

            emotion_detection = Service.objects.get_or_create(name="Emotion Detection")[0]
            qa_subscription_td = Service.objects.get_or_create(name="Questions and Answers")[0]

            qa_subscription = Subscription.objects.create(user=self, service=qa_service)
            qa_subscription.types.add(three_d_type,hand_type, controller_type)

            length_subscription = Subscription.objects.create(user=self, service=length_service)
            length_subscription.types.add(three_d_type,hand_type)

            post_it_subscription = Subscription.objects.create(user=self, service=post_it_service)
            post_it_subscription.types.add(three_d_type,hand_type)

            emotion_detection_subscription = Subscription.objects.create(user=self, service=emotion_detection)
            emotion_detection_subscription.types.add(two_d_type, chat_type)

            qa_subscription_td_instance = Subscription.objects.create(user=self, service=qa_subscription_td)
            qa_subscription_td_instance.types.add(two_d_type, prompt_type)



class SubscriptionType(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Service(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()

    def __str__(self):
        return self.name

class Subscription(models.Model):
    user = models.ForeignKey(CustomUser, related_name='subscriptions', on_delete=models.CASCADE)
    service = models.ForeignKey(Service, related_name='subscribers', on_delete=models.CASCADE)
    types = models.ManyToManyField(SubscriptionType, related_name='subscriptions')



class Friendship(models.Model):
    user = models.ForeignKey(CustomUser, related_name='friendships', on_delete=models.CASCADE)
    friend = models.ForeignKey(CustomUser, related_name='friends', on_delete=models.CASCADE)


class FriendRequest(models.Model):  
    from_user = models.ForeignKey(CustomUser, related_name='friend_requests_sent', on_delete=models.CASCADE)
    to_user = models.ForeignKey(CustomUser, related_name='friend_requests_received', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_accepted = models.BooleanField(default=False)


class ChatRoom(models.Model):
    name = models.CharField(max_length=255, unique=True)
    participant1 = models.ForeignKey(CustomUser, related_name='chat_rooms1', on_delete=models.CASCADE)
    participant2 = models.ForeignKey(CustomUser, related_name='chat_rooms2', on_delete=models.CASCADE)


class ChatMessage(models.Model):
    chat_room = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE, null=True)
    sender = models.ForeignKey(CustomUser, related_name='sent_messages', on_delete=models.CASCADE)
    message = models.TextField()
    image = models.ImageField(upload_to='chat_images/', null=True, blank=True)
    audio_clip = models.FileField(upload_to='chat_audio/', null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def get_reaction_counts(self):
        reactions = self.emoji_reactions.all()
        reaction_counts = {reaction_type[0]: 0 for reaction_type in EmojiReaction.REACTION_CHOICES}
        for reaction in reactions:
            reaction_counts[reaction.reaction_type] += 1
        return reaction_counts

    def can_delete(self, user):
        return self.sender == user

    def delete_message(self):
        self.delete() 

    def is_visible_to(self, user):
        return user in self.chat_room.participants.all()

class EmojiReaction(models.Model):
    REACTION_CHOICES = (
        ('appreciate', 'Appreciate'),
        ('check', 'Check'),
        ('heart', 'Heart'),
        ('sad', 'Sad'),
        ('smile', 'Smile'),
        ('surprised', 'Surprised'),
        ('thumbup', 'Thumb Up'),
    )

    user = models.ForeignKey(CustomUser, related_name='emoji_reactions', on_delete=models.CASCADE)
    message = models.ForeignKey(ChatMessage, related_name='emoji_reactions', on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'message', 'reaction_type')



class Notification(models.Model):  
    user = models.ForeignKey(CustomUser, related_name='notifications', on_delete=models.CASCADE)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    related_request = models.ForeignKey(FriendRequest, null=True, blank=True, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)