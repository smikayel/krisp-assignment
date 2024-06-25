export class Recorder {
  /**
   * main worker class from which we should extend for each type of recorders
   */
  constructor() {
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
}