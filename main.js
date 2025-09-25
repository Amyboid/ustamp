let urlSet = new Set()
urlSet.add('kkkkl')

let videoContainer = document.getElementById('movie_player')
console.log('vid', videoContainer);

// let url = 'https://www.youtube.com/watch?v=0cn8r8LWVJs'
let video = document.getElementsByClassName('video-stream')[0]
console.log('vids', video);
console.log(videoContainer.baseURI)
if (videoContainer.baseURI === url) {
    video.currentTime = 500
}
console.log('hie')