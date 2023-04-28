import {initInputHandler, onMouseClick, selectedCuboid, updateCamera, updateInfoWindow} from "./inputHandler.js";
import {initRenderer, render, scene} from "./renderer.js";
import {initPhysicsEngine, stepPhysics, world} from "./physicsEngine.js";
import {generateRandomCuboidPositions, getRandomCuboidExcept} from "./utils.js";
import {
    applyAction,
    calculateEnvironmentalEffects,
    createCuboid,
    getState,
    removeCuboid
} from "./cuboid.js";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat';

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
            const {rigidBody, brain} = cuboid;
            const state = getState(cuboid, brain);
            const action = brain.react(state);
            applyAction(rigidBody, action);

            const effects = calculateEnvironmentalEffects(cuboid);
            cuboid.health += effects;

            // Check if the health is less than or equal to 0 and replace the cuboid
            if (cuboid.health <= 0) {
                removeCuboid(cuboid);

                // Generate a new random position for the new cuboid
                const newPosition = generateRandomCuboidPositions(1, width, height, padding)[0];

                // Replace the cuboid with a new one
                let procreator = getRandomCuboidExcept(cuboids, cuboid);
                procreator.children++;
                const newCuboid = createCuboid(newPosition.x, newPosition.y, width, height, health, procreator.brain);
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
