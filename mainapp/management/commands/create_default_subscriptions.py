from django.core.management.base import BaseCommand
from mainapp.models import CustomUser, SubscriptionType, Service, Subscription


class Command(BaseCommand):
    help = 'Create default subscriptions for all users'

    def handle(self, *args, **options):
        hand_type = SubscriptionType.objects.get_or_create(name="Hand")[0]
        controller_type = SubscriptionType.objects.get_or_create(name="Controller")[0]

        qa_service = Service.objects.get_or_create(name="Questions and Answers")[0]
        length_service = Service.objects.get_or_create(name="Length Measurement")[0]
        post_it_service = Service.objects.get_or_create(name="Post-It")[0]

        for user in CustomUser.objects.all():
            qa_subscription, created = Subscription.objects.get_or_create(user=user, service=qa_service)
            if created:
                qa_subscription.types.add(hand_type, controller_type)

            length_subscription, created = Subscription.objects.get_or_create(user=user, service=length_service)
            if created:
                length_subscription.types.add(hand_type)

            post_it_subscription, created = Subscription.objects.get_or_create(user=user, service=post_it_service)
            if created:
                post_it_subscription.types.add(hand_type)

        self.stdout.write(self.style.SUCCESS('Successfully created default subscriptions for all users'))