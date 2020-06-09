let currentCash = 0;
let cashGrowthRate = 1;

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
    currentCash = cash;
}

//TODO callbacks on change