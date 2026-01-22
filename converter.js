// Converter window - handles actual conversion
console.log('Converter window loaded');

let conversionData = null;
let isProcessing = false;

// Update status text and notify background
function updateStatus(text, percent = null) {
  const statusText = document.getElementById('statusText');
  if (statusText) {
    statusText.textContent = text;
  }
  
  // Notify background script of progress
  if (percent !== null) {
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      progress: { percent, status: text }
    });
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
    
    updateStatus('Starting conversion...', 0);
    
    handleConversion(request.data)
      .then(result => {
        isProcessing = false;
        updateStatus('Conversion complete!', 100);
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        isProcessing = false;
        updateStatus('Conversion failed: ' + error.message, 0);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep channel open for async response
  }
});

async function handleConversion({ fileData, fileName, outputFormat, quality }) {
  try {
    updateStatus('Loading file...', 5);
    
    // Recreate blob from transferred data
    const blob = new Blob([fileData], { type: getMimeTypeFromFileName(fileName) });
    
    // Determine if source is video or audio
    const isSourceVideo = blob.type.startsWith('video/') || fileName.toLowerCase().endsWith('.ts');
    const isTargetAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(outputFormat);
    
    let resultBlob;
    
    if (isTargetAudio && isSourceVideo) {
      updateStatus('Extracting audio from video...', 10);
      resultBlob = await convertVideoToAudio(blob, outputFormat, quality);
    } else if (isTargetAudio) {
      updateStatus('Converting audio...', 10);
      resultBlob = await convertAudioToAudio(blob, outputFormat, quality);
    } else {
      updateStatus('Converting video...', 10);
      resultBlob = await convertVideoToVideo(blob, outputFormat, quality);
    }
    
    updateStatus('Finalizing...', 95);
    
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
    let video = null;
    let audioCtx = null;
    let recorder = null;
    
    try {
      updateStatus('Creating video element...', 15);
      
      video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      
      // Create object URL
      const videoUrl = URL.createObjectURL(videoBlob);
      video.src = videoUrl;
      video.muted = false;
      video.volume = 1.0;
      
      // Add to document (required for some browsers)
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      document.body.appendChild(video);
      
      // Wait for metadata with dynamic timeout based on file size
      const metadataTimeout = Math.max(60000, Math.min(videoBlob.size / 10000, 300000)); // 60s to 5min
      await Promise.race([
        new Promise((res) => {
          video.onloadedmetadata = res;
        }),
        new Promise((_, rej) => 
          setTimeout(() => rej(new Error(`Video metadata load timeout (${Math.floor(metadataTimeout/1000)}s) - File may be too large or corrupt`)), metadataTimeout)
        )
      ]);
      
      // Wait for video to be ready with dynamic timeout
      const readyTimeout = Math.max(60000, Math.min(videoBlob.size / 10000, 300000)); // 60s to 5min
      await Promise.race([
        new Promise((res) => {
          if (video.readyState >= 2) {
            res();
          } else {
            video.oncanplay = res;
          }
        }),
        new Promise((_, rej) => 
          setTimeout(() => rej(new Error(`Video ready timeout (${Math.floor(readyTimeout/1000)}s) - File may be too large or corrupt`)), readyTimeout)
        )
      ]);
      
      updateStatus('Extracting audio...', 20);
      
      // Create audio context and extract audio
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      
      // Get audio stream
      const audioStream = dest.stream;
      
      // Check if audio stream has tracks
      if (audioStream.getAudioTracks().length === 0) {
        throw new Error('No audio track found in video');
      }
      
      // Determine MIME type
      let mimeType = getAudioMimeType(targetFormat);
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback to supported format
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else {
          throw new Error('No supported audio format found');
        }
      }
      
      const audioBitsPerSecond = getAudioBitrate(quality);
      const chunks = [];
      recorder = new MediaRecorder(audioStream, { 
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
        URL.revokeObjectURL(videoUrl);
        if (video.parentNode) {
          document.body.removeChild(video);
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close();
        }
        resolve(resultBlob);
      };
      
      recorder.onerror = (e) => {
        if (video.parentNode) {
          document.body.removeChild(video);
        }
        reject(new Error('Recording failed: ' + (e.error || 'Unknown error')));
      };
      
      updateStatus('Recording audio...', 25);
      
      // Start recording
      recorder.start(100);
      
      // Start playing
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error('Play error:', e);
        });
      }
      
      // Update progress
      const progressInterval = setInterval(() => {
        if (video.duration && !isNaN(video.duration)) {
          const progress = 25 + Math.floor((video.currentTime / video.duration) * 65);
          updateStatus(`Recording audio... ${Math.floor((video.currentTime / video.duration) * 100)}%`, progress);
        }
      }, 500);
      
      // Stop when video ends
      video.onended = () => {
        clearInterval(progressInterval);
        updateStatus('Finishing recording...', 90);
        setTimeout(() => {
          if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
          }
          audioStream.getTracks().forEach(track => track.stop());
        }, 500);
      };
      
      // Error handling
      video.onerror = () => {
        clearInterval(progressInterval);
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
        reject(new Error('Video playback error: ' + (video.error ? video.error.message : 'Unknown error')));
      };
      
    } catch (error) {
      if (video && video.parentNode) {
        document.body.removeChild(video);
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
      reject(error);
    }
  });
}

// Convert audio to audio
async function convertAudioToAudio(audioBlob, targetFormat, quality) {
  return new Promise(async (resolve, reject) => {
    let audio = null;
    let audioCtx = null;
    
    try {
      audio = document.createElement('audio');
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      
      const audioUrl = URL.createObjectURL(audioBlob);
      audio.src = audioUrl;
      
      audio.style.position = 'fixed';
      audio.style.top = '-9999px';
      document.body.appendChild(audio);
      
      // Dynamic timeout for audio files
      const audioTimeout = Math.max(60000, Math.min(audioBlob.size / 10000, 300000)); // 60s to 5min
      await Promise.race([
        new Promise((res) => {
          audio.onloadedmetadata = res;
        }),
        new Promise((_, rej) => 
          setTimeout(() => rej(new Error(`Audio load timeout (${Math.floor(audioTimeout/1000)}s) - File may be too large or corrupt`)), audioTimeout)
        )
      ]);
      
      // Create audio context
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
          throw new Error('No supported audio format found');
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
        URL.revokeObjectURL(audioUrl);
        if (audio.parentNode) {
          document.body.removeChild(audio);
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close();
        }
        resolve(resultBlob);
      };
      
      recorder.onerror = (e) => {
        if (audio.parentNode) {
          document.body.removeChild(audio);
        }
        reject(new Error('Audio conversion failed'));
      };
      
      recorder.start(100);
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error('Audio play error:', e);
        });
      }
      
      // Update progress
      const progressInterval = setInterval(() => {
        if (audio.duration && !isNaN(audio.duration)) {
          const progress = 25 + Math.floor((audio.currentTime / audio.duration) * 65);
          updateStatus(`Converting... ${Math.floor((audio.currentTime / audio.duration) * 100)}%`, progress);
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
      if (audio && audio.parentNode) {
        document.body.removeChild(audio);
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
      reject(error);
    }
  });
}

// Convert video to video
async function convertVideoToVideo(videoBlob, targetFormat, quality) {
  return new Promise(async (resolve, reject) => {
    let video = null;
    let audioCtx = null;
    
    try {
      video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      
      const videoUrl = URL.createObjectURL(videoBlob);
      video.src = videoUrl;
      video.muted = true;
      
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      document.body.appendChild(video);
      
      // Dynamic timeout for video-to-video conversion
      const v2vTimeout = Math.max(60000, Math.min(videoBlob.size / 10000, 300000)); // 60s to 5min
      await Promise.race([
        new Promise((res) => {
          video.onloadedmetadata = res;
        }),
        new Promise((_, rej) => 
          setTimeout(() => rej(new Error(`Video load timeout (${Math.floor(v2vTimeout/1000)}s) - File may be too large or corrupt`)), v2vTimeout)
        )
      ]);
      
      // Create canvas for video frames
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      
      const canvasStream = canvas.captureStream(30);
      
      // Add audio if present
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
          throw new Error('No supported video format found');
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
        URL.revokeObjectURL(videoUrl);
        if (video.parentNode) {
          document.body.removeChild(video);
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close();
        }
        resolve(resultBlob);
      };
      
      recorder.onerror = (e) => {
        if (video.parentNode) {
          document.body.removeChild(video);
        }
        reject(new Error('Video conversion failed'));
      };
      
      recorder.start(100);
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error('Video play error:', e);
        });
      }
      
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
        if (video.duration && !isNaN(video.duration)) {
          const progress = 25 + Math.floor((video.currentTime / video.duration) * 65);
          updateStatus(`Converting... ${Math.floor((video.currentTime / video.duration) * 100)}%`, progress);
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
      if (video && video.parentNode) {
        document.body.removeChild(video);
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
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
    ts: 'video/mp2t',
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
