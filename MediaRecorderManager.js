

export class AudioRecorder extends Recorder {
  constructor(audioWorkerPath) {
    super(audioWorkerPath);
  }

  onWorkerMessage(event) {
    if (event.data.type === 'processedData') {
      console.log("Processed audio data received:", event.data.data);
      this.processedData = event.data.data;
      if (this.onProcessedData) this.onProcessedData(this.processedData);
    }
  }
}

export class VideoRecorder extends Recorder {
  constructor(videoWorkerPath) {
    super(videoWorkerPath);
  }

  onWorkerMessage(event) {
    if (event.data.type === 'processedData') {
      console.log("Processed video data received:", event.data.data);
      this.processedData = event.data.data;
      if (this.onProcessedData) this.onProcessedData(this.processedData);
    }
  }
}


export class MediaRecorderManager {
  constructor() {
    this.audioRecorder = new AudioRecorder('audioWorker.js');
    this.videoRecorder = new VideoRecorder('videoWorker.js');

    this.audioRecorder.worker.onmessage = this.onAudioMessage.bind(this);
    this.videoRecorder.worker.onmessage = this.onVideoMessage.bind(this);

    this.isRecording = false;
    this.audioData = null;
    this.videoData = null;

    this.initPromises();
  }

  initPromises() {
    this.audioPromise = new Promise((resolve) => {
      this.audioPromiseResolve = resolve;
    });
    this.videoPromise = new Promise((resolve) => {
      this.videoPromiseResolve = resolve;
    });
  }

  async startRecording() {
    if (!this.isRecording) {
      await this.audioRecorder.start({ audio: true });
      await this.videoRecorder.start({ video: true });
      this.isRecording = true;
      console.log("Media recording started");
      this.enableStopButton();
    }
  }

  stopRecording() {
    if (this.isRecording) {
      this.audioRecorder.stop();
      this.videoRecorder.stop();
      this.isRecording = false;
      console.log("Media recording stopped");

      Promise.all([this.audioPromise, this.videoPromise])
        .then(([audioData, videoData]) => {
          this.combineMedia(audioData, videoData);
        })
        .catch(err => console.error("Error combining media:", err));
    }
  }

  enableStopButton() {
    const stopButton = document.getElementById('recorderStop');
    stopButton.disabled = false;
  }

  onAudioMessage(event) {
    console.log("Audio data received:", event.data.data);
    this.audioData = event.data.data;
    this.audioPromiseResolve(this.audioData);
  }

  onVideoMessage(event) {
    console.log("Video data received:", event.data.data);
    this.videoData = event.data.data;
    this.videoPromiseResolve(this.videoData);
  }

  async combineMedia(audioBlob, videoBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const videoUrl = URL.createObjectURL(videoBlob);

    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.muted = true;
    videoElement.play();

    const canvas = document.getElementById('videoCanvas');
    const ctx = canvas.getContext('2d');

    videoElement.onloadedmetadata = () => {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      this.drawVideoFrame(videoElement, ctx, canvas);
    };
  }

  drawVideoFrame(videoElement, ctx, canvas) {
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    if (!videoElement.paused && !videoElement.ended) {
      requestAnimationFrame(() => this.drawVideoFrame(videoElement, ctx, canvas));
    }
  }

}
