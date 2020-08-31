import { getRandomInt, daysBetween } from '../util/Util';
import { ShopSelection, ShopSelectionType } from '../state/UIState';
import * as date from '../state/DateState';

// Map is a 2D array of objects containing up to three properties
// "tile": name of the tile in this location
// "building": name of the building in this location, or null if there is none
// "buildDate": date that the building in this location was built, or null if there is no building here
// "degraded": true if this building is in degraded state, or null otherwise
// "previousBuilding": building on this tile before it collapsed into rubble, if applicable
let map;
let demolitionCostFraction;
let buildingDegradedCallbacks = [];
let buildingCollapseCallbacks = [];

export function setDemolitionCostFraction(costFraction) {
    demolitionCostFraction = costFraction;
}

export function initializeMap(tilesJson, width, height) {
    let startingTileNames = Object.keys(tilesJson).
        filter(tile => tilesJson[tile]['startingTile']);
    map = new Array(width);
    for (let x = 0; x < width; x++) {
        map[x] = new Array(height);
        for (let y = 0; y < height; y++) {
            let tileName = startingTileNames[getRandomInt(0, startingTileNames.length)];
            map[x][y] = { 
                "tile": tileName,
                "building": null
            };
        }
    }
    return map;
}

export function getMap() {
    return map;
}

export function areCoordinatesValid(x, y) {
    return x >= 0 && x < map.length && y >=0 && y < map[0].length;
}

export function getAdjacentCoordinates(x, y) {
    let result = [
        new Phaser.Math.Vector2(x - 1, y),
        new Phaser.Math.Vector2(x + 1, y),
        new Phaser.Math.Vector2(x, y - 1),
        new Phaser.Math.Vector2(x, y + 1)
    ];
    return result.filter(coords => areCoordinatesValid(coords.x, coords.y));
}

export function getShopSelectionPrice(jsonCache, selection, targetX, targetY) {
    if (selection.selectionType == ShopSelectionType.DEMOLITION) {
        let buildingName;
        if (map[targetX][targetY].building == "Rubble") {
            // Rubble demolish cost is based on the previous building that became rubble
            buildingName = map[targetX][targetY].previousBuilding;
        } else {
            buildingName = map[targetX][targetY].building;
        }
        return jsonCache.get('buildings')[buildingName]['cost'] * demolitionCostFraction;
    } else {
        return selection.getPrice(jsonCache);
    }
}

export function addShopSelectionToMap(selection, tileMap, x, y) {
    if (selection.selectionType == ShopSelectionType.DEMOLITION) {
        tileMap[x][y].building = null;
        tileMap[x][y].buildDate = null;
        tileMap[x][y].degraded = null;
    } else {
        if (selection.selectionType != ShopSelectionType.TILE_ONLY) {
            tileMap[x][y].building = selection.buildingName;
            tileMap[x][y].buildDate = new Date(date.getCurrentDate());
            tileMap[x][y].degraded = null;
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

export function addBuildingCollapseListener(callback, context) {
    buildingCollapseCallbacks.push({ 
        callback: callback,
        context: context
    });
}

export function addBuildingDegradedListener(callback, context) {
    buildingDegradedCallbacks.push({ 
        callback: callback,
        context: context
    });
}

export function currentDateListener(date, jsonCache) {
    for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
            if (map[x][y].building && map[x][y].building != "Rubble") {
                let days = daysBetween(map[x][y].buildDate, date);
                // Check for building degrade/collapse
                if (!map[x][y].degraded &&
                        days >= jsonCache.get('buildings')[map[x][y].building]['degradeDays']) {
                    // Degrade the building
                    map[x][y].degraded = true;
                    buildingDegradedCallbacks.forEach(callback => 
                        callback.callback(new Phaser.Math.Vector2(x, y), callback.context));
                } else if (days >= jsonCache.get('buildings')[map[x][y].building]['collapseDays']) {
                    // Demolish the building
                    map[x][y].previousBuilding = map[x][y].building;
                    addShopSelectionToMap(new ShopSelection(ShopSelectionType.DEMOLITION), map, x, y);
                    map[x][y].building = "Rubble";
                    buildingCollapseCallbacks.forEach(callback => 
                        callback.callback(new Phaser.Math.Vector2(x, y), callback.context));
                }
            }
        }
    }
}
