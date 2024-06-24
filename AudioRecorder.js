import { Recorder } from "./Recorder.js";


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
