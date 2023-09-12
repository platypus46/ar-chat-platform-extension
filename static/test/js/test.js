let currentQuestionPage = 0;
let currentAnswerPage = 0;

function GPTQuestion() {
  let gptsttText = document.querySelector("#sttText");
  let gptinputButton = document.querySelector("#input-button");
  const miscContainer = document.getElementById("MiscContainer");

  const maxCharsPerLine = 20; // 예: 각 줄에 20자까지만 표시
  // 임의의 장문 질문
  let longQuestion = gptsttText.getAttribute("value") || "질문";

  setInterval(function () {
    const newQuestion = gptsttText.getAttribute("value");
    if (longQuestion !== newQuestion) {
      longQuestion = newQuestion;
      const questionPages = paginateText(longQuestion, maxCharsPerLine, 2);
      updateQuestionPage(questionPages);
    }
  }, 500);

  gptinputButton.addEventListener("click", function () {
    fetch("/get_gpt_answer/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"), // Django CSRF token
      },
      body: JSON.stringify({ question: longQuestion }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Received data from server:", data); // 추가
        longAnswer = data.answer;
        const answerPages = paginateText(longAnswer, maxCharsPerLine, 5);
        updateAnswerPage(answerPages);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  // Django의 CSRF 토큰을 가져오는 함수
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

  // 임의의 장문 대답
  let longAnswer = "대답";

  // 텍스트를 여러 페이지로 분할하는 함수
  function paginateText(text, charsPerLine, linesPerPage) {
    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length > charsPerLine) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
      currentLine += word + " ";
    });
    if (currentLine) lines.push(currentLine.trim());

    let pages = [];
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pages.push(lines.slice(i, i + linesPerPage).join("\n"));
    }

    return pages;
  }

  const questionPages = paginateText(longQuestion, maxCharsPerLine, 2);
  const answerPages = paginateText(longAnswer, maxCharsPerLine, 5);

  const totalQuestionPages = questionPages.length;
  const totalAnswerPages = answerPages.length;

  // 질문 칸 생성
  const questionEntity = document.createElement("a-entity");
  questionEntity.setAttribute("id", "question-text");
  questionEntity.setAttribute(
    "text",
    `value: ${questionPages[currentQuestionPage]}; color: white; align: center; width: 0.35;`
  );
  questionEntity.setAttribute(
    "geometry",
    "primitive: plane; width: 0.18; height: 0.1"
  );
  questionEntity.setAttribute("position", `0 0.1 0.01`); // z값 조절
  miscContainer.appendChild(questionEntity);

  // 대답 칸 생성
  const answerEntity = document.createElement("a-entity");
  answerEntity.setAttribute("id", "answer");
  answerEntity.setAttribute(
    "text",
    `value: Answer: ${answerPages[currentAnswerPage]}; color: white; align: center; width: 0.35;`
  );
  answerEntity.setAttribute(
    "geometry",
    "primitive: plane; width: 0.18; height: 0.15"
  );
  answerEntity.setAttribute("position", `0 -0.1 0.01`); // 수정된 부분
  miscContainer.appendChild(answerEntity);
  //버튼 만들기 펑션
  function createButton(textValue, position, clickCallback) {
    const buttonEntity = document.createElement("a-entity");
    buttonEntity.setAttribute(
      "geometry",
      "primitive: plane; width: 0.1; height: 0.05"
    );
    buttonEntity.setAttribute("material", "color: #333");
    buttonEntity.setAttribute("position", position);
    buttonEntity.setAttribute("class", "clickable");
    buttonEntity.addEventListener("click", clickCallback);

    const textEntity = document.createElement("a-entity");
    textEntity.setAttribute(
      "text",
      `value: ${textValue}; color: white; align: center; width: 0.5;` // width를 0.09로 조절하여 텍스트 크기를 조정
    );
    textEntity.setAttribute("position", "0 0 0.01"); // Slightly in front of the button plane for visibility
    buttonEntity.appendChild(textEntity);

    return buttonEntity;
  }
  // 질문에 대한 페이지네이션 버튼
  const questionPrevButton = createButton(
    "이전",
    `0.175 0.05 0.01`,
    function () {
      if (currentQuestionPage > 0) {
        currentQuestionPage--;
        updateQuestionPage();
      }
    }
  );
  questionEntity.appendChild(questionPrevButton);

  const questionNextButton = createButton(
    "다음",
    `0.175 -0.05 0.01`,
    function () {
      if (currentQuestionPage < totalQuestionPages - 1) {
        currentQuestionPage++;
        updateQuestionPage();
      }
    }
  );
  questionEntity.appendChild(questionNextButton);

  const answerPrevButton = createButton(
    "이전",
    `0.175 0.05 0.01`,
    function () {
      if (currentAnswerPage > 0) {
        currentAnswerPage--;
        updateAnswerPage();
      }
    }
  );
  answerEntity.appendChild(answerPrevButton);

  const answerNextButton = createButton(
    "다음",
    `0.175 -0.05 0.01`,
    function () {
      if (currentAnswerPage < totalAnswerPages - 1) {
        currentAnswerPage++;
        updateAnswerPage();
      }
    }
  );
  answerEntity.appendChild(answerNextButton);
  // 페이지 업데이트 함수 수정
  function updateQuestionPage(questionPages) {
    const questionEntity = document.getElementById("question-text");
    if (questionEntity) {
      const textComponent = questionEntity.getAttribute("text");
      textComponent.value = questionPages[currentQuestionPage];
      questionEntity.setAttribute("text", textComponent);
    }
  }

  function updateAnswerPage(answerPages) {
    const answerEntity = document.getElementById("answer");
    if (answerEntity) {
      const textComponent = answerEntity.getAttribute("text");
      textComponent.value = "Answer: " + answerPages[currentAnswerPage];
      answerEntity.setAttribute("text", textComponent);
    }
  }
}