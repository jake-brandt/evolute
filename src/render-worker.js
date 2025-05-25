// Render Worker
import { initWebGL, render } from './renderer.js';

console.log("Render worker script loaded.");

let gl = null;
let canvas = null;

self.onmessage = function(event) {
    console.log("Render worker received message:", event.data);
    const { type, payload } = event.data;

    if (type === 'init') {
        canvas = payload.canvas;
        if (canvas) {
            gl = initWebGL(canvas);
            if (gl) {
                self.postMessage({ status: "Render worker initialized and WebGL context created." });
            } else {
                self.postMessage({ status: "Render worker: WebGL initialization failed on the provided canvas." });
                console.error("Render worker: WebGL initialization failed.");
            }
        } else {
            self.postMessage({ status: "Render worker: Canvas not provided." });
            console.error("Render worker: Canvas not received.");
        }
    } else if (type === 'renderScene') {
        if (gl && payload.sceneData) {
            render(gl, payload.sceneData);
            // self.postMessage({ status: "Scene rendered" }); // Optional: for synchronization or feedback
        } else if (!gl) {
            console.error("Render worker: WebGL context not available.");
        } else {
            console.error("Render worker: Scene data not provided for rendering.");
        }
    }
    // Add more message types as needed
};
