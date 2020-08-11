export const BuildingType = Object.freeze({
    YELLOW: 0,
    RED: 1,
    BROWN: 2,
    RED_AWNING: 3,
    GREEN_AWNING: 4,
    NO_AWNING: 5,
});

export const SpriteType = Object.freeze({
    TILE_AND_BUILDING: 0,
    BUILDING_ONLY: 1
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
        default:
        case 'no_awning':
            return BuildingType.NO_AWNING;
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
        default:
        case BuildingType.NO_AWNING:
            return 'no_awning';
    }
}

export class Building {
    constructor(buildingType, spriteType) {
        this.buildingType = buildingType;
        this.spriteType = spriteType;
    }

    getName() {
        return getBuildingNameFromType(this.buildingType);
    }
}
