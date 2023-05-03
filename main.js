import {initInputHandler, onMouseClick, updateCamera} from "./inputHandler.js";
import {initRenderer, render} from "./renderer.js";
import {initPhysicsEngine, world} from "./physicsEngine.js";
import {
    generateRandomPosition,
    generateRandomPositionWithinDistance,
    isSpaceEmpty
} from "./utils.js";
import {
    createCuboid, reactToWorld,
    removeCuboid,
} from "./cuboid.js";
import {calculateEnvironmentalEffects, createSceneObject} from "./sceneObjects.js";
import {updateInfoWindow} from "./infoWindow.js";
import {updateWorldInfoWindow} from "./worldInfoWindow.js";

let cuboids;
let sceneObjects;

async function init() {
    const world_size = 200
    await initPhysicsEngine()
    initRenderer(world_size);

    document.addEventListener('click', onMouseClick, false);



    const width = 1;
    const height = 1;
    const padding = 0.1;
    const worldSize = world_size / 2;
    const numSceneObjects = 3;
    const obstacleWidth = 20;
    const obstacleHeight = 20;
    sceneObjects = [];

    for (let i = 0; i < numSceneObjects; i++) {
        let attempts = 0;
        let maxAttempts = 10;
        let createdSceneObject = false;

        while (!createdSceneObject && attempts < maxAttempts) {
            const pos = generateRandomPosition(worldSize, obstacleWidth, obstacleHeight);

            if (isSpaceEmpty(pos.x, pos.y, obstacleWidth, obstacleHeight, padding)) {
                const sceneObject = createSceneObject(pos.x, pos.y, obstacleWidth, obstacleHeight);
                sceneObjects.push(sceneObject);
                createdSceneObject = true;
            }

            attempts++;
        }

        if (!createdSceneObject) {
            console.log("Failed to create a sceneObject after", maxAttempts, "attempts.");
        }
    }

    const health = 100;
    const numCuboids = 150;
    cuboids = [];

    for (let i = 0; i < numCuboids; i++) {
        let attempts = 0;
        let maxAttempts = 10;
        let createdCuboid = false;

        while (!createdCuboid && attempts < maxAttempts) {
            const pos = generateRandomPosition(worldSize, width, height);

            if (isSpaceEmpty(pos.x, pos.y, width, height, padding)) {
                const cuboid = createCuboid(pos.x, pos.y, width, height, health);
                cuboids.push(cuboid);
                createdCuboid = true;
            }

            attempts++;
        }

        if (!createdCuboid) {
            console.log("Failed to create a cuboid after", maxAttempts, "attempts.");
        }
    }


    initInputHandler();

    const animate = () => {
        requestAnimationFrame(animate);


        // Process all sceneObject effects
        for (const sceneObject of sceneObjects) {
            world.intersectionsWith(sceneObject.sensorCollider, (otherCollider) => {
                otherCollider.cuboid.health += 2;
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
            reactToWorld(cuboid);
            calculateEnvironmentalEffects(cuboid);

            // Check if the health is less than or equal to 0 and replace the cuboid
            if (cuboid.health > 1000) {
                // Generate a new random position for the new cuboid
                const newPosition = generateRandomPositionWithinDistance(cuboid.rigidBody.translation(), 3);

                if (isSpaceEmpty(newPosition.x, newPosition.y, width, height, padding)) {
                    cuboid.health -= 900
                    const newCuboid = createCuboid(newPosition.x, newPosition.y, width, height, health, cuboid.brain);
                    cuboids.push(newCuboid);
                }
            }

            if (cuboid.health < 0) {
                removeCuboid(cuboid);
                const index = cuboids.indexOf(cuboid);
                cuboids[index] = null;
            }
        }

        cuboids = cuboids.filter(cuboid => cuboid !== null);

        world.step();
        updateCamera();
        render();
        updateInfoWindow();
        updateWorldInfoWindow();
    };

    animate();
}


export {world, cuboids, sceneObjects}
export default init;
