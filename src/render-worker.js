// Render Worker
import { 
    initWebGL, 
    render, 
    vertexShaderSource, 
    fragmentShaderSource, 
    compileShader, 
    createProgram 
} from './renderer.js';
import { vertices, colors, indices } from './cube-geometry.js';
import * as mat4 from './mat4.js';

console.log("Render worker script loaded.");

let gl = null;
let canvas = null;
let shaderProgram = null;
let attributeLocations = {
    position: null,
    color: null
};
let uniformLocations = {
    matrix: null
};
let cubeBuffers = {
    vertex: null,
    color: null,
    index: null
};

// Matrices for MVP
let projectionMatrix = new Float32Array(16);
let viewMatrix = new Float32Array(16);
let modelMatrix = new Float32Array(16);
let mvpMatrix = new Float32Array(16); // Can be declared here or in renderScene

self.onmessage = function(event) {
    console.log("Render worker received message:", event.data);
    const { type, payload } = event.data;

    if (type === 'init') {
        canvas = payload.canvas;
        console.log("Render worker: Received message payload for 'init':", payload);
        console.log("Render worker: Canvas object received:", canvas);
        if (canvas) {
            gl = initWebGL(canvas);
            if (!gl) {
                self.postMessage({ status: "Render worker: WebGL initialization failed on the provided canvas." });
                console.error("Render worker: WebGL initialization failed.");
                return; // Stop if WebGL context failed
            }
            self.postMessage({ status: "Render worker initialized and WebGL context created." });

            // Compile shaders
            const vs = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
            if (!vs) {
                self.postMessage({ status: "Render worker: Failed to compile vertex shader." });
                return;
            }
            const fs = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
            if (!fs) {
                self.postMessage({ status: "Render worker: Failed to compile fragment shader." });
                gl.deleteShader(vs); // Clean up successfully compiled vertex shader
                return;
            }

            // Link program
            shaderProgram = createProgram(gl, vs, fs);
            if (!shaderProgram) {
                self.postMessage({ status: "Render worker: Failed to link shader program." });
                // Shaders are deleted by createProgram on failure, so no need to delete vs/fs here
                return;
            }
            // Original shaders can be deleted after linking
            gl.deleteShader(vs);
            gl.deleteShader(fs);


            // Get attribute and uniform locations
            attributeLocations.position = gl.getAttribLocation(shaderProgram, 'a_position');
            attributeLocations.color = gl.getAttribLocation(shaderProgram, 'a_color');
            uniformLocations.matrix = gl.getUniformLocation(shaderProgram, 'u_matrix');

            if (attributeLocations.position === -1 || attributeLocations.color === -1) {
                self.postMessage({ status: "Render worker: Failed to get attribute locations (a_position or a_color)." });
                console.error("Render worker: Failed to get attribute locations (a_position or a_color). Position:", attributeLocations.position, "Color:", attributeLocations.color);
                return;
            }
            if (uniformLocations.matrix === null) {
                self.postMessage({ status: "Render worker: Failed to get uniform location (u_matrix)." });
                console.error("Render worker: Failed to get uniform location (u_matrix).");
                return;
            }
            
            // Create buffers
            cubeBuffers.vertex = gl.createBuffer();
            if (!cubeBuffers.vertex) {
                 self.postMessage({ status: "Render worker: Failed to create vertex buffer." });
                 console.error("Render worker: Failed to create vertex buffer.");
                 return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffers.vertex);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            cubeBuffers.color = gl.createBuffer();
            if (!cubeBuffers.color) {
                 self.postMessage({ status: "Render worker: Failed to create color buffer." });
                 console.error("Render worker: Failed to create color buffer.");
                 return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffers.color);
            gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

            cubeBuffers.index = gl.createBuffer();
            if (!cubeBuffers.index) {
                 self.postMessage({ status: "Render worker: Failed to create index buffer." });
                 console.error("Render worker: Failed to create index buffer.");
                 return;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeBuffers.index);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

            // Initialize matrices
            const aspectRatio = canvas.width / canvas.height;
            mat4.perspective(projectionMatrix, Math.PI / 4, aspectRatio, 0.1, 100.0);
            mat4.lookAt(viewMatrix, [0, 1, 3], [0, 0, 0], [0, 1, 0]); // Camera at (0,1,3), looking at origin, up is Y
            mat4.identity(modelMatrix);
            
            self.postMessage({ status: "Render worker: Cube assets and matrices initialized." });

        } else {
            self.postMessage({ status: "Render worker: Canvas not provided." });
            console.error("Render worker: Canvas not received.");
        }
    } else if (type === 'renderScene') {
        if (!gl || !shaderProgram || !cubeBuffers.vertex || !payload.sceneData || !payload.sceneData.hasOwnProperty('cubeRotationY')) {
            let errorMsg = "Render worker: Cannot render scene. Missing or invalid data: ";
            if (!gl) errorMsg += "WebGL context, ";
            if (!shaderProgram) errorMsg += "Shader program, ";
            if (!cubeBuffers.vertex) errorMsg += "Vertex buffer (implies others also missing), ";
            if (!payload.sceneData) errorMsg += "Scene data, ";
            if (payload.sceneData && !payload.sceneData.hasOwnProperty('cubeRotationY')) errorMsg += "cubeRotationY in scene data, ";
            console.error(errorMsg.slice(0, -2) + ".");
            return;
        }

        const cubeRotationY = payload.sceneData.cubeRotationY;

        // Update Model Matrix
        mat4.identity(modelMatrix);
        mat4.rotateY(modelMatrix, modelMatrix, cubeRotationY);
        // Example translation: mat4.translate(modelMatrix, modelMatrix, [0, 0, -2]); // Moves cube 2 units away

        // Calculate MVP Matrix
        mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);      // mvpMatrix = viewMatrix * modelMatrix
        mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix); // mvpMatrix = projectionMatrix * mvpMatrix (which is view * model)
        
        render(gl, shaderProgram, attributeLocations, uniformLocations, cubeBuffers, mvpMatrix);
        // self.postMessage({ status: "Scene rendered" }); // Optional
    }
    // Add more message types as needed
};
