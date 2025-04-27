// Import Matter.js modules
// @ts-ignore
const Engine = Matter.Engine;
// @ts-ignore
const Render = Matter.Render;
// @ts-ignore
const Bodies = Matter.Bodies;
// @ts-ignore
const World = Matter.World;
// @ts-ignore
const Mouse = Matter.Mouse;
// @ts-ignore
const MouseConstraint = Matter.MouseConstraint;
// @ts-ignore
const Constraint = Matter.Constraint;

// Create engine and world
const engine = Engine.create();
const world = engine.world;
world.gravity.y = 0; // Disable gravity for material simulation

// Create renderer
const render = Render.create({
    // @ts-ignore
    element: document.body,
    engine: engine,
    options: {
        // @ts-ignore
        width: window.innerWidth,
        // @ts-ignore
        height: window.innerHeight,
        wireframes: false,
        background: '#000000'
    }
});

// Add static walls
const walls = [
    // @ts-ignore
    Bodies.rectangle(0, window.innerHeight / 2, 10, window.innerHeight, { isStatic: true, render: { fillStyle: 'black' } }),
    // @ts-ignore
    Bodies.rectangle(window.innerWidth, window.innerHeight / 2, 10, window.innerHeight, { isStatic: true, render: { fillStyle: 'black' } }),
    // @ts-ignore
    Bodies.rectangle(window.innerWidth / 2, 0, window.innerWidth, 10, { isStatic: true, render: { fillStyle: 'black' } }),
    // @ts-ignore
    Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, 10, { isStatic: true, render: { fillStyle: 'black' } })
];
World.add(world, walls);

// Adjust grid creation to spread objects across the screen
const rows = 30;
const cols = 30;
const squareSize = 8; // Increase square size for better visibility
const spacingX = (window.innerWidth - cols * squareSize) / (cols + 2); // Dynamic horizontal spacing
const spacingY = (window.innerHeight - rows * squareSize) / (rows + 2); // Dynamic vertical spacing;

// Initialize grid array
const grid = Array.from({ length: cols }, () => Array(rows).fill(null));

// Create squares and add to world
for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
        const x = spacingX + i * (squareSize + spacingX) + squareSize / 2;
        const y = spacingY + j * (squareSize + spacingY) + squareSize / 2;
        const body = Bodies.rectangle(x, y, squareSize, squareSize, {
            render: { fillStyle: 'white' },
            friction: 0.1,
            restitution: 0.9 // Slightly elastic for cloth-like behavior
        });
        grid[i][j] = body;
        World.add(world, body);
    }
}

// Add constraints to connect squares with hidden lines
const constraints = []; // Store all constraints for dynamic updates

for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
        // Horizontal constraints
        if (i < cols - 1) {
            const constraint = Constraint.create({
                bodyA: grid[i][j],
                bodyB: grid[i + 1][j],
                length: squareSize + spacingX,
                stiffness: 0.1, // Initial stiffness
                damping: 0.5,
                render: { visible: false } // Hide the constraint line
            });
            constraints.push(constraint);
            World.add(world, constraint);
        }
        // Vertical constraints
        if (j < rows - 1) {
            const constraint = Constraint.create({
                bodyA: grid[i][j],
                bodyB: grid[i][j + 1],
                length: squareSize + spacingY,
                stiffness: 0.1, // Initial stiffness
                damping: 0.5,
                render: { visible: false } // Hide the constraint line
            });
            constraints.push(constraint);
            World.add(world, constraint);
        }
    }
}

// Dynamically adjust stiffness based on proximity
Matter.Events.on(engine, 'beforeUpdate', () => {
    for (const constraint of constraints) {
        const bodyA = constraint.bodyA;
        const bodyB = constraint.bodyB;

        // Calculate the current distance between the two bodies
        const dx = bodyA.position.x - bodyB.position.x;
        const dy = bodyA.position.y - bodyB.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Adjust stiffness based on proximity (closer = higher stiffness)
        const proximityFactor = Math.max(0.1, 1 - distance / (squareSize * 2)); // Scale factor (reduce divisor for stronger effect)
        constraint.stiffness = 0.01 + 0.8 * proximityFactor; // Base stiffness + amplified proximity adjustment

        // Optional: Log stiffness for debugging
        if (engine.timing.timestamp % 5000 < 16) { // Log approximately once per second
            console.log(`Constraint stiffness: ${constraint.stiffness}, Distance: ${distance}`);
        }
    }
});

// Add mouse constraint for dragging
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: { visible: false }
    }
});
World.add(world, mouseConstraint);

// Run the renderer and engine
Render.run(render);
Engine.run(engine);
