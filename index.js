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

    const videoContainer = document.querySelector('.VideoContainer')
    videoContainer.style.display = '';

    const playback = document.getElementById('videoCanvas')
    playback.style.display = 'none';
  });

  stopButton.addEventListener('click', () => {
    mediaRecorder.stopRecording();
    stopButton.disabled = true;
    startButton.disabled = false;
    mediaRecorder.createPlayback();

    const videoContainer = document.querySelector('.VideoContainer')
    videoContainer.style.display = 'none';

    const playback = document.getElementById('videoCanvas')
    playback.style.display = '';
  });
})();
