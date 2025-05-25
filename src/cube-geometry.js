// src/cube-geometry.js
export const vertices = new Float32Array([
    // Front face
    -0.5, -0.5,  0.5, // Vertex 0
     0.5, -0.5,  0.5, // Vertex 1
     0.5,  0.5,  0.5, // Vertex 2
    -0.5,  0.5,  0.5, // Vertex 3
    // Back face
    -0.5, -0.5, -0.5, // Vertex 4
     0.5, -0.5, -0.5, // Vertex 5
     0.5,  0.5, -0.5, // Vertex 6
    -0.5,  0.5, -0.5, // Vertex 7
]);

export const colors = new Float32Array([
    // Colors for each of the 8 vertices (R, G, B)
    1.0, 0.0, 0.0, // Vertex 0: Red
    0.0, 1.0, 0.0, // Vertex 1: Green
    0.0, 0.0, 1.0, // Vertex 2: Blue
    1.0, 1.0, 0.0, // Vertex 3: Yellow
    1.0, 0.0, 1.0, // Vertex 4: Magenta
    0.0, 1.0, 1.0, // Vertex 5: Cyan
    0.5, 0.5, 0.5, // Vertex 6: Grey
    1.0, 1.0, 1.0, // Vertex 7: White
]);

export const indices = new Uint16Array([
    // Front face
    0, 1, 2,  0, 2, 3,
    // Back face
    4, 5, 6,  4, 6, 7,
    // Top face
    3, 2, 6,  3, 6, 7,
    // Bottom face
    0, 1, 5,  0, 5, 4,
    // Right face
    1, 5, 6,  1, 6, 2,
    // Left face
    0, 4, 7,  0, 7, 3,
]);
