import {scene} from "./renderer.js";
import {world} from "./physicsEngine.js";
import * as THREE from 'https://cdn.skypack.dev/three';
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat';
import {createBrain} from "./rlAgent.js";
import {deselect, selectedCuboid} from "./inputHandler.js";

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

    const agent = createBrain(parentAgent);

    let age = 1;

    return {rigidBody, mesh: cuboidMesh, health, agent, collider, age};
}

export function getState(rigidBody) {
    const position = rigidBody.translation();
    const velocity = rigidBody.linvel();

    return [position.x, position.y, velocity.x, velocity.y];
}

export function applyAction(rigidBody, action) {
    const impulseStrength = 1;
    let impulse;

    switch (action) {
        case 0:
            impulse = {x: 0, y: impulseStrength};
            break;
        case 1:
            impulse = {x: 0, y: -impulseStrength};
            break;
        case 2:
            impulse = {x: -impulseStrength, y: 0};
            break;
        case 3:
            impulse = {x: impulseStrength, y: 0};
            break;
        case 4:
            return;
    }

    rigidBody.applyImpulse(impulse, true);
}

export function calculateEnvironmentalEffects(cuboid) {
    const targetPosition = {x: 0, y: 0};
    const distanceToTarget = Math.sqrt(
        Math.pow(targetPosition.x - cuboid.rigidBody.translation().x, 2) +
        Math.pow(targetPosition.y - cuboid.rigidBody.translation().y, 2)
    );

    // Provide a positive reward if the agent is within 10 units of the center
    const reward = (distanceToTarget <= 60) ? 100 / distanceToTarget : -distanceToTarget;

    return reward;
}

export function removeCuboid(cuboid) {
    if (selectedCuboid === cuboid) {
        deselect()
    }

    // Remove the rigid body from the physics world
    world.removeRigidBody(cuboid.rigidBody);
    world.removeCollider(cuboid.collider);

    // Remove the mesh from the scene
    scene.remove(cuboid.mesh);
}
