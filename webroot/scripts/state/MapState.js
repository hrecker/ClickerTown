import * as Util from '../util/Util';
import * as Tiles from '../model/Tile';

let map;
let selectedBuilding;
let selectedBuildingCallbacks = [];

export function initializeMap(width, height) {
    map = new Array(width);
    for (let x = 0; x < width; x++) {
        map[x] = new Array(height);
        for (let y = 0; y < height; y++) {
            let type = Tiles.getTileType(Util.getRandomInt(0, Object.keys(Tiles.TileType).length));
            map[x][y] = new Tiles.Tile(type);
        }
    }
    return map;
}

export function getMap() {
    return map;
}

export function setSelectedBuilding(selected) {
    selectedBuilding = selected;
    selectedBuildingCallbacks.forEach(callback => 
        callback.callback(selectedBuilding, callback.scene));
}

export function getSelectedBuilding() {
    return selectedBuilding;
}

export function addSelectedBuildingListener(callback, scene) {
    selectedBuildingCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}
