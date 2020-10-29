# ClickerTown
ClickerTown is an isometric clicker game built using [Phaser 3](https://phaser.io/). Click for cash, so you can build buildings to get more cash so you can build more buildings!

Try the game [here](https://robocrow.itch.io/clickertown)!

# Game Overview
The map is a 7x7 dirt square to start off. The player starts with no money, and clicks to earn enough to purchase buildings and tiles from the shop. Each building has different properties that can affect the amount of cash being generated, often depending on other nearby buildings. The map doesn't change size, so unwanted buildings must be demolished to make space for new buildings. The game autosaves every minute, as well as allowing manual saves.

![MainGame](screenshots/main_game.png?raw=true)

Buildings can be rotated with right click (for aesthetic reasons). The camera is controlled with WASD and can zoom in and out with Q and E. The whole map can be rotated with the rotate button on the left. The button in the top left corner can be used to reset the game and start over.

# Running the game yourself
This repository is structured to serve the game locally with [parcel](https://parceljs.org/getting_started.html). Start parcel pointing at the webroot/index.html entry file.

# Credits
Sound effects and sprites from the [Kenney Asset Pack (version 41)](https://www.kenney.nl).

Music by [Eric Matyas](https://www.soundimage.org) ("Puzzle Dreams").

Bomb image from https://icon-library.com/icon/bomb-icon-24.html

Phaser nineslice plugin from https://github.com/jdotrjs/phaser3-nineslice
