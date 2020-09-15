import { getTilesWithinRange } from '../state/MapState';

export function getBuildingCashGrowthRate(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    let building = buildingsJson[map[x][y].building];
    let cashGrowthRate = building['baseCashGrowthRate'];

    let tilesToCheck;
    switch (building['name']) {
        case "Restaurant":
            // Restaraunts get +$1/second for each house within 2 tiles
            tilesToCheck = getTilesWithinRange(x, y, 2);
            tilesToCheck.forEach(tile => {
                if (map[tile.x][tile.y].building == "House") {
                    cashGrowthRate += 1;
                }
            });
            break;
        case "Convenience Store":
            // Convenience Store gets -$2/second for Convenience Stores within 3 tiles
            tilesToCheck = getTilesWithinRange(x, y, 3);
            tilesToCheck.forEach(tile => {
                if (map[tile.x][tile.y].building == "Convenience Store") {
                    cashGrowthRate -= 2;
                }
            });
            break;
        case "Bank":
            // Banks get +$0.25/second for each house within 5 tiles, and
            // -$10/second for each bank within 5 tiles
            tilesToCheck = getTilesWithinRange(x, y, 5);
            tilesToCheck.forEach(tile => {
                let building = map[tile.x][tile.y].building;
                if (building == "Bank") {
                    cashGrowthRate -= 10;
                } else if (building == "House") {
                    cashGrowthRate += 0.25;
                }
            });
            break;
        case "Warehouse":
            // Warehouses get -$1/second for each house within 3 tiles
            tilesToCheck = getTilesWithinRange(x, y, 3);
            tilesToCheck.forEach(tile => {
                let building = map[tile.x][tile.y].building;
                if (building == "House") {
                    cashGrowthRate -= 1;
                }
            });
            break;
        case "Courthouse":
            // Courthouses get +$2/second for each non-hermit building within 4 tiles,
            // They also get -$100/second for each courthouse within 4 tiles
            tilesToCheck = getTilesWithinRange(x, y, 4);
            tilesToCheck.forEach(tile => {
                let building = map[tile.x][tile.y].building;
                if (building == "Courthouse") {
                    cashGrowthRate -= 100;
                } else if (building && building !== "Hermit") {
                    cashGrowthRate += 2;
                }
            });
            break;
        case "Hermit":
            // Hermits get -$2/second for each building within 3 tiles
            tilesToCheck = getTilesWithinRange(x, y, 3);
            tilesToCheck.forEach(tile => {
                let building = map[tile.x][tile.y].building;
                if (building) {
                    cashGrowthRate -= 2;
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
