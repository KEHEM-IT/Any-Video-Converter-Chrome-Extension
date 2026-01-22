// Converter window - handles actual conversion
console.log('Converter window loaded');

let conversionData = null;
let isProcessing = false;

// Update status text
function updateStatus(text) {
  const statusText = document.getElementById('statusText');
  if (statusText) {
    statusText.textContent = text;
  }
}

// Listen for conversion requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startConversion') {
    if (isProcessing) {
      sendResponse({ success: false, error: 'Already processing' });
      return true;
    }
    
    isProcessing = true;
    conversionData = request.data;
    
    updateStatus('Starting conversion...');
    
    handleConversion(request.data)
      .then(result => {
        isProcessing = false;
        sendResponse({ success: true, data: result });
        updateStatus('Conversion complete!');
      })
      .catch(error => {
        isProcessing = false;
        sendResponse({ success: false, error: error.message });
        updateStatus('Conversion failed: ' + error.message);
      });
    
    return true; // Keep channel open for async response
  }
});

async function handleConversion({ fileData, fileName, outputFormat, quality }) {
  try {
    updateStatus('Loading file...');
    
    // Recreate blob from transferred data
    const blob = new Blob([fileData], { type: getMimeTypeFromFileName(fileName) });
    
    // Determine if source is video or audio
    const isSourceVideo = blob.type.startsWith('video/');
    const isTargetAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(outputFormat);
    
    let resultBlob;
    
    if (isTargetAudio && isSourceVideo) {
      updateStatus('Extracting audio from video...');
      resultBlob = await convertVideoToAudio(blob, outputFormat, quality);
    } else if (isTargetAudio) {
      updateStatus('Converting audio...');
      resultBlob = await convertAudioToAudio(blob, outputFormat, quality);
    } else {
      updateStatus('Converting video...');
      resultBlob = await convertVideoToVideo(blob, outputFormat, quality);
    }
    
    updateStatus('Finalizing...');
    
    // Convert blob to array buffer for transfer
    const arrayBuffer = await resultBlob.arrayBuffer();
    
    return {
      data: arrayBuffer,
      mimeType: resultBlob.type,
      size: resultBlob.size
    };
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
}

// Convert video to audio (extract audio track)
async function convertVideoToAudio(videoBlob, targetFormat, quality) {
  return new Promise(async (resolve, reject) => {
    try {
      updateStatus('Creating video element...');
      
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoBlob);
      video.muted = false;
      video.style.display = 'none';
      document.body.appendChild(video);
      
      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = () => rej(new Error('Failed to load video'));
        setTimeout(() => rej(new Error('Video load timeout')), 30000);
      });
      
      updateStatus('Extracting audio...');
      
      // Create audio context and extract audio
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      
      // Get audio stream
      const audioStream = dest.stream;
      
      // Determine MIME type
      let mimeType = getAudioMimeType(targetFormat);
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback to supported format
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else {
          reject(new Error('No supported audio format found'));
          return;
        }
      }
      
      const audioBitsPerSecond = getAudioBitrate(quality);
      const chunks = [];
      const recorder = new MediaRecorder(audioStream, { 
        mimeType,
        audioBitsPerSecond 
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const resultBlob = new Blob(chunks, { type: mimeType });
        URL.revokeObjectURL(video.src);
        document.body.removeChild(video);
        audioCtx.close();
        resolve(resultBlob);
      };
      
      recorder.onerror = (e) => {
        document.body.removeChild(video);
        reject(new Error('Audio extraction failed'));
      };
      
      updateStatus('Recording audio...');
      
      // Start recording and play video
      recorder.start(100);
      video.play().catch(e => {
        reject(new Error('Failed to play video: ' + e.message));
      });
      
      // Update progress
      const progressInterval = setInterval(() => {
        if (video.duration) {
          const progress = (video.currentTime / video.duration * 100).toFixed(0);
          updateStatus(`Recording audio... ${progress}%`);
        }
      }, 500);
      
      // Stop when video ends
      video.onended = () => {
        clearInterval(progressInterval);
        setTimeout(() => {
          recorder.stop();
          audioStream.getTracks().forEach(track => track.stop());
        }, 500);
      };
      
    } catch (error) {
      reject(error);
    }
  });
}

// Convert audio to audio
async function convertAudioToAudio(audioBlob, targetFormat, quality) {
  return new Promise(async (resolve, reject) => {
    try {
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(audioBlob);
      audio.style.display = 'none';
      document.body.appendChild(audio);
      
      await new Promise((res, rej) => {
        audio.onloadedmetadata = res;
        audio.onerror = () => rej(new Error('Failed to load audio'));
        setTimeout(() => rej(new Error('Audio load timeout')), 30000);
      });
      
      // Create audio context
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      
      const audioStream = dest.stream;
      
      let mimeType = getAudioMimeType(targetFormat);
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else {
          reject(new Error('No supported audio format found'));
          return;
        }
      }
      
      const audioBitsPerSecond = getAudioBitrate(quality);
      const chunks = [];
      const recorder = new MediaRecorder(audioStream, { 
        mimeType,
        audioBitsPerSecond 
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const resultBlob = new Blob(chunks, { type: mimeType });
        URL.revokeObjectURL(audio.src);
        document.body.removeChild(audio);
        audioCtx.close();
        resolve(resultBlob);
      };
      
      recorder.onerror = (e) => {
        document.body.removeChild(audio);
        reject(new Error('Audio conversion failed'));
      };
      
      recorder.start(100);
      audio.play().catch(e => {
        reject(new Error('Failed to play audio: ' + e.message));
      });
      
      // Update progress
      const progressInterval = setInterval(() => {
        if (audio.duration) {
          const progress = (audio.currentTime / audio.duration * 100).toFixed(0);
          updateStatus(`Converting... ${progress}%`);
        }
      }, 500);
      
      audio.onended = () => {
        clearInterval(progressInterval);
        setTimeout(() => {
          recorder.stop();
          audioStream.getTracks().forEach(track => track.stop());
        }, 500);
      };
      
    } catch (error) {
      reject(error);
    }
  });
}

// Convert video to video
async function convertVideoToVideo(videoBlob, targetFormat, quality) {
  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoBlob);
      video.muted = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      
      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = () => rej(new Error('Failed to load video'));
        setTimeout(() => rej(new Error('Video load timeout')), 30000);
      });
      
      // Create canvas for video frames
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      const canvasStream = canvas.captureStream(30);
      
      // Add audio if present
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      
      const stream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);
      
      let mimeType = getVideoMimeType(targetFormat);
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else {
          reject(new Error('No supported video format found'));
          return;
        }
      }
      
      const videoBitsPerSecond = getVideoBitrate(quality);
      const audioBitsPerSecond = getAudioBitrate(quality);
      
      const chunks = [];
      const recorder = new MediaRecorder(stream, { 
        mimeType,
        videoBitsPerSecond,
        audioBitsPerSecond
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const resultBlob = new Blob(chunks, { type: mimeType });
        URL.revokeObjectURL(video.src);
        document.body.removeChild(video);
        audioCtx.close();
        resolve(resultBlob);
      };
      
      recorder.onerror = (e) => {
        document.body.removeChild(video);
        reject(new Error('Video conversion failed'));
      };
      
      recorder.start(100);
      video.play().catch(e => {
        reject(new Error('Failed to play video: ' + e.message));
      });
      
      // Draw frames
      const drawFrame = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0);
          requestAnimationFrame(drawFrame);
        }
      };
      drawFrame();
      
      // Update progress
      const progressInterval = setInterval(() => {
        if (video.duration) {
          const progress = (video.currentTime / video.duration * 100).toFixed(0);
          updateStatus(`Converting... ${progress}%`);
        }
      }, 500);
      
      video.onended = () => {
        clearInterval(progressInterval);
        setTimeout(() => {
          recorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }, 500);
      };
      
    } catch (error) {
      reject(error);
    }
  });
}

// Helper functions
function getMimeTypeFromFileName(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function getAudioMimeType(format) {
  const mimeTypes = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg;codecs=opus',
    m4a: 'audio/mp4'
  };
  return mimeTypes[format] || 'audio/webm;codecs=opus';
}

function getVideoMimeType(format) {
  const mimeTypes = {
    mp4: 'video/mp4',
    webm: 'video/webm;codecs=vp9,opus',
    mkv: 'video/webm;codecs=vp9,opus'
  };
  return mimeTypes[format] || 'video/webm;codecs=vp9,opus';
}

function getAudioBitrate(quality) {
  const bitrates = {
    high: 320000,
    medium: 192000,
    low: 128000
  };
  return bitrates[quality] || 192000;
}

function getVideoBitrate(quality) {
  const bitrates = {
    high: 5000000,
    medium: 2500000,
    low: 1000000
  };
  return bitrates[quality] || 2500000;
}
