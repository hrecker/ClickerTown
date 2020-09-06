export const ShopSelectionType = Object.freeze({
    DEMOLITION: 0,
    TILE_ONLY: 1,
    BUILDING_ONLY: 2,
    TILE_AND_BUILDING: 3
});

let inDialog = false;

// Item selected in the UI to build
let shopSelection;
let shopSelectionCallbacks = [];

export function setInDialog(isInDialog) {
    inDialog = isInDialog;
}

export function isInDialog() {
    return inDialog;
}

export function setShopSelection(selection) {
    shopSelection = selection;
    shopSelectionCallbacks.forEach(callback => 
        callback.callback(shopSelection, callback.scene));
}

export function getShopSelection() {
    return shopSelection;
}

export function addShopSelectionListener(callback, scene) {
    shopSelectionCallbacks.push({ 
        callback: callback,
        scene: scene
    });
}

export class ShopSelection {
    constructor(selectionType, tileName, buildingName) {
        this.selectionType = selectionType;
        this.tileName = tileName;
        this.buildingName = buildingName;
    }

    getName() {
        switch (this.selectionType) {
            case ShopSelectionType.DEMOLITION:
                return 'bomb';
            case ShopSelectionType.TILE_ONLY:
                return this.tileName;
            case ShopSelectionType.BUILDING_ONLY:
            case ShopSelectionType.TILE_AND_BUILDING:
            default:
                return this.buildingName;
        }
    }

    getPrice(jsonCache) {
        switch (this.selectionType) {
            case ShopSelectionType.TILE_ONLY:
                return jsonCache.get('tiles')[this.tileName]['cost'];
            case ShopSelectionType.BUILDING_ONLY:
            case ShopSelectionType.TILE_AND_BUILDING:
                return jsonCache.get('buildings')[this.buildingName]['cost'];
            // Demolition price depends on what is demolished
            case ShopSelectionType.DEMOLITION:
            default:
                return 0;
        }
    }
}
