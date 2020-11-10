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
