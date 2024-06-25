import { Recorder } from "./Recorder.js";

export class VideoRecorder extends Recorder {
  /**
   * in this class we will start the recording of the video, 
   * we will send each 10 milliseconds to the worker, where we should able
   * to edit the chunk and get back the processed chunk
   */
  constructor() {
    super();
    this.videoChunks = [];
    this.videoPromise = null;
    this.videoPromiseResolve = null;
    this.videoElement = document.createElement('video');
    this.canvasElement = document.createElement('canvas');
    this.canvasContext = this.canvasElement.getContext('2d');
    document.body.appendChild(this.canvasElement);
  }

  /**
   * the start function for the recorder
   * @param {*} constraints the action/config which should be sent to worker
   */
  async start(constraints) {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.stream = stream;
    this.videoElement.srcObject = stream;
    this.videoElement.play();

    this.videoElement.onloadedmetadata = () => {
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
      this.drawVideoFrame();
    };

    super.start(constraints);
    this.videoChunks = []; // Clear previous video chunks
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
    console.log('chunk here');
  }

  /**
   * this method will resolve the promise of the video Recording
   */
  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.stream.getTracks().forEach(track => track.stop());
      if (this.videoPromiseResolve) {
        const videoBlob = new Blob(this.videoChunks, { type: 'video/webm' });
        this.videoPromiseResolve(videoBlob);
      }
    }
  }

  /**
   * Draws the current video frame onto the canvas
   */
  drawVideoFrame() {
    if (this.videoElement.paused || this.videoElement.ended) {
      return;
    }
    this.canvasContext.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
    requestAnimationFrame(() => this.drawVideoFrame());
  }
}
