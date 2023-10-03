let isRecording = false;
let isSubRecording = false; 
let isBoxVisible = false; 
let mediaRecorder;
let audioChunks = [];
let recordButton;
let recordText;
let eraserButton;
let chatScroll;
let sttText = document.querySelector("#sttText");
const subTextbar = document.getElementById("subTextbar");
let desiredScale = "0.7 0.7 1";

let currentLanguage = "en";  // 초기 언어 설정
let language_mode = document.querySelector("#language-mode");
let language_text = language_mode.querySelector("a-text");

let subRecordButton;
let canClickSpaceBar = true; 
let canClickCharPagerButtons = false;
let canClickEmojiPagerButtons = false;

let wasSubRecording = false; 

AFRAME.registerComponent('char-pager', {
  schema: {
      chars: {default: ['0','1','2','3','4',
      '5','6','7','8','9',
      '+','-','/','%','*',
      '!', '@', '#', '$', '=', 
      '^', '&', '*', '(', ')']},
      current: {default: 0}
  },
  init: function () {
      let data = this.data;
      let el = this.el;

      function refreshChars() {
          let start = data.current;
          let end = start + 5;
          let displayedChars = data.chars.slice(start, end);
          
          const totalWidth = 0.1;
          const numOfBoxes = 7; 
          const boxWidth = totalWidth / numOfBoxes;
          const spacing = boxWidth; 

          el.innerHTML = '';

          // 이전버튼
          let prevButton = document.createElement('a-text');
          prevButton.setAttribute('value', '<');
          prevButton.setAttribute('color', 'black');
          prevButton.setAttribute('position', {x: - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0.001}); 
          prevButton.setAttribute('scale', '0.02 0.02 0.02'); 

          let prevBox = document.createElement('a-box');
          prevBox.setAttribute('position', {x: - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0});
          prevBox.setAttribute('scale', `${boxWidth} 0.02 0.002`);
          prevBox.setAttribute('color', 'white');
          prevBox.setAttribute('class', 'clickable');

          prevBox.addEventListener('click', function() {
            if (canClickSpaceBar) return; 
            if (canClickEmojiPagerButtons) return;

            if (data.current > 0) {
                data.current -= 5;
                refreshChars();
            }
          });

          el.appendChild(prevBox);
          el.appendChild(prevButton);

          displayedChars.forEach((char, index) => {
            let charEntity = document.createElement('a-text');
            charEntity.setAttribute('value', char);
            charEntity.setAttribute('color', 'black');
            charEntity.setAttribute('position', {x: (index + 1) * spacing - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0.001}); 
            charEntity.setAttribute('scale', '0.03 0.03 0.03'); 
        
            let boxEntity = document.createElement('a-box');
            boxEntity.setAttribute('position', {x: (index + 1) * spacing - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0});
            boxEntity.setAttribute('scale', `${boxWidth} 0.02 0.002`);
            boxEntity.setAttribute('color', 'white');
            boxEntity.setAttribute('class', 'clickable');
        
            boxEntity.addEventListener('click', function() {
              if (canClickSpaceBar) return;  
              if (canClickEmojiPagerButtons) return;

              
              charEntity.setAttribute('color', 'yellow');
              if (sttText) {
                  let currentText = sttText.getAttribute('troika-text').value;
                  sttText.setAttribute('troika-text', `value: ${currentText + char}`);
              }
              setTimeout(function() {
                  charEntity.setAttribute('color', 'black'); 
              }, 1000); 
          });
          
        
            el.appendChild(boxEntity);
            el.appendChild(charEntity);
        });
        
          // 다음버튼
          let nextButton = document.createElement('a-text');
          nextButton.setAttribute('value', '>');
          nextButton.setAttribute('color', 'black');
          nextButton.setAttribute('position', {x: 6 * spacing - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0.001}); 
          nextButton.setAttribute('scale', '0.02 0.02 0.02'); 

          let nextBox = document.createElement('a-box');
          nextBox.setAttribute('position', {x: 6 * spacing - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0});
          nextBox.setAttribute('scale', `${boxWidth} 0.02 0.002`);
          nextBox.setAttribute('color', 'white');
          nextBox.setAttribute('class', 'clickable');

          nextBox.addEventListener('click', function() {
            if (canClickSpaceBar) return; 
            if (canClickEmojiPagerButtons) return;

            if (data.current + 5 < data.chars.length) {
                data.current += 5;
                refreshChars();
            }
          });

          el.appendChild(nextBox);
          el.appendChild(nextButton);
      }

      setTimeout(refreshChars, 100);
    }
});

AFRAME.registerComponent('emoji-pager', {
  schema: {
      chars: {default: ['😀','😃','😄','😁','😆',
      '😅','🤣','😂','🙂','🙃']},
      current: {default: 0}
  },
  init: function () {
      let data = this.data;
      let el = this.el;

      function refreshChars() {
          let start = data.current;
          let end = start + 5;
          let displayedChars = data.chars.slice(start, end);
          
          const totalWidth = 0.1;
          const numOfBoxes = 7; 
          const boxWidth = totalWidth / numOfBoxes;
          const spacing = boxWidth; 

          el.innerHTML = '';

          // 이전버튼
          let prevButton = document.createElement('a-text');
          prevButton.setAttribute('value', '<');
          prevButton.setAttribute('color', 'black');
          prevButton.setAttribute('position', {x: - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0.001}); 
          prevButton.setAttribute('scale', '0.02 0.02 0.02'); 

          let prevBox = document.createElement('a-box');
          prevBox.setAttribute('position', {x: - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0});
          prevBox.setAttribute('scale', `${boxWidth} 0.02 0.002`);
          prevBox.setAttribute('color', 'white');
          prevBox.setAttribute('class', 'clickable');

          prevBox.addEventListener('click', function() {
            if (canClickSpaceBar) return; 
            if (canClickCharPagerButtons) return;

            if (data.current > 0) {
                data.current -= 5;
                refreshChars();
            }
          });

          el.appendChild(prevBox);
          el.appendChild(prevButton);

          displayedChars.forEach((char, index) => {
            let charEntity = document.createElement('a-troika-text');
            charEntity.setAttribute('value', char); 
            charEntity.setAttribute('color', 'black'); 
            charEntity.setAttribute('position', {x: (index + 1) * spacing - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0.001}); 
            charEntity.setAttribute('scale', '0.03 0.03 0.03'); 
            charEntity.setAttribute('font', '/static/lobby/font/NanumGothic-Bold.ttf'); 
            charEntity.setAttribute('fontSize', '0.03'); 
            charEntity.setAttribute('letterSpacing', '0'); 
            charEntity.setAttribute('anchor', 'center'); 
        
            let boxEntity = document.createElement('a-box');
            boxEntity.setAttribute('position', {x: (index + 1) * spacing - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0});
            boxEntity.setAttribute('scale', `${boxWidth} 0.02 0.002`);
            boxEntity.setAttribute('color', 'white');
            boxEntity.setAttribute('class', 'clickable');
        
            boxEntity.addEventListener('click', function() {
              if (canClickSpaceBar) return;  
              if (canClickCharPagerButtons) return;
              
              charEntity.setAttribute('color', 'yellow');
              if (sttText) {
                  let currentText = sttText.getAttribute('troika-text').value;
                  sttText.setAttribute('troika-text', `value: ${currentText + char}`);
              }
              setTimeout(function() {
                  charEntity.setAttribute('color', 'black'); 
              }, 1000); 
          });
          
        
            el.appendChild(boxEntity);
            el.appendChild(charEntity);
        });
        
          // 다음버튼
          let nextButton = document.createElement('a-text');
          nextButton.setAttribute('value', '>');
          nextButton.setAttribute('color', 'black');
          nextButton.setAttribute('position', {x: 6 * spacing - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0.001}); 
          nextButton.setAttribute('scale', '0.02 0.02 0.02'); 

          let nextBox = document.createElement('a-box');
          nextBox.setAttribute('position', {x: 6 * spacing - (totalWidth / 2) + (boxWidth / 2), y: 0, z: 0});
          nextBox.setAttribute('scale', `${boxWidth} 0.02 0.002`);
          nextBox.setAttribute('color', 'white');
          nextBox.setAttribute('class', 'clickable');

          nextBox.addEventListener('click', function() {
            if (canClickSpaceBar) return; 
             if (canClickCharPagerButtons) return;

            if (data.current + 5 < data.chars.length) {
                data.current += 5;
                refreshChars();
            }
          });

          el.appendChild(nextBox);
          el.appendChild(nextButton);
      }

      setTimeout(refreshChars, 100);
    }
});


async function initRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  
  // Initialization of global variables after ensuring mediaRecorder is set up
  recordButton = document.getElementById("recordButton");
  recordText = document.getElementById("recordText");
  eraserButton = document.getElementById("eraser-button");
  chatScroll = document.querySelector("#chatScroll");
  subRecordButton = document.getElementById("subRecordButton");

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("language", currentLanguage);
    
    const response = await fetch("/transcribe/", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.transcription) {
      let newTranscription = "";
      if (isRecording) {
        newTranscription = formatText(data.transcription);
      } else { 
        newTranscription = formatText(sttText.getAttribute('troika-text').value + data.transcription);
      }
      sttText.setAttribute('troika-text', 'value', newTranscription);

      subRecordButton.setAttribute("color", "red"); 

      if (!isBoxVisible) {
        subTextbar.setAttribute('troika-text', 'value', (data.transcription).substring(0, 10).replace(/\n/g, ""));
      }
      else {
        subTextbar.setAttribute('troika-text', 'value', "");
      }
    }
    audioChunks = [];
  };

  recordButton.addEventListener("click", () => {
    if (isRecording) {
      mediaRecorder.stop();
      recordText.setAttribute("value", "not recording");
      isRecording = false;
      recordButton.setAttribute("gltf-model", recordButtonModel);
    } else {
      sttText.setAttribute("troika-text","value", ""); // 녹음 시작 전 sttText 초기화
      mediaRecorder.start();
      recordText.setAttribute("value", "recording...");
      isRecording = true;
      recordButton.setAttribute("gltf-model", recordStopButtonModel);
    }
  });

  subRecordButton.addEventListener("click", () => {
    if (isSubRecording) { 
      mediaRecorder.stop();
      subRecordButton.setAttribute("color", "red");  
      isSubRecording = false; 
    } else {
      mediaRecorder.start();
      subRecordButton.setAttribute("color", "white");  
      isSubRecording = true; 
    }
  });

  chatScroll.addEventListener("click", () => {
    const roundBox = document.querySelector("#roundBox");
    let targetPositionY;
  
    if (isBoxVisible) {
        targetPositionY = "-0.08"; 

        // `troika-text`의 `value` 속성을 설정합니다.
        const currentText = sttText.getAttribute('troika-text').value;
        subTextbar.setAttribute('troika-text', `value: ${currentText.substring(0, 10).replace(/\n/g, "")}`);
    } else {
        targetPositionY = "0.08"; 

        // `troika-text`의 `value` 속성을 빈 문자열로 설정합니다.
        subTextbar.setAttribute('troika-text', 'value: ');
    }
  
    roundBox.setAttribute("animation", `
        property: position;
        to: 0 ${targetPositionY} -0.02;
        dur: 500; 
        easing: easeInOutQuad;
    `);

    isBoxVisible = !isBoxVisible; 
});


  eraserButton.addEventListener("click", eraseText);
}

function eraseText() {
  sttText.setAttribute('troika-text', 'value', "");
}

function formatText(content) {
  const maxCharsPerLine = 8; 
  const lineHeight = 0.008; 

  const chunkedContent = [];
  for(let i = 0; i < content.length; i += maxCharsPerLine) {
      chunkedContent.push(content.substring(i, i + maxCharsPerLine));
  }

  const lines = chunkedContent.length;
  const newYPosition = 0.04 - (lines - 1) * lineHeight;
  sttText.setAttribute("position", `-0.02 ${newYPosition} 0.02`);

  return chunkedContent.join('\n');
}

document.querySelector("#backSpacebar").addEventListener("click", function() {
  let currentText = sttText.getAttribute('troika-text').value;
  let newText = currentText.slice(0, -1);
  sttText.setAttribute('troika-text', 'value', newText);
});

document.querySelector("#spaceBar").addEventListener("click", function() {
  let currentText = sttText.getAttribute('troika-text').value;
  let newText = currentText + ' ';
  sttText.setAttribute('troika-text', 'value', newText);
});

window.addEventListener("DOMContentLoaded", (event) => {
  initRecorder().catch(err => console.error('Initialization failed:', err));
});

