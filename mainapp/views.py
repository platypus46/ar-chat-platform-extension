from django.contrib.auth import  login
from django.shortcuts import render
from django.http import JsonResponse
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from .models import CustomUser, Friendship

def login_view(request):
    return render(request, 'login.html')

def lobby_view(request):
    return render(request, 'lobby.html')

def main_view(request, username):
    user = CustomUser.objects.get(username=username)
    friends = Friendship.objects.filter(user=user)
    return render(request, 'main.html', {'user': user, 'friends': friends})

def register(request):
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'register':
            username = request.POST.get('username')
            password = request.POST.get('password1')
            full_name = request.POST.get('full_name')

            # 사용자 생성
            user = CustomUser.objects.create_user(username=username, password=password, full_name=full_name)

            # 사용자 로그인
            login(request, user)
            return JsonResponse({'status': 'success'}) 

    return JsonResponse({'status': 'error'})


#코드 테스트 용 함수
def test_view(request):
    return render(request, 'test.html')
