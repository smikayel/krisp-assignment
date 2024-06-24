import { MediaRecorderManager } from "./MediaRecorderManager.js";

(() => {
  const mediaRecorder = new MediaRecorderManager()

  const startButton = document.querySelector('#recorderStart');
  const stopButton = document.querySelector('#recorderStop');
  startButton.addEventListener('click', () => {
    mediaRecorder.startRecording();
    stopButton.disabled = false;
    startButton.disabled = true;
  });

  stopButton.addEventListener('click', () => {
    mediaRecorder.stopRecording();
    stopButton.disabled = true;
    startButton.disabled = false;
  });
})();
