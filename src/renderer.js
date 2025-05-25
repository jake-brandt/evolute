// Basic WebGL Renderer

/**
 * Initializes the WebGL context on a given canvas.
 * @param {HTMLCanvasElement} canvas - The canvas element to render to.
 * @returns {WebGLRenderingContext | null} The WebGL context or null if initialization fails.
 */
function initWebGL(canvas) {
    let logPrefix = (typeof self !== 'undefined' && self.constructor.name === 'DedicatedWorkerGlobalScope') ? "[Worker] " : "[Main] ";
    console.log(logPrefix + "initWebGL called with canvas:", canvas);

    let gl = null;
    try {
        console.log(logPrefix + "Attempting to get 'webgl' context");
        gl = canvas.getContext("webgl");
        console.log(logPrefix + "'webgl' context result:", gl);

        if (!gl) {
            console.log(logPrefix + "Attempting to get 'experimental-webgl' context");
            gl = canvas.getContext("experimental-webgl");
            console.log(logPrefix + "'experimental-webgl' context result:", gl);
        }
    } catch (e) {
        // Log the error with prefix, but the main error handling for !gl follows
        console.error(logPrefix + "WebGL context initialization error during getContext:", e);
    }

    if (!gl) {
        // alert("Unable to initialize WebGL. Your browser may not support it."); // Commented out as per instructions
        console.error(logPrefix + "Unable to initialize WebGL. Your browser may not support it or the canvas is already in use.");
        return null;
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things
    gl.depthFunc(gl.LEQUAL);
    // Clear the color as well as the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    console.log(logPrefix + "WebGL initialized.");
    return gl;
}

/**
 * Basic render function.
 * @param {WebGLRenderingContext} gl - The WebGL context.
 * @param {object} sceneData - Data representing the scene to render (placeholder for now).
 */
function render(gl, sceneData) {
    if (!gl) {
        console.error("WebGL context not available for rendering.");
        return;
    }
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Placeholder: Actual drawing commands will go here.
    // For example, setting up shaders, buffers, and drawing primitives.
    // console.log("Rendering scene:", sceneData); 

    // For now, let's just make sure the clear color works.
    // If the canvas is black, this part is working.
}

export { initWebGL, render };
