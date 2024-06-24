import { Recorder } from "./Recorder.js";


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
