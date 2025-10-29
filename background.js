function sendAutoCaptureMsg() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('upd: TabId', tabs[0].id);
    chrome.storage.sync.get(['autoCapture'], (result) => {
      if (result.autoCapture) {
        chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "start", tabId: tabs[0].id })
      }
    })
  })
}

chrome.tabs.onRemoved.addListener((tabId) => {
  console.log('tabclosed', tabId);
  chrome.storage.sync.get(['autoCapturing'], (result) => {
    console.log('autoCapturing get result', result);
    let autoCapturingVideos = Object.keys(result).length ? [...result.autoCapturing] : [] 
    let updatedVideos = autoCapturingVideos.filter((video) => video.tabId !== tabId)
    console.log('autoCapturing set videos', updatedVideos);
    chrome.storage.sync.set({ autoCapturing: [...updatedVideos] })
  })
})

chrome.runtime.onMessage.addListener((message) => {
  console.log('ms:', message);
  if (message.sender === 'updatePlayback') {
    sendAutoCaptureMsg()
  }
}
)

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.url.includes('https://www.youtube.com/watch?')) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ['updatePlayback.js']
    })
  }
})


chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.url.includes('https://www.youtube.com/watch?')) {
    if (details.transitionType === 'reload' || details.transitionType === 'typed' || details.transitionType === 'link') {
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        files: ['updatePlayback.js']
      })
    }
  }
})