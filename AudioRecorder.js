export class AudioRecorder {

  constructor() {
    this.mediaRecorder = null;
    this.gainNode = null;
    this.recordedChunks = [];
    this.volume = 1.0;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.handleStream(stream);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  stop () {
    if (!this.mediaRecorder) return

    console.log(this.mediaRecorder)
    this.mediaRecorder.stop()
  }

  handleStream(stream) {
    const source = this.audioContext.createMediaStreamSource(stream);
    this.gainNode = this.audioContext.createGain();
    const destination = this.audioContext.createMediaStreamDestination();
    
    source.connect(this.gainNode);
    this.gainNode.connect(destination);
    this.gainNode.connect(this.audioContext.destination);

    const mediaRecorder = new MediaRecorder(destination.stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      console.log('here')
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = url;
      a.download = 'recording.webm';
      a.click();
      
      window.URL.revokeObjectURL(url);
    };

    this.mediaRecorder = mediaRecorder
  }

  setVolume(volume) {
    if (!this.gainNode) return
    this.volume = parseFloat(volume)
    this.gainNode.gain.value = this.volume;
  }

}
