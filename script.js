function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Dormant Thue-Morse helpers kept for possible future reuse.
function generalizedThueMorseTerm(n, base) {
    // Sum of base-b digits of n, reduced mod b.
    let sum = 0;
    while (n > 0) {
        sum = (sum + (n % base)) % base;
        n = Math.floor(n / base);
    }
    return sum;
}

function drawThueMorseBackgroundDormant() {
    const previousCanvas = document.getElementById("tm-bg");
    if (previousCanvas) {
        previousCanvas.remove();
    }

    const canvas = document.createElement("canvas");
    canvas.id = "tm-bg";
    canvas.setAttribute("aria-hidden", "true");

    const dpr = window.devicePixelRatio || 1;
    const width = Math.ceil(window.innerWidth * dpr);
    const fullHeight = Math.ceil(
        Math.max(document.documentElement.scrollHeight, window.innerHeight) * dpr
    );

    canvas.width = width;
    canvas.height = fullHeight;

    const ctx = canvas.getContext("2d", { alpha: false });
    const cellSize = Math.max(4, Math.floor(16 * dpr));
    const base = 2;
    const palette = ["#ffffff", "#d7f0d6"];

    for (let y = 0, m = 0; y < fullHeight; y += cellSize, m++) {
        const tm = generalizedThueMorseTerm(m, base);
        for (let x = 0, n = 0; x < width; x += cellSize, n++) {
            const value = (generalizedThueMorseTerm(n, base) + tm) % base;
            ctx.fillStyle = palette[value];
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }

    document.body.prepend(canvas);
}

function generateAutomatonSettings() {
    const states = 3;
    const ruleSize = states * states * states;
    const ruleTable = [];

    for (let i = 0; i < ruleSize; i++) {
        ruleTable.push(randomInt(0, states - 1));
    }

    return {
        states,
        colors: ["#ffffff", "#d9f2d9", "#edf9ed"],
        ruleTable
    };
}

const automatonSettings = generateAutomatonSettings();

function neighborhoodToIndex(left, center, right, states) {
    return left * states * states + center * states + right;
}

function drawCellularAutomatonBackground() {
    const previousCanvas = document.getElementById("tm-bg");
    if (previousCanvas) {
        previousCanvas.remove();
    }

    const canvas = document.createElement("canvas");
    canvas.id = "tm-bg";
    canvas.setAttribute("aria-hidden", "true");

    const dpr = window.devicePixelRatio || 1;
    const width = Math.ceil(window.innerWidth * dpr);
    const fullHeight = Math.ceil(
        Math.max(document.documentElement.scrollHeight, window.innerHeight) * dpr
    );

    canvas.width = width;
    canvas.height = fullHeight;

    const ctx = canvas.getContext("2d", { alpha: false });
    const cellSize = Math.max(4, Math.floor(14 * dpr));

    const columns = Math.ceil(width / cellSize);
    const rows = Math.ceil(fullHeight / cellSize);
    const states = automatonSettings.states;
    const colors = automatonSettings.colors;
    const ruleTable = automatonSettings.ruleTable;

    let currentRow = new Array(columns);
    for (let x = 0; x < columns; x++) {
        currentRow[x] = randomInt(0, states - 1);
    }

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            const state = currentRow[x];
            ctx.fillStyle = colors[state];
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }

        const nextRow = new Array(columns);
        for (let x = 0; x < columns; x++) {
            const left = currentRow[(x - 1 + columns) % columns];
            const center = currentRow[x];
            const right = currentRow[(x + 1) % columns];
            const index = neighborhoodToIndex(left, center, right, states);
            nextRow[x] = ruleTable[index];
        }

        currentRow = nextRow;
    }

    document.body.prepend(canvas);
}

function setFooterYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }
}

let redrawTimer;
function scheduleRedraw() {
    clearTimeout(redrawTimer);
    redrawTimer = window.setTimeout(drawCellularAutomatonBackground, 120);
}

setFooterYear();
drawCellularAutomatonBackground();
window.addEventListener("resize", scheduleRedraw);
