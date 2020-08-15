export function getBuildingCashGrowthRate(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    let building = buildingsJson[map[x][y].building];
    let baseCashGrowthRate = building['baseCashGrowthRate'];
    //TODO logic based on nearby buildings & building type
    return baseCashGrowthRate;
}

export function getBuildingClickValue(buildingsJson, map, x, y) {
    if (!map[x][y].building) {
        return 0;
    }
    let building = buildingsJson[map[x][y].building];
    let baseClickValue = building['baseClickValue'];
    //TODO logic based on nearby buildings & building type
    return baseClickValue;
}
