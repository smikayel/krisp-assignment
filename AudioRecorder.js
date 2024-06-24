import { Recorder } from "./Recorder.js";

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
