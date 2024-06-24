export class Recorder {
  constructor(workerScript) {
    this.worker = new Worker(workerScript);
    this.worker.onmessage = this.onWorkerMessage.bind(this);
    this.mediaRecorder = null;
    this.stream = null;
    this.recordedChunks = [];
    this.recording = false;
  }

  async start(constraints) {
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType });
      this.recordedChunks = [];

      this.worker.postMessage({ type: 'data', data: blob });

      this.stream.getTracks().forEach(track => track.stop());
    };

    this.mediaRecorder.start();
    this.recording = true;
  }

  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    this.recording = false;
  }

  onWorkerMessage(event) {
    // To be overridden by subclasses
  }
}
