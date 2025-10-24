function sendAutoCaptureMsg(tabId) {
  chrome.storage.sync.get(['autoCapture'], (result) => {
    console.log('autCap', result.autoCapture);
    if (result.autoCapture) {
      chrome.tabs.sendMessage(tabId, { autoCapture: "start" })
    }
  })
}


chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  console.log('history state updated', details.url);
  if (details.url.includes('https://www.youtube.com/watch?')) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ['updatePlayback.js']
    })
    sendAutoCaptureMsg(details.tabId)
  }
})


chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.url.includes('https://www.youtube.com/watch?')) {
    if (details.transitionType === 'reload') {
      console.log('reloaded');
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        files: ['updatePlayback.js']
      })
      sendAutoCaptureMsg(details.tabId)
    }
  }
})