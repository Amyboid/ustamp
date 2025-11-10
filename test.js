{
    let tabId = 0
    chrome.storage.sync.get(["intervals"], (result) => {
        console.log('result is: ', result);
        if (Object.keys(result).length > 0) {
            let intervals = result.intervals
            console.log('intervals array: ', intervals);

            let previousInterval = intervals.find((interval) => interval.tabId === tabId)
            console.log('previousInterval: ', previousInterval);
            if (previousInterval) {
                console.log('previousInterval InervalId: ', previousInterval.intervalId);
                clearInterval(previousInterval.intervalId)
            }
            let intervalId = window.setInterval(() => {
                console.log('hello:', tabId)
            }, 5000)
            setTheIntervals(tabId, intervalId)
        }
        else {
            let intervalId = setInterval(() => {
                console.log('bro:', tabId)
            }, 5000)
            setTheIntervals(tabId, intervalId)
        }
    })

    function setTheIntervals(tabId, id) {
        console.log('\n---tabId:IntervalId--\n', tabId, ":", id, "\n------\n")
        chrome.storage.sync.get(["intervals"], (result) => {
            let arr = Object.keys(result).length ? result.intervals : []
            console.log('arr: ', arr);
            let brr = arr.filter((interval) => interval.tabId !== tabId)
            console.log('brr: ', brr);
            chrome.storage.sync.set({ "intervals": [...brr, { tabId: tabId, intervalId: id }] })
        })
        chrome.storage.sync.get(["intervals"], (result) => {
            let newArr = Object.keys(result).length ? result.intervals : []
            console.log('NewArr: ', newArr);
        })
    }
}


