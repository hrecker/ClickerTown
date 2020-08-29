let currentDate;
let currentDateCallbacks = [];

export function setCurrentDate(date) {
    currentDate = date;
    currentDateCallbacks.forEach(callback =>
        callback.callback(getCurrentDate(), callback.context));
}

export function addDays(days) {
    currentDate.setDate(currentDate.getDate() + days);
    currentDateCallbacks.forEach(callback =>
        callback.callback(getCurrentDate(), callback.context));
}

export function getCurrentDate() {
    return currentDate;
}

export function addCurrentDateListener(callback, context) {
    currentDateCallbacks.push({ 
        callback: callback,
        context: context
    });
}
