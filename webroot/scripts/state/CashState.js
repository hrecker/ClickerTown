import * as buildModel from '../model/Building';
import * as tileModel from '../model/Tile';
import { getSelection } from './ShopSelectionCache';

let startingCashGrowthRate;
let startingClickValue;
// Store cash in decicents (mills, or tenths of a cent), to allow updating cash value every tenth of a second
let currentCashDecicents;
let cashGrowthRateDecicents;
let clickCashValueDecicents;
let currentCashCallbacks = [];
let cashGrowthCallbacks = [];
let clickCashCallbacks = [];

export function setStartingCashGrowthRate(growthRate) {
    startingCashGrowthRate = growthRate;
}

export function setStartingClickValue(clickValue) {
    startingClickValue = clickValue;
}

function dollarsToDecicents(dollars) {
    return Math.round(dollars * 1000);
}

function decicentsToDollars(decicents) {
    return decicents / 1000.0;
}

export function getCashGrowthRate() {
    return decicentsToDollars(cashGrowthRateDecicents);
}

export function setCashGrowthRate(growthRate) {
    let decicentsGrowthRate = dollarsToDecicents(growthRate);
    if (decicentsGrowthRate == cashGrowthRateDecicents) {
        return;
    }

    cashGrowthRateDecicents = decicentsGrowthRate;
    cashGrowthCallbacks.forEach(callback => 
        callback.callback(getCashGrowthRate(), callback.scene));
}

export function getClickCashValue() {
    return decicentsToDollars(clickCashValueDecicents);
}

export function setClickCashValue(cashValue) {
    let cashValueDecicents = dollarsToDecicents(cashValue);
    if (cashValueDecicents == clickCashValueDecicents) {
        return;
    }

    clickCashValueDecicents = cashValueDecicents;
    clickCashCallbacks.forEach(callback => 
        callback.callback(getClickCashValue(), callback.scene));
}

export function getCurrentCash() {
    return decicentsToDollars(currentCashDecicents);
}

export function getCurrentCashDecicents() {
    return currentCashDecicents;
}

export function setCurrentCashDecicents(cashDecicents) {
    if (cashDecicents == currentCashDecicents) {
        return;
    }
    currentCashDecicents = cashDecicents;
    currentCashCallbacks.forEach(callback => 
        callback.callback(getCurrentCash(), callback.scene));
}

export function addCurrentCash(cash) {
    setCurrentCash(cash + getCurrentCash());
}

export function setCurrentCash(cash) {
    let cashDecicents = dollarsToDecicents(cash);
    setCurrentCashDecicents(cashDecicents);
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

export function getCashRates(tileMap) {
    let cashGrowthRate = startingCashGrowthRate;
    let clickValue = startingClickValue;
    for (let x = 0; x < tileMap.length; x++) {
        for (let y = 0; y < tileMap[x].length; y++) {
            let building = tileMap[x][y].building;
            let tile = tileMap[x][y].tile;
            if (building) {
                cashGrowthRate += buildModel.getBuildingCashGrowthRate(getSelection(building), tileMap, x, y);
                clickValue += buildModel.getBuildingClickValue(getSelection(building), tileMap, x, y);
            }
            cashGrowthRate += tileModel.getTileCashGrowthRate(getSelection(tile), tileMap, x, y);
            clickValue += tileModel.getTileClickValue(getSelection(tile), tileMap, x, y);
        }
    }
    return {
        cashGrowthRate: cashGrowthRate,
        clickValue: clickValue
    };
}

export function updateCashRates(tileMap) {
    let rates = getCashRates(tileMap);
    setCashGrowthRate(rates.cashGrowthRate);
    setClickCashValue(rates.clickValue);
}
