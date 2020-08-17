let currentCashCents;
let cashGrowthRateCents;
let clickCashValueCents;
let currentCashCallbacks = [];
let cashGrowthCallbacks = [];
let clickCashCallbacks = [];

function dollarsToCents(dollars) {
    return Math.round(dollars * 100);
}

function centsToDollars(cents) {
    return cents / 100.0;
}

export function getCashGrowthRate() {
    return centsToDollars(cashGrowthRateCents);
}

export function setCashGrowthRate(growthRate) {
    let centsGrowthRate = dollarsToCents(growthRate);
    if (centsGrowthRate == cashGrowthRateCents) {
        return;
    }

    cashGrowthRateCents = centsGrowthRate;
    cashGrowthCallbacks.forEach(callback => 
        callback.callback(getCashGrowthRate(), callback.scene));
}

export function getClickCashValue() {
    return centsToDollars(clickCashValueCents);
}

export function setClickCashValue(cashValue) {
    let cashValueCents = dollarsToCents(cashValue);
    if (cashValueCents == clickCashValueCents) {
        return;
    }

    clickCashValueCents = cashValueCents;
    clickCashCallbacks.forEach(callback => 
        callback.callback(getClickCashValue(), callback.scene));
}

export function getCurrentCash() {
    return centsToDollars(currentCashCents);
}

export function addCurrentCash(cash) {
    setCurrentCash(cash + getCurrentCash());
}

export function setCurrentCash(cash) {
    let cashCents = dollarsToCents(cash);
    if (cashCents == currentCashCents) {
        return;
    }

    currentCashCents = cashCents;
    currentCashCallbacks.forEach(callback => 
        callback.callback(getCurrentCash(), callback.scene));
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
