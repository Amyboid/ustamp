console.log('Content script loaded')
let video;
let parentDiv;
let videoContainer;
let title;
// let shortLinkElement;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    video = document.getElementsByTagName('video')[0]
    parentDiv = video.parentElement
    videoContainer = parentDiv.parentElement
    // shortLinkElement = document.querySelector('head > link[rel="shortlinkUrl"]')
    title = getTitle()
    console.log('title:', title);

    let videoId = generateShortLink(videoContainer.baseURI.split('&')[0])
    console.log('vid from content script: ', videoId);

    // checking for add timestamp instruction
    if (message.addTimestamp) {
        // update or set new timestamp of a video
        chrome.storage.local.set({ [videoId]: { "title": title, "time": video.currentTime } }).then(() => {
            sendResponse({ key: videoId, title: title, time: video.currentTime })
        });
    }
    // checking for auto capture instruction
    if (message.autoCapture) {
        console.log('msg for ac: ', message, " TabId in message: ", message.tabId);
        if (message.autoCapture === 'start') {
            chrome.storage.sync.get(['autoCapturing'], (result) => {
                console.log('autoCapturing result is', result);
                let isAlreadyCapturing = Object.keys(result).length ? result.autoCapturing.some((video) => video.videoId === videoId) : false
                console.log('isAlreadyCapturing: ', isAlreadyCapturing);

                if (!isAlreadyCapturing) {
                    setCurrentlyAutoCapturingVideo(videoId, message.tabId, true)
                    autoCapture(videoId, message.tabId)
                    sendResponse({ capturing: true })
                }
            })
        }
        else {
            setCurrentlyAutoCapturingVideo(videoId, message.tabId, false)
            clearInterval(intervalId)
            intervalId = undefined
            sendResponse({ capturing: false })
        }
    }

    if (message.sendTitle) {
        const url = window.location.href;
        if (url && url.includes('https://www.youtube.com/watch?')) {
            if (title) {
                sendResponse({ title: title });
            }
            else {
                sendResponse({ error: 'No title found' });
            }
        }
    }
    return true;
})


function setCurrentlyAutoCapturingVideo(videoId, tabId, add) {
    chrome.storage.sync.get(['autoCapturing'], (result) => {
        console.log('autoCapturing get result', result);
        let autoCapturingVideos = Object.keys(result).length ? [...result.autoCapturing] : []
        console.log('autoCapturing get result, autoCapturingVids', autoCapturingVideos);
        if (add) {
            autoCapturingVideos = autoCapturingVideos.filter((video) => video.tabId !== tabId)
            chrome.storage.sync.set({ autoCapturing: [...autoCapturingVideos, { videoId: videoId, tabId: tabId }] })
        }
        else {
            // finding with tabId to ensure auto capture stoping request is coming from same tab, from where it is started
            let isRequestValid = autoCapturingVideos.find((video) => video.tabId === tabId)
            console.log('isRequestValid', isRequestValid);
            if (isRequestValid) {
                let updatedVideos = autoCapturingVideos.filter((video) => video.videoId !== videoId)
                console.log('autoCapturing set videos', updatedVideos);
                chrome.storage.sync.set({ autoCapturing: [...updatedVideos] })
            }
        }
    })
}

let intervalId;
function autoCapture(videoId, tabId) {
    intervalId ??= setInterval(() => {
        const url = window.location.href;
        if (url && url.includes('https://www.youtube.com/watch?')) {
            if (!video.paused) {
                console.log('ac title', title);
                chrome.storage.local.set({ [videoId]: { "title": title, "time": video.currentTime } }).then(() => {
                    console.log('captured');
                    chrome.storage.sync.get(['isPopupOpen'], (result) => {
                        // send message only if popup window is open
                        if (result.isPopupOpen) {
                            chrome.runtime.sendMessage({ key: videoId, title: title, time: video.currentTime });
                        }
                    })
                });
            }
        }
        else {
            console.log('captured stoped');
            setCurrentlyAutoCapturingVideo(videoId, tabId, false)
            clearInterval(intervalId)
            intervalId = undefined
        }
    }, 2000)
}


function getTitle() {
    let titleElement = document.querySelector('head > meta[name="title"]');
    let titleTag = document.querySelector('head > title')
    if (titleElement) {
        console.log('from getTitle if cond', titleElement.content);
        return titleElement.content
    } else if (titleTag) {
        console.log('from else if cond', produceTitle(titleTag.innerText));
        return produceTitle(titleTag.innerText)
    }
    return null
}

function produceTitle(text) {
    // if starts with (any integer)
    if (text.match(/^\(\d\)/)) {
        const regex = /^\(\d\) ([^]*)(?= - YouTube$)/
        const match = regex.exec(text)
        return match ? match[1] : null
    }
    else {
        const regex = /([^]*)(?= - YouTube$)/
        const match = regex.exec(text)
        return match ? match[0] : null
    }
}

function generateShortLink(longUrl) {
    let videoId = longUrl.split('=')[1]
    let shortLinkTemplate = 'https://youtu.be/'
    return shortLinkTemplate + videoId
}

console.log('bye from content script');
