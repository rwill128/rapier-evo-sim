import {createSceneObject} from "./sceneObjects.js";
import {generateRandomPosition, isSpaceEmpty} from "../utils.js";
import {sceneObjects, world} from "../main.js";

class SceneObjectsManager {
    constructor(worldSize) {
        this.initSceneObjects(worldSize);
    }

    initSceneObjects(worldSize) {
        const padding = 0.1;
        const halfWorldSize = worldSize / 2;
        const numSceneObjects = 1;
        const obstacleWidth = 200;
        const obstacleHeight = 200;

        for (let i = 0; i < numSceneObjects; i++) {
            let attempts = 0;
            let maxAttempts = 10;
            let createdSceneObject = false;

            while (!createdSceneObject && attempts < maxAttempts) {
                const pos = generateRandomPosition(halfWorldSize, obstacleWidth, obstacleHeight);

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
    }

    update() {
        // for (const sceneObject of sceneObjects) {
        //     let affectedCuboids = []
        //     world.intersectionsWith(sceneObject.sensorCollider, (otherCollider) => {
        //         if (otherCollider.parent().userData !== undefined && otherCollider.parent().userData.interactionType === "Plant") {
        //             const affectedCuboid = otherCollider.parent().userData;
        //             affectedCuboids.push(affectedCuboid);
        //         }
        //     });
        //     for (const affectedCuboid of affectedCuboids) {
        //         affectedCuboid.health += 2;
        //     }
        // }
    }
}

export {SceneObjectsManager};
