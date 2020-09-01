import { getRandomInt } from '../util/Util';
import { ShopSelectionType } from '../state/UIState';

let map;
let demolitionCostFraction;

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
        return jsonCache.get('buildings')[map[targetX][targetY].building]['cost'] * demolitionCostFraction;
    } else {
        return selection.getPrice(jsonCache);
    }
}

export function addShopSelectionToMap(selection, tileMap, x, y) {
    if (selection.selectionType == ShopSelectionType.DEMOLITION) {
        tileMap[x][y].building = null;
    } else {
        if (selection.selectionType != ShopSelectionType.TILE_ONLY) {
            tileMap[x][y].building = selection.buildingName;
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
