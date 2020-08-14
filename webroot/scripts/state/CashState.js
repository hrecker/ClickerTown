let currentCash = 0;
let cashGrowthRate = 1;
let clickCashValue = 1;
let currentCashCallbacks = [];
let cashGrowthCallbacks = [];
let clickCashCallbacks = [];

export function getCashGrowthRate() {
    return cashGrowthRate;
}

export function setCashGrowthRate(growthRate) {
    if (growthRate == cashGrowthRate) {
        return;
    }

    cashGrowthRate = growthRate;
    cashGrowthCallbacks.forEach(callback => 
        callback.callback(cashGrowthRate, callback.scene));
}

export function getClickCashValue() {
    return clickCashValue;
}

export function setClickCashValue(cashValue) {
    if (cashValue == clickCashValue) {
        return;
    }

    clickCashValue = cashValue;
    clickCashCallbacks.forEach(callback => 
        callback.callback(clickCashValue, callback.scene));
}

export function getCurrentCash() {
    return currentCash;
}

export function addCurrentCash(cash) {
    setCurrentCash(cash + currentCash);
}

export function setCurrentCash(cash) {
    if (cash == currentCash) {
        return;
    }

    currentCash = cash;
    currentCashCallbacks.forEach(callback => 
        callback.callback(currentCash, callback.scene));
}

export function addCurrentCashListener(callback, scene) {
    currentCashCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

export function addCashGrowthListener(callback, scene) {
    cashGrowthCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

export function addClickCashListener(callback, scene) {
    clickCashCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}
