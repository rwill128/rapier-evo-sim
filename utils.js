// utils.js
import {RAPIER, world} from "./physicsEngine.js";

export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

export function generateRandomPosition(worldSize, width, height) {
    const halfWidth = worldSize / 2;
    const x = Math.random() * (worldSize - width) - halfWidth;
    const y = Math.random() * (worldSize - height) - halfWidth;
    return {x, y};
}

export function generateRandomPositionWithinDistance(point, distance) {
    const angle = Math.random() * Math.PI * 2; // Random angle in radians
    const dx = distance * Math.cos(angle); // Change in x
    const dy = distance * Math.sin(angle); // Change in y

    const x = point.x + dx;
    const y = point.y + dy;

    return { x, y };
}


export function isSpaceEmpty(x, y, width, height, padding = 0.1) {
    // Create a slightly larger cuboid shape
    const paddedWidth = width + padding;
    const paddedHeight = height + padding;
    const shape = new RAPIER.Cuboid(paddedWidth / 2, paddedHeight / 2);

    // Set the initial position, rotation, and zero velocity
    const shapePos = { x: x, y: y };
    const shapeRot = 0;

    let isEmpty = true

    world.intersectionsWithShape(shapePos, shapeRot, shape, (handle) => {
        if (handle.isSensor()) {
            return true;
        }

        isEmpty = false;
        return false; // Return `false` instead if we want to stop searching for other colliders that contain this point.
    });

    // if (isEmpty === false) {
    //     console.log("Tried to find empty space at " + x + ", " + y + " but collision was detected.")
    // }

    return isEmpty;
}

export function getRandomCuboidExcept(cuboidsList, excludeCuboid) {
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