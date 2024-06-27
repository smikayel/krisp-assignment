export class VideoRecorder {

  /**
   * video recorder constructor, to setup all the required
   * attributes for video manipulations
   */
  constructor() {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const overlayUpload = document.getElementById('overlayUpload');

    this.video = videoElement;
    this.canvas = canvasElement;
    this.recordedVideo = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.overlayImage = new Image();

    overlayUpload.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.overlayImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  /**
   * start the video stream to be able to show the streaming, and recording
   */
  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.video.srcObject = stream;

    const videoTrack = stream.getVideoTracks()[0];
    const processor = new MediaStreamTrackProcessor(videoTrack);
    const generator = new MediaStreamTrackGenerator({ kind: 'video' });
    const writer = generator.writable.getWriter();
    const reader = processor.readable.getReader();

    // give the dimensions for the video
    const width = 600;
    const height = 480;
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');

    const processFrame = async () => {
      const result = await reader.read();
      if (result.done) {
        writer.close();
        return;
      }

      const frame = result.value;
      ctx.drawImage(frame, 0, 0, width, height);
      if (this.overlayImage.src) {
        ctx.drawImage(this.overlayImage, 0, 0, width / 2, height / 2);
      }
      const processedFrame = new VideoFrame(this.canvas, { timestamp: frame.timestamp });
      writer.write(processedFrame);
      frame.close();
      processedFrame.close();

      processFrame();
    };

    processFrame();

    const processedStream = new MediaStream([generator]);
    this.mediaRecorder = new MediaRecorder(processedStream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      this.recordedVideo = blob;
      if (this.resolveRecordedVideo) {
        this.resolveRecordedVideo(blob);
      }
    };

    this.mediaRecorder.start();
  }

  /**
   * stop the video recording stream
   */
  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }

  /**
   * method will resolve the recorded video
   * @returns the video stream as the blob data
   */
  getRecordedVideo() {
    return new Promise((resolve) => {
      if (this.recordedVideo) {
        resolve(this.recordedVideo);
      } else {
        this.resolveRecordedVideo = resolve;
      }
    });
  }
}
