let videoContainer;
let video;
let videoId;
// chrome.storage.local.clear()
chrome.storage.local.get(null).then((result) => {
    console.log('vcAll:', result);
})

let intervalId;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('message: ', sender, message);
    videoContainer = document.getElementById('movie_player')
    video = document.getElementsByClassName('video-stream')[0]
    videoId = videoContainer.baseURI.split('&')[0]
    
    // checking for add timestamp instruction
    if (message.addTimestamp) {
        // update or set new timestamp of a video
        chrome.storage.local.set({ [videoId]: video.currentTime }).then(() => {
            console.log('value is set');
            sendResponse({ status: true })
        });
    }
    // checking for auto capture instruction
    else if (message.autoCapture) {
        if (message.autoCapture === 'start') {
            sendResponse({ capturing: true })
            autoCapture()
        }
        else {
            clearInterval(intervalId)
            intervalId = undefined
        }
    }
    return true;
})

function autoCapture() {
    intervalId ??= setInterval(() => {
        const url = window.location.href;
        console.log('URL: ', url);
        if (url && url.includes('https://www.youtube.com/watch?')) {
            chrome.storage.local.set({ [videoId]: video.currentTime }).then(() => {
            console.log('captured');
        });
        }
        else {
            clearInterval(intervalId)
            intervalId = undefined
        }

    }, 2000)
}