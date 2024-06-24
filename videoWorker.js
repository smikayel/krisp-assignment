self.onmessage = function(event) {
  if (event.data.type === 'data') {
    const chunk = event.data.data;
    const volume = event.data.volume;

    // Process the chunk (e.g., apply volume modification)
    const modifiedChunk = processChunk(chunk, volume);

    self.postMessage({ type: 'processedData', data: modifiedChunk });
  }
};

function processChunk(chunk, volume) {
  // Example: Modify chunk based on volume
  // This is where you would implement your specific processing logic
  return chunk;
}