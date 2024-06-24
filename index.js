export class Recorder {
  constructor(workerScript) {
    this.worker = new Worker(workerScript);
    this.worker.onmessage = this.onWorkerMessage.bind(this);
    this.mediaRecorder = null;
    this.stream = null;
  }

  async start(constraints) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.ondataavailable(event.data); // Handle data collection in subclasses
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start(10); // Capture chunks every 10 milliseconds

    } catch (error) {
      console.error('Error starting recorder:', error);
    }
  }

  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }

  onWorkerMessage(event) { }

  ondataavailable(data) { }
}

export class AudioRecorder extends Recorder {
  constructor(audioWorkerPath) {
    super(audioWorkerPath);
    this.audioChunks = [];
    this.audioPromise = null;
    this.audioPromiseResolve = null;
  }

  start(constraints) {
    super.start(constraints);
    this.audioPromise = new Promise((resolve) => {
      this.audioPromiseResolve = resolve;
    });
  }

  async ondataavailable(data) {
    this.audioChunks.push(data);
    this.worker.postMessage({ type: 'data', data: data });

  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.stream.getTracks().forEach(track => track.stop());
      if (this.audioPromiseResolve) {
        this.audioPromiseResolve(new Blob(this.audioChunks, { type: 'audio/webm' }));
      }
    }
  }
}


export class VideoRecorder extends Recorder {
  constructor(videoWorkerPath) {
    super(videoWorkerPath);
    this.videoChunks = [];
    this.videoPromise = null;
    this.videoPromiseResolve = null;
  }

  start(constraints) {
    super.start(constraints);
    this.videoPromise = new Promise((resolve) => {
      this.videoPromiseResolve = resolve;
    });
  }

  async ondataavailable(data) {
    this.videoChunks.push(data);
    this.worker.postMessage({ type: 'data', data: data });

  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.stream.getTracks().forEach(track => track.stop());
      if (this.videoPromiseResolve) {
        this.videoPromiseResolve(new Blob(this.videoChunks, { type: 'video/webm' }));
      }
    }
  }
}

export class MediaRecorderManager {
  constructor() {
    // Initialize audio and video recorders
    this.audioRecorder = new AudioRecorder('audioWorker.js');
    this.videoRecorder = new VideoRecorder('videoWorker.js');

    // Set up event listeners if needed for worker messages
    this.audioRecorder.worker.onmessage = this.onAudioWorkerMessage.bind(this);
    this.videoRecorder.worker.onmessage = this.onVideoWorkerMessage.bind(this);

    this.isRecording = false;
  }

  async startRecording() {
    if (!this.isRecording) {
      // Start audio and video recording
      await this.audioRecorder.start({ audio: true });
      await this.videoRecorder.start({ video: true });

      this.isRecording = true;
      console.log("Media recording started");
    }
  }

  stopRecording() {
    if (this.isRecording) {
      this.audioRecorder.stop();
      this.videoRecorder.stop();

      this.isRecording = false;
      console.log("Media recording stopped");

      Promise.all([
        this.audioRecorder.audioPromise,
        this.videoRecorder.videoPromise
      ]).then(([audioData, videoData]) => {
        this.createPlayback(audioData, videoData);
      }).catch(err => {
        console.error("Error combining media:", err);
      });
    }
  }

  // Handle audio worker message if needed
  onAudioWorkerMessage(event) { }

  // Handle video worker message if needed
  onVideoWorkerMessage(event) { }

  // Create playback elements for audio and video blobs
  async createPlayback(audioBlob, videoBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const videoUrl = URL.createObjectURL(videoBlob);

    // Example: Create video and audio elements for playback
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.play();

    const audioElement = document.createElement('audio');
    audioElement.src = audioUrl;
    audioElement.play();

    const canvas = document.getElementById('videoCanvas');
    const ctx = canvas.getContext('2d');

    videoElement.onloadedmetadata = () => {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      this.drawVideoFrame(videoElement, ctx, canvas);
    };

    audioElement.onloadedmetadata = () => {
      audioElement.play();
    };

    // Reset video and audio URLs after playback ends to release resources
    videoElement.onended = () => {
      URL.revokeObjectURL(videoUrl);
      URL.revokeObjectURL(audioUrl);
    };
  }

  drawVideoFrame(videoElement, ctx, canvas) {
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    if (!videoElement.paused && !videoElement.ended) {
      requestAnimationFrame(() => this.drawVideoFrame(videoElement, ctx, canvas));
    }
  }
}

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
