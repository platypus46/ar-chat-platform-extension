let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let sttText = document.querySelector("#sttText");


function eraseText() {
  let sttText = document.querySelector("#sttText");
  sttText.setAttribute("value", "");
  sttText.setAttribute("width", "0.7");
}


async function initRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

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
      const sttText = document.querySelector("#sttText");
      sttText.setAttribute("value", data.transcription);
      sttText.setAttribute("width", "0.7");
    }
    audioChunks = [];
  };
}

window.addEventListener("DOMContentLoaded", (event) => {
  initRecorder();

  const recordButton = document.getElementById("recordButton");
  const recordText = document.getElementById("recordText");
  const eraserButton = document.getElementById("eraser-button");

  recordButton.addEventListener("click", () => {
    if (isRecording) {
      mediaRecorder.stop();
      recordText.setAttribute("value", "not recording");
      isRecording = false;
    } else {
      mediaRecorder.start();
      recordText.setAttribute("value", "recording...");
      isRecording = true;
    }
  });
  eraserButton.addEventListener("click", eraseText);
});