import { MediaRecorderManager } from "./MediaRecorderManager.js";

(() => {
  const mediaRecorder = new MediaRecorderManager()


  const startButton = document.querySelector('#recorderStart');
  const stopButton = document.querySelector('#recorderStop');

  const volumeControl = document.getElementById('volume');
  volumeControl.addEventListener('input', function(e) {
    mediaRecorder.audioRecorder.setVolume(e.target.value)
  });

  startButton.addEventListener('click', () => {
    mediaRecorder.startRecording();
    stopButton.disabled = false;
    startButton.disabled = true;
  });

  stopButton.addEventListener('click', () => {
    mediaRecorder.stopRecording();
    stopButton.disabled = true;
    startButton.disabled = false;

    mediaRecorder.createPlayback();
  });
})();
