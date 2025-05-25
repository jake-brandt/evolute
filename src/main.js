import DIContainer from './di-container.js';
// initWebGL is now primarily used by the render worker.
// Main thread might still need it if it does any direct rendering or needs GL state.
import { initWebGL } from './renderer.js'; 

console.log("Main game logic script loaded.");

const container = new DIContainer();

// Register canvas
const mainCanvas = document.getElementById('gameCanvas');
container.register('canvas', mainCanvas);
const errorDisplay = document.getElementById('errorDisplay');

function showError(message) {
    if (errorDisplay) {
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
    }
    console.error(message); // Also log to console as before
}

let isMainCanvasTransferredToWorker = false;

// --- Worker Setup ---
let physicsWorker = null;
let renderWorker = null;

if (window.Worker) {
    console.log("Initializing Web Workers...");
    // Physics Worker
    physicsWorker = new Worker('./src/physics-worker.js', { type: 'module' });
    physicsWorker.onmessage = function(event) {
        console.log("Main thread received from physics worker:", event.data);
        // Handle messages from physics worker (e.g., updated state)
        if (event.data.type === 'physicsUpdate') {
            // Send updated state to render worker
            if (renderWorker) {
                // Potentially transform or select data for rendering
                renderWorker.postMessage({ type: 'renderScene', payload: { sceneData: event.data.state } });
            }
        }
    };
    physicsWorker.onerror = function(error) {
        console.error("Error in physics worker:", error.message, error.filename, error.lineno);
    };
    physicsWorker.postMessage({ type: 'init', payload: { /* any initial physics config */ } });

    // Render Worker
    renderWorker = new Worker('./src/render-worker.js', { type: 'module' });
    renderWorker.onmessage = function(event) {
        console.log("Main thread received from render worker:", event.data);
        const status = event.data.status;
        if (status) {
            if (status.includes("failed") || status.includes("not provided") || status.includes("not available")) {
                showError(`Render Worker: ${status}`);
            } else {
                console.log(`Render Worker status: ${status}`);
            }
        }
        // Handle other messages from render worker (e.g., status, errors)
    };
    renderWorker.onerror = function(error) {
        showError(`Error in render worker: ${error.message} (File: ${error.filename}, Line: ${error.lineno})`);
    };

    // Initialize Render Worker with OffscreenCanvas
    if (mainCanvas.transferControlToOffscreen) {
        try {
            const offscreenCanvas = mainCanvas.transferControlToOffscreen();
            renderWorker.postMessage({ type: 'init', payload: { canvas: offscreenCanvas } }, [offscreenCanvas]);
            console.log("OffscreenCanvas transferred to render worker.");
            isMainCanvasTransferredToWorker = true;
        } catch (e) {
            showError(`Error transferring canvas to offscreen worker: ${e.message}. Attempting fallback.`);
            // console.error("OffscreenCanvas transfer failed. Error:", e, "Falling back to using main canvas for render worker."); // Original console log
            renderWorker.postMessage({ type: 'init', payload: { canvas: mainCanvas } });
            isMainCanvasTransferredToWorker = true;
        }
    } else {
        showError("OffscreenCanvas is not supported by this browser. Attempting fallback for render worker, but performance might be affected.");
        // console.warn("OffscreenCanvas is not supported by this browser. Falling back to using main canvas for render worker."); // Original console log
        renderWorker.postMessage({ type: 'init', payload: { canvas: mainCanvas } });
        isMainCanvasTransferredToWorker = true;
    }

} else {
    showError("Web Workers are not supported in this browser. Game functionality will be severely limited or unavailable.");
    // console.error("Web Workers are not supported in this browser. Game functionality will be limited."); // Original console log
}

// Attempt to get a GL context on the main canvas ONLY if it wasn't transferred.
if (!isMainCanvasTransferredToWorker) {
    container.registerFactory('gl', (c) => {
        const canvas = c.resolve('canvas');
        if (!canvas) {
            showError("Main thread: Canvas element not found for WebGL initialization.");
            return null;
        }
        const context = initWebGL(canvas);
        if (!context) {
            showError("Main thread: Unable to initialize WebGL. Your browser may not support it, or the canvas is in use by a worker.");
            return null;
        }
        console.log("Main thread WebGL context initialized (potentially for UI or fallback).")
        return context;
    });
    const gl = container.resolve('gl'); // Initialize main thread GL context (could be null)
} else {
    container.register('gl', null); // Ensure 'gl' resolves to null if canvas is with worker
    // console.log("Main thread WebGL context not initialized because canvas is with render worker."); // Original console log, showError not needed here as it's an expected state.
}


// --- Game Loop ---
let lastTime = 0;
let gameRunning = true;

function gameLoop(timestamp) {
    if (!gameRunning) return;

    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // 1. Process Input (To be implemented)
    // inputSystem.process();

    // 2. Update Game State (via Physics Worker)
    if (physicsWorker) {
        physicsWorker.postMessage({ type: 'updateState', payload: { deltaTime } });
    } else {
        // Fallback or direct update if no worker
        // world.update(deltaTime);
        // if (renderWorker) renderWorker.postMessage({ type: 'renderScene', payload: { sceneData: world.getSceneData() } });
    }
    
    // 3. Rendering is now primarily handled by the render worker.
    // The main thread game loop's role is to drive updates and coordinate.
    // If there was any main-thread UI or overlay rendering, it would go here.
    // e.g., if (gl) { gl.clear(...); /* render UI */ }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    console.log("Starting game loop...");
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function stopGame() {
    console.log("Stopping game loop...");
    gameRunning = false;
    if (physicsWorker) physicsWorker.terminate();
    if (renderWorker) renderWorker.terminate();
    console.log("Workers terminated.");
}

// Start the game
startGame();

export { container, startGame, stopGame, physicsWorker, renderWorker };
