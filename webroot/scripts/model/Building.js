export const BuildingType = Object.freeze({
    YELLOW: 0,
    RED: 1,
    BROWN: 2,
    RED_AWNING: 3,
    GREEN_AWNING: 4,
    NO_AWNING: 5,
    GRASS: 6
});

export function getBuildingTypeFromName(name) {
    let lowerName = name.toLowerCase();
    switch (lowerName) {
        case 'yellow':
            return BuildingType.YELLOW;
        case 'red':
            return BuildingType.RED;
        case 'brown':
            return BuildingType.BROWN;
        case 'red_awning':
            return BuildingType.RED_AWNING;
        case 'green_awning':
            return BuildingType.GREEN_AWNING;
        case 'no_awning':
            return BuildingType.NO_AWNING;
        default:
        case 'grass':
            return BuildingType.GRASS;
    }
}

export function getBuildingNameFromType(buildingType) {
    switch(buildingType) {
        case BuildingType.YELLOW:
            return 'yellow';
        case BuildingType.RED:
            return 'red';
        case BuildingType.BROWN:
            return 'brown';
        case BuildingType.RED_AWNING:
            return 'red_awning';
        case BuildingType.GREEN_AWNING:
            return 'green_awning';
        case BuildingType.NO_AWNING:
            return 'no_awning';
        default:
        case BuildingType.GRASS:
            return 'grass';
    }
}

export class Building {
    constructor(buildingType) {
        this.buildingType = buildingType;
    }

    getName() {
        return getBuildingNameFromType(this.buildingType);
    }
}
