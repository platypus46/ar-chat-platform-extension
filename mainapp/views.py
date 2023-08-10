from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect
from django.http import JsonResponse
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from .models import CustomUser, Friendship

def login(request):
    return render(request, 'login.html')

def main_view(request, username):
    user = CustomUser.objects.get(username=username)
    friends = Friendship.objects.filter(user=user)
    return render(request, 'main.html', {'user': user, 'friends': friends})



#로그인 참고용 코드
def register_login(request):
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'register':
            username = request.POST.get('username')
            full_name = request.POST.get('full_name')
            password1 = request.POST.get('password1')
            password2 = request.POST.get('password2')
            user = CustomUser.objects.create_user(username=username, password=password1, full_name=full_name)
            login(request, user)
            return JsonResponse({'status': 'success'})
        elif action == 'login':
            form = CustomAuthenticationForm(request, data=request.POST)
            if form.is_valid():
                user = form.get_user()
                login(request, user)
                return JsonResponse({'status': 'success'})
            else:
                return JsonResponse({'status': 'error', 'errors': form.errors})
    return render(request, 'test.html', {'register_form': CustomUserCreationForm(), 'login_form': CustomAuthenticationForm()})

#회원가입 참고용 코드
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
