import { getAdjacentCoordinates } from '../state/MapState';
import { SelectionRelationship } from '../state/ShopSelectionCache';

export function getTileCashGrowthRate(tile, map, x, y) {
    if (!tile) {
        return 0;
    }
    let baseCashGrowthRate = tile['baseCashGrowthRate'];

    switch (tile['name']) {
        case "Grass":
            // Grass gets +0.1 growth rate for adjacent grass tiles
            let adjacentTiles = getAdjacentCoordinates(x, y);
            adjacentTiles.forEach(adjacent => {
                if (map[adjacent.x][adjacent.y].tile == "Grass") {
                    baseCashGrowthRate += 0.1;
                }
            });
            break;
        case "Sand":
            // Sand gets +0.5 growth rate when located on the edge of the map
            if (x == 0 || x == map.length - 1 || y == 0 || y == map[0].length - 1) {
                baseCashGrowthRate += 0.5;
            }
            break;
    }

    return baseCashGrowthRate;
}

export function getTileClickValue(tile, map, x, y) {
    if (!tile) {
        return 0;
    }
    return tile['baseClickValue'];
}


// Positive, negative, or neutral. Ex: grass positive with grass and fountains.
// See above methods for details on the relationships between buildings/tiles.
export function getTileRelationship(tile, other) {
    switch (tile) {
        case "Grass":
            if (other == "Grass" || other == "Fountain") {
                return SelectionRelationship.POSITIVE;
            }
            break;
    }
    // Neutral if not specified
    return SelectionRelationship.NEUTRAL;
}