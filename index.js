export class Recorder {
  /**
   * main worker class from which we should extend for each type of recorders
   * @param {string} workerScript path to script for the worker
   */
  constructor(workerScript) {
    this.worker = new Worker(workerScript);
    this.worker.onmessage = this.onWorkerMessage.bind(this);
    this.mediaRecorder = null;
    this.stream = null;
  }

  /**
   * start recorder
   * @param {object} constraints the configs or actions to configure the worker
   */
  async start(constraints) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.ondataavailable(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.stream.getTracks().forEach(track => track.stop());
      };

      // we should capture each chunk with 10 milliseconds
      this.mediaRecorder.start(10);

    } catch (error) {
      console.error('Error starting recorder:', error);
    }
  }

  /**
   * stop recorder
   */
  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }

  /**
   * we will get the worker emitted message here,
   * basically this method should be overridden in the sub class
   */
  onWorkerMessage(event) { }

  ondataavailable(data) { }
}

export class AudioRecorder extends Recorder {

  /**
   * in this class we will start the recording of the audio, 
   * we will send each 10 milliseconds to the worker, where we should able
   * to edit the chunk and get back the processed chunk
   * @param {string} audioWorkerPath the worker script path
   */
  constructor(audioWorkerPath) {
    super(audioWorkerPath);
    this.audioChunks = [];
    this.audioPromise = null;
    this.audioPromiseResolve = null;
  }

  /**
   * the start function for the recorder
   * @param {*} constraints the action/config which should be sent to worker
   */
  start(constraints) {
    super.start(constraints);
    this.audioPromise = new Promise((resolve) => {
      this.audioPromiseResolve = resolve;
    });
  }

  /**
   * in this method we can get the chunk data of the audio 
   * which we want to record
   * @param {*} data the chunk data of the audio
   */
  async ondataavailable(data) {
    this.audioChunks.push(data);
    this.worker.postMessage({ type: 'data', data: data });
  }

  /**
   * stop method for audio worker 
   */
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
  /**
   * in this class we will start the recording of the video, 
   * we will send each 10 milliseconds to the worker, where we should able
   * to edit the chunk and get back the processed chunk
   * @param {string} videoWorkerPath the worker script path
   */
  constructor(videoWorkerPath) {
    super(videoWorkerPath);
    this.videoChunks = [];
    this.videoPromise = null;
    this.videoPromiseResolve = null;
  }

  /**
   * the start function for the recorder
   * @param {*} constraints the action/config which should be sent to worker
   */
  start(constraints) {
    super.start(constraints);
    this.videoPromise = new Promise((resolve) => {
      this.videoPromiseResolve = resolve;
    });
  }

  /**
   * in this method we can get the chunk data of the video 
   * which we want to record
   * @param {*} data the chunk data of the video
   */
  async ondataavailable(data) {
    this.videoChunks.push(data);
    this.worker.postMessage({ type: 'data', data: data });

  }

  /**
   * this method will resolve the promise of the video Recording
   */
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
  /**
   * MediaRecorderManager to control audio and video recording
   */
  constructor() {
    this.audioRecorder = new AudioRecorder('audioWorker.js');
    this.videoRecorder = new VideoRecorder('videoWorker.js');

    this.audioRecorder.worker.onmessage = this.onAudioWorkerMessage.bind(this);
    this.videoRecorder.worker.onmessage = this.onVideoWorkerMessage.bind(this);

    this.isRecording = false;
  }

  /**
   * start method which will enable the recording process
   */
  startRecording() {
    if (!this.isRecording) {
      // Start audio and video recording
      this.audioRecorder.start({ audio: true });
      this.videoRecorder.start({ video: true });

      this.isRecording = true;
      console.log("Media recording started");
    }
  }

  /**
   * stop function to be able to stop the media recorder
   * here should be called the methods for the stopping
   * the audio and video recorders 
   */
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

  /**
   * the function which bounded to worker onMessage,
   * we can get here the events from audioWorker
   * @param {*} event 
   */
  onAudioWorkerMessage(event) { }

  /**
   * the function which bounded to worker onMessage,
   * we can get here the events from videoWorker
   * @param {*} event 
   */
  onVideoWorkerMessage(event) { }

  /**
   * method will create the full playback in canvas
   * @param {Blob} audioBlob full recorded audio
   * @param {Blob} videoBlob full recorded video
   */
  async createPlayback(audioBlob, videoBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const videoUrl = URL.createObjectURL(videoBlob);

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

    videoElement.onended = () => {
      URL.revokeObjectURL(videoUrl);
      URL.revokeObjectURL(audioUrl);
    };
  }

  /**
   * 
   * @param {Element} videoElement video element for the canvas video
   * @param {*} ctx the 2d context from the canvas
   * @param {*} canvas the main canvas where should be shown the video
   */
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
