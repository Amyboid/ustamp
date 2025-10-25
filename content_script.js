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
            sendResponse({ key: videoId, value: video.currentTime })
        });
    }
    // checking for auto capture instruction
    if (message.autoCapture) {
        if (message.autoCapture === 'start') {
            sendResponse({ capturing: true })
            autoCapture()
        }
        else {
            clearInterval(intervalId)
            intervalId = undefined
        }
    }

    if (message.sendTitle) {
        const url = window.location.href;
        if (url && url.includes('https://www.youtube.com/watch?')) {

            // finding title of a video
            // classname used here is temporary, it can be changed in future
            let titleElement = document.getElementsByClassName('ytd-watch-metadata')[4]
            if (titleElement) {
                console.log(titleElement.innerHTML, titleElement.innerText);
                sendResponse({ title: titleElement.innerText })
            }
            else {
                sendResponse({ error: 'No title found' })
            }
        }
    }
    return true;
})

function autoCapture() {
    intervalId ??= setInterval(() => {
        const url = window.location.href;
        if (url && url.includes('https://www.youtube.com/watch?')) {
            chrome.storage.local.set({ [videoId]: video.currentTime }).then(() => {
                console.log('captured');
                chrome.storage.sync.get(['isPopupOpen'], (result) => {
                    if (result.isPopupOpen) {
                        chrome.runtime.sendMessage({ key: videoId, value: video.currentTime });
                    }
                })
            });
        }
        else {
            clearInterval(intervalId)
            intervalId = undefined
        }

    }, 2000)
}