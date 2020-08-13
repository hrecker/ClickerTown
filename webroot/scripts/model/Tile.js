import * as build from './Building';

export const TileType = Object.freeze({
    CONCRETE: 0,
    SAND: 1,
    GRASS: 2,
    DIRT: 3
});

export function getTileType(index) {
    switch (index) {
        case 0:
            return TileType.CONCRETE;
        case 1:
            return TileType.SAND;
        case 2:
            return TileType.GRASS;
        case 3:
        default:
            return TileType.DIRT;
    }
}

export function getTileTypeFromName(name) {
    switch(name) {
        case 'concrete':
            return TileType.CONCRETE;
        case 'sand':
            return TileType.SAND;
        case 'grass':
            return TileType.GRASS;
        case 'dirt':
        default:
            return TileType.DIRT;
    }
}

export function getNameFromTileType(type) {
    switch(type) {
        case TileType.CONCRETE:
            return 'concrete';
        case TileType.SAND:
            return 'sand';
        case TileType.GRASS:
            return 'grass';
        case TileType.DIRT:
        default:
            return 'dirt';
    }
}

export class Tile {
    constructor(type) {
        this.type = type;
    }

    //TODO shouldn't need to construct the building here
    placeBuilding(type) {
        this.building = new build.Building(type);
    }

    getBuilding() {
        return this.building;
    }

    getTileName() {
        return getNameFromTileType(this.type);
    }
}
