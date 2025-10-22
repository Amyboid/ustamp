videoContainer = document.getElementById('movie_player')
video = document.getElementsByClassName('video-stream')[0]
videoId = videoContainer.baseURI.split('=')[1]

// get the video from storage 
chrome.storage.local.get([videoId]).then((result) => {
    if (result) {
        console.log('result:', result, videoId);
        let currentTimestamp = result[videoId]
        console.log('currentTime:::', currentTimestamp);
        // check if the video exist
        if (currentTimestamp) {
            // if video is already loaded
            if (video.duration) {
                console.log('video duration', video.duration);
                video.currentTime = parseFloat(currentTimestamp) - 10
            }
            // wait for loading the video meta data
            video.addEventListener('loadedmetadata', () => {
                console.log('Metadata loaded');
                // update it's currentTime
                video.currentTime = parseFloat(currentTimestamp) - 10
            })
        }
    }
})
