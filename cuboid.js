import {scene, THREE} from "./renderer.js";
import {RAPIER, world} from "./physicsEngine.js";
import {createBrain} from "./brain.js";
import {deselect, selectedCuboid} from "./inputHandler.js";

const CREATURE_TYPES = ["Plant", "Predator"]

export function createCuboid(x, y, width, height, health, parentAgent = null) {
    // Create a dynamic rigid-body.
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
    let rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create a cuboid collider attached to the dynamic rigidBody.
    let colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
    let collider = world.createCollider(colliderDesc, rigidBody);


    // Create a cuboid mesh and add it to the scene
    const cuboidGeometry = new THREE.BoxGeometry(width, height, 0.1);
    const cuboidMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
    const cuboidMesh = new THREE.Mesh(cuboidGeometry, cuboidMaterial);
    scene.add(cuboidMesh);

    // Create an eye collider that is twice the size of the cuboid object.
    let eyeColliderDesc = RAPIER.ColliderDesc.cuboid(width * 7/2, height * 7/2).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setSensor(true);
    let eyeCollider = world.createCollider(eyeColliderDesc, rigidBody);

    // Create a cuboid mesh and add it to the scene
    const eyeGeometry = new THREE.BoxGeometry(width * 7, height * 7, 0.1);
    // Create an eye mesh material with transparency enabled
    const eyeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.05 // Adjust the opacity value between 0 (completely transparent) and 1 (completely opaque)
    });
    const eyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
    scene.add(eyeMesh);

    const brain = createBrain(parentAgent);

    let age = 1;
    let children = 0;

    let cuboid = {
        rigidBody: rigidBody,
        mesh: cuboidMesh,
        eyeMesh: eyeMesh,
        health,
        brain,
        collider: collider,
        age,
        children,
        eyeColliders: [eyeCollider]
    };
    if (parentAgent === null) {
        if (Math.random() < .3) {
            cuboid.interactionType = "Predator";
        } else {
            cuboid.interactionType = "Plant"
        }
    } else {
        cuboid.interactionType = parentAgent.interactionType;
    }

    rigidBody.userData = cuboid;
    return cuboid;
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
                eyeObservations.push(cuboid.rigidBody.translation().x - otherCuboid.rigidBody.translation().x);
                eyeObservations.push(cuboid.rigidBody.translation().y - otherCuboid.rigidBody.translation().y);
                eyeObservations.push(CREATURE_TYPES.indexOf(otherCuboid.rigidBody.interactionType));
                return false;
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

    const linearImpulseStrength = 0.1;
    const rotationalImpulseStrength = 0.005;

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
    scene.remove(cuboid.mesh);
    scene.remove(cuboid.eyeMesh);

    // Dispose of the geometry and material resources
    cuboid.mesh.geometry.dispose();
    cuboid.mesh.material.dispose();
    cuboid.eyeMesh.geometry.dispose();
    cuboid.eyeMesh.material.dispose();
}

