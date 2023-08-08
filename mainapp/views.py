from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect
from django.http import JsonResponse
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from .models import CustomUser, Friendship

def signup_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            raw_password = form.cleaned_data.get('password1')
            user = authenticate(username=username, password=raw_password)
            login(request, user)
            return redirect('main', username=user.username)
    else:
        form = CustomUserCreationForm()
    return render(request, 'signup.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('main', username=user.username)
    return render(request, 'login.html')

def main_view(request, username):
    user = CustomUser.objects.get(username=username)
    friends = Friendship.objects.filter(user=user)
    return render(request, 'main.html', {'user': user, 'friends': friends})



#참고용 코드입니다.
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
