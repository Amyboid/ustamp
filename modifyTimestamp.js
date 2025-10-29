let timestampsContainer;
let capturingStatus;
let capturingStatusImg;
let currentPlayback;
let captureButton;
let videoTitle;
let allTimestamps = []

document.addEventListener('DOMContentLoaded', () => {
    // Setting a flag when the popup is opened
    chrome.storage.sync.set({ isPopupOpen: true });

    currentPlayback = document.getElementById('current-playback')
    captureButton = document.getElementById('capture-btn')
    videoTitle = document.getElementById('video-title')
    capturingStatus = document.getElementById('capturing-status')
    capturingStatusImg = document.getElementById('capturing-status-img')

    timestampsContainer = document.getElementById('timestamps')
    setTitle(videoTitle, currentPlayback)
    setCapturingStatus(false)
    captureButton.addEventListener('click', () => addTimestamp())

    let autoCaptureToggle = document.getElementById('auto-capture')
    autoCaptureToggle.disabled = true
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].url.includes('https://www.youtube.com/watch?')) {
            autoCaptureToggle.disabled = false
            // getting autocapture setting from storage
            chrome.storage.sync.get(['autoCapture'], (result) => {
                autoCaptureToggle.checked = result.autoCapture || false;
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

    fetchAll()
});
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
            chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "start", tabId: tabs[0].id })
        }
        else {
            chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "stop", tabId: tabs[0].id })
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
    return key + '?t=' + parseInt(time)
}
function showDescription() {
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'description-div';

    const img = document.createElement('img');
    img.src = 'assets/description.png';
    img.alt = '';

    const paragraph = document.createElement('p');
    paragraph.innerHTML = `
  Watch a youtube video and capture the last played time, to begin where
  you left off. Toggle <span class="description-highlight">Auto capture</span> to capture time
  automatically at 15s interval.
`;

    descriptionDiv.appendChild(img);
    descriptionDiv.appendChild(paragraph);
    timestampsContainer.appendChild(descriptionDiv);
}


function createTimestamp(container, key, title, time) {
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';

    // Create the timestamp-left div
    const timestampLeftDiv = document.createElement('div');
    timestampLeftDiv.className = 'timestamp-left';

    // Create the timestamp-key span
    const timestampKeySpan = document.createElement('span');
    timestampKeySpan.className = 'timestamp-key';

    const timestampVideoLink = document.createElement('a');
    timestampVideoLink.className = 'video-link';
    timestampVideoLink.href = formatUrl(key, time)
    timestampVideoLink.textContent = title;

    timestampKeySpan.appendChild(timestampVideoLink);
    // Create the timestamp-value span
    const timestampValueSpan = document.createElement('span');
    timestampValueSpan.className = 'timestamp-value';
    timestampValueSpan.textContent = formatTime(time);

    // Append the key and value to the timestamp-left div
    timestampLeftDiv.appendChild(timestampKeySpan);
    timestampLeftDiv.appendChild(timestampValueSpan);

    const timestampRightDiv = document.createElement('div');
    timestampRightDiv.className = 'timestamp-right';

    // Create the span element for the timestamp text
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp-video-link';
    timestampSpan.textContent = formatUrl(key, time);

    // Create the copy URL button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-url-btn';
    copyButton.setAttribute('aria-label', 'copy-url-btn');

    // Create the image for the copy button
    const copyIcon = document.createElement('img');
    copyIcon.className = 'copy-url-icon';
    copyIcon.src = 'assets/copy.png';

    // Append the image to the copy button
    copyButton.appendChild(copyIcon);
    copyButton.addEventListener('click', () => copyUrlToClipBoard(copyIcon, formatUrl(key, time)))
    // Create the delete timestamp button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'timestamp-delete-btn';
    deleteButton.setAttribute('aria-label', 'delete-timestamp');

    // Create the image for the delete button
    const deleteIcon = document.createElement('img');
    deleteIcon.src = 'assets/delete.png';
    deleteIcon.alt = '';

    // Append the image to the delete button
    deleteButton.appendChild(deleteIcon);
    deleteButton.addEventListener('click', () => deleteTimestamp(key))

    // Append the span and buttons to the parent div
    timestampRightDiv.appendChild(timestampSpan);
    timestampRightDiv.appendChild(copyButton);
    timestampRightDiv.appendChild(deleteButton);


    // Append the left div and delete button to the main timestamp div
    timestampDiv.appendChild(timestampLeftDiv);
    timestampDiv.appendChild(timestampRightDiv);

    // Append the timestamp element to your desired parent in the DOM
    container.appendChild(timestampDiv);

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
            const formattedTime = formatTime(parseFloat(result[key].time))
            allTimestamps.push({ key: key, title: result[key].title, time: result[key].time })
        }
        )
        refreshTimestamps()
    })

}

function refreshTimestamps() {
    timestampsContainer.innerHTML = '';
    // Render all timestamps
    allTimestamps.forEach(({ key, title, time }) => {
        createTimestamp(timestampsContainer, key, title, time);
    });
}

function updateTimestamps(response) {
    // removing the element if it already exist in the array to get the updated one
    allTimestamps = allTimestamps.filter(ts => ts.key !== response.key);
    allTimestamps.push({ key: response.key, title: response.title, time: response.time });
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
            alert('please watch a video to capture', tabs[0].url)
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
            currentPlayback.innerHTML = '<p class="no-playback">Hello welcome</p>'
        }
    })
}


document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Clear the flag when the popup is closed
        chrome.storage.sync.set({ isPopupOpen: false });
    }
})