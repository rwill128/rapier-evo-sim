// utils.js
export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

export function generateRandomPosition(worldSize, width, height) {
    const halfWidth = worldSize / 2;
    const x = Math.random() * (worldSize - width) - halfWidth;
    const y = Math.random() * (worldSize - height) - halfWidth;
    return {x, y};
}

export function generateRandomCuboidPositions(count, width, height, padding, range = 200) {
    const positions = [];

    while (positions.length < count) {
        let x = (Math.random() * range) - range/2; // Random x between -9 and 9
        let y = (Math.random() * range) - range/2; // Random y between -4 and 4

        let overlaps = false;
        for (const pos of positions) {
            const dx = Math.abs(x - pos.x);
            const dy = Math.abs(y - pos.y);
            if (dx < width + padding && dy < height + padding) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            positions.push({x, y});
        }
    }

    return positions;
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