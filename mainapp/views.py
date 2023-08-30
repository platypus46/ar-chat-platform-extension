from django.contrib.auth import authenticate, login
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import CustomUser, FriendRequest, Friendship, Notification, ChatRoom, ChatMessage
from django.views.decorators.csrf import csrf_exempt
from .forms import ProfilePictureForm
import speech_recognition as sr
import subprocess
import logging
import json
import os

logger = logging.getLogger(__name__)

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
        context['gpt_api_key'] =user.gpt_api_key
        context['profile_picture'] = user.profile_picture if user.profile_picture else None
        context['subscriptions'] = user.subscriptions.all()
        context['friends'] = [friendship.friend for friendship in user.friendships.all()]
        context['notifications'] = Notification.objects.filter(user=user, is_read=False)

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
    
def convert_to_wav(input_file, output_file):
    command = ["ffmpeg", "-i", input_file, output_file]
    subprocess.run(command, check=True)

@csrf_exempt
def transcribe(request):
    if request.method == 'POST':
        recognizer = sr.Recognizer()
        audio_file = request.FILES['audio']

        temp_audio_path = "temp_audio.webm"
        wav_audio_path = "temp_audio.wav"

        try:
            # Save the audio file temporarily
            with open(temp_audio_path, 'wb+') as dest:
                for chunk in audio_file.chunks():
                    dest.write(chunk)

            # Convert the webm file to wav format
            convert_to_wav(temp_audio_path, wav_audio_path)

            # Use the converted wav file for recognition
            with sr.AudioFile(wav_audio_path) as source:
                audio_data = recognizer.record(source)
                try:
                    text = recognizer.recognize_google(audio_data, language="ko-kr")
                    print(f"Recognized Text: {text}")  # <-- 로그를 찍는 부분
                    return JsonResponse({'transcription': text})
                except sr.UnknownValueError:
                    print("Could not understand audio")  # <-- 로그를 찍는 부분
                    return JsonResponse({'error': 'Google 음성 인식이 오디오를 이해할 수 없습니다.'})
                except sr.RequestError:
                    print("Could not request results")  # <-- 로그를 찍는 부분
                    return JsonResponse({'error': 'Google 음성 인식 서비스에 요청을 할 수 없습니다.'})

        except Exception as e:
            print(f"An error occurred: {str(e)}")  # <-- 로그를 찍는 부분
            return JsonResponse({'error': f'오류가 발생했습니다: {str(e)}'})

        finally:
            # Clean up the temporary files
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
            if os.path.exists(wav_audio_path):
                os.remove(wav_audio_path)

    return JsonResponse({'error': '잘못된 요청 방식입니다.'})

@login_required
def get_friends_and_conversations(request):
    user = request.user
    friendships = user.friendships.all()  # 모든 친구 찾기
    friends_list = []
    
    for friendship in friendships:
        friend = friendship.friend
        chat_room, created = ChatRoom.objects.get_or_create(
            participant1=user, participant2=friend
        )
        messages = ChatMessage.objects.filter(
            chat_room=chat_room
        ).order_by('-timestamp')[:50]  # 최근 50개의 메시지만 가져옴

        # conversation 문자열을 만드는 부분을 수정
        conversation = '\n'.join([
            f"{msg.sender.full_name}: {msg.message}" for msg in messages
        ])
        
        
        friends_list.append({
            'name': friend.full_name,
            'conversation': conversation,
        })
    
    return JsonResponse({'friends': friends_list})

def save_gpt_api_key(request):
    if request.method == 'POST':
        user = request.user
        data = json.loads(request.body)
        gpt_api_key = data.get('gptApiKey')
        
        if user.is_authenticated:
            user.gpt_api_key = gpt_api_key
            user.save()
            return JsonResponse({"status": "success"})
        else:
            return JsonResponse({"status": "failure"})

#코드 테스트 용 함수
def test_view(request):
    context={}
    return render(request, 'test.html',context=context)

def test1_view(request):
    context={}
    return render(request, 'test1.html')
