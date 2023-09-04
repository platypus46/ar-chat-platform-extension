"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from mainapp import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', views.login_view, name='login'),
    path('lobby/<str:username>/', views.lobby_view, name='lobby'),
    path('test/', views.test_view, name='test'),
    path('test1/', views.test1_view, name='test1'),
    path('validate_step/<int:step>/', views.validate_step, name='validate_step'),
    path('register_login/', views.register, name='register'),
    path('update_profile/', views.update_profile, name='update_profile'),
    path('transcribe/', views.transcribe, name='transcribe'),
    path('save_gpt_api_key/', views.save_gpt_api_key, name='save_gpt_api_key'),
    path('get_friends_and_conversations/', views.get_friends_and_conversations, name='get_friends_and_conversations'),
    path('get_gpt_answer/', views.get_gpt_answer_ajax, name='get_gpt_answer_ajax'),
    path('shop/<str:username>',views.subscription_shop, name= 'shop'),
]

if settings.DEBUG:  # 개발 모드에서만
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)