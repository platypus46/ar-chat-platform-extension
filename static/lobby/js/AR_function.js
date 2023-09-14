let dotEntity = null;
let lineEntity = null;
let lineMaterial = null;
let isFirstMeasurement = true;

let input_Button = document.querySelector("#input-button"); 

let measureEventListener;
let eraserEventListener;

let longAnswer = "";  
let gptClickListener;
let loadingInterval; 

const pageUpbutton = document.getElementById("up"); //답변 이전페이지로 넘기기
const pageDownbutton = document.getElementById("down");//답변 다음페이지로 넘기기

function createDot(scene, position) {
  dotEntity = document.createElement("a-sphere");
  dotEntity.setAttribute("radius", 0.01);
  dotEntity.setAttribute("color", "black");
  dotEntity.setAttribute("position", position);
  scene.appendChild(dotEntity);
}

function createLine(scene, start, end) {
  lineEntity = document.createElement("a-entity");
  lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const points = [];
  points.push(new THREE.Vector3(start.x, start.y, start.z));
  points.push(new THREE.Vector3(end.x, end.y, end.z));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, lineMaterial);
  lineEntity.setObject3D("mesh", line);
  scene.appendChild(lineEntity);
}

function updateLine(start, end) {
  const points = [];
  points.push(new THREE.Vector3(start.x, start.y, start.z));
  points.push(new THREE.Vector3(end.x, end.y, end.z));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  lineEntity.getObject3D("mesh").geometry = geometry;
}

function calculateDistance(start, end) {
  return start.distanceTo(end) * 100;
}

function lengthMeasurement() {
    ui.setAttribute("visible", "false");
    talkpad.setAttribute("visible", "false");
    xypad.setAttribute("visible", "false");
    console.log("길이측정 활성화");

    let measurementText = document.querySelector("#sttText");
    measurementText.setAttribute("value", "현재 길이: 계산 중...");

    eraserButton = document.querySelector("#eraser-button");

    const scene = document.querySelector("a-scene");

    measureEventListener = () => {
      const rightHandEntity = document.querySelector("#rightHand");
      if (rightHandEntity) {
        const handTrackingExtras =
          rightHandEntity.components["hand-tracking-extras"];
        if (handTrackingExtras && handTrackingExtras.getJoints) {
          const joints = handTrackingExtras.getJoints();
          if (joints && joints.getIndexTip) {
            const indexTip = joints.getIndexTip();
            const position = new THREE.Vector3();
            indexTip.getPosition(position);

            if (isFirstMeasurement) {
              createDot(scene, position);
              isFirstMeasurement = false;
            } else {
              if (dotEntity && !lineEntity) {
                createLine(scene, dotEntity.getAttribute("position"), position);
              }
              if (lineEntity) {
                updateLine(dotEntity.getAttribute("position"), position);
                const length = calculateDistance(
                  new THREE.Vector3(
                    dotEntity.getAttribute("position").x,
                    dotEntity.getAttribute("position").y,
                    dotEntity.getAttribute("position").z
                  ),
                  position
                );
                measurementText.setAttribute(
                  "value",
                  `현재 길이: ${length.toFixed(2)} cm`
                );
              }
            }
          }
        }
      }
    };

    eraserEventListener = () =>  {
      if (dotEntity) {
        scene.removeChild(dotEntity);
        scene.removeChild(lineEntity);
        dotEntity = null;
        lineEntity = null;
        isFirstMeasurement = true; // Reset the flag
        measurementText.setAttribute("value", "현재 길이: 초기화됨");
      }
    };

    input_Button.addEventListener("click", measureEventListener);
    eraserButton.addEventListener("click", eraserEventListener);
}

function GPTQuestion() {
  // 페이지네이션을 위한 변수 선언
  let currentPage = 0;
  let totalPages = 0;
  let pageLength = 200;  
  let gptsttText = document.querySelector("#sttText");
  const miscContainer = document.getElementById("MiscContainer");

  let longQuestion = gptsttText.getAttribute("value") || "질문";

  setInterval(function () {
    const newQuestion = gptsttText.getAttribute("value");
    if (longQuestion !== newQuestion) {
      longQuestion = newQuestion;
      updateQuestion(longQuestion);  // 이 부분 추가
    }
  }, 500);

  gptClickListener = function () {
    startLoadingAnimation();

    fetch("/get_gpt_answer/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ question: longQuestion }),
    })
    .then((response) => response.json())
    .then((data) => {
      console.log("Received data from server:", data);
      longAnswer = data.answer;  // 원본 답변 업데이트
      stopLoadingAnimation();
      updateAnswer(longAnswer);
    })
    .catch((error) => {
      stopLoadingAnimation();
      console.error("Error:", error);
    });
  };

  input_Button.addEventListener("click", gptClickListener);

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const questionEntity = document.createElement("a-entity");
  questionEntity.setAttribute("id", "question-text");
  questionEntity.setAttribute(
    "text",
    `value: ${longQuestion}; color: white; align: center; ;`
  );
  questionEntity.setAttribute(
    "geometry",
    "primitive: plane; width: 0.28; height: 0.1"
  );
  questionEntity.setAttribute("position", `0 0.1 0.01`);
  miscContainer.appendChild(questionEntity);

  const answerEntity = document.createElement("a-entity");
  answerEntity.setAttribute("id", "answer");
  answerEntity.setAttribute(
    "text",
    `value: ; color: white; align: center; `
  );
  answerEntity.setAttribute(
    "geometry",
    "primitive: plane; width: 0.28; height: 0.17"
  );
  answerEntity.setAttribute("position", `0 -0.08 0.01`);
  miscContainer.appendChild(answerEntity);

  // 페이지네이션 함수
  function paginateAnswer(answer, page) {
    const start = page * pageLength;
    const end = start + pageLength;
    return answer.slice(start, end);
  } 
 // 페이지네이션 이벤트 리스너
  function onUpButtonClick() {
    if (currentPage > 0) {
      currentPage--;
      updateAnswer(longAnswer);  
    }
  }

  function onDownButtonClick() {
    if (currentPage < totalPages - 1) {
      currentPage++;
      updateAnswer(longAnswer);  
    }
  }

  // 이벤트 리스너 등록
  pageUpbutton.addEventListener("click", onUpButtonClick);
  pageDownbutton.addEventListener("click", onDownButtonClick);

  // 기존 updateAnswer() 함수 수정
  function updateAnswer(answer) {
    const answerEntity = document.getElementById("answer");
    if (answerEntity) {
      const textComponent = answerEntity.getAttribute("text");
      textComponent.value = paginateAnswer(answer, currentPage);  // 페이지네이션 적용
      answerEntity.setAttribute("text", textComponent);

      // 전체 페이지 수 계산
      totalPages = Math.ceil(answer.length / pageLength);
    }
  }

  function updateQuestion(question) {
    const questionEntity = document.getElementById("question-text");
    if (questionEntity) {
      const textComponent = questionEntity.getAttribute("text");
      textComponent.value = question;
      questionEntity.setAttribute("text", textComponent);
    }
  }

  function startLoadingAnimation() {
    let loadingText = '';
    const fullText = 'Loading...';
    let index = 0;
  
    // 이미 진행 중인 애니메이션을 정지
    if (loadingInterval) {
      clearInterval(loadingInterval);
    }
  
    loadingInterval = setInterval(() => {
      if (index < fullText.length) {
        loadingText += fullText[index];
        updateAnswer(loadingText);
        index++;
      } else {
        loadingText = '';
        index = 0;
      }
    }, 300);  // 300ms 마다 업데이트
  }
  
  function stopLoadingAnimation() {
    if (loadingInterval) {
      clearInterval(loadingInterval);
    }
  }
}


function onBackwardButtonClick() {
  // 이벤트 리스너 제거
  if (input_Button) {
    if (measureEventListener) {
      input_Button.removeEventListener("click", measureEventListener);
    }
    if (gptClickListener) {
      input_Button.removeEventListener("click", gptClickListener);
    }
  }

  const scene = document.querySelector("a-scene");
  if (dotEntity) {
    scene.removeChild(dotEntity);
    dotEntity = null;
  }
  if (lineEntity) {
    scene.removeChild(lineEntity);
    lineEntity = null;
  }
  isFirstMeasurement = true;

  // 페이지네이션 이벤트 리스너 제거
  if(onUpButtonClick){
    pageUpbutton.removeEventListener("click", onUpButtonClick);
  }
  if(onDownButtonClick){
    pageDownbutton.removeEventListener("click", onDownButtonClick);
  }
}