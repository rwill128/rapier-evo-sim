import {world} from "./physicsEngine.js";

const CREATURE_TYPES = ["Plant", "Predator", "SceneObjects.Healer"]

export function getState(cuboid) {
    let stateObservations = [];

    for (let i = 0; i < cuboid.brain.sensoryInputs.length; i++) {
        const nextInput = cuboid.brain.sensoryInputs[i];

        if (nextInput === "position.x") {
            stateObservations.push(cuboid.rigidBody.translation().x);
        } else if (nextInput === "position.y") {
            stateObservations.push(cuboid.rigidBody.translation().y);
        } else if (nextInput === "velocity.x") {
            stateObservations.push(cuboid.rigidBody.linvel().x);
        } else if (nextInput === "velocity.y") {
            stateObservations.push(cuboid.rigidBody.linvel().y);
        } else if (nextInput === "health") {
            stateObservations.push(cuboid.health);
        } else if (nextInput === "age") {
            stateObservations.push(cuboid.age);
        }
    }
    return stateObservations;
}

export function getVision(cuboid) {
    let eyeObservations = [];

    for (const eyeCollider of cuboid.eyeColliders) {
        world.intersectionsWith(eyeCollider, (otherCollider) => {
            if (otherCollider.parent().userData !== undefined) {
                const otherCuboid = otherCollider.parent().userData;
                eyeObservations.push(otherCuboid.rigidBody.translation().x - cuboid.rigidBody.translation().x);
                eyeObservations.push(otherCuboid.rigidBody.translation().y - cuboid.rigidBody.translation().y);
                eyeObservations.push(CREATURE_TYPES.indexOf(otherCuboid.interactionType));
                return false;
            } else {
                eyeObservations.push(otherCollider.parent().translation().x - otherCollider.parent().translation().x);
                eyeObservations.push(otherCollider.parent().translation().y - otherCollider.parent().translation().y);
                eyeObservations.push(0);
            }
            return true;
        });
    }

    while (eyeObservations.length < 3) {
        eyeObservations.push(0)
    }

    if (eyeObservations.length > 3) {
        eyeObservations = [eyeObservations[0], eyeObservations[1], eyeObservations[2]]
    }

    return eyeObservations;
}


