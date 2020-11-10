import { setMap, getMap, initializeMap, getMapRotation, setMapRotation } from './MapState';
import * as state from './CashState';
import { isMusicEnabled, isSoundEnabled, setMusicEnabled, setSoundEnabled } from './AudioState';

const mapKey = 'map';
const cashKey = 'currentCash';
const mapRotationKey = 'mapRotation';
export const musicEnabledKey = 'musicEnabled';
export const soundEnabledKey = 'soundEnabled';
let gameResetCallbacks = [];

let priceIncreaseRate = 1;

export function saveGame() {
    localStorage.setItem(mapKey, JSON.stringify(getMap()));
    localStorage.setItem(cashKey, state.getCurrentCashDecicents());
    localStorage.setItem(mapRotationKey, getMapRotation());
}

export function initializeGame(jsonCache, forceReinitialize) {
    let savedMap = localStorage.getItem(mapKey);
    let savedCash = localStorage.getItem(cashKey);
    let savedRotation = localStorage.getItem(mapRotationKey) ?? 0;
    let musicEnabled = localStorage.getItem(musicEnabledKey);
    let soundEnabled = localStorage.getItem(soundEnabledKey);
    if (savedMap && savedCash != null && !forceReinitialize) {
        // Load saved values
        setMap(JSON.parse(savedMap));
        state.setCurrentCashDecicents(savedCash);
        state.updateCashRates(getMap());
        setMapRotation(Number(savedRotation));
        // Default to enabling sound/music
        setMusicEnabled(musicEnabled == 'true' || musicEnabled === null);
        setSoundEnabled(soundEnabled == 'true' || soundEnabled === null);
    } else {
        // Initialize base values
        state.setCurrentCash(jsonCache.get('initials')['startingCash']);
        state.setCashGrowthRate(jsonCache.get('initials')['startingGrowthRate']);
        state.setClickCashValue(jsonCache.get('initials')['startingClickValue']);
        setMapRotation(0);
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

export function setPriceIncreaseRate(rate) {
    priceIncreaseRate = rate;
}

export function getPriceIncreaseRate() {
    return priceIncreaseRate;
}
