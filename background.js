// Background service worker
let conversionInProgress = false;
let converterWindow = null;
let conversionProgress = { percent: 0, status: 'idle' };

// Listen for conversion status updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startConversion') {
    conversionInProgress = true;
    conversionProgress = { percent: 0, status: 'starting' };
    sendResponse({ success: true });
  } else if (request.action === 'conversionComplete') {
    conversionInProgress = false;
    conversionProgress = { percent: 100, status: 'complete' };
    sendResponse({ success: true });
  } else if (request.action === 'isConversionInProgress') {
    sendResponse({ 
      inProgress: conversionInProgress,
      progress: conversionProgress
    });
  } else if (request.action === 'updateProgress') {
    conversionProgress = request.progress;
    sendResponse({ success: true });
  } else if (request.action === 'getProgress') {
    sendResponse({ progress: conversionProgress });
  } else if (request.action === 'openConverterWindow') {
    // Open a hidden window for conversion
    if (!converterWindow) {
      chrome.windows.create({
        url: 'converter.html',
        type: 'popup',
        width: 400,
        height: 300,
        focused: false
      }, (window) => {
        converterWindow = window;
        sendResponse({ windowId: window.id });
      });
      return true;
    } else {
      sendResponse({ windowId: converterWindow.id });
    }
  } else if (request.action === 'closeConverterWindow') {
    if (converterWindow) {
      chrome.windows.remove(converterWindow.id);
      converterWindow = null;
    }
    sendResponse({ success: true });
  }
  return true;
});

// Clean up when converter window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (converterWindow && converterWindow.id === windowId) {
    converterWindow = null;
    conversionInProgress = false;
  }
});
