let timestampsContainer;
let allTimestamps = []

document.addEventListener('DOMContentLoaded', () => {
     // Setting a flag when the popup is opened
    chrome.storage.sync.set({ isPopupOpen: true });
    let currentPlayback = document.getElementById('current-playback')
    let captureButton = document.getElementById('capture-btn')
    let videoTitle = document.getElementById('video-title')
    timestampsContainer = document.getElementById('timestamps')
    setTitle(videoTitle, currentPlayback)
    captureButton.addEventListener('click', () => addTimestamp())

    let autoCaptureToggle = document.getElementById('auto-capture')
    autoCaptureToggle.disabled = true
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs[0].url.includes('https://www.youtube.com/watch?')) {
            autoCaptureToggle.disabled = false
        }
    });
    // getting autocapture setting from storage
    chrome.storage.sync.get(['autoCapture'], (result) => {
        autoCaptureToggle.checked = result.autoCapture || false;
    });
    autoCaptureToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ autoCapture: autoCaptureToggle.checked })
        let isChecked = autoCaptureToggle.checked
        if (isChecked) {
            sendAutoCaptureMsg(isChecked)
        } else {
            sendAutoCaptureMsg(isChecked)
        }
    })

    fetchAll()
});

function formatTime(totalSeconds) {
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = Math.floor(totalSeconds % 60);

    let formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedDuration;
}

function createTimestamp(container, keyText, valueText) {
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';

    // Create the timestamp-left div
    const timestampLeftDiv = document.createElement('div');
    timestampLeftDiv.className = 'timestamp-left';

    // Create the timestamp-key span
    const timestampKeySpan = document.createElement('span');
    timestampKeySpan.className = 'timestamp-key';
    timestampKeySpan.textContent = keyText; // Set the key text

    // Create the timestamp-value span
    const timestampValueSpan = document.createElement('span');
    timestampValueSpan.className = 'timestamp-value';
    timestampValueSpan.textContent = valueText; // Set the value text

    // Append the key and value to the timestamp-left div
    timestampLeftDiv.appendChild(timestampKeySpan);
    timestampLeftDiv.appendChild(timestampValueSpan);

    // Create the button for deleting the timestamp
    const deleteButton = document.createElement('button');
    deleteButton.className = 'timestamp-delete-btn';
    deleteButton.setAttribute('aria-label', 'delete-timestamp');
    // Create the image for the delete button
    const deleteImage = document.createElement('img');
    deleteImage.src = 'assets/delete.png';
    deleteImage.alt = '';

    // Append the image to the delete button
    deleteButton.appendChild(deleteImage);
    deleteButton.addEventListener('click', () => deleteTimestamp(keyText))

    // Append the left div and delete button to the main timestamp div
    timestampDiv.appendChild(timestampLeftDiv);
    timestampDiv.appendChild(deleteButton);

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
            const formattedTime = formatTime(parseFloat(result[key]))
            allTimestamps.push({ key: key, value: formattedTime })
        }
        )
        refreshTimestamps()
    })

}

function refreshTimestamps() {
    timestampsContainer.innerHTML = '';
    // Render all timestamps
    allTimestamps.forEach(({ key, value }) => {
        createTimestamp(timestampsContainer, key, value);
    });
}

function updateTimestamps(response) {
    // removing the element if it already exist in the array to get the updated one
    allTimestamps = allTimestamps.filter(ts => ts.key !== response.key);
    allTimestamps.push({ key: response.key, value: formatTime(response.value) });
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
            alert('please watch a video to add timestamp', tabs[0].url)
        }
    })
}
// listening for message send by content-script to update timestamp in extension ui
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg && msg.key && msg.value) {
        updateTimestamps(msg)
        sendResponse({ timestampUpdated: true })
    }
});

function sendAutoCaptureMsg(isChecked) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isChecked) {
            chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "start" })
        }
        else {
            chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "stop" })
        }
    })
}

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