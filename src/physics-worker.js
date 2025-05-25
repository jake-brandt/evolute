// Physics Worker
console.log("Physics worker script loaded.");

let cubeRotationY = 0;
const rotationSpeed = Math.PI / 4; // Radians per second

self.onmessage = function(event) {
    console.log("Physics worker received message:", event.data);

    const { type, payload } = event.data;

    if (type === 'init') {
        // Initialize physics engine, etc.
        console.log("Physics worker initializing...");
        // Example: const world = new PhysicsWorld();
        self.postMessage({ status: "Physics initialized" });
    } else if (type === 'updateState') {
        // Update physics state based on payload (e.g., deltaTime, input)
        const deltaTime = payload.deltaTime || (1/60); // Default to 60 FPS if deltaTime not provided
        cubeRotationY += rotationSpeed * deltaTime;
        
        const newState = { 
            cubeRotationY: cubeRotationY 
            // Add other state variables here if needed
        };
        self.postMessage({ type: "physicsUpdate", state: newState });
    }
    // Add more message types as needed
};

// Initial setup or error handling
// self.postMessage({ status: "Physics worker ready" }); // Or send after init
