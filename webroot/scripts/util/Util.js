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

export function formatPhaserCashText(textObject, cashValue, suffix, includePrefix, invertColor) {
    let prefix = "";
    if (cashValue > 0.001) {
        prefix += "+";
        if (invertColor) {
            textObject.setColor(negativeCashColor);
        } else {
            textObject.setColor(positiveCashColor);
        }
    } else if (cashValue < -0.001) {
        if (invertColor) {
            textObject.setColor(positiveCashColor);
        } else {
            textObject.setColor(negativeCashColor);
        }
    } else {
        textObject.setColor("#000000");
    }
    let cashText = formatCash(cashValue) + suffix;
    textObject.setText(includePrefix ? prefix + cashText : cashText);
}

// https://stackoverflow.com/questions/154059/how-can-i-check-for-an-empty-undefined-null-string-in-javascript
export function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}
