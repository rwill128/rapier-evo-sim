import {initInputHandler, onMouseClick, updateCamera} from "./inputHandler.js";
import {initRenderer, render} from "./renderer.js";
import {initPhysicsEngine, world} from "./physicsEngine.js";
import {
    generateRandomPosition,
    generateRandomPositionWithinDistance,
    isSpaceEmpty
} from "./utils.js";
import {updateInfoWindow} from "./infoWindow.js";
import {updateWorldInfoWindow} from "./worldInfoWindow.js";
import {SceneObjectsManager} from "./sceneObjects/sceneObjectsManager.js";
import {Cuboid} from "./cuboids/Cuboid.js";
import {loadTop50HealthiestCreatures, saveTop50HealthiestCreatures} from "./storageUtils.js";

let cuboids;
let sceneObjects = []

async function init() {
    const world_size = 300
    await initPhysicsEngine()
    initRenderer(world_size);

    document.addEventListener('click', onMouseClick, false);
    const sceneObjectsManager = new SceneObjectsManager(world_size);


    const width = 1;
    const height = 1;
    const health = 100;
    const padding = .1;
    const numCuboids = 150;
    cuboids = loadTop50HealthiestCreatures(world_size/2, width, height);

    while (cuboids.length < numCuboids) {
        let attempts = 0;
        let maxAttempts = 10;
        let createdCuboid = false;

        while (!createdCuboid && attempts < maxAttempts) {
            const pos = generateRandomPosition(world_size/2, width, height);

            if (isSpaceEmpty(pos.x, pos.y, width, height, padding)) {
                const cuboid = new Cuboid(pos.x, pos.y, width, height, health);
                cuboids.push(cuboid);
                createdCuboid = true;
            }

            attempts++;
        }

        if (!createdCuboid) {
            console.log("Failed to create a cuboid after", maxAttempts, "attempts.");
        }
    }

    document.getElementById('save-top-50').addEventListener('click', () => {
        // Assuming you have the creatures array available in the scope
        saveTop50HealthiestCreatures(cuboids);
    });


    cuboids = cuboids.concat(loadTop50HealthiestCreatures());


    initInputHandler();

    const animate = () => {
        requestAnimationFrame(animate);

        world.step();

        sceneObjectsManager.update();

        for (const cuboid of cuboids) {

            //Process predator collisions
            if (cuboid.collider.parent().userData.interactionType === "Predator") {
                world.contactsWith(cuboid.collider, (otherCollider) => {
                    if (otherCollider.parent().userData !== undefined) {
                        const otherCuboid = otherCollider.parent().userData;
                        if (otherCuboid.interactionType !== "Predator") {
                            // console.log("Successfully processed predator collision")
                            otherCuboid.health -= 100;
                            cuboid.health += 50;
                        }
                    }
                });

            }

            cuboid.reactToWorld();
            cuboid.calculateEnvironmentalEffects();

            // Check if the health is less than or equal to 0 and replace the cuboid
            if (cuboid.health > 1000) {
                // Generate a new random position for the new cuboid
                const newPosition = generateRandomPositionWithinDistance(cuboid.rigidBody.translation(), 3);

                if (isSpaceEmpty(newPosition.x, newPosition.y, width, height, padding)) {
                    cuboid.health -= 900
                    const newCuboid = new Cuboid(newPosition.x, newPosition.y, width, height, 100, cuboid);
                    cuboids.push(newCuboid);
                }
            }

            if (cuboid.health < 0) {
                const index = cuboids.indexOf(cuboid);
                cuboids[index] = null;
                cuboid.dieGracefully();
            }
        }

        cuboids = cuboids.filter(cuboid => cuboid !== null);

        // Occasionally sprinkle in some genetic diversity
        if (Math.random() < .05) {
            const newPosition = generateRandomPositionWithinDistance({ x: 0, y: 0}, 50);

            if (isSpaceEmpty(newPosition.x, newPosition.y, width, height, padding)) {
                const newCuboid = new Cuboid(newPosition.x, newPosition.y, width, height, 100);
                cuboids.push(newCuboid);
            }
        }





        updateCamera();
        render();
        updateInfoWindow();
        updateWorldInfoWindow();
    };

    animate();
}


export {world, cuboids, sceneObjects}
export default init;
