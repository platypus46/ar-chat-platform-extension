from django.contrib.auth import authenticate, login
import re
from django.conf import settings  
from datetime import datetime
from django.shortcuts import render,redirect
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import CustomUser, FriendRequest, Friendship, Notification, ChatRoom, ChatMessage, Subscription
from django.views.decorators.csrf import csrf_exempt
from .forms import ProfilePictureForm
import speech_recognition as sr
import openai
import base64
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
        context['subscriptions'] = user.subscriptions.all()
        context['friends'] = [friendship.friend for friendship in user.friendships.all()]
        context['notifications'] = Notification.objects.filter(user=user, is_read=False)
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        if user.profile_picture:
            context['profile_picture_url'] = f"{user.profile_picture.url}?ver={timestamp}"
        else:
            context['profile_picture_url'] = f"/static/lobby/img/default_profile.png?ver={timestamp}"

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
            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({'status': 'error', 'errors': 'Username already exists'})
            elif re.search(r'\W', username):  # \W는 모든 특수 문자를 의미
                return JsonResponse({'status': 'error', 'errors': 'Username contains invalid characters'})
            else:
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
        lang = request.POST.get('language', 'en')
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
                    text = recognizer.recognize_google(audio_data, language=lang)
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
        room_name = f"{min(user.username, friend.username)}_{max(user.username, friend.username)}"
        
        chat_room, created = ChatRoom.objects.get_or_create(
            name=room_name,
            defaults={
                'participant1': user,
                'participant2': friend
            }
        )
        
        messages = ChatMessage.objects.filter(
            chat_room=chat_room
        ).order_by('-timestamp')[:5]    # 최근 5개의 메시지만 가져옴

        messages = list(reversed(list(messages)))

        # conversation 문자열을 만드는 부분을 수정
        conversation = '\n'.join([
            f"{msg.sender.username}: {msg.message}" for msg in messages
        ])

        print(f"ChatRoom Name: {chat_room.name}")  # 채팅방 이름 출력
        print(f"Conversation with {friend.full_name}:")  # 친구 이름 출력
        print(conversation)  # 대화 내용 출력

        friends_list.append({
        'name': friend.full_name,
        'username': friend.username,
        'conversation': conversation,
        'profile_picture': friend.profile_picture.url if friend.profile_picture else None  # 프로필 사진 추가
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

@csrf_exempt
def get_gpt_answer_ajax(request):
    if request.method == "POST":
        user = request.user  
        if not user.is_authenticated:  
            return JsonResponse({"status": "error", "message": "User not authenticated"})

        data = json.loads(request.body)
        question = data.get("question")
        user_api_key = user.gpt_api_key  

        if not user_api_key:  
            return JsonResponse({"status": "error", "message": "No GPT API Key found for the user"})

        answer = get_gpt_answer(question, user_api_key)
        return JsonResponse({"answer": answer})

def get_gpt_answer(question, api_key):
    openai.api_key = api_key  # API 키를 파라미터로 받아 사용
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": f"{question}"},
        {"role": "assistant", "content": ""}
    ]
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo", 
        messages=messages,
        max_tokens=600 
    )
    print(f"GPT-3 API Response: {response}")  
    return response['choices'][0]['message']['content'].strip()

#스크린샷 테스트용
def save_screenshot(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        image_data = data.get('image', None)
        
        if image_data:
            image_data = image_data.split(',')[1]

            image_data = base64.b64decode(image_data)

            directory = os.path.join(settings.STATIC_ROOT, 'lobby/test')
            file_path = os.path.join(directory, 'screenshot.jpg')

            # 디렉터리가 존재하지 않으면 생성
            if not os.path.exists(directory):
                os.makedirs(directory)

            with open(file_path, 'wb') as f:
                f.write(image_data)
            
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'no image data'})


def subscription_shop(request, username):
    try:
        # username에 해당하는 사용자 정보 가져오기
        target_user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return redirect('/login')  # 또는 다른 에러 처리 로직

    # 현재 로그인한 사용자 정보 가져오기
    current_user = request.user

    # 해당 사용자가 구독한 서비스들의 목록을 가져옴
    subscriptions = Subscription.objects.filter(user=target_user)
    subscribed_services = [subscription.service for subscription in subscriptions]

    # 컨텍스트에 필요한 정보 저장
    context = {
        'current_user': current_user,
        'target_user': target_user,
        'subscriptions': subscriptions,
        'subscribed_services': subscribed_services,
    }

    return render(request, 'subscription_shop.html', context)

def test1_view(request):
    return render(request, "test1.html")

#코드 테스트 용 함수
def test_view(request):
    context={}
    return render(request, 'test.html',context=context)