// import { MediaRecorderManager } from "./MediaRecorderManager.js";

import { AudioRecorder } from "./AudioRecorder.js";

(() => {
  // const mediaRecorder = new MediaRecorderManager()
  const mediaRecorder = new AudioRecorder()
  const startButton = document.querySelector('#recorderStart');
  const stopButton = document.querySelector('#recorderStop');

  const volumeControl = document.getElementById('volume');
  volumeControl.addEventListener('input', function(e) {
    mediaRecorder.setVolume(e.target.value)
  });

  startButton.addEventListener('click', () => {
    mediaRecorder.start();
    stopButton.disabled = false;
    startButton.disabled = true;
  });

  stopButton.addEventListener('click', () => {
    mediaRecorder.stop();
    stopButton.disabled = true;
    startButton.disabled = false;
  });
})();
