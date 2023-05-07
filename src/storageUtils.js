import {Cuboid} from "./cuboids/Cuboid.js";
import {generateRandomPosition} from "./utils.js";

export function saveTop50HealthiestCreatures(creatures) {
    // Sort the creatures array by health in descending order
    const sortedCreatures = creatures.sort((a, b) => b.health - a.health);

    // Take the top 50 healthiest creatures
    const top50Healthiest = sortedCreatures.slice(0, 50);

    // Serialize each of the top 50 healthiest creatures
    const serializedTop50 = top50Healthiest.map(creature => creature.serialize());

    // Save the serialized creatures to localStorage
    localStorage.setItem('top50HealthiestCreatures', JSON.stringify(serializedTop50));
}

export function loadTop50HealthiestCreatures(worldSize, width, height) {
    const storedTop50 = localStorage.getItem('top50HealthiestCreatures');
    if (storedTop50) {
        const serializedTop50 = JSON.parse(storedTop50);
        const top50Healthiest = serializedTop50.map(serializedCuboid => {
            const state = JSON.parse(serializedCuboid);
            const randomPos = generateRandomPosition(worldSize/2, width, height)
            return new Cuboid(randomPos.x, randomPos.y, state.width, state.height, state.health, null, state);
        });
        return top50Healthiest;
    } else {
        console.warn('No top 50 healthiest creatures found in localStorage');
        return [];
    }
}
