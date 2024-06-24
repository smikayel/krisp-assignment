import { Recorder } from "./Recorder.js";

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