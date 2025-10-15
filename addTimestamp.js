if (!videoContainer) {
    console.log('no videoContainer found');
    videoContainer = document.getElementById('movie_player')
    video = document.getElementsByClassName('video-stream')[0]
    videoId = videoContainer.baseURI.split('=')[1]
}

console.log('videoId',videoId);

// update or set new timestamp of a video
chrome.storage.local.set({[videoId]: video.currentTime}).then(() => {
  console.log("Value is set");
});


