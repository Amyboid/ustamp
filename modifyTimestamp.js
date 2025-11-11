let timestampsContainer;
let settingsPopup;
let settingsBtn;
let footer;
let capturingStatus;
let capturingStatusImg;
let currentPlayback;
let captureButton;
let videoTitle;
let allTimestamps = []

document.addEventListener('DOMContentLoaded', () => {
    currentPlayback = document.getElementById('current-playback')
    captureButton = document.getElementById('capture-btn')
    videoTitle = document.getElementById('video-title')
    capturingStatus = document.getElementById('capturing-status')
    capturingStatusImg = document.getElementById('capturing-status-img')
    settingsBtn = document.getElementById('settings')
    settingsPopup = document.getElementById('settings-popup')
    settingsPopup.style.display = 'none'
    settingsBtn.addEventListener('click', () => handleSettingsPopup())
    timestampsContainer = document.getElementById('timestamps')
    footer = document.getElementById('footer')
    setTitle(videoTitle, currentPlayback)
    setCapturingStatus(false)
    captureButton.addEventListener('click', () => addTimestamp())

    let autoCaptureToggle = document.getElementById('auto-capture')
    let autoUptateToggle = document.getElementById('auto-update')
    autoCaptureToggle.disabled = true
    autoUptateToggle.disabled = true
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].url.includes('https://www.youtube.com/watch?')) {
            autoCaptureToggle.disabled = false
            autoUptateToggle.disabled = false
            // getting autocapture setting from storage
            chrome.storage.sync.get(['autoCapture'], (result) => {
                autoCaptureToggle.checked = result.autoCapture ?? false;
                let isChecked = autoCaptureToggle.checked
                if (autoCaptureToggle.checked && !autoCaptureToggle.disabled) {
                    setCapturingStatus(true)
                    sendAutoCaptureMsg(isChecked)
                }
                else {
                    setCapturingStatus(false)
                    sendAutoCaptureMsg(isChecked)
                }
            });

            chrome.storage.sync.get(['autoUpdate'], (result) => {
                autoUptateToggle.checked = result.autoUpdate ?? false;
            })

            footer.innerHTML = ''
        } else {
            footer.innerHTML =
                `
      <div class="support">
        <img src="assets/support.png" alt="" />
        <span><a href="static/user_guide.html#support" target="_blank">Show some support</a></span>
      </div>
      <span>|</span>
      <span><a href="static/user_guide.html#user-guide" target="_blank">How to use this extension?</a></span>
        `
        }
    });
    autoCaptureToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ autoCapture: autoCaptureToggle.checked })
        let isChecked = autoCaptureToggle.checked
        if (isChecked) {
            setCapturingStatus(true)
            sendAutoCaptureMsg(isChecked)
        } else {
            setCapturingStatus(false)
            sendAutoCaptureMsg(isChecked)
        }
    })

    autoUptateToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ autoUpdate: autoUptateToggle.checked })
    })

    fetchAll()
});

function handleSettingsPopup(){
    if (settingsPopup.style.display === 'none') {
        settingsPopup.style.display = 'flex'
    }
    else{
        settingsPopup.style.display = 'none'
    }
}
function copyUrlToClipBoard(copyIcon, url) {
    navigator.clipboard.writeText(url);
    copyIcon.src = "assets/copied.png"
    setTimeout(() => {
        copyIcon.src = "assets/copy.png"
    }, 800)
}

function setCapturingStatus(capturing) {
    if (capturing) {
        capturingStatus.innerText = 'Capturing'
        capturingStatusImg.src = 'assets/capturing.png'
        captureButton.disabled = true
    } else {
        capturingStatus.innerText = 'Capture'
        capturingStatusImg.src = 'assets/capture.png'
        captureButton.disabled = false
    }
}
function sendAutoCaptureMsg(isChecked) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isChecked) {
            chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "start", tabId: tabs[0].id, sender: "popup" })
        }
        else {
            chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "stop", tabId: tabs[0].id, sender: "popup" })
        }
    })
}
function formatTime(Seconds) {
    let totalSeconds = parseFloat(Seconds)
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = Math.floor(totalSeconds % 60);

    let formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedDuration;
}

function formatUrl(key, time) {
    return 'https://youtu.be/' + key + '?t=' + parseInt(time)
}


function createTimestamp(container, key, title, time, done) {
    const timestamp = document.createElement("div");
    timestamp.className = "timestamp";

    const left = document.createElement("div");
    left.className = "timestamp-left";

    const spanKey = document.createElement("span");
    spanKey.className = "timestamp-key";

    const link = document.createElement("a");
    link.className = "video-link";
    link.href = formatUrl(key, time);
    link.textContent = title;

    spanKey.appendChild(link);

    const progressStatus = document.createElement("div");
    progressStatus.className = "progress-status";

    const timeSpan = document.createElement("span");
    timeSpan.className = "timestamp-value";
    timeSpan.textContent = formatTime(time);

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const progressCompleted = document.createElement("div");
    progressCompleted.className = "progress-completed";
    progressCompleted.style.width = `${done}%`
    progressBar.appendChild(progressCompleted);

    const percent = document.createElement("span");
    percent.className = "progress-percentage";
    percent.textContent = done + "%";

    progressStatus.append(timeSpan, progressBar, percent);

    left.append(spanKey, progressStatus);

    const right = document.createElement("div");
    right.className = "timestamp-right";

    const delBtn = document.createElement("button");
    delBtn.className = "timestamp-delete-btn";
    delBtn.setAttribute("aria-label", "delete-timestamp");
    const delImg = document.createElement("img");
    delImg.src = "assets/delete.png";
    delBtn.appendChild(delImg);
    delBtn.addEventListener('click', () => deleteTimestamp(key))

    const videoLink = document.createElement("span");
    videoLink.className = "timestamp-video-link";

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-url-btn";
    copyBtn.setAttribute("aria-label", "copy-url-btn");
    const copyImg = document.createElement("img");
    copyImg.className = "copy-url-icon";
    copyImg.src = "assets/copy.png";
    copyBtn.addEventListener('click', () => copyUrlToClipBoard(copyImg, formatUrl(key, time)))
    copyBtn.appendChild(copyImg);

    right.append(delBtn, videoLink, copyBtn);

    timestamp.append(left, right);

    container.appendChild(timestamp);

}
function deleteTimestamp(key) {
    chrome.storage.local.remove([key], () => {
        let error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
        allTimestamps = allTimestamps.filter(ts => ts.key !== key);
        refreshTimestamps();
    })
}
function fetchAll() {
    chrome.storage.local.get(null).then((result) => {
        allTimestamps = [];
        Object.keys(result).forEach((key) => {
            allTimestamps.push({ key: key, title: result[key].title, time: result[key].time, done: result[key].done })
        }
        )
        refreshTimestamps()
    })

}

function refreshTimestamps() {
    timestampsContainer.innerHTML = ''
    if (allTimestamps.length > 0) {
        // Render all timestamps
        allTimestamps.forEach(({ key, title, time, done }) => {
            createTimestamp(timestampsContainer, key, title, time, done);
        });
    } else {
        timestampsContainer.innerHTML =
            `
        <div class="fallback">
        <div>
          <img class="fallback-img" src="assets/fallback1.png" alt="fallback-img">
        </div>
        <p>No video captured</p>
      </div>        
        `
    }
}

function updateTimestamps(response) {
    // removing the element if it already exist in the array to get the updated one
    allTimestamps = allTimestamps.filter(ts => ts.key !== response.key);
    allTimestamps.push({ key: response.key, title: response.title, time: response.time, done: response.done });
    refreshTimestamps();
}

function addTimestamp() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].url.includes('https://www.youtube.com/watch?')) {
            chrome.tabs.sendMessage(tabs[0].id, { addTimestamp: true }, (response) => {
                if (response) {
                    updateTimestamps(response)
                }
                else {
                    alert("No response from content script.");
                }
            })
        }
        else {
            alert('please watch a youtube video to capture', tabs[0].url)
        }
    })
}
// listening for message send by content-script to update timestamp in extension ui
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg) {
        updateTimestamps(msg)
        sendResponse({ timestampUpdated: true })
    }
});

function setTitle(videoTitle, currentPlayback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].url.includes('https://www.youtube.com/watch?')) {
            chrome.tabs.sendMessage(tabs[0].id, { sendTitle: "yes" }, (response) => {
                if (chrome.runtime.lastError) {
                    // Attempt to reload the tab
                    videoTitle.innerText = 'Error: ' + chrome.runtime.lastError.message + '\nTry reloading the page...'
                    return;
                }
                if (response) {
                    if (response.title) {
                        videoTitle.innerText = response.title
                    }
                    else {
                        videoTitle.innerText = response.error
                    }
                }
            })
        }
        else {
            currentPlayback.innerHTML =
                `
            <div class="no-playback">
             <p>Welcome to ustamp</p>
             <span>Save your last played time and continue where you left off</span>
            </div>
             `
        }
    })
}
