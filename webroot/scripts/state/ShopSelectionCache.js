import { getPriceIncreaseRate } from './GameState';
import { getPlacementCount } from "./MapState";

export const ShopSelectionType = Object.freeze({
    DEMOLITION: 0,
    TILE_ONLY: 1,
    BUILDING_ONLY: 2,
    TILE_AND_BUILDING: 3
});

let selections = {};
let i = 0;

export function loadSelections(jsonCache) {
    // Demolition
    let demolition = {};
    demolition.cost = 0;
    demolition.flatCost = true;
    demolition.shopSelectionType = ShopSelectionType.DEMOLITION;
    selections['bomb'] = demolition;
    // Buildings
    for (let buildingName in jsonCache.get('buildings')) {
        selections[buildingName] = jsonCache.get('buildings')[buildingName];
        selections[buildingName].shopSelectionType = 
            ShopSelectionType[jsonCache.get('buildings')[buildingName]['shopSelectionType']];
    }
    // Tiles
    for (let tileName in jsonCache.get('tiles')) {
        selections[tileName] = jsonCache.get('tiles')[tileName];
        selections[tileName].shopSelectionType = ShopSelectionType.TILE_ONLY;
    }
}

export function getSelections() {
    return selections;
}

export function getSelection(selectionName) {
    return selections[selectionName];
}

export function getSelectionProp(selectionName, propName) {
    return selections[selectionName][propName];
}

export function getTileName(selectionName) {
    let sel = selections[selectionName];
    if (sel.shopSelectionType == ShopSelectionType.TILE_ONLY) {
        return selectionName;
    } else {
        return sel.tileName;
    }
}

export function getType(selectionName) {
    return selections[selectionName].shopSelectionType;
}

export function getPrice(selectionName) {
    let basePrice = selections[selectionName]['cost'];
    if (isFlatCost(selectionName)) {
        return basePrice;
    }

    let placementCount = getPlacementCount(selectionName);
    let price = Math.floor(basePrice * Math.pow(getPriceIncreaseRate(), placementCount));
    if (price == basePrice && placementCount > 0) {
        price++;
    }
    return price;
}

export function isFlatCost(selectionName) {
    return selections[selectionName]['flatCost'];
}
