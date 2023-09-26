let isRecording = false;
let isBoxVisible = false; 
let mediaRecorder;
let audioChunks = [];
let sttText;
let recordButton;
let recordText;
let eraserButton;
let chatScroll;

AFRAME.registerComponent('char-pager', {
  schema: {
      chars: {default: ['0','1','2','3','4',
      '5','6','7','8','9',
      '!', '@', '#', '$', '%', 
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
                charEntity.setAttribute('color', 'yellow');
                if (sttText) {
                    let currentText = sttText.getAttribute('value');
                    sttText.setAttribute('value', currentText + char);
                }
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
  sttText = document.querySelector("#sttText");
  recordButton = document.getElementById("recordButton");
  recordText = document.getElementById("recordText");
  eraserButton = document.getElementById("eraser-button");
  chatScroll = document.querySelector("#chatScroll");

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob);
    
    const response = await fetch("/transcribe/", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    
    if (data.transcription) {
      sttText.setAttribute("value", formatText(data.transcription));
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
      mediaRecorder.start();
      recordText.setAttribute("value", "recording...");
      isRecording = true;
      recordButton.setAttribute("gltf-model", recordStopButtonModel);
    }
  });

  chatScroll.addEventListener("click", () => {
    const roundBox = document.querySelector("#roundBox");
    let targetPositionY;
  
    if (isBoxVisible) {
      // 현재 roundBox가 보이는 상태라면 회색 박스 안으로 숨기기
      targetPositionY = "-0.08"; // 회색 박스 안으로 숨기기 위한 y 좌표값
    } else {
      // 현재 roundBox가 숨겨진 상태라면 위로 슬라이드하여 보이게 하기
      targetPositionY = "0.08"; // 위로 슬라이드하기 위한 y 좌표값
    }
  
    // 애니메이션 효과를 적용하기 위해 A-Frame의 animation 컴포넌트를 사용합니다.
    roundBox.setAttribute("animation", `
      property: position;
      to: 0 ${targetPositionY} -0.01;
      dur: 500; 
      easing: easeInOutQuad;
    `);
  
    isBoxVisible = !isBoxVisible; // 상태 업데이트
  });


  eraserButton.addEventListener("click", eraseText);
}

function eraseText() {
  sttText.setAttribute("value", "");
}

function formatText(content) {
  const maxCharsPerLine = 5; 
  const lineHeight = 0.008; 

  const chunkedContent = [];
  for(let i = 0; i < content.length; i += maxCharsPerLine) {
      chunkedContent.push(content.substring(i, i + maxCharsPerLine));
  }

  const lines = chunkedContent.length;
  const newYPosition = 0.04 - (lines - 1) * lineHeight;
  sttText.setAttribute("position", `-0.04 ${newYPosition} 0.01`);

  return chunkedContent.join('\n');
}


window.addEventListener("DOMContentLoaded", (event) => {
  initRecorder().catch(err => console.error('Initialization failed:', err));
});
