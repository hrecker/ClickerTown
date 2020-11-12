import { ShopSelectionType } from './ShopSelectionCache';
import { getSelectionProp, getPrice, getType, getTileName } from './ShopSelectionCache';

// Map is a 2D array of objects containing up to two properties	
// "tile": name of the tile in this location	
// "building": name of the building in this location, or null if there is none
// "rotation": clockwise rotation of the building in this location. 0 is the default. Possible values are 0, 90, 180, 270
let map;
let demolitionCostFraction;
let mapRotation;
let mapRotationCallbacks = [];
let placementCallbacks = [];
let placementCounts = {};

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
    updatePlacementCounts();
    return map;
}

function updatePlacementCounts() {
    placementCounts = {};
    for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
            if (map[x][y].building) {
                incrementPlacementCount(map[x][y].building);
            }
            incrementPlacementCount(map[x][y].tile);
        }
    }
}

function incrementPlacementCount(placed) {
    if (placementCounts[placed]) {
        placementCounts[placed]++;
    } else {
        placementCounts[placed] = 1;
    }
}

function decrementPlacementCount(removed) {
    if (placementCounts[removed]) {
        placementCounts[removed]--;
    }
}

export function getPlacementCount(placement) {
    if (placementCounts[placement]) {
        return placementCounts[placement];
    }
    return 0;
}

export function setMap(newMap) {
    map = newMap;
    updatePlacementCounts();
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

export function getShopSelectionPrice(selection, targetX, targetY) {
    if (getType(selection) == ShopSelectionType.DEMOLITION) {
        return getSelectionProp(map[targetX][targetY].building, 'cost') * demolitionCostFraction;
    } else {
        return getPrice(selection);
    }
}

export function addPlacementListener(callback, scene) {
    placementCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

export function addShopSelectionToMap(selection, tileMap, x, y, rotation) {
    let changed = [];
    if (getType(selection) == ShopSelectionType.DEMOLITION) {
        if (tileMap === map) {
            decrementPlacementCount(tileMap[x][y].building);
            changed.push(tileMap[x][y].building);
        }
        tileMap[x][y].building = null;
    } else {
        if (getType(selection) != ShopSelectionType.TILE_ONLY) {
            tileMap[x][y].building = selection;
            tileMap[x][y].rotation = rotation;
            if (tileMap === map) {
                incrementPlacementCount(selection);
                changed.push(selection);
            }
        } 
        if (getType(selection) != ShopSelectionType.BUILDING_ONLY) {
            let tileName = getTileName(selection);
            if (tileMap === map && tileMap[x][y].tile != tileName) {
                incrementPlacementCount(tileName);
                decrementPlacementCount(tileMap[x][y].tile);
                changed.push(tileName);
                changed.push(tileMap[x][y].tile);
            }
            tileMap[x][y].tile = tileName;
        }
    }

    if (tileMap === map) {
        placementCallbacks.forEach(callback => 
            callback.callback(changed, callback.scene));
    }
}

// Can only modify/place tiles or buildings on tiles that don't have a building already
// and do not match the tile being placed.
// Can only demolish tiles with a placed building.
export function canPlaceShopSelection(selection, x, y) {
    return selection && 
        ((map[x][y].building && getType(selection) == ShopSelectionType.DEMOLITION) ||
        (!map[x][y].building && getType(selection) != ShopSelectionType.DEMOLITION &&
        (getType(selection) != ShopSelectionType.TILE_ONLY || map[x][y].tile != selection)));
}
