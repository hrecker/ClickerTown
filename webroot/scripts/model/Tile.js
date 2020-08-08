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

export class Tile {
    constructor(type) {
        this.type = type;
    }

    placeBuilding(type) {
        this.building = new build.Building(type);
    }

    getBuilding() {
        return this.building;
    }
}
