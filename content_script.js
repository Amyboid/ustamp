console.log('Content script loaded')
let video;
let parentDiv;
let videoContainer;
let title;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    video = document.getElementsByTagName('video')[0]
    parentDiv = video.parentElement
    videoContainer = parentDiv.parentElement
    title = getTitle()
    let videoId = videoContainer.baseURI.split('v=')[1].split('&')[0]

    console.log('video from content script in first load: ', videoId);

    // checking for add timestamp instruction
    if (message.addTimestamp) {
        console.log("video while normal capturing: ", videoContainer.baseURI.split('v=')[1]);
        // update or set new timestamp of a video
        chrome.storage.local.set({ [videoId]: { "title": title, "time": video.currentTime, "done": calculatePercentage(video.currentTime, video.duration) } }).then(() => {
            sendResponse({ key: videoId, title: title, time: video.currentTime, done: calculatePercentage(video.currentTime, video.duration) })
        });
    }
    // checking for auto capture instruction
    if (message.autoCapture) {
        console.log('msg for ac: ', message.sender, "\nvideoId from container: ", videoContainer.baseURI.split('v=')[1], "\nvideoId from videoId: ", videoId, "\nvideo title:", title);
        if (message.autoCapture === 'start') {
            autoCapture(videoId, message.tabId, true)
            sendResponse({ capturing: true })
        }
        else {
            autoCapture(videoId, message.tabId, false)
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

function calculatePercentage(currentTime, duration) {
    let completed = Math.round((Math.ceil(currentTime) / Math.ceil(duration)) * 100)
    return completed
}
// let intervalIds = new Set();
function autoCapture(videoId, tabId, start) {
    console.log('\n-----\nvideoId passed to autocapture: ', videoId, "\nstart: ", start, "\n-----\n");
    if (start) {
        chrome.storage.sync.get(['autoCapturing'], (result) => {
            if (Object.keys(result).length > 0) {
                let allCapturingVideos = result.autoCapturing
                let previousVideoInTheTab = allCapturingVideos.find((video) => video.tabId === tabId)
                if (previousVideoInTheTab) {
                    console.log('previousInterval InervalId: ', previousVideoInTheTab.intervalId);
                    clearInterval(previousVideoInTheTab.intervalId)
                }

            }
            let intervalId = startInterval(videoId)
            setCurrentlyAutoCapturingVideo(tabId, true, intervalId)
        })
    }
    else {
        chrome.storage.sync.get(['autoCapturing'], (result) => {
            if (Object.keys(result).length > 0) {
                let allCapturingVideos = result.autoCapturing
                let previousVideoInTheTab = allCapturingVideos.find((video) => video.tabId === tabId)
                if (previousVideoInTheTab) {
                    console.log('previousInterval InervalId: ', previousVideoInTheTab.intervalId);
                    clearInterval(previousVideoInTheTab.intervalId)
                }
                setCurrentlyAutoCapturingVideo(tabId, false, undefined)
            }
        })
    }
}

function startInterval(videoId) {
    let intervalId = setInterval(() => {
        const url = window.location.href;
        if (url && url.includes('https://www.youtube.com/watch?')) {
            if (!video.paused) {
                chrome.storage.local.get([videoId]).then((result) => {
                    let updatedTime = video.currentTime;
                    if (Object.keys(result).length > 0) {
                        updatedTime = Math.max(updatedTime, result[videoId].time)
                    }
                    chrome.storage.local.set({ [videoId]: { "title": title, "time": updatedTime, "done": calculatePercentage(video.currentTime, video.duration) } }).then(() => {
                        console.log('\n---\ncaptured video info\n', "videoId: ", videoId, "\ntitle: ", title, "\currentTime: ", updatedTime, "intervalId: ", intervalId, "\n----\n");
                    });
                })
            }
        }
    }, 10000)

    return intervalId
}

function setCurrentlyAutoCapturingVideo(tabId, add, intervalId) {
    chrome.storage.sync.get(['autoCapturing'], (result) => {
        let autoCapturingVideos = Object.keys(result).length ? result.autoCapturing : []
        autoCapturingVideos = autoCapturingVideos.filter((video) => video.tabId !== tabId)
        if (add) {
            chrome.storage.sync.set({ autoCapturing: [...autoCapturingVideos, { tabId: tabId, intervalId: intervalId }] })
        }
        else {
            chrome.storage.sync.set({ autoCapturing: [...autoCapturingVideos] })
        }
    })
}

function getTitle() {
    let titleTag = document.querySelector('head > title')
    if (titleTag) {
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

console.log('bye from content script');
