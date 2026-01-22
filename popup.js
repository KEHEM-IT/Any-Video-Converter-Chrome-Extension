// Video/audio converter with background processing
let currentFile = null;
let outputBlob = null;
let isConverting = false;

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

// Format detection
const VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'mpeg', 'mpg', 'm4v', '3gp'];
const AUDIO_FORMATS = ['mp3', 'wav', 'aac', 'flac', 'alac', 'ogg', 'm4a', 'amr'];

// Check if conversion is in progress on load
chrome.runtime.sendMessage({ action: 'isConversionInProgress' }, (response) => {
  if (response && response.inProgress) {
    showProgress('Conversion in progress...');
  }
});

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
    outputFormat.value = 'mp4';
  } else {
    outputFormat.value = 'mp3';
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

// Create offscreen document if needed
async function setupOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Processing audio/video conversion in background'
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
    progressText.textContent = 'Initializing conversion...';
    
    // Setup offscreen document
    await setupOffscreenDocument();
    
    const outputExt = outputFormat.value;
    const qualityLevel = quality.value;
    
    progressText.textContent = 'Converting... This may take a while.';
    
    // Start progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 10;
        progressFill.style.width = `${Math.min(progress, 90)}%`;
      }
    }, 1000);
    
    // Read file as array buffer
    const fileData = await currentFile.arrayBuffer();
    
    // Send to offscreen document for conversion
    const response = await chrome.runtime.sendMessage({
      action: 'convert',
      data: {
        fileData: fileData,
        fileName: currentFile.name,
        outputFormat: outputExt,
        quality: qualityLevel
      }
    });
    
    clearInterval(progressInterval);
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    // Create blob from result
    outputBlob = new Blob([response.data.data], { type: response.data.mimeType });
    
    // Complete progress
    progressFill.style.width = '100%';
    progressText.textContent = 'Conversion complete!';
    
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
