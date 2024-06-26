export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.gainNode = null;
    this.stream = null;
    this.lastRecorded = null;
  }

  async startMicrophone() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.handleStream(this.stream);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  handleStream(stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    this.gainNode = audioContext.createGain();
    const destination = audioContext.createMediaStreamDestination();

    source.connect(this.gainNode);
    this.gainNode.connect(destination);
    this.gainNode.connect(audioContext.destination);

    this.mediaRecorder = new MediaRecorder(destination.stream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.lastRecorded = new Blob(this.recordedChunks, { type: 'audio/webm' });
    };
  }

  downloadLastRecord () {
    const url = URL.createObjectURL(this.lastRecorded);

    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = 'recording.webm';
    a.click();

    window.URL.revokeObjectURL(url);
  }

  setVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  async start() {
    await this.startMicrophone()
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.recordedChunks = [];
      this.mediaRecorder.start();
      console.log('Recording started');
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.stream.getTracks().forEach(function(track) {
        track.stop();
      });
      console.log('Recording stopped');
    }
  }
}
