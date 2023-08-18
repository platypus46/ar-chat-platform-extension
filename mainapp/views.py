from django.contrib.auth import authenticate, login
from django.shortcuts import render
from django.http import JsonResponse
from .models import CustomUser, Friendship
from django.views.decorators.csrf import csrf_exempt
from .forms import ProfilePictureForm
from django.shortcuts import redirect

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('login-username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'status': 'success', 'username': user.username})
        else:
            return JsonResponse({'status': 'error', 'message': 'Invalid username or password'})

    return render(request, 'login.html')


def lobby_view(request, username):
    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return render(request, 'error.html', {'message': '잘못된 사용자입니다.'})

    context = {}
    if user.is_authenticated:
        context['username'] = user.username
        context['full_name'] = user.full_name
        context['profile_picture'] = user.profile_picture if user.profile_picture else None
        context['subscriptions'] = user.subscriptions.all()
        context['friends'] = user.friends.all()

    return render(request, 'lobby.html', context)


@csrf_exempt
def update_profile(request):
    if request.method == "POST" and request.user.is_authenticated:
        form = ProfilePictureForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            return JsonResponse({'status': 'success', 'image_url': request.user.profile_picture.url})
        else:
            return JsonResponse({'status': 'error'})
    return JsonResponse({'status': 'not allowed'})

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

def validate_step(request, step):
    if request.method == 'POST':
        if step == 1:
            username = request.POST.get('username')
            return JsonResponse({'status': 'success'})
        elif step == 2:
            full_name = request.POST.get('full_name')
            return JsonResponse({'status': 'success'})
        elif step == 3:
            password1 = request.POST.get('password1')
            password2 = request.POST.get('password2')
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'error', 'errors': 'Invalid step'})
    else:
        return JsonResponse({'status': 'error', 'errors': 'Invalid method'})

#코드 테스트 용 함수
def test_view(request):
    context={}
    return render(request, 'test.html',context=context)

def test1_view(request):
    context={}
    return render(request, 'test1.html')
