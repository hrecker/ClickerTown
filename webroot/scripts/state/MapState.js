import { getRandomProperty } from '../util/Util';
import { Tile } from '../model/Tile';

let map;

export function initializeMap(tilesJson, width, height) {
    map = new Array(width);
    for (let x = 0; x < width; x++) {
        map[x] = new Array(height);
        for (let y = 0; y < height; y++) {
            let tile = getRandomProperty(tilesJson);
            map[x][y] = new Tile(tile['name']);
        }
    }
    return map;
}

export function getMap() {
    return map;
}
