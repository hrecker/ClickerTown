/** @type {import("../../typings/phaser")}*/

import { Plugin as NineSlicePlugin } from 'phaser3-nineslice'
import { LoadingScene } from "./scenes/LoadingScene";
import { TitleScene } from "./scenes/TitleScene";
import { BackgroundScene } from "./scenes/BackgroundScene";
import { MapScene } from "./scenes/MapScene";
import { UIScene } from "./scenes/UIScene";

var config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 740,
    physics: {
        default: 'arcade'
    },
    plugins: {
        global: [ 
            NineSlicePlugin.DefaultCfg
        ],
    },
    scene: [
        LoadingScene,
        BackgroundScene,
        TitleScene,
        MapScene,
        UIScene
    ]
};

new Phaser.Game(config);
