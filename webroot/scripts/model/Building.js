export const BuildingType = Object.freeze({
    YELLOW: 0,
    RED: 1,
    BROWN: 2
});

export function getBuildingType(index) {
    switch (index) {
        case 0:
            return BuildingType.YELLOW;
        case 1:
            return BuildingType.RED;
        case 2:
        default:
            return BuildingType.BROWN;
    }
}

export function getBuildingTypeFromName(name) {
    let lowerName = name.toLowerCase();
    switch (lowerName) {
        case 'yellow':
            return BuildingType.YELLOW;
        case 'red':
            return BuildingType.RED;
        case 'brown':
        default:
            return BuildingType.BROWN;
    }
}

export class Building {
    constructor(type) {
        this.type = type;
    }
}
