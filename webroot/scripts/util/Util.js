export const positiveCashColor = "#15b800";
export const negativeCashColor = "#f54242";

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
export function formatCash(cashValue, stripCents) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    // Prevent unneeded negative zero values caused by floating point issues
    let result = formatter.format(cashValue);
    if (result === "-$0.00") {
        result = "$0.00";
    }
    if (stripCents && result.endsWith(".00")) {
        result = result.substring(0, result.length - 3);
    }
    return result;
}

// Handle large cash values, using works for values above 1 trillion/billion/million.
export function formatLargeCash(cashValue) {
    if (cashValue >= 1000000000000) { // trillion
        return formatCash(cashValue / 1000000000000, false) + "t";
    }
    if (cashValue >= 1000000000) { // tres comas
        return formatCash(cashValue / 1000000000, false) + "b";
    }
    if (cashValue >= 1000000) { // millions
        return formatCash(cashValue / 1000000, false) + "m";
    }
    return formatCash(cashValue, true);
}

export function formatPhaserCashText(textObject, cashValue, suffix, includePrefix, invertColor) {
    let prefix = "";
    if (cashValue > 0.001) {
        prefix += "+";
        if (invertColor) {
            setTextColorIfNecessary(textObject, negativeCashColor);
        } else {
            setTextColorIfNecessary(textObject, positiveCashColor);
        }
    } else if (cashValue < -0.001) {
        if (invertColor) {
            setTextColorIfNecessary(textObject, positiveCashColor);
        } else {
            setTextColorIfNecessary(textObject, negativeCashColor);
        }
    } else {
        setTextColorIfNecessary(textObject, "#000");
    }
    let cashText = formatCash(cashValue) + suffix;
    textObject.setText(includePrefix ? prefix + cashText : cashText);
}

export function setTextColorIfNecessary(textObject, color) {
    if (textObject.style.color != color) {
        textObject.setColor(color);
    }
}

// https://stackoverflow.com/questions/154059/how-can-i-check-for-an-empty-undefined-null-string-in-javascript
export function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}
