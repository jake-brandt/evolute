// Basic WebGL Renderer

export const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec3 a_color;
    uniform mat4 u_matrix;
    varying vec3 v_color;
    void main() {
        gl_Position = u_matrix * a_position;
        v_color = a_color;
    }
`;

export const fragmentShaderSource = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); /* Solid Red */
    }
`;

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
 * Compiles a shader from source.
 * @param {WebGLRenderingContext} gl - The WebGL context.
 * @param {string} source - The shader source code.
 * @param {number} type - The shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER).
 * @returns {WebGLShader | null} The compiled shader or null if compilation fails.
 */
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const typeString = type === gl.VERTEX_SHADER ? "Vertex" : "Fragment";
        console.error(`Error compiling ${typeString} shader: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

/**
 * Creates a WebGL program from a vertex and fragment shader.
 * @param {WebGLRenderingContext} gl - The WebGL context.
 * @param {WebGLShader} vertexShader - The compiled vertex shader.
 * @param {WebGLShader} fragmentShader - The compiled fragment shader.
 * @returns {WebGLProgram | null} The WebGL program or null if linking fails.
 */
function createProgram(gl, vertexShader, fragmentShader) {
    if (!vertexShader || !fragmentShader) {
        console.error("Cannot create program with null shaders.");
        return null;
    }
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(`Error linking program: ${gl.getProgramInfoLog(program)}`);
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

/**
 * Renders the scene with a cube.
 * @param {WebGLRenderingContext} gl - The WebGL context.
 * @param {WebGLProgram} program - The shader program.
 * @param {object} attributeLocations - Object containing attribute locations.
 * @param {object} uniformLocations - Object containing uniform locations.
 * @param {object} buffers - Object containing WebGL buffer objects.
 * @param {Float32Array} mvpMatrix - The Model-View-Projection matrix.
 */
function render(gl, program, attributeLocations, uniformLocations, buffers, mvpMatrix) {
    if (!gl) {
        console.error("WebGL context not available for rendering.");
        return;
    }
    if (!program) {
        console.error("Shader program not available for rendering.");
        return;
    }
    // It's good practice to check for all required parameters
    if (!attributeLocations || !uniformLocations || !buffers || !mvpMatrix) {
        console.error("Missing required parameters for rendering.");
        return;
    }


    // 1. Clear Canvas
    // Note: gl.clearColor, enable(DEPTH_TEST), depthFunc are often set during initWebGL
    // but can be set here if they might change per frame or per object.
    // Assuming they are set from initWebGL for this setup.
    // gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set in initWebGL
    // gl.clearDepth(1.0); // Default
    // gl.enable(gl.DEPTH_TEST); // Set in initWebGL
    // gl.depthFunc(gl.LEQUAL); // Set in initWebGL
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.disable(gl.DEPTH_TEST);

    // 2. Set Viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 3. Use Shader Program
    gl.useProgram(program);

    // 4. Set up Vertex Position Attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
    gl.vertexAttribPointer(
        attributeLocations.position, // location
        3,                           // size (num components)
        gl.FLOAT,                    // type
        false,                       // normalize
        0,                           // stride
        0                            // offset
    );
    gl.enableVertexAttribArray(attributeLocations.position);

    // 5. Set up Vertex Color Attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        attributeLocations.color,    // location
        3,                           // size (num components)
        gl.FLOAT,                    // type
        false,                       // normalize
        0,                           // stride
        0                            // offset
    );
    gl.enableVertexAttribArray(attributeLocations.color);

    // 6. Set Uniforms
    gl.uniformMatrix4fv(
        uniformLocations.matrix,     // location
        false,                       // transpose
        mvpMatrix                    // data
    );

    // 7. Bind Index Buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

    // 8. Draw the Cube
    // The number of indices (36) is specific to the cube-geometry.js
    const vertexCount = 36; 
    gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0);
}

export { initWebGL, render };
