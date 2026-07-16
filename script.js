function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseCssTimeToMs(cssTime) {
    const value = cssTime.trim();
    if (value.endsWith("ms")) {
        return Number.parseFloat(value);
    }
    if (value.endsWith("s")) {
        return Number.parseFloat(value) * 1000;
    }
    return 900;
}

const BACKGROUND_EXTRA_VIEWPORTS = 1.5;

function getContentCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const site = document.querySelector(".site");
    const bodyStyles = window.getComputedStyle(document.body);
    const bodyPaddingTop = Number.parseFloat(bodyStyles.paddingTop) || 0;
    const bodyPaddingBottom = Number.parseFloat(bodyStyles.paddingBottom) || 0;
    const siteHeight = site ? site.getBoundingClientRect().height : 0;
    const contentHeight = siteHeight + bodyPaddingTop + bodyPaddingBottom;
    const cssWidth = Math.ceil(window.innerWidth);
    const cssHeight = Math.ceil(Math.max(contentHeight, window.innerHeight));
    const cssRenderHeight = Math.ceil(cssHeight + window.innerHeight * BACKGROUND_EXTRA_VIEWPORTS);
    return {
        dpr,
        cssWidth,
        cssHeight,
        cssRenderHeight,
        width: Math.ceil(cssWidth * dpr),
        height: Math.ceil(cssHeight * dpr),
        renderHeight: Math.ceil(cssRenderHeight * dpr)
    };
}

function getBackgroundLayer() {
    return document.getElementById("bg-layer");
}

function getBackgroundContent() {
    const bgLayer = getBackgroundLayer();
    if (!bgLayer) {
        return null;
    }

    let bgContent = document.getElementById("bg-content");
    if (!bgContent) {
        bgContent = document.createElement("div");
        bgContent.id = "bg-content";
        bgLayer.appendChild(bgContent);
    }

    return bgContent;
}

function syncBackgroundScroll() {
    const bgContent = getBackgroundContent();
    if (!bgContent) {
        return;
    }

    const offsetY = -window.scrollY * 0.5;
    bgContent.style.transform = `translateY(${offsetY}px)`;
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
    const bgContent = getBackgroundContent();
    if (!bgContent) {
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.className = "tm-bg";
    canvas.setAttribute("aria-hidden", "true");

    const { dpr, cssWidth, cssRenderHeight, width, renderHeight } = getContentCanvasSize();

    canvas.width = width;
    canvas.height = renderHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssRenderHeight}px`;

    const ctx = canvas.getContext("2d", { alpha: false });
    const cellSize = Math.max(4, Math.floor(16 * dpr));
    const base = 2;
    const palette = ["#ffffff", "#d7f0d6"];

    for (let y = 0, m = 0; y < renderHeight; y += cellSize, m++) {
        const tm = generalizedThueMorseTerm(m, base);
        for (let x = 0, n = 0; x < width; x += cellSize, n++) {
            const value = (generalizedThueMorseTerm(n, base) + tm) % base;
            ctx.fillStyle = palette[value];
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }

    const oldCanvases = bgContent.querySelectorAll(".tm-bg");
    bgContent.appendChild(canvas);
    syncBackgroundScroll();
    for (const oldCanvas of oldCanvases) {
        oldCanvas.remove();
    }
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

let automatonSettings = generateAutomatonSettings();

function neighborhoodToIndex(left, center, right, states) {
    return left * states * states + center * states + right;
}

function drawCellularAutomatonBackground() {
    const bgContent = getBackgroundContent();
    if (!bgContent) {
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.className = "tm-bg";
    canvas.setAttribute("aria-hidden", "true");

    const { dpr, cssWidth, cssRenderHeight, width, renderHeight } = getContentCanvasSize();

    canvas.width = width;
    canvas.height = renderHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssRenderHeight}px`;

    const ctx = canvas.getContext("2d", { alpha: false });
    const cellSize = Math.max(4, Math.floor(14 * dpr));

    const columns = Math.ceil(width / cellSize);
    const rows = Math.ceil(renderHeight / cellSize);
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

    const oldCanvases = bgContent.querySelectorAll(".tm-bg");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    bgContent.appendChild(canvas);
    syncBackgroundScroll();

    if (reduceMotion) {
        for (const oldCanvas of oldCanvases) {
            oldCanvas.remove();
        }
        return;
    }

    let cleaned = false;
    const cleanupOldCanvases = () => {
        if (cleaned) {
            return;
        }
        cleaned = true;
        for (const oldCanvas of oldCanvases) {
            oldCanvas.remove();
        }
    };

    canvas.addEventListener("animationend", cleanupOldCanvases, { once: true });
    const animationDuration = window.getComputedStyle(canvas).animationDuration.split(",")[0];
    const cleanupDelay = Math.max(200, parseCssTimeToMs(animationDuration) + 200);
    window.setTimeout(cleanupOldCanvases, cleanupDelay);
}

function setFooterYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }
}

function runPageReveal(page) {
    const revealNodes = page.querySelectorAll(".reveal");
    for (const node of revealNodes) {
        node.classList.remove("reveal");
    }

    // Force a reflow so re-adding .reveal restarts the CSS animation.
    void page.offsetWidth;

    for (const node of revealNodes) {
        node.classList.add("reveal");
    }
}

function normalizePageFromHash() {
    const pageName = window.location.hash.replace("#", "").trim();
    if (pageName === "games" || pageName === "music" || pageName === "home") {
        return pageName;
    }
    return "home";
}

function setActivePage(pageName, shouldAnimate = true, scrollToTop = true) {
    const pages = document.querySelectorAll("[data-page]");
    const links = document.querySelectorAll("[data-page-link]");

    if (scrollToTop) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    for (const page of pages) {
        const isActive = page.getAttribute("data-page") === pageName;
        page.hidden = !isActive;
        page.classList.toggle("is-active", isActive);
        if (isActive && shouldAnimate) {
            runPageReveal(page);
        }
    }

    for (const link of links) {
        const isActive = link.getAttribute("data-page-link") === pageName;
        link.classList.toggle("is-active", isActive);
    }

    automatonSettings = generateAutomatonSettings();
    drawCellularAutomatonBackground();
}

function initPageNavigation() {
    const navLinks = document.querySelectorAll("[data-page-link]");
    for (const link of navLinks) {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const pageName = link.getAttribute("data-page-link");
            if (!pageName) {
                return;
            }

            const nextHash = `#${pageName}`;
            if (window.location.hash !== nextHash) {
                window.history.pushState(null, "", nextHash);
            }
            setActivePage(pageName, true);
        });
    }

    window.addEventListener("popstate", () => {
        setActivePage(normalizePageFromHash(), true, true);
    });

    setActivePage(normalizePageFromHash(), false, false);
}

let redrawTimer;
function scheduleRedraw() {
    clearTimeout(redrawTimer);
    redrawTimer = window.setTimeout(drawCellularAutomatonBackground, 120);
}

setFooterYear();
initPageNavigation();
window.addEventListener("resize", scheduleRedraw);
window.addEventListener("scroll", syncBackgroundScroll, { passive: true });
