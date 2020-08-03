import * as build from './Building';

export const TileType = Object.freeze({ 
    STONE: 0, 
    FULL_GRASS: 1, 
    PATCHY_GRASS: 2
});

export function getTileType(index) {
    switch (index) {
        case 0:
            return TileType.STONE;
        case 1:
            return TileType.FULL_GRASS;
        case 2:
        default:
            return TileType.PATCHY_GRASS;
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
