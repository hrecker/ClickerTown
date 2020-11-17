import { getTilesWithinRange } from '../state/MapState';
import { SelectionRelationship, ShopSelectionType, getType } from '../state/ShopSelectionCache';

function countHouses(map, tiles) {
    let houseCount = 0;
    tiles.forEach(tile => {
        if (map[tile.x][tile.y].building == "House") {
            houseCount++;
        } else if (map[tile.x][tile.y].building == "Apartment") {
            // Apartments count as 3 houses
            houseCount += 3;
        }
    });
    return houseCount;
}

export function getBuildingCashGrowthRate(building, map, x, y) {
    if (!building) {
        return 0;
    }
    let cashGrowthRate = building['baseCashGrowthRate'];

    let tilesToCheck;
    switch (building['name']) {
        case "Restaurant":
            // Restaraunts get +$0.5/second for each house within 2 tiles
            tilesToCheck = getTilesWithinRange(x, y, 2);
            cashGrowthRate += 0.5 * countHouses(map, tilesToCheck);
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
            // Banks get +$0.50/second for each house within 5 tiles, and
            // -$10/second for each bank within 5 tiles
            tilesToCheck = getTilesWithinRange(x, y, 5);
            cashGrowthRate += 0.5 * countHouses(map, tilesToCheck);
            tilesToCheck.forEach(tile => {
                let building = map[tile.x][tile.y].building;
                if (building == "Bank") {
                    cashGrowthRate -= 10;
                }
            });
            break;
        case "Warehouse":
            // Warehouses get -$1/second for each house within 3 tiles
            tilesToCheck = getTilesWithinRange(x, y, 3);
            cashGrowthRate -= countHouses(map, tilesToCheck);
            break;
        case "Fountain":
            // Fountains get +$1/second for each grass within 2 tiles
            tilesToCheck = getTilesWithinRange(x, y, 2);
            tilesToCheck.forEach(tile => {
                if (map[tile.x][tile.y].tile == "Grass") {
                    cashGrowthRate++;
                }
            });
            break;
        case "Courthouse":
            // Courthouses get +$2/second for each non-hermit building within 5 tiles,
            // They also get -$100/second for each courthouse within 5 tiles
            tilesToCheck = getTilesWithinRange(x, y, 5);
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
            // Hermits get -$3/second for each building within 3 tiles
            tilesToCheck = getTilesWithinRange(x, y, 3);
            tilesToCheck.forEach(tile => {
                let building = map[tile.x][tile.y].building;
                if (building) {
                    cashGrowthRate -= 3;
                }
            });
            break;
        case "Office":
            // Offices get +$3/second for each warehouse within 3 tiles
            tilesToCheck = getTilesWithinRange(x, y, 3);
            tilesToCheck.forEach(tile => {
                let building = map[tile.x][tile.y].building;
                if (building == "Warehouse") {
                    cashGrowthRate += 3;
                }
            });
            break;
    }

    return cashGrowthRate;
}

export function getBuildingClickValue(building, map, x, y) {
    if (!building) {
        return 0;
    }
    return building['baseClickValue'];
}

// Positive, negative, or neutral. Ex: courthouses positive with all
// building except courthouse, which is negative. House neutral with 
// all buildings. Etc.
// See above methods for details on the relationships between buildings/tiles.
export function getBuildingRelationship(building, other) {
    switch (building) {
        case "Restaurant":
            if (other == "House" || other == "Apartment") {
                return SelectionRelationship.POSITIVE;
            }
            break;
        case "Convenience Store":
            if (other == "Convenience Store") {
                return SelectionRelationship.NEGATIVE;
            }
            break;
        case "Bank":
            if (other == "House" || other == "Apartment") {
                return SelectionRelationship.POSITIVE;
            }
            if (other == "Bank") {
                return SelectionRelationship.NEGATIVE;
            }
            break;
        case "Warehouse":
            if (other == "House" || other == "Apartment") {
                return SelectionRelationship.NEGATIVE;
            }
            if (other == "Office") {
                return SelectionRelationship.POSITIVE;
            }
            break;
        case "Fountain":
            if (other == "Grass") {
                return SelectionRelationship.POSITIVE;
            }
            break;
        case "Courthouse":
            if (other == "Courthouse" || other == "Hermit") {
                return SelectionRelationship.NEGATIVE;
            } else if (getType(other) == ShopSelectionType.BUILDING_ONLY || 
                           getType(other) == ShopSelectionType.TILE_AND_BUILDING) {
                return SelectionRelationship.POSITIVE;
            }
            break;
        case "Hermit":
            if (getType(other) == ShopSelectionType.BUILDING_ONLY || 
                    getType(other) == ShopSelectionType.TILE_AND_BUILDING) {
                return SelectionRelationship.NEGATIVE;
            }
            break;
        case "Office":
            if (other == "Warehouse") {
                return SelectionRelationship.POSITIVE;
            }
            break;
    }

    // Some buildings default to positive/negative
    if (other == "Courthouse") {
        return SelectionRelationship.POSITIVE;
    }
    if (other == "Hermit") {
        return SelectionRelationship.NEGATIVE;
    }

    // Neutral if not specified
    return SelectionRelationship.NEUTRAL;
}
