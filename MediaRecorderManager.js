import { AudioRecorder } from "./AudioRecorder.js";
import { VideoRecorder } from "./VideoRecorder.js";

export class MediaRecorderManager {
  /**
   * MediaRecorderManager to control audio and video recording
   */
  constructor() {
    this.audioRecorder = new AudioRecorder();
    this.videoRecorder = new VideoRecorder();

    this.isRecording = false;
  }

  /**
   * start method which will enable the recording process
   */
  startRecording() {
    if (!this.isRecording) {
      this.audioRecorder.start();
      this.videoRecorder.start();
      this.isRecording = true;
      console.log("Media recording started");
    }
  }

  /**
   * stop function to be able to stop the media recorder
   * here should be called the methods for the stopping
   * the audio and video recorders
   */
  async stopRecording() {
    if (this.isRecording) {
      this.audioRecorder.stop();
      this.videoRecorder.stop();
      this.isRecording = false;
      console.log("Media recording stopped");
    }
  }

  /**
   * method will create the full playback in canvas
   */
  async createPlayback() {
    const videoBlob  = await this.videoRecorder.getRecordedVideo();
    const audioBlob = await this.audioRecorder.getRecordedAudio();

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
