import { musicEnabledKey, soundEnabledKey } from '../state/GameState';

let musicEnabled = true;
let soundEnabled = true;
let musicEnabledCallbacks = [];

export function isMusicEnabled() {
    return musicEnabled;
}

export function setMusicEnabled(enabled) {
    if (musicEnabled != enabled) {
        musicEnabled = enabled ? true : false;      
        musicEnabledCallbacks.forEach(callback => 
            callback.callback(musicEnabled, callback.scene));
        // Save music setting to local storage
        localStorage.setItem(musicEnabledKey, isMusicEnabled());
    }
}

export function isSoundEnabled() {
    return soundEnabled;
}

export function playSound(scene, soundName, volume) {
    if (isSoundEnabled()) {
        let sound = scene.sound.get(soundName);
        if (!sound) {
            sound = scene.sound.add(soundName);
        }
        if (!volume) {
            volume = 1;
        }
        sound.play({
            volume: volume
        });
    }
}

export function setSoundEnabled(enabled) {
    soundEnabled = enabled ? true : false;
    // Save sound setting to local storage
    localStorage.setItem(soundEnabledKey, isSoundEnabled());
}

export function addMusicEnabledListener(callback, scene) {
    musicEnabledCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}