export function getBuildingCashGrowthRate(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    console.log(map[x][y].building);
    let building = buildingsJson[map[x][y].building];
    return building['baseCashGrowthRate'];
    //TODO logic based on nearby buildings & building type
}

export function getBuildingClickValue(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    let building = buildingsJson[map[x][y].building];
    return building['baseClickValue'];
    //TODO logic based on nearby buildings & building type
}

export class Building {
    constructor(name) {
        this.name = name;
    }
}
