document.addEventListener('DOMContentLoaded', () => {
    let container = document.getElementById('timestamps-container')
    let loadButton = document.getElementById('load-btn')
    let clearButton = document.getElementById('clear-btn')
    loadButton.addEventListener('click', () => addTimestamp())
    clearButton.addEventListener('click', () => clear(container))

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
        if (autoCaptureToggle.checked && !autoCaptureToggle.disabled) {
            sendAutoCaptureMsg(autoCaptureToggle.checked);
        }
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


});

function formatTime(totalSeconds) {
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = Math.floor(totalSeconds % 60);

    let formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedDuration;
}
function fetchAll(container) {
    chrome.storage.local.get(null).then((result) => {
        console.log(result)
        Object.keys(result).forEach((key) => {
            result[key] = formatTime(parseFloat(result[key]))
        }
        )
        container.innerText = JSON.stringify(result)
    })

}
function clear(container) {
    container.innerText = ''
}


function addTimestamp() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].url.includes('https://www.youtube.com/watch?')) {
            chrome.tabs.sendMessage(tabs[0].id, { addTimestamp: true }, (response) => {
                if (response) {
                    // alert(response.status);
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

let toggleId;
function sendAutoCaptureMsg(isChecked) {
    alert(toggleId)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (isChecked) {
            chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "start" }, (response) => {
                
            })
            
        }
        else {
            chrome.tabs.sendMessage(tabs[0].id, { autoCapture: "stop" }, (response) => {
                
            })
        }
    })
}