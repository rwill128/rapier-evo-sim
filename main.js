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
    const eventQueue = new RAPIER.EventQueue();

    initInputHandler();

    function modifyCuboid(cuboid) {
        cuboid.health -= 1000;
    }

    const animate = () => {
        requestAnimationFrame(animate);
        world.step(eventQueue);

        eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            let handle1IsSceneObject = false;
            let handle2IsSceneObject = false;
            let handle1IsCuboidObject = false;
            let handle2IsCuboidObject = false;
            if (sceneObjectLookupBySensorCollider[handle1] != null ||
                sceneObjectLookupBySensorCollider[handle1] != null ||
                sceneObjectLookupBySensorCollider[handle1] != null) {
                handle1IsSceneObject = true;
            }

            if (sceneObjectLookupBySensorCollider[handle2] != null ||
                sceneObjectLookupBySensorCollider[handle2] != null ||
                sceneObjectLookupBySensorCollider[handle2] != null) {
                handle2IsSceneObject = true;
            }

            if (!handle1IsSceneObject && !handle2IsSceneObject) {
                console.log("Couldn't find a scene object for this collision event. Handles were: " + handle1 + " and " + handle2);
                return;
            }

            if (handle1IsSceneObject && handle2IsSceneObject) {
                console.log("Both handles were related to scene objects: " + handle1 + " and " + handle2);
                return;
            }

            if (cuboidLookupByRigidBody[handle1] != null ||
                cuboidLookupByCollider[handle1] != null) {
                handle1IsCuboidObject = true;
            }

            if (cuboidLookupByRigidBody[handle2] != null ||
                cuboidLookupByCollider[handle2] != null) {
                handle2IsCuboidObject = true;
            }

            if (!handle1IsCuboidObject && !handle2IsCuboidObject) {
                console.log("Neither handle was a cuboid object: " + handle1 + " and " + handle2);
                return;
            }

            if (handle1IsCuboidObject && handle2IsCuboidObject) {
                console.log("Both handles were cuboid objects: " + handle1 + " and " + handle2);
                return;
            }
            let touchedCuboid = undefined;
            if (handle1IsCuboidObject === true) {
                touchedCuboid = cuboidLookupByCollider[handle1] || cuboidLookupByRigidBody[handle1];
            }


            if (handle2IsCuboidObject === true) {
                touchedCuboid = cuboidLookupByCollider[handle2] || cuboidLookupByRigidBody[handle2];
            }

            if (touchedCuboid !== undefined) {
                // Modify the cuboid touched by the sensor
                modifyCuboid(touchedCuboid);
            } else {
                console.log("We found a null cuboid when we expected one!")
            }
        });


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

        updateCamera();
        render();
        updateInfoWindow();
    };

    animate();
}


export {world, cuboids, sceneObjects}
export default init;
