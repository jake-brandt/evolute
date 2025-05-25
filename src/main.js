import DIContainer from './di-container.js';
// initWebGL is now primarily used by the render worker.
// Main thread might still need it if it does any direct rendering or needs GL state.
import { initWebGL } from './renderer.js'; 

console.log("Main game logic script loaded.");

const container = new DIContainer();

// Register canvas
const mainCanvas = document.getElementById('gameCanvas');
container.register('canvas', mainCanvas);

// Attempt to get a GL context on the main canvas for any main-thread rendering needs or checks
// This might be optional if all rendering is offloaded.
container.registerFactory('gl', (c) => {
    const canvas = c.resolve('canvas');
    if (!canvas) {
        console.error("Canvas element not found for WebGL initialization on main thread.");
        return null;
    }
    // You might want different GL settings or no GL context at all on main thread
    // if everything is on workers. For now, let's try to get one.
    const context = initWebGL(canvas); 
    if(context){
        console.log("Main thread WebGL context initialized (potentially for UI or fallback).")
    }
    return context;
});

const gl = container.resolve('gl'); // Initialize main thread GL context (if needed)

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
        // Handle messages from render worker (e.g., status, errors)
    };
    renderWorker.onerror = function(error) {
        console.error("Error in render worker:", error.message, error.filename, error.lineno);
    };

    // Initialize Render Worker with OffscreenCanvas
    if (mainCanvas.transferControlToOffscreen) {
        try {
            const offscreenCanvas = mainCanvas.transferControlToOffscreen();
            renderWorker.postMessage({ type: 'init', payload: { canvas: offscreenCanvas } }, [offscreenCanvas]);
            console.log("OffscreenCanvas transferred to render worker.");
        } catch (e) {
            console.error("Could not transfer canvas to offscreen worker. Error:", e);
            // Fallback or error handling if OffscreenCanvas is not supported or fails
            // For now, we'll let the render worker report its status.
        }
    } else {
        console.warn("OffscreenCanvas is not supported by this browser. Render worker might not function as intended.");
        // Send a null canvas or handle differently if OffscreenCanvas is critical
        renderWorker.postMessage({ type: 'init', payload: { canvas: null } });
    }

} else {
    console.error("Web Workers are not supported in this browser. Game functionality will be limited.");
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
