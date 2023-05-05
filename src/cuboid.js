import {scene, THREE} from "./renderer.js";
import {RAPIER, world} from "./physicsEngine.js";
import {createBrain} from "./brain.js";
import {deselect, selectedCuboid} from "./inputHandler.js";
import {Cuboid} from "./cuboids/Cuboid.js";

const CREATURE_TYPES = ["Plant", "Predator", "SceneObjects.Healer"]



export function createCuboid(x, y, width, height, health, parentAgent = null) {
    return new Cuboid(x, y, width, height, health, parentAgent);
}

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


export function applyAction(cuboid, action) {

    const actionTypes = cuboid.brain.actionTypes;
    const orientation = cuboid.rigidBody.rotation();

    const linearImpulseStrength = 0.5;
    const rotationalImpulseStrength = 0.05;

    for (let i = 0; i < actionTypes.length; i++) {
        const actionType = actionTypes[i];
        const impulseValue = action[i];

        switch (actionType) {
            case "absolute_impulse.x":
                cuboid.rigidBody.applyImpulse({x: impulseValue * linearImpulseStrength, y: 0}, true);
                break;
            case "absolute_impulse.y":
                cuboid.rigidBody.applyImpulse({x: 0, y: impulseValue * linearImpulseStrength}, true);
                break;
            case "relative_impulse.x":
                const impulseX = impulseValue * (Math.cos(orientation) * linearImpulseStrength);
                const impulseY = impulseValue * (Math.sin(orientation) * linearImpulseStrength);
                cuboid.rigidBody.applyImpulse({x: impulseX, y: impulseY}, true);
                break;
            case "relative_impulse.y":
                const impulseXNeg = -impulseValue * (Math.sin(orientation) * linearImpulseStrength);
                const impulseYPos = impulseValue * (Math.cos(orientation) * linearImpulseStrength);
                cuboid.rigidBody.applyImpulse({x: impulseXNeg, y: impulseYPos}, true);
                break;
            case "rotational_impulse":
                cuboid.rigidBody.applyTorqueImpulse(impulseValue * rotationalImpulseStrength);
                break;
            default:
                throw new Error(`Invalid action type: ${actionType}`);
        }
    }
}

export function reactToWorld(cuboid) {
    const state = getState(cuboid);
    const eyeInputs =  getVision(cuboid);
    const action = cuboid.brain.react(state, eyeInputs);
    cuboid.brain.lastAction = action;
    applyAction(cuboid, action);
}


export function removeCuboid(cuboid) {
    if (selectedCuboid === cuboid) {
        deselect();
    }

    // Remove the rigid body from the physics world
    world.removeRigidBody(cuboid.rigidBody);
    world.removeCollider(cuboid.collider);
    world.removeCollider(cuboid.eyeColliders[0]);

    // Remove the mesh from the scene
    scene.remove(cuboid.cuboidBodyMesh);
    scene.remove(cuboid.eyeMesh);

    // Dispose of the geometry and material resources
    cuboid.cuboidBodyMesh.geometry.dispose();
    cuboid.cuboidBodyMesh.material.dispose();
    cuboid.eyeMesh.geometry.dispose();
    cuboid.eyeMesh.material.dispose();
}

