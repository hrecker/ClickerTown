import * as Util from '../util/Util';
import * as Tiles from '../model/Tile';

let map;

export function initializeMap(width, height) {
    map = new Array(width);
    for (let x = 0; x < width; x++) {
        map[x] = new Array(height);
        for (let y = 0; y < height; y++) {
            let type = Tiles.getTileType(Util.getRandomInt(0, 3));
            map[x][y] = new Tiles.Tile(type);
        }
    }
    return map;
}

export function getMap() {
    return map;
}

//TODO callbacks on change