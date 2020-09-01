import { getAdjacentCoordinates } from '../state/MapState';

export function getBuildingCashGrowthRate(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    let building = buildingsJson[map[x][y].building];
    let cashGrowthRate = building['baseCashGrowthRate'];

    let adjacentTiles = getAdjacentCoordinates(x, y);
    switch (building['name']) {
        case "Convenience Store":
            // Convenience Store gets -1 growth rate for adjacent Convenience Stores
            adjacentTiles.forEach(adjacent => {
                if (map[adjacent.x][adjacent.y].building == "Convenience Store") {
                    cashGrowthRate -= 1;
                }
            });
            break;
        case "Restaurant":
            // Restaraunts get +1 growth rate for adjacent grass tiles
            adjacentTiles.forEach(adjacent => {
                if (map[adjacent.x][adjacent.y].tile == "Grass") {
                    cashGrowthRate += 1;
                }
            });
            break;
        case "Bank":
            // Banks get -10 growth rate for adjacent banks, and +2 for each other adjacent buildings
            adjacentTiles.forEach(adjacent => {
                let building = map[adjacent.x][adjacent.y].building;
                if (building == "Bank") {
                    cashGrowthRate -= 10;
                } else if (building) {
                    cashGrowthRate += 2;
                }
            });
            break;
    }

    return cashGrowthRate;
}

export function getBuildingClickValue(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    let building = buildingsJson[map[x][y].building];
    let clickValue = building['baseClickValue'];
    return clickValue;
}
