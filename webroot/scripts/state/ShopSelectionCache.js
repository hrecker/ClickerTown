import { getPriceIncreaseRate } from './GameState';
import { getPlacementCount, getExpansionCount } from "./MapState";
import { getBuildingRelationship } from '../model/Building';
import { getTileRelationship } from '../model/Tile';

export const ShopSelectionType = Object.freeze({
    DEMOLITION: 0,
    TILE_ONLY: 1,
    BUILDING_ONLY: 2,
    TILE_AND_BUILDING: 3,
    EXPAND_MAP: 4
});

export const SelectionRelationship = Object.freeze({
    NEUTRAL: 0,
    POSITIVE: 1,
    NEGATIVE: 2
});

let selections = {};
let expandBasePrice;
let expandPriceIncreaseRate;
let maxSelectionRange = 0;

export function loadSelections(jsonCache) {
    // Demolition
    let demolition = {};
    demolition.cost = 0;
    demolition.flatCost = true;
    demolition.shopSelectionType = ShopSelectionType.DEMOLITION;
    demolition.shopPriceCache = {};
    selections['bomb'] = demolition;
    // Buildings
    for (let buildingName in jsonCache.get('buildings')) {
        selections[buildingName] = jsonCache.get('buildings')[buildingName];
        selections[buildingName].shopSelectionType = 
            ShopSelectionType[jsonCache.get('buildings')[buildingName]['shopSelectionType']];
        selections[buildingName].shopPriceCache = {};
        maxSelectionRange = Math.max(getSelectionRange(buildingName), maxSelectionRange);
    }
    // Tiles
    for (let tileName in jsonCache.get('tiles')) {
        selections[tileName] = jsonCache.get('tiles')[tileName];
        selections[tileName].shopSelectionType = ShopSelectionType.TILE_ONLY;
        selections[tileName].shopPriceCache = {};
        maxSelectionRange = Math.max(getSelectionRange(tileName), maxSelectionRange);
    }
    // Expand map
    let expand = {};
    expand.cost = 0;
    expand.shopSelectionType = ShopSelectionType.EXPAND_MAP;
    expand.shopPriceCache = {};
    selections['expand'] = expand;
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

export function getSelectionRange(selectionName) {
    if (!selections[selectionName] || !selections[selectionName].displayRange) {
        return 0;
    }
    return selections[selectionName].displayRange;
}

export function getMaxSelectionRange() {
    return maxSelectionRange;
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
    if (selectionName == 'bomb' || isFlatCost(selectionName)) {
        return selections[selectionName]['cost'];
    }

    if (selectionName == 'expand') {
        return getExpandPrice();
    }

    let placementCount = getPlacementCount(selectionName);
    if (selections[selectionName].shopPriceCache.hasOwnProperty(placementCount)) {
        return selections[selectionName].shopPriceCache[placementCount];
    }

    let basePrice = selections[selectionName]['cost'];
    let price = Math.floor(basePrice * Math.pow(getPriceIncreaseRate(), placementCount));
    if (price == basePrice && placementCount > 0) {
        price++;
    }
    selections[selectionName].shopPriceCache[placementCount] = price;
    return price;
}

export function isFlatCost(selectionName) {
    return selections[selectionName]['flatCost'];
}

export function setExpandBasePrice(basePrice) {
    expandBasePrice = basePrice;
}

export function setExpandPriceIncreaseRate(increaseRate) {
    expandPriceIncreaseRate = increaseRate;
}

export function getExpandPrice() {
    return Math.floor(expandBasePrice * Math.pow(expandPriceIncreaseRate, getExpansionCount()));
}

export function getSelectionRelationship(selection1, selection2) {
    let type = getType(selection1);
    if (type == ShopSelectionType.BUILDING_ONLY || type == ShopSelectionType.TILE_AND_BUILDING) {
        return getBuildingRelationship(selection1, selection2);
    } else if (type == ShopSelectionType.TILE_ONLY) {
        return getTileRelationship(selection1, selection2);
    }

    return SelectionRelationship.NEUTRAL;
}
