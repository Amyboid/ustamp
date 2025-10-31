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
    console.log('video c time', video.currentTime);
    sendAutoCaptureMsg()
    return
}


async function runAll(video, videoContainer) {
    await sleep(2000)
    let videoId = videoContainer.baseURI.split('v=')[1].split('&')[0]
    console.log('vid', videoId);

    let observer = new MutationObserver(() => {
        let vc = document.getElementsByTagName('video')[0].parentElement.parentElement
        if (vc.classList.contains("ad-showing")) {
            // video.currentTime = 10000 // temp for testing should be removed
            console.log('showing ad....');
        }
        else {
            console.log('not showing ad....', videoId);
            // video.currentTime = 0 // temp for testing should be removed
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