export function getTileCashGrowthRate(tilesJson, map, x, y) {
    if (!map[x][y].tile) {
        return 0;
    }
    let tile = tilesJson[map[x][y].tile];
    let baseCashGrowthRate = tile['baseCashGrowthRate'];
    //TODO logic based on nearby tiles & tile type
    return baseCashGrowthRate;
}

export function getTileClickValue(tilesJson, map, x, y) {
    if (!map[x][y].tile) {
        return 0;
    }
    let tile = tilesJson[map[x][y].tile];
    let baseClickValue = tile['baseClickValue'];
    //TODO logic based on nearby tiles & tile type
    return baseClickValue;
}
