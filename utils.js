// utils.js
export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

export function generateRandomCuboidPositions(count, width, height, padding) {
    const positions = [];

    while (positions.length < count) {
        let x = (Math.random() * 50) - 25; // Random x between -9 and 9
        let y = (Math.random() * 50) - 25; // Random y between -4 and 4

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
