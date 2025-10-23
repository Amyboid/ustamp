chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('https://www.youtube.com/watch?')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['addTimestamp.js']
    })
  }
});


chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  console.log('history state updated');
  if (details.url.includes('https://www.youtube.com/watch?')) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ['updatePlayback.js']
    })
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
    }
  }
})