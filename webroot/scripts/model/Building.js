export const BuildingType = Object.freeze({ 
    CRATE: 0, 
    CHEST: 1, 
    BOULDER: 2
});

export function getBuildingType(index) {
    switch (index) {
        case 0:
            return BuildingType.CRATE;
        case 1:
            return BuildingType.CHEST;
        case 2:
        default:
            return BuildingType.BOULDER;
    }
}

export class Building {
    constructor(type) {
        this.type = type;
    }
}
