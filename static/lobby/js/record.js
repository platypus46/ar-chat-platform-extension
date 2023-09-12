let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let sttText;
let recordButton;
let recordText;
let eraserButton;

async function initRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  
  // Initialization of global variables after ensuring mediaRecorder is set up
  sttText = document.querySelector("#sttText");
  recordButton = document.getElementById("recordButton");
  recordText = document.getElementById("recordText");
  eraserButton = document.getElementById("eraser-button");

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
      sttText.setAttribute("value", data.transcription);
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

  eraserButton.addEventListener("click", eraseText);
}

function eraseText() {
  sttText.setAttribute("value", "");
}

window.addEventListener("DOMContentLoaded", (event) => {
  initRecorder().catch(err => console.error('Initialization failed:', err));
});