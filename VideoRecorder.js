export class VideoRecorder {
  constructor() {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');

    this.video = videoElement;
    this.canvas = canvasElement;
    this.recordedVideo = null;
    this.overlay = document.getElementById('overlay');
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.overlayImage = new Image();
    this.overlayImage.src = this.overlay.src;
  }

  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.video.srcObject = stream;

    const videoTrack = stream.getVideoTracks()[0];
    const processor = new MediaStreamTrackProcessor(videoTrack);
    const generator = new MediaStreamTrackGenerator({ kind: 'video' });
    const writer = generator.writable.getWriter();
    const reader = processor.readable.getReader();

    const { width, height } = this.video.getBoundingClientRect();
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
      ctx.drawImage(this.overlayImage, 0, 0, width / 2, height / 2);
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

  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }

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
