videoContainer = document.getElementById('movie_player')
video = document.getElementsByClassName('video-stream')[0]
videoId = videoContainer.baseURI.split('&')[0]
video.onloadedmetadata = null;

// get the video from storage 
chrome.storage.local.get([videoId]).then((result) => {
    if (Object.keys(result).length === 0) {
        console.log('no records found');
        return
    }
    else {
        let currentTimestamp = result[videoId]
        // check if video is already loaded
        if (video.readyState >= 3) {
            video.currentTime = parseFloat(currentTimestamp) - 10
        }
        else {
            // wait for loading the video meta data
            console.log('video not loaded yet');
            video.onloadedmetadata = (event) => {
                console.log('Metadata loaded');
                // update it's currentTime
                video.currentTime = parseFloat(currentTimestamp) - 10
            };
        }
    }
})


