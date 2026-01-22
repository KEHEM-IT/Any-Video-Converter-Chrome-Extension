// Offscreen document for background conversion
console.log('Offscreen document loaded');

// Handle conversion requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convert') {
    handleConversion(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function handleConversion({ fileData, fileName, outputFormat, quality }) {
  try {
    // Recreate blob from transferred data
    const blob = new Blob([fileData], { type: getMimeTypeFromFileName(fileName) });
    
    // Determine if source is video or audio
    const isSourceVideo = blob.type.startsWith('video/');
    const isTargetAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(outputFormat);
    
    let resultBlob;
    
    if (isTargetAudio && isSourceVideo) {
      // Video to Audio conversion - extract audio only
      resultBlob = await convertVideoToAudio(blob, outputFormat, quality);
    } else if (isTargetAudio) {
      // Audio to Audio conversion
      resultBlob = await convertAudioToAudio(blob, outputFormat, quality);
    } else {
      // Video to Video conversion
      resultBlob = await convertVideoToVideo(blob, outputFormat, quality);
    }
    
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
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoBlob);
      video.muted = false;
      
      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = rej;
      });
      
      // Create audio context and extract audio
      const audioCtx = new AudioContext();
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
        audioCtx.close();
        resolve(resultBlob);
      };
      
      recorder.onerror = (e) => {
        reject(new Error('Audio extraction failed: ' + e.error));
      };
      
      // Start recording and play video
      recorder.start(100);
      video.play();
      
      // Stop when video ends
      video.onended = () => {
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
      
      await new Promise((res, rej) => {
        audio.onloadedmetadata = res;
        audio.onerror = rej;
      });
      
      // Create audio context
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);
      
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
        audioCtx.close();
        resolve(resultBlob);
      };
      
      recorder.onerror = (e) => {
        reject(new Error('Audio conversion failed: ' + e.error));
      };
      
      recorder.start(100);
      audio.play();
      
      audio.onended = () => {
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
      
      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = rej;
      });
      
      // Create canvas for video frames
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      const canvasStream = canvas.captureStream(30);
      
      // Add audio if present
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);
      
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
        audioCtx.close();
        resolve(resultBlob);
      };
      
      recorder.onerror = (e) => {
        reject(new Error('Video conversion failed: ' + e.error));
      };
      
      recorder.start(100);
      video.play();
      
      // Draw frames
      const drawFrame = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0);
          requestAnimationFrame(drawFrame);
        }
      };
      drawFrame();
      
      video.onended = () => {
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
