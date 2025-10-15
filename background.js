chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('https://www.youtube.com/watch?')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['addTimestamp.js']
    })
  }
});


chrome.webNavigation.onHistoryStateUpdated.addListener((details)=>{
  if (details.url.includes('https://www.youtube.com/watch?')) {
    chrome.scripting.executeScript({
      target: {tabId: details.tabId},
      files: ['updatePlayback.js']
    })
  }
})