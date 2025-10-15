let videoContainer;
let video;
let videoId;
// chrome.storage.local.clear()
chrome.storage.local.get(null).then((result)=>{
    console.log('vcAll:',result);
})
