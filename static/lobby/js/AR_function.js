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

const pageUpbutton = document.getElementById("left"); //답변 이전페이지로 넘기기
const pageDownbutton = document.getElementById("right"); //답변 다음페이지로 넘기기

let postItcheck = false;
let selectedColor; 
let postItEvnetListner;

//포스트잇이 담겨질 배열
let createdPostIts = [];
let createdTextEntities = [];
let areElementsHidden = false; 

//질문 주기 체크
let checkQuestionInterval;


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

    let measurementText = document.querySelector("#sttText");

    measurementText.setAttribute("troika-text", `value: ${formatText(getLocalizedText("Length: Calculating..."))}`);

    if (!isBoxVisible) {
      subTextbar.setAttribute("troika-text", `value: ${getLocalizedText("Length: Calculating...").replace(/\n/g, "")}`);
    }
    else {
      subTextbar.setAttribute("troika-text", "value: ");
    }
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
                const roundedLength = parseFloat(length.toFixed(2));
                measurementText.setAttribute("troika-text", `value: ${formatText(getLocalizedText("Length: Value", { length: roundedLength }))}`);

                if (!isBoxVisible) {
                  subTextbar.setAttribute("troika-text", `value: ${getLocalizedText("Length: Value", { length: roundedLength }).replace(/\n/g, "")}`);
                }
                else {
                  subTextbar.setAttribute("troika-text", "value: ");
                }
                
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
        measurementText.setAttribute("troika-text", `value: ${formatText(getLocalizedText("Length: Initialized"))}`);

        if (!isBoxVisible) {
          subTextbar.setAttribute("troika-text", `value: ${getLocalizedText("Length: Initialized").replace(/\n/g, "")}`);
        }
        else {
          subTextbar.setAttribute("troika-text", "value: ");
        }
      }
    };

    input_Button.addEventListener("click", measureEventListener);
    eraserButton.addEventListener("click", eraserEventListener);
}

function GPTQuestion() {
  // 페이지네이션을 위한 변수 선언
  let currentPage = 0;
  let totalPages = 0;
  let pageLength = 150;  
  let gptsttText = document.querySelector("#sttText");
  const miscContainer = document.getElementById("MiscContainer");
  document.getElementById("Miscbutton").setAttribute("visible", false);


  let longQuestion = gptsttText.getAttribute('troika-text').value.replace(/\n/g, "") || "Ask a question";

  checkQuestionInterval = setInterval(function () {
    const newQuestion = gptsttText.getAttribute('troika-text').value;
    if (longQuestion !== newQuestion) {
      longQuestion = newQuestion;
      updateQuestion(longQuestion); 
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

  // 페이지 번호를 표시할 a-entity 요소 생성
  const pageEntity = document.createElement("a-entity");
  pageEntity.setAttribute("id", "page-number");
  pageEntity.setAttribute("text", `value: 1/1; color: white; align: center;`);
  pageEntity.setAttribute("geometry", "primitive: plane; width: 0.08; height: 0.04");
  pageEntity.setAttribute("position", `0 -0.2 0.02`);
  pageEntity.setAttribute("material", "color: #0000FF"); 
  miscContainer.appendChild(pageEntity);

  const questionEntity = document.createElement("a-entity");
  questionEntity.setAttribute("id", "question-text");
  questionEntity.setAttribute(
    "text",
    `value: ${longQuestion}; color: white; align: center; scale: 0.2`
  );
  questionEntity.setAttribute(
    "geometry",
    "primitive: plane; width: 0.22; height: 0.1"
  );
  questionEntity.setAttribute("position", `0 0.1 0.01`);
  questionEntity.setAttribute("material", "color: #9bc2cf"); 
  miscContainer.appendChild(questionEntity);

  const answerEntity = document.createElement("a-entity");
  answerEntity.setAttribute("id", "answer");
  answerEntity.setAttribute(
    "text",
    `value: ; color: white; align: center; scale: 0.2`
  );
  answerEntity.setAttribute(
    "geometry",
    "primitive: plane; width: 0.22; height: 0.17"
  );
  answerEntity.setAttribute("position", `0 -0.08 0.01`);
  answerEntity.setAttribute("material", "color: #9bc2cf"); 
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

  // 기존 updateAnswer 함수 수정
  function updateAnswer(answer) {
    const answerEntity = document.getElementById("answer");
    if (answerEntity) {
      const textComponent = answerEntity.getAttribute("text");
      textComponent.value = paginateAnswer(answer, currentPage);
      answerEntity.setAttribute("text", textComponent);

      // 전체 페이지 수 계산 및 페이지 번호 업데이트
      totalPages = Math.ceil(answer.length / pageLength);
      const pageNumberEntity = document.getElementById("page-number");
      if (pageNumberEntity) {
        const pageNumberTextComponent = pageNumberEntity.getAttribute("text");
        pageNumberTextComponent.value = `${currentPage + 1}/${totalPages}`;
        pageNumberEntity.setAttribute("text", pageNumberTextComponent);
      }
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

// 가시성을 토글하는 함수
function toggleVisibility() {
  areElementsHidden = !areElementsHidden; // 상태 토글

  const elementsToToggle = [
    document.querySelector("#palette"),
    document.querySelector("#p-pad"),
    document.querySelector("#zpad"),
    document.querySelector("#recordButton"),
    document.querySelector("#Text"),
  ];

  elementsToToggle.forEach((el) => {
    if (el) {
      el.setAttribute("visible", !areElementsHidden); // 가시성 설정
    }
  });
}

function colorEvent() {
  const colorBox = ["redBox", "orangeBox", "yellowBox", "greenBox", "blueBox", "violetBox", "purpleBox"];
  
  if (postItcheck) {
    colorBox.forEach((colorId) => {
      const color = document.getElementById(colorId);
      color.addEventListener("click", moveColor);
    });
  } else {
    colorBox.forEach((colorId) => {
      const color = document.getElementById(colorId);
      color.removeEventListener("click", moveColor);
    });
    ui.setAttribute("visible", "true");
    xypad.setAttribute("visible", "true");
    colorSelectorGroup.setAttribute('visible', "false");
  }
}

function moveColor(event) {
  selectedColor = event.target.getAttribute("data-color");
  const sphere = document.getElementById("selectedColorSphere");
  sphere.setAttribute("color", selectedColor);
}

function postIt() {
  const colorSelectorGroup = document.querySelector('#colorSelectorGroup');
  ui.setAttribute("visible", "false");
  xypad.setAttribute("visible", "false");
  colorSelectorGroup.setAttribute('visible', "true");
  postItcheck = true;
  document.getElementById("selectedColorSphere").addEventListener("click", toggleVisibility);
  colorEvent();

  postItEventListener = ()=> {
    const rightHandEntity = document.querySelector("#rightHand");
    if (rightHandEntity) {
      const handTrackingExtras = rightHandEntity.components["hand-tracking-extras"];
      if (handTrackingExtras && handTrackingExtras.getJoints) {
        const joints = handTrackingExtras.getJoints();
        if (joints && joints.getIndexTip) {
          const indexTip = joints.getIndexTip();
          const position = new THREE.Vector3();
          indexTip.getPosition(position);

          // 포스트잇 생성
          createPostIt(position, selectedColor);
        }
      }
    }
  };

  // null 체크를 추가합니다.
  if (input_Button) {
    input_Button.addEventListener("click", postItEventListener);
  } else {
    console.error("input_Button is null");
  }
}

function createPostIt(position, color) {
  const scene = document.querySelector("a-scene");
  const cameraEl = document.querySelector("a-camera");  // 카메라 엔터티 참조
  let zvalue=0.02;

  const postIt = document.createElement("a-box");
  postIt.setAttribute("position", position);
  postIt.setAttribute("color", color);
  postIt.setAttribute("width", "0.1");
  postIt.setAttribute("height", "0.1");
  postIt.setAttribute("depth", "0.01");
  

  let rotationString = "0 0 0";  // 기본 회전 값

  if (cameraEl) {
    const cameraPosition = cameraEl.getAttribute("position");
    const directionVec3 = {
      x: cameraPosition.x - position.x,
      z: cameraPosition.z - position.z
    };

    // y-축 회전을 계산합니다.
    let angleRad = Math.atan2(directionVec3.x, directionVec3.z);
    let angleDeg = THREE.MathUtils.radToDeg(angleRad);

    const dotProduct = directionVec3.x * 0 + directionVec3.z * 1;  
    if (dotProduct < 0) {
      zvalue=-0.04;
    }

    rotationString = `0 ${angleDeg} 0`;
  }

  postIt.setAttribute("rotation", rotationString);  // 포스트잇 회전 설정
  console.log(sttText.getAttribute("value")); 
  // 텍스트 엔터티 생성 및 속성 설정
  const textEntity = document.createElement("a-text");
  textEntity.setAttribute("value", sttText.getAttribute('troika-text').value);
  textEntity.setAttribute("align", "center");
  textEntity.setAttribute("position", `${position.x} ${position.y} ${position.z+zvalue}`);
  textEntity.setAttribute("width", 0.4);
  textEntity.setAttribute("rotation", rotationString);  // 텍스트 엔터티도 동일한 회전을 가지도록 설정

  // 한글 폰트 설정
  textEntity.setAttribute("text", "font", "/static/lobby/font/NanumGothic-Bold.json");
  textEntity.setAttribute("text", "fontImage", "/static/lobby/font/NanumGothic-Bold.png");
  textEntity.setAttribute("text", "shader", "msdf");  

  scene.appendChild(postIt);  
  scene.appendChild(textEntity);  

  createdPostIts.push(postIt);
  createdTextEntities.push(textEntity);
}


function onBackwardButtonClick() {
  const scene = document.querySelector("a-scene");
  document.getElementById("Miscbutton").setAttribute("visible", true);
  // 이벤트 리스너 제거
  if (input_Button) {
    if (measureEventListener) {
      input_Button.removeEventListener("click", measureEventListener);
    }
    if (gptClickListener) {
      clearInterval(checkQuestionInterval); 
      input_Button.removeEventListener("click", gptClickListener);
    }
    if (postItEventListener){
      input_Button.removeEventListener("click", postItEventListener);
    }
  }
  if(toggleVisibility){
    document.getElementById("selectedColorSphere").removeEventListener("click", toggleVisibility);
  }

  createdPostIts.forEach((postIt) => {
    scene.removeChild(postIt);
  });
  
  createdTextEntities.forEach((text) => {
    scene.removeChild(text);
  });
  document.getElementById("colorSelectorGroup").setAttribute("visible", false);
  
  createdPostIts = [];
  createdTextEntities = [];

  if (dotEntity) {
    scene.removeChild(dotEntity);
    dotEntity = null;
  }
  if (lineEntity) {
    scene.removeChild(lineEntity);
    lineEntity = null;
  }
  isFirstMeasurement = true;
  colorEvent()
  postItcheck=false;

  // 페이지네이션 이벤트 리스너 제거
  if(onUpButtonClick){
    pageUpbutton.removeEventListener("click", onUpButtonClick);
  }
  if(onDownButtonClick){
    pageDownbutton.removeEventListener("click", onDownButtonClick);
  }

  
   // pageEntity를 찾아서 제거
   const pageEntity = document.getElementById("page-number");
   if (pageEntity) {
     scene.removeChild(pageEntity);
   }
   document.querySelector("#sttText").setAttribute("value", "Misc Mode");
}