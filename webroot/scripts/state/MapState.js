import { ShopSelectionType } from '../state/UIState';

// Map is a 2D array of objects containing up to two properties	
// "tile": name of the tile in this location	
// "building": name of the building in this location, or null if there is none
// "rotation": clockwise rotation of the building in this location. 0 is the default. Possible values are 0, 90, 180, 270
let map;
let demolitionCostFraction;
let mapRotation;
let mapRotationCallbacks = [];

export function setDemolitionCostFraction(costFraction) {
    demolitionCostFraction = costFraction;
}

export function initializeMap(width, height) {
    map = new Array(width);
    for (let x = 0; x < width; x++) {
        map[x] = new Array(height);
        for (let y = 0; y < height; y++) {
            map[x][y] = { 
                "tile": 'Dirt',
                "building": null,
                "rotation": 0
            };
        }
    }
    return map;
}

export function setMap(newMap) {
    map = newMap;
}

export function getMap() {
    return map;
}

export function rotateClockwise() {
    setMapRotation((mapRotation + 90) % 360);
}

export function setMapRotation(rotation) {
    mapRotation = rotation;
    mapRotationCallbacks.forEach(callback => 
        callback.callback(mapRotation, callback.scene));
}

export function getMapRotation() {
    return mapRotation;
}

export function addMapRotationListener(callback, scene) {
    mapRotationCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

export function areCoordinatesValid(x, y) {
    return x >= 0 && x < map.length && y >=0 && y < map[0].length;
}

export function getAdjacentCoordinates(x, y) {
    return getTilesWithinRange(x, y, 1);
}

export function getTilesWithinRange(x, y, range) {
    range = Math.abs(range);
    let result = [];
    for (let deltaX = -range; deltaX <= range; deltaX++) {
        for (let deltaY = Math.abs(deltaX) - range; deltaY <= range - Math.abs(deltaX); deltaY++) {
            if ((deltaX != 0 || deltaY != 0) && areCoordinatesValid(x + deltaX, y + deltaY)) {
                result.push(new Phaser.Math.Vector2(x + deltaX, y + deltaY));
            }
        }
    }
    return result;
}

export function getShopSelectionPrice(jsonCache, selection, targetX, targetY) {
    if (selection.selectionType == ShopSelectionType.DEMOLITION) {
        return jsonCache.get('buildings')[map[targetX][targetY].building]['cost'] * demolitionCostFraction;
    } else {
        return selection.getPrice(jsonCache);
    }
}

export function addShopSelectionToMap(selection, tileMap, x, y, rotation) {
    if (selection.selectionType == ShopSelectionType.DEMOLITION) {
        tileMap[x][y].building = null;
    } else {
        if (selection.selectionType != ShopSelectionType.TILE_ONLY) {
            tileMap[x][y].building = selection.buildingName;
            tileMap[x][y].rotation = rotation;
        } 
        if (selection.selectionType != ShopSelectionType.BUILDING_ONLY) {
            tileMap[x][y].tile = selection.tileName;
        }
    }
}

// Can only modify/place tiles or buildings on tiles that don't have a building already
// and do not match the tile being placed.
// Can only demolish tiles with a placed building.
export function canPlaceShopSelection(selection, x, y) {
    return selection && 
        ((map[x][y].building && selection.selectionType == ShopSelectionType.DEMOLITION) ||
        (!map[x][y].building && selection.selectionType != ShopSelectionType.DEMOLITION &&
        (selection.selectionType != ShopSelectionType.TILE_ONLY || map[x][y].tile != selection.getName())));
}
