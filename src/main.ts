import { drawMinus, drawNumber } from "./numbers";
import { random } from "./random";
import * as w4 from "./wasm4";

class GameObject {
    x: u8;
    y: u8;
    properties: u8;
};

class Island {
    x: u8;
    y: u8;
    width: u8;
    height: u8;
}

enum Player {
    FIRST_PLAYER = 0,
    SECOND_PLAYER = 1
}

enum Ressource {
    MONEY = 0,
    WOOD = 1,
    STONE = 2,
    IRON = 3
}

enum DisplayMode {
    NORMAL = 0,
    BUILD = 1,
    PLACING = 2
}

enum GameObjectType {
    CHURCH = 0
}

let mode = DisplayMode.NORMAL;
let currentGameObjectType: GameObjectType;
let tick: u8 = 0;
let year: u16 = 1600;
let month: u8 = 0;

let previousGamepad: u8;
let previousMouse: u8;

function getPlayer(props: u8): Player {
    return (props & 128) >> 7;
}

function getHealth(props: u8): u8 {
    return (props & 96) >> 5;
}

function getType(props: u8): GameObjectType {
    return (props & 31);
}

function makeProperties(player: Player, health: u8, type: GameObjectType): u8 {
    return <u8>((player << 7) | (health << 5) | type);
}

const islands: Array<Island> = [
    { x: 0, y: 0, width: 5, height: 8 },
    { x: 10, y: 10, width: 3, height: 4 }
]

const objects = new Map<u16, GameObject>();
const ressources = new Map<u8, u16>();
ressources.set(<u8>((0 * islands.length) + Ressource.MONEY), <u16>random(1000, 2000));
ressources.set(<u8>((0 * islands.length) + Ressource.WOOD), <u16>random(1000, 2000));
ressources.set(<u8>((0 * islands.length) + Ressource.STONE), <u16>random(1000, 2000));
ressources.set(<u8>((0 * islands.length) + Ressource.IRON), <u16>random(1000, 2000));


// tile
const tileWidth = 32;
const tileHeight = 16;
const tileDiagonal = Math.sqrt(8 * 8 + 16 * 16);
const tileFlags = 0; // BLIT_1BPP
const tile = memory.data<u8>([0xff, 0xfc, 0x3f, 0xff, 0xff, 0xf0, 0x0f, 0xff, 0xff, 0xc0, 0x03, 0xff, 0xff, 0x00, 0x00, 0xff, 0xfc, 0x00, 0x00, 0x3f, 0xf0, 0x00, 0x00, 0x0f, 0xc0, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc0, 0x00, 0x00, 0x03, 0xf0, 0x00, 0x00, 0x0f, 0xfc, 0x00, 0x00, 0x3f, 0xff, 0x00, 0x00, 0xff, 0xff, 0xc0, 0x03, 0xff, 0xff, 0xf0, 0x0f, 0xff, 0xff, 0xfc, 0x3f, 0xff]);

let offsetX = 0;
let offsetY = 0;

let selectedX = 0;
let selectedY = 0;

function drawOcean(): void {
    store<u16>(w4.DRAW_COLORS, 3);
    w4.rect(0, 0, 160, 160);
}

function drawIsland(island: Island): void {
    store<u16>(w4.DRAW_COLORS, 2);
    for (let row = <i32>island.width + <i32>island.x; row >= <i32>island.x; row--) {
        for (let col = <i32>island.height + <i32>island.y; col >= <i32>island.y; col--) {
            const x = (col - row) * tileWidth / 2;
            const y = (col + row) * tileHeight / 2;
            w4.blit(tile, x + offsetX, y + offsetY, tileWidth, tileHeight, tileFlags);
        }
    }
}

function drawIslands(): void {
    for (let i = 0; i < islands.length; i++) {
        drawIsland(islands[i])
    }
}

function drawSelected(): void {
    store<u16>(w4.DRAW_COLORS, 4);
    const x = (selectedX - selectedY) * tileWidth / 2;
    const y = (selectedX + selectedY) * tileHeight / 2;
    w4.blit(tile, x + offsetX, y + offsetY, tileWidth, tileHeight, tileFlags);
}

function drawObjects(): void {
    store<u16>(w4.DRAW_COLORS, 4);
    const values = objects.values();

    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const x = (<i32>value.x - <i32>value.y) * tileWidth / 2;
        const y = (<i32>value.x + <i32>value.y) * tileHeight / 2;
        w4.blit(tile, x + offsetX, y + offsetY, tileWidth, tileHeight, tileFlags);
    }
}

function drawUI(): void {
    store<u16>(w4.DRAW_COLORS, 1);
    w4.rect(0, 0, 160, 7)
    store<u16>(w4.DRAW_COLORS, 4);
    w4.line(0, 7, 160, 7);
    store<u16>(w4.DRAW_COLORS, 2);
    const money = <u8>(0 + Ressource.MONEY);

    drawNumber(130, 1, month + 1, true);
    drawMinus(135, 1);
    drawNumber(138, 1, year);

    store<u16>(w4.DRAW_COLORS, 0x4321);
    w4.blit(gold, 1, 0, goldWidth, goldHeight - 2, goldFlags);
    w4.blit(wood, 30, 0, woodWidth, woodHeight - 2, woodFlags);
    w4.blit(stone, 65, 0, stoneWidth, stoneHeight - 2, stoneFlags);
    w4.blit(iron, 95, 0, ironWidth, ironHeight - 2, ironFlags);

    store<u16>(w4.DRAW_COLORS, 0x02);
    drawNumber(3, 1, ressources.get(money));
    drawNumber(40, 1, ressources.get(<u8>Ressource.WOOD));
    drawNumber(70, 1, ressources.get(<u8>Ressource.STONE));
    drawNumber(100, 1, ressources.get(<u8>Ressource.IRON));

    if (mode === DisplayMode.BUILD) {
        store<u16>(w4.DRAW_COLORS, 1);
        w4.rect(8, 160, 160, 152);
        store<u16>(w4.DRAW_COLORS, 2);
        w4.blit(tile, 25, 35, tileWidth, tileHeight, tileFlags);
        w4.blit(tile, 25, 110, tileWidth, tileHeight, tileFlags);
        w4.blit(tile, 100, 35, tileWidth, tileHeight, tileFlags);
        w4.blit(tile, 100, 110, tileWidth, tileHeight, tileFlags);
        const name = "Church";
        w4.text(name, 80 - name.length * 4, 15);
    }
}

// gold
const goldWidth = 8;
const goldHeight = 8;
const goldFlags = 1; // BLIT_2BPP
const gold = memory.data<u8>([0x00, 0x00, 0x3f, 0x00, 0xd5, 0xc0, 0xd9, 0xc0, 0xd5, 0xc0, 0x3f, 0x00, 0x00, 0x00, 0x00, 0x00]);

// wood
const woodWidth = 12;
const woodHeight = 8;
const woodFlags = 1; // BLIT_2BPP
const wood = memory.data<u8>([0x00, 0x00, 0x00, 0x3e, 0xaa, 0xbc, 0xd7, 0xbf, 0xab, 0xd7, 0xaf, 0xfb, 0xd7, 0xaa, 0xab, 0x3e, 0xbf, 0xac, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

// stone
const stoneWidth = 12;
const stoneHeight = 8;
const stoneFlags = 1; // BLIT_2BPP
const stone = memory.data<u8>([0x00, 0x00, 0x00, 0x3a, 0xab, 0x00, 0x3a, 0xab, 0x00, 0xff, 0xff, 0xc0, 0xaa, 0xea, 0x80, 0xaa, 0xea, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

// iron
const ironWidth = 8;
const ironHeight = 8;
const ironFlags = 1; // BLIT_2BPP
const iron = memory.data<u8>([0x00, 0x00, 0x16, 0x00, 0x4a, 0x00, 0x5a, 0x80, 0x6b, 0xc0, 0x2f, 0x00, 0x00, 0x00, 0x00, 0x00]);

function handleInput(): void {
    const gamepad = load<u8>(w4.GAMEPAD1);

    if (gamepad & w4.BUTTON_RIGHT) {
        offsetX -= 2;
    } else if (gamepad & w4.BUTTON_LEFT) {
        offsetX += 2;
    } else if (gamepad & w4.BUTTON_UP) {
        offsetY += 2;
    } else if (gamepad & w4.BUTTON_DOWN) {
        offsetY -= 2;
    }

    const pressedThisFrame = gamepad & (gamepad ^ previousGamepad);
    previousGamepad = gamepad;

    if (pressedThisFrame & w4.BUTTON_1) {
        if (mode === DisplayMode.BUILD) {
            mode = DisplayMode.NORMAL;
        } else {
            mode = DisplayMode.BUILD;
        }
    }

    const mouse = load<u8>(w4.MOUSE_BUTTONS);
    const mouseThisFrame = mouse & (mouse ^ previousMouse);
    previousMouse = mouse;

    if (mouseThisFrame & w4.MOUSE_LEFT) {
        if (mode === DisplayMode.PLACING) {
            if (!objects.has(<u16>(selectedX * 256 + selectedY))) {
                const properties = makeProperties(Player.FIRST_PLAYER, 3, currentGameObjectType);
                objects.set(<u16>(selectedX * 256 + selectedY), { x: <u8>selectedX, y: <u8>selectedY, properties });
                mode = DisplayMode.NORMAL;
            }
        } else if (mode === DisplayMode.BUILD) {
            handleBuildMenuClick();
        }
    }

    const screenX = load<i16>(w4.MOUSE_X) - offsetX;
    const screenY = load<i16>(w4.MOUSE_Y) - offsetY;

    store<u16>(w4.DRAW_COLORS, 4);
    const mainC = -8;
    const intersectX1 = -mainC + 0.5 * (screenX) + (screenY);
    const intersectX2 = -mainC + 0.5 * (screenX) - (screenY);
    const intersectY1 = mainC + 0.5 * intersectX1;
    const intersectY2 = -mainC - 0.5 * intersectX2;

    if ((intersectY1 > screenY) || (intersectY2 > screenY)) {
        return;
    }

    const ix1 = intersectX1 - tileHeight;
    const ix2 = intersectX2 - tileHeight;
    const tileX = (Math.sqrt(ix1 * ix1 + intersectY1 * intersectY1)) / tileDiagonal;
    const tileY = (Math.sqrt(ix2 * ix2 + intersectY2 * intersectY2)) / tileDiagonal;


    selectedX = <i32>Math.floor(tileX);
    selectedY = <i32>Math.floor(tileY);
}

function handleBuildMenuClick(): void {
    //TODO build for real
    mode = DisplayMode.PLACING;
    currentGameObjectType = GameObjectType.CHURCH;
}

function handleLogic(): void {
    if (tick === 0) {
        const values = objects.values();

        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            if (getPlayer(value.properties) === Player.FIRST_PLAYER) {
                if (getType(value.properties) === GameObjectType.CHURCH) {
                    ressources.set(0, ressources.get(0) + 1);
                }
            }
        }
    }
}

export function update(): void {
    tick = <u8>((tick + 1) % 300);

    if (tick === 0) {
        month = (month + 1) % 12;

        if (month === 0) {
            year = year + 1;
        }
    }

    if (mode !== DisplayMode.BUILD) {
        drawOcean();
        drawIslands();
        drawObjects();
    }
    if (mode === DisplayMode.PLACING) {
        drawSelected();
    }
    handleInput();
    handleLogic();
    drawUI();
}
