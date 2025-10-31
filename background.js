let videoLodedMap = new Map();

function forwardAutoCaptureMsg() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('upd: Tabs', tabs);
    chrome.storage.sync.get(['autoCapture'], (result) => {
      if (result.autoCapture && tabs.length !== 0) {
        chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "start", tabId: tabs[0].id, sender: "background.js" })
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
    forwardAutoCaptureMsg()
  }
}
)

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.url.includes('https://www.youtube.com/watch?')) {
    console.log('onhistoryupdated: ', details, details.transitionQualifiers.length)
    let videoLoaded = videoLodedMap.get("videoLoaded")
    let vidId = details.url.split('v=')[1].split('&')[0]
    let documentId = details.documentId
    console.log('videoLodedMap onHistUpdate: ', videoLoaded)
    if (videoLoaded) {
      if (videoLoaded.vidId === vidId && videoLoaded.documentId === documentId) {
        return
      }
      else {
        videoLodedMap.set("videoLoaded", { vidId: vidId, documentId: documentId })
        console.log('script injected onhist.')
        chrome.scripting.executeScript({
          target: { tabId: details.tabId },
          files: ['updatePlayback.js']
        })
      }

    }
    else {
      videoLodedMap.set("videoLoaded", { vidId: vidId, documentId: documentId })
      console.log('script injected onhist.')
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        files: ['updatePlayback.js']
      })
    }
  }
})


chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.url.includes('https://www.youtube.com/watch?')) {
    console.log('oncommited', details)
    let videoLoaded = videoLodedMap.get("videoLoaded")
    let vidId = details.url.split('v=')[1].split('&')[0]
    let documentId = details.documentId
    console.log('videoLodedMap onCommited: ', videoLoaded)
    if (videoLoaded) {
      if (videoLoaded.vidId === vidId && videoLoaded.documentId === documentId) {
        return
      }
      else {
        videoLodedMap.set("videoLoaded", { vidId: vidId, documentId: documentId })
        console.log('script injected oncommit.')
        chrome.scripting.executeScript({
          target: { tabId: details.tabId },
          files: ['updatePlayback.js']
        })
      }
    }
    else {
      videoLodedMap.set("videoLoaded", { vidId: vidId, documentId: documentId })
      console.log('script injected oncommit.')
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        files: ['updatePlayback.js']
      })
    }
  }
})