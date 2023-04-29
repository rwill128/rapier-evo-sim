import {initInputHandler, onMouseClick, selectedCuboid, updateCamera, updateInfoWindow} from "./inputHandler.js";
import {initRenderer, render, scene} from "./renderer.js";
import {initPhysicsEngine, RAPIER, stepPhysics, world} from "./physicsEngine.js";
import {generateRandomCuboidPositions, getRandomCuboidExcept} from "./utils.js";
import {
    applyAction,
    calculateEnvironmentalEffects,
    createCuboid,
    createSceneObject,
    sceneObjectLookupByRigidBody,
    sceneObjectLookupByCollider,
    sceneObjectLookupBySensorCollider,
    getState,
    removeCuboid,
    cuboidLookupByCollider,
    cuboidLookupByRigidBody
} from "./cuboid.js";

let cuboids;
let sceneObjects;

async function init() {
    const world_size = 200
    await initPhysicsEngine(world_size)
    initRenderer(world_size);

    document.addEventListener('click', onMouseClick, false);

    const obstacleWidth = 20;
    const obstacleHeight = 20;
    const sceneObjectPositions = generateRandomCuboidPositions(3, obstacleWidth, obstacleHeight, 20, world_size);
    sceneObjects = sceneObjectPositions.map(pos => createSceneObject(pos.x, pos.y, obstacleWidth, obstacleHeight));


    const width = 1;
    const height = 1;
    const padding = 0.1;
    const health = 100;
    const cuboidPositions = generateRandomCuboidPositions(50, width, height, padding, world_size / 2);
    cuboids = cuboidPositions.map(pos => createCuboid(pos.x, pos.y, width, height, health));

    // Create the event queue
    // const eventQueue = new RAPIER.EventQueue();

    initInputHandler();

    function modifyCuboid(cuboid) {
        cuboid.health = -10;
    }

    const animate = () => {
        requestAnimationFrame(animate);


        // Process all sceneObject effects
        for (const sceneObject of sceneObjects) {
            world.intersectionsWith(sceneObject.sensorCollider, (otherCollider) => {
                otherCollider.cuboid.health += 1;
            });
        }

        // Process all vision for creatures
        // for (const cuboid of cuboids) {
        //     world.intersectionsWith(cuboid.eyeCollider, (otherCollider) => {
        //         if (otherCollider.cuboid) {
        //             console.log("Saw a cuboid: " + otherCollider.cuboid)
        //         } else {
        //             console.log("Saw a noncuboid: " + otherCollider)
        //         }
        //
        //     });
        // }


        for (const cuboid of cuboids) {
            cuboid.age++;
            const {brain} = cuboid;
            const state = getState(cuboid, brain);
            const action = brain.react(state);
            applyAction(cuboid, action);

            calculateEnvironmentalEffects(cuboid);

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

        world.step();
        updateCamera();
        render();
        updateInfoWindow();
    };

    animate();
}


export {world, cuboids, sceneObjects}
export default init;
