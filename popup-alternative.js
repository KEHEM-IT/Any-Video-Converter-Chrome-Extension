// Alternative implementation using official FFmpeg.wasm CDN
// This version is more reliable and easier to use

let ffmpeg = null;
let currentFile = null;
let outputBlob = null;
let isFFmpegLoaded = false;

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

// Load FFmpeg from CDN
async function loadFFmpeg() {
  if (isFFmpegLoaded) return;
  
  try {
    // Load FFmpeg.wasm from CDN
    if (!window.FFmpegWASM) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js';
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load FFmpeg library'));
        document.head.appendChild(script);
      });
    }
    
    const { FFmpeg } = window.FFmpegWASM;
    const { toBlobURL } = window.FFmpegWASM;
    
    ffmpeg = new FFmpeg();
    
    // Set up logging and progress
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });
    
    ffmpeg.on('progress', ({ progress }) => {
      const percent = Math.round(progress * 100);
      progressFill.style.width = `${percent}%`;
      progressText.textContent = `Converting... ${percent}%`;
    });
    
    // Load FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    isFFmpegLoaded = true;
  } catch (error) {
    throw new Error('Failed to initialize FFmpeg: ' + error.message);
  }
}

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

function handleFile(file) {
  currentFile = file;
  
  const extension = file.name.split('.').pop().toLowerCase();
  const isVideo = VIDEO_FORMATS.includes(extension);
  const isAudio = AUDIO_FORMATS.includes(extension);
  
  if (!isVideo && !isAudio) {
    showError('Unsupported file format. Please upload a valid video or audio file.');
    return;
  }
  
  fileName.textContent = file.name;
  fileFormat.textContent = extension.toUpperCase();
  fileSize.textContent = formatBytes(file.size);
  
  fileInfo.style.display = 'block';
  conversionSection.style.display = 'block';
  
  outputFormat.value = isVideo ? 'mp4' : 'mp3';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

convertBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  
  try {
    conversionSection.style.display = 'none';
    fileInfo.style.display = 'none';
    errorSection.style.display = 'none';
    resultSection.style.display = 'none';
    
    progressSection.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Loading FFmpeg...';
    
    await loadFFmpeg();
    
    progressText.textContent = 'Processing file...';
    
    const inputExt = currentFile.name.split('.').pop().toLowerCase();
    const outputExt = outputFormat.value;
    const qualityLevel = quality.value;
    
    const inputFileName = `input.${inputExt}`;
    const outputFileName = `output.${outputExt}`;
    
    // Write file to FFmpeg filesystem
    await ffmpeg.writeFile(inputFileName, await fetchFile(currentFile));
    
    // Build and run FFmpeg command
    const args = buildFFmpegArgs(inputFileName, outputFileName, outputExt, qualityLevel);
    
    progressText.textContent = 'Converting...';
    await ffmpeg.exec(args);
    
    // Read output
    const data = await ffmpeg.readFile(outputFileName);
    outputBlob = new Blob([data.buffer], { type: getMimeType(outputExt) });
    
    // Cleanup
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
    
    // Show result
    progressSection.style.display = 'none';
    resultSection.style.display = 'block';
    
    const newFileName = currentFile.name.replace(/\.[^/.]+$/, '') + '.' + outputExt;
    outputFileName.textContent = newFileName;
    outputFileSize.textContent = formatBytes(outputBlob.size);
    
  } catch (error) {
    console.error('Conversion error:', error);
    showError('Conversion failed: ' + error.message);
  }
});

function buildFFmpegArgs(input, output, format, qualityLevel) {
  const args = ['-i', input];
  
  let videoBitrate, audioBitrate, crf;
  
  switch (qualityLevel) {
    case 'high':
      videoBitrate = '5000k';
      audioBitrate = '320k';
      crf = '18';
      break;
    case 'low':
      videoBitrate = '1000k';
      audioBitrate = '128k';
      crf = '28';
      break;
    default:
      videoBitrate = '2500k';
      audioBitrate = '192k';
      crf = '23';
  }
  
  if (VIDEO_FORMATS.includes(format)) {
    switch (format) {
      case 'mp4':
      case 'mov':
      case 'm4v':
        args.push('-c:v', 'libx264', '-crf', crf, '-c:a', 'aac', '-b:a', audioBitrate);
        break;
      case 'webm':
        args.push('-c:v', 'libvpx', '-b:v', videoBitrate, '-c:a', 'libvorbis', '-b:a', audioBitrate);
        break;
      case 'mkv':
        args.push('-c:v', 'libx264', '-crf', crf, '-c:a', 'aac', '-b:a', audioBitrate);
        break;
      case 'avi':
        args.push('-c:v', 'libx264', '-crf', crf, '-c:a', 'mp3', '-b:a', audioBitrate);
        break;
      default:
        args.push('-c:v', 'libx264', '-crf', crf, '-c:a', 'aac', '-b:a', audioBitrate);
    }
  } else {
    switch (format) {
      case 'mp3':
        args.push('-vn', '-c:a', 'libmp3lame', '-b:a', audioBitrate);
        break;
      case 'wav':
        args.push('-vn', '-c:a', 'pcm_s16le');
        break;
      case 'aac':
      case 'm4a':
        args.push('-vn', '-c:a', 'aac', '-b:a', audioBitrate);
        break;
      case 'ogg':
        args.push('-vn', '-c:a', 'libvorbis', '-b:a', audioBitrate);
        break;
      default:
        args.push('-vn', '-c:a', 'aac', '-b:a', audioBitrate);
    }
  }
  
  args.push(output);
  return args;
}

function getMimeType(format) {
  const mimeTypes = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    flv: 'video/x-flv',
    wmv: 'video/x-ms-wmv',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    m4v: 'video/x-m4v',
    '3gp': 'video/3gpp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    amr: 'audio/amr'
  };
  return mimeTypes[format] || 'application/octet-stream';
}

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

resetBtn.addEventListener('click', resetConverter);
errorResetBtn.addEventListener('click', resetConverter);

function resetConverter() {
  currentFile = null;
  outputBlob = null;
  fileInput.value = '';
  
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

async function fetchFile(file) {
  return new Uint8Array(await file.arrayBuffer());
}
