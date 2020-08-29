let currentDate;
let currentDateCallbacks = [];

export function setCurrentDate(date) {
    currentDate = date;
    currentDateCallbacks.forEach(callback =>
        callback.callback(getCurrentDateString(), callback.scene));
}

export function addDays(days) {
    currentDate.setDate(currentDate.getDate() + days);
    currentDateCallbacks.forEach(callback =>
        callback.callback(getCurrentDateString(), callback.scene));
}

// https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
export function getCurrentDateString() {
    let options = { year: 'numeric', month: 'long', day: 'numeric' };
    return currentDate.toLocaleDateString("en-US", options);
}

export function addCurrentDateStringListener(callback, scene) {
    currentDateCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}
