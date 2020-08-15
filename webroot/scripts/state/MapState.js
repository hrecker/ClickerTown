import { getRandomInt } from '../util/Util';

let map;

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
