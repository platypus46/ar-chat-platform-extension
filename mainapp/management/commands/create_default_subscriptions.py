from django.core.management.base import BaseCommand
from mainapp.models import CustomUser, Subscription

class Command(BaseCommand):
    help = 'Creates default subscriptions for all users'

    def handle(self, *args, **kwargs):
        # 시스템 사용자 생성
        system_usernames = ['질문하기']
        system_users = []
        for username in system_usernames:
            user, created = CustomUser.objects.get_or_create(username=username, is_system_user=True, defaults={'full_name': username})
            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created system user {username}'))
            system_users.append(user)

        # 모든 사용자에게 기본 구독 설정
        all_users = CustomUser.objects.filter(is_system_user=False)
        for user in all_users:
            for system_user in system_users:
                Subscription.objects.get_or_create(user=user, subscribed_to=system_user)
            self.stdout.write(self.style.SUCCESS(f'Successfully set default subscriptions for {user.username}'))