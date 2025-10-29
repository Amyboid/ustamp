console.log('enter in upd..');
video = document.getElementsByTagName('video')[0]
parentDiv = video.parentElement
videoContainer = parentDiv.parentElement
// shortLinkElement = document.querySelector('head > link[rel="shortlinkUrl"]')
console.log('variables: ', videoContainer.baseURI);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sendAutoCaptureMsg() {
    chrome.runtime.sendMessage({ sender: 'updatePlayback', autoCapture: "check" })
}

function setCurrentTime(video, currentTimestamp) {
    video.currentTime = parseFloat(currentTimestamp) - 10
    sendAutoCaptureMsg()
    return
}

function generateShortLink(longUrl) {
    let videoId = longUrl.split('=')[1]
    let shortLinkTemplate = 'https://youtu.be/'
    return shortLinkTemplate + videoId
}

async function runAll(video, videoContainer) {
    await sleep(2000)
    let videoId = generateShortLink(videoContainer.baseURI.split('&')[0])
    console.log('vid', videoId);
    // let showingAd = videoContainer.classList.contains("ad-showing")


    let observer = new MutationObserver(() => {
        let vc = document.getElementsByTagName('video')[0].parentElement.parentElement
        if (vc.classList.contains("ad-showing")) {
            console.log('showing ad....');
        }
        else {
            console.log('not showing ad....', videoId);
            observer.disconnect()
            // get the video from storage 
            chrome.storage.local.get([videoId]).then((result) => {
                if (Object.keys(result).length === 0) {
                    console.log('no records found', videoId, result);
                    sendAutoCaptureMsg()
                    return
                }
                else {
                    console.log(Object.keys(result).length)
                    let currentTimestamp = result[videoId].time
                    // check if video is already loaded
                    if (video.currentTime !== undefined) {
                        setCurrentTime(video, currentTimestamp)
                        console.log('video already loaded:');
                    }
                    else {
                        // wait for loading the video meta data
                        console.log('video not loaded yet', video.currentTime);
                        video.onloadedmetadata = (event) => {
                            // update it's currentTime
                            console.log('Metadata loaded', video, video.currentTime);
                            setCurrentTime(video, currentTimestamp)
                            video.onloadedmetadata = null;
                        };
                    }
                }
                console.log('bye from update playback')
            })
        }
    })

    observer.observe(videoContainer, {
        attributes: true,
        childList: true,
        attributeFilter: ['class']
    });
}

runAll(video, videoContainer)
console.log('Exit from update playback')