import {initInputHandler, onMouseClick, selectedCuboid, updateCamera, updateInfoWindow} from "./inputHandler.js";
import {initRenderer, render, scene} from "./renderer.js";
import {initPhysicsEngine, stepPhysics, world} from "./physicsEngine.js";
import {generateRandomCuboidPositions} from "./utils.js";
import {
    applyAction,
    calculateEnvironmentalEffects,
    createCuboid,
    getState,
    removeCuboid
} from "./cuboid.js";

let cuboids;


async function init() {
    const world_size = 200
    await initPhysicsEngine(world_size)
    initRenderer(world_size);

    document.addEventListener('click', onMouseClick, false);

    const width = 1;
    const height = 1;
    const padding = 0.1;
    const health = 100;
    const positions = generateRandomCuboidPositions(150, width, height, padding);

    cuboids = positions.map(pos => createCuboid(pos.x, pos.y, width, height, health));


    initInputHandler();

    const animate = () => {
        requestAnimationFrame(animate);
        stepPhysics();

        for (const cuboid of cuboids) {
            cuboid.age++;
            const {rigidBody, agent} = cuboid;
            const state = getState(rigidBody);
            const action = agent.react(state);
            applyAction(rigidBody, action);

            const effects = calculateEnvironmentalEffects(cuboid);
            cuboid.health += effects;

            function getRandomCuboidExcept(cuboidsList, excludeCuboid) {
                // Filter out the excluded cuboid and sort the remaining cuboids by health in descending order
                const sortedCuboids = cuboidsList.filter(cuboid => cuboid !== excludeCuboid).sort((a, b) => b.age - a.age);

                // If there are no remaining cuboids, return null
                if (sortedCuboids.length === 0) {
                    return null;
                }

                // Get the top 5 healthiest cuboids, or all remaining cuboids if there are fewer than 5
                const topCuboids = sortedCuboids.slice(0, Math.min(sortedCuboids.length, 5));

                // Choose a random cuboid from the top 5 healthiest cuboids
                const randomIndex = Math.floor(Math.random() * topCuboids.length);
                return topCuboids[randomIndex];
            }

            // Check if the health is less than or equal to 0 and replace the cuboid
            if (cuboid.health <= 0) {
                removeCuboid(cuboid);

                // Generate a new random position for the new cuboid
                const newPosition = generateRandomCuboidPositions(1, width, height, padding)[0];

                // Replace the cuboid with a new one
                const newCuboid = createCuboid(newPosition.x, newPosition.y, width, height, health, getRandomCuboidExcept(cuboids, cuboid).agent);
                const index = cuboids.indexOf(cuboid);
                cuboids[index] = newCuboid;
            }
        }

        updateCamera();
        render();
        updateInfoWindow();
    };

    animate();
}


export {world, cuboids}
export default init;
