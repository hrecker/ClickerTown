let currentCash = 0;
let cashGrowthRate = 1;
let changeCallbacks = [];

export function getCashGrowthRate() {
    return cashGrowthRate;
}

export function setCashGrowthRate(growthRate) {
    cashGrowthRate = growthRate;
}

export function getCurrentCash() {
    return currentCash;
}

export function setCurrentCash(cash) {
    if (cash == currentCash) {
        return;
    }

    currentCash = cash;
    changeCallbacks.forEach(callback => 
        callback.callback(currentCash, callback.scene));
}

export function addCurrentCashListener(callback, scene) {
    changeCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

//TODO callbacks on change