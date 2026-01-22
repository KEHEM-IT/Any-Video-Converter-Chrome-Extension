// Background service worker for conversion
let conversionInProgress = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startConversion') {
    conversionInProgress = true;
    // Keep service worker alive during conversion
    const keepAlive = setInterval(() => {
      chrome.runtime.getPlatformInfo();
    }, 20000);
    
    // Store the interval ID
    chrome.storage.local.set({ keepAliveInterval: keepAlive });
    sendResponse({ success: true });
  } else if (request.action === 'conversionComplete') {
    conversionInProgress = false;
    chrome.storage.local.get(['keepAliveInterval'], (result) => {
      if (result.keepAliveInterval) {
        clearInterval(result.keepAliveInterval);
      }
    });
    sendResponse({ success: true });
  } else if (request.action === 'isConversionInProgress') {
    sendResponse({ inProgress: conversionInProgress });
  }
  return true;
});

// Warn user before closing browser during conversion
chrome.windows.onRemoved.addListener((windowId) => {
  if (conversionInProgress) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Conversion In Progress',
      message: 'A file conversion is still running. Please wait for it to complete.'
    });
  }
});
