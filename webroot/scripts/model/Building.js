import { getAdjacentCoordinates } from '../state/MapState';

export function getBuildingCashGrowthRate(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    let building = buildingsJson[map[x][y].building];
    let baseCashGrowthRate = building['baseCashGrowthRate'];

    let adjacentTiles = getAdjacentCoordinates(x, y);
    switch (building['name']) {
        case "Convenience Store":
            // Convenience Store gets -1 growth rate for adjacent Convenience Stores
            adjacentTiles.forEach(adjacent => {
                if (map[adjacent.x][adjacent.y].building == "Convenience Store") {
                    baseCashGrowthRate -= 1;
                }
            });
            break;
        case "Restaurant":
            // Restaraunts get +1 growth rate for adjacent grass tiles
            adjacentTiles.forEach(adjacent => {
                if (map[adjacent.x][adjacent.y].tile == "Grass") {
                    baseCashGrowthRate += 1;
                }
            });
            break;
        case "Bank":
            // Banks get -10 growth rate for adjacent banks, and +2 for each other adjacent buildings
            adjacentTiles.forEach(adjacent => {
                let building = map[adjacent.x][adjacent.y].building;
                if (building == "Bank") {
                    baseCashGrowthRate -= 10;
                } else if (building) {
                    baseCashGrowthRate += 2;
                }
            });
            break;
    }

    return baseCashGrowthRate;
}

export function getBuildingClickValue(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    let building = buildingsJson[map[x][y].building];
    let baseClickValue = building['baseClickValue'];
    return baseClickValue;
}
