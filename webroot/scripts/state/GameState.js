import { setMap, getMap, initializeMap } from './MapState';
import * as state from './CashState';

const mapKey = 'map';
const cashKey = 'currentCash';
let gameResetCallbacks = [];

export function saveGame() {
    localStorage.setItem(mapKey, JSON.stringify(getMap()));
    localStorage.setItem(cashKey, state.getCurrentCashDecicents());
}

export function initializeGame(jsonCache, forceReinitialize) {
    let savedMap = localStorage.getItem(mapKey);
    let savedCash = localStorage.getItem(cashKey);
    if (savedMap && savedCash != null && !forceReinitialize) {
        // Load saved values
        setMap(JSON.parse(savedMap));
        state.setCurrentCashDecicents(savedCash);
        state.updateCashRates(jsonCache, getMap());
    } else {
        // Initialize base values
        state.setCurrentCash(jsonCache.get('initials')['startingCash']);
        state.setCashGrowthRate(jsonCache.get('initials')['startingGrowthRate']);
        state.setClickCashValue(jsonCache.get('initials')['startingClickValue']);
        // Initialize tile map
        initializeMap(jsonCache.get('initials')['mapWidth'], jsonCache.get('initials')['mapHeight']);
    }
}

export function resetGame(jsonCache) {
    initializeGame(jsonCache, true);
    gameResetCallbacks.forEach(callback => 
        callback.callback(callback.scene));
}

export function addGameResetListener(callback, scene) {
    gameResetCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}
