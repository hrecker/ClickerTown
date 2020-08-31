import { getAdjacentCoordinates } from '../state/MapState';

// Degraded buildings produce 80% of normal output
const degradedMultiplier = 0.8;

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
        case "Rubble":
            // Rubble gets -1 growth rate for each adjacent building
            adjacentTiles.forEach(adjacent => {
                if (map[adjacent.x][adjacent.y].building) {
                    cashGrowthRate -= 1;
                }
            });
            break;
    }

    // Apply degraded building reduced output
    if (cashGrowthRate > 0 && map[x][y].degraded) {
        cashGrowthRate *= degradedMultiplier;
    }

    return cashGrowthRate;
}

export function getBuildingClickValue(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    let building = buildingsJson[map[x][y].building];
    let clickValue = building['baseClickValue'];

    let adjacentTiles = getAdjacentCoordinates(x, y);
    switch (building['name']) {
        case "Rubble":
            // Rubble gets -0.1 click value for each adjacent building
            adjacentTiles.forEach(adjacent => {
                if (map[adjacent.x][adjacent.y].building) {
                    clickValue -= 0.1;
                }
            });
            break;
    }

    // Apply degraded building reduced output
    if (clickValue > 0 && map[x][y].degraded) {
        clickValue *= degradedMultiplier;
    }

    return clickValue;
}
