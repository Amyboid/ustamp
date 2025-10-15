videoContainer = document.getElementById('movie_player')
video = document.getElementsByClassName('video-stream')[0]
videoId = videoContainer.baseURI.split('=')[1]


// get the video from storage 
chrome.storage.local.get([videoId]).then((result)=>{
    if (result) {
        console.log('result:', result);
        let currentTimestamp = result[videoId]
        // check if the video already exist
        if (currentTimestamp) {   
            // update it's currentTime
            video.currentTime = parseFloat(currentTimestamp)
            console.log('currentTime: ', video.currentTime);
        }
    }
})

chrome.storage.local.get(null).then((result)=>{
    console.log('vcAll:',result);
})
