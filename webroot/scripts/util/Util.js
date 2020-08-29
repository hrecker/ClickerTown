// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

// https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
export function getRandomProperty(obj) {
    let keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};

// https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
export function formatCash(cashValue) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    // Prevent unneeded negative zero values caused by floating point issues
    let result = formatter.format(cashValue);
    if (result === "-$0.00") {
        result = "$0.00";
    }
    return result;
}

// https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
export function formatDate(date) {
    let options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString("en-US", options);
}

// https://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-javascript
function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

export function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}
