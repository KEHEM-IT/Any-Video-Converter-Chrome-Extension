// Video/audio converter with background processing
let currentFile = null;
let outputBlob = null;
let isConverting = false;
let converterWindowId = null;
let progressCheckInterval = null;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileFormat = document.getElementById('fileFormat');
const fileSize = document.getElementById('fileSize');
const conversionSection = document.getElementById('conversionSection');
const outputFormat = document.getElementById('outputFormat');
const quality = document.getElementById('quality');
const convertBtn = document.getElementById('convertBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const outputFileName = document.getElementById('outputFileName');
const outputFileSize = document.getElementById('outputFileSize');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const errorSection = document.getElementById('errorSection');
const errorText = document.getElementById('errorText');
const errorResetBtn = document.getElementById('errorResetBtn');

// Format detection - Added .ts support
const VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'mpeg', 'mpg', 'm4v', '3gp', 'ts'];
const AUDIO_FORMATS = ['mp3', 'wav', 'aac', 'flac', 'alac', 'ogg', 'm4a', 'amr'];

// Check if conversion is in progress on load
checkConversionStatus();

function checkConversionStatus() {
  chrome.runtime.sendMessage({ action: 'isConversionInProgress' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Background script not ready:', chrome.runtime.lastError);
      return;
    }
    if (response && response.inProgress) {
      isConverting = true;
      showProgress(response.progress.status || 'Conversion in progress...');
      progressFill.style.width = `${response.progress.percent || 0}%`;
      startProgressMonitoring();
    }
  });
}

// Monitor progress from background
function startProgressMonitoring() {
  if (progressCheckInterval) {
    clearInterval(progressCheckInterval);
  }
  
  progressCheckInterval = setInterval(() => {
    chrome.runtime.sendMessage({ action: 'getProgress' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        return;
      }
      
      const progress = response.progress;
      if (progress) {
        progressFill.style.width = `${progress.percent || 0}%`;
        progressText.textContent = progress.status || 'Converting...';
        
        if (progress.percent >= 100 || progress.status === 'complete') {
          clearInterval(progressCheckInterval);
          progressCheckInterval = null;
        }
      }
    });
  }, 500);
}

function stopProgressMonitoring() {
  if (progressCheckInterval) {
    clearInterval(progressCheckInterval);
    progressCheckInterval = null;
  }
}

// Prevent closing popup during conversion
window.addEventListener('beforeunload', (e) => {
  if (isConverting) {
    e.preventDefault();
    e.returnValue = '';
    return 'A file conversion is in progress. Are you sure you want to close?';
  }
});

// Upload area interactions
uploadArea.addEventListener('click', () => {
  fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// Handle file upload
function handleFile(file) {
  currentFile = file;
  
  // Auto-detect format
  const extension = file.name.split('.').pop().toLowerCase();
  const isVideo = VIDEO_FORMATS.includes(extension);
  const isAudio = AUDIO_FORMATS.includes(extension);
  
  if (!isVideo && !isAudio) {
    showError('Unsupported file format. Please upload a valid video or audio file.');
    return;
  }
  
  // Display file info
  fileName.textContent = file.name;
  fileFormat.textContent = extension.toUpperCase();
  fileSize.textContent = formatBytes(file.size);
  
  // Show sections
  fileInfo.style.display = 'block';
  conversionSection.style.display = 'block';
  
  // Set default output format
  if (isVideo) {
    outputFormat.value = 'mp3';
  } else {
    outputFormat.value = 'ogg';
  }
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Get converter window tab
async function getConverterWindow() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'openConverterWindow' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      converterWindowId = response.windowId;
      resolve(response.windowId);
    });
  });
}

// Send message to converter window
async function sendToConverter(message) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get all tabs in the converter window
      const tabs = await chrome.tabs.query({ windowId: converterWindowId });
      
      if (tabs.length === 0) {
        reject(new Error('Converter window not found'));
        return;
      }
      
      const tabId = tabs[0].id;
      
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Convert button click
convertBtn.addEventListener('click', async () => {
  if (!currentFile || isConverting) return;
  
  try {
    isConverting = true;
    
    // Notify background script
    chrome.runtime.sendMessage({ action: 'startConversion' });
    
    // Hide other sections
    conversionSection.style.display = 'none';
    fileInfo.style.display = 'none';
    errorSection.style.display = 'none';
    resultSection.style.display = 'none';
    
    // Show progress
    progressSection.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Opening converter window...';
    
    // Get converter window
    await getConverterWindow();
    
    // Wait for window to load
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const outputExt = outputFormat.value;
    const qualityLevel = quality.value;
    
    progressText.textContent = 'Starting conversion...';
    
    // Start progress monitoring
    startProgressMonitoring();
    
    // Read file as array buffer
    const fileData = await currentFile.arrayBuffer();
    
    progressText.textContent = 'Converting... You can close this popup!';
    
    // Send to converter window
    const response = await sendToConverter({
      action: 'startConversion',
      data: {
        fileData: fileData,
        fileName: currentFile.name,
        outputFormat: outputExt,
        quality: qualityLevel
      }
    });
    
    stopProgressMonitoring();
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    // Create blob from result
    outputBlob = new Blob([response.data.data], { type: response.data.mimeType });
    
    // Complete progress
    progressFill.style.width = '100%';
    progressText.textContent = 'Conversion complete!';
    
    // Close converter window
    chrome.runtime.sendMessage({ action: 'closeConverterWindow' });
    
    setTimeout(() => {
      // Show result
      progressSection.style.display = 'none';
      resultSection.style.display = 'block';
      
      const newFileName = currentFile.name.replace(/\.[^/.]+$/, '') + '.' + outputExt;
      outputFileName.textContent = newFileName;
      outputFileSize.textContent = formatBytes(outputBlob.size);
    }, 500);
    
  } catch (error) {
    console.error('Conversion error:', error);
    showError('Conversion failed: ' + error.message);
    
    stopProgressMonitoring();
    
    // Close converter window on error
    chrome.runtime.sendMessage({ action: 'closeConverterWindow' });
  } finally {
    isConverting = false;
    chrome.runtime.sendMessage({ action: 'conversionComplete' });
  }
});

function showProgress(message) {
  conversionSection.style.display = 'none';
  fileInfo.style.display = 'none';
  errorSection.style.display = 'none';
  resultSection.style.display = 'none';
  progressSection.style.display = 'block';
  progressText.textContent = message;
}

// Download button
downloadBtn.addEventListener('click', () => {
  if (!outputBlob) return;
  
  const url = URL.createObjectURL(outputBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = outputFileName.textContent;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Reset buttons
resetBtn.addEventListener('click', resetConverter);
errorResetBtn.addEventListener('click', resetConverter);

function resetConverter() {
  currentFile = null;
  outputBlob = null;
  fileInput.value = '';
  isConverting = false;
  stopProgressMonitoring();
  
  fileInfo.style.display = 'none';
  conversionSection.style.display = 'none';
  progressSection.style.display = 'none';
  resultSection.style.display = 'none';
  errorSection.style.display = 'none';
}

function showError(message) {
  progressSection.style.display = 'none';
  conversionSection.style.display = 'none';
  fileInfo.style.display = 'none';
  resultSection.style.display = 'none';
  
  errorSection.style.display = 'block';
  errorText.textContent = message;
}

// Cleanup on popup close
window.addEventListener('unload', () => {
  stopProgressMonitoring();
});
