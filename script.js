function thueBit(n) {
    // Thue-Morse bit: parity of the number of set bits.
    let parity = 0;
    while (n) {
        parity ^= 1;
        n &= n - 1;
    }
    return parity;
}

function drawThueMorseBackground() {
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

    const colorZero = "#ffffff";
    const colorOne = "#c2e6c0";

    for (let y = 0, m = 0; y < fullHeight; y += cellSize, m++) {
        const tm = thueBit(m);
        for (let x = 0, n = 0; x < width; x += cellSize, n++) {
            const bit = (thueBit(n) + tm) & 1;
            ctx.fillStyle = bit ? colorOne : colorZero;
            ctx.fillRect(x, y, cellSize, cellSize);
        }
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
    redrawTimer = window.setTimeout(drawThueMorseBackground, 120);
}

setFooterYear();
drawThueMorseBackground();
window.addEventListener("resize", scheduleRedraw);
