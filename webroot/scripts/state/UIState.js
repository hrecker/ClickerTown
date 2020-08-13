export const ShopSelectionType = Object.freeze({
    TILE_ONLY: 0,
    BUILDING_ONLY: 1,
    TILE_AND_BUILDING: 2
});

// Item selected in the UI to build
let shopSelection;
let shopSelectionCallbacks = [];

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
            case ShopSelectionType.TILE_ONLY:
                return this.tileName;
            case ShopSelectionType.BUILDING_ONLY:
            case ShopSelectionType.TILE_AND_BUILDING:
            default:
                return this.buildingName;
        }
    }
}
