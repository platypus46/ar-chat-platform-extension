# PLATYVERSE(Ar-Chat-Platform-Extension)

**2D, 3D 환경에서 1:1 채팅을 지원하며, '길이 측정', '포스트잇', 'GPT를 이용한 질문과 답변' 등 가능한 추가 기능을 사용할 수 있는 장고 웹 프로젝트입니다.**    
(It is a Django web project that supports 1:1 chatting in 2D and 3D environments, and can use additional functions such as 'length measurement', 'post-it', and 'questions and answers using GPT')  

**※본 페이지에는 여러 개의 GIF 이미지가 포함되어 있어 로딩에 시간이 다소 걸릴 수 있습니다. 모든 내용이 잘 표시될 때까지 잠시만 기다려 주세요. 감사합니다!**  
(This page contains several GIF images, so it may take some time to load. Please wait a moment for everything to display properly. Thank you!)

-------------
  
**[Test video 1]**  
![test3](https://github.com/platypus46/ar-chat-platform-extension/assets/89053845/74efa5bc-6974-43b6-b9e9-90118e6dd3ea)  
**말풍선이나 AI 버튼을 누르면 GPT, 감정인식 등의 추가 기능을 사용할 수 있습니다.**  
You can use additional features such as GPT and emotion recognition by pressing the speech bubble or AI button.  

※감정인식의 경우 API지원이 중단될 수도 있습니다.
  
**[Test video 2]**  
![test1](https://github.com/platypus46/ar-chat-platform-extension/assets/89053845/d5579283-7dbf-4548-8f7e-3ad011992b1d)  
**AR공간에서 1:1채팅을 하고 있는 장면**  
This is a 1:1 chatting scene in an AR space.
  
**[Test video 3]**  
![test2](https://github.com/platypus46/ar-chat-platform-extension/assets/89053845/7891551a-86e6-4374-a566-4ac5ffc8e41f)  
- GPT를 이용한 대답받기(Get answers using GPT)
- 길이측정(Length Measurement)  
- 포스트잇(Post-It)  

## Tools
![Django](https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white)
![A-Frame](https://img.shields.io/badge/A--Frame-EF2D5E.svg?style=for-the-badge&logo=a-frame&logoColor=white)
![Threejs](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)  
![Docker](https://img.shields.io/badge/Docker-2496ED.svg?&style=for-the-badge&logo=Docker&logoColor=white)

  
**(Emotion Classification API)**  
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white) ![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)  
 
   
  
## Usages
1.ngok설치  
2. ngrok url을 django settings.py에서 ALLOWED_HOSTS,CORS_ORIGIN_WHITELIST,CSRF_TRUSTED_ORIGINS에 각각 입력  
3. 터미널에서 docker-compose up --build 실행  
(실행 전 장고 키 입력 및 migrate,migrations필요)
  
  
## Contributors

[platypus46](https://github.com/platypus46)  
[BlackShrike](https://github.com/BlackShrike)  
[LHH-97](https://github.com/LHH-97)  

## Resource  
**API**  
- GPT-3.5-Turbo(질문 및 대답)  
- SpeechRecognition를 이용한 Google Cloud Speech AI사용(음성 인식)  
- 단발식 한국어 대화 데이터셋을 활용하여 감정 분석을 위해 미세 조정된 KcBERT 모델(감정 분류)  
  
       
**Background Image**      
[@HWANG_DARAM](https://hwang-daram.com/work/q=YToyOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjtzOjQ6InBhZ2UiO2k6Mjt9&bmode=view&idx=12493814&t=board) 
 
