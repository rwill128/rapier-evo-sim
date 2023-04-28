import {eyeLines, scene} from "./renderer.js";
import {world} from "./physicsEngine.js";
import * as THREE from 'https://cdn.skypack.dev/three';
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat';
import {createBrain} from "./brain.js";
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

    const brain = createBrain(parentAgent);

    let age = 1;
    let children = 0;

    return {rigidBody, mesh: cuboidMesh, health, brain, collider, age, children};
}

export function getState(cuboid, brain) {

    let state_observations = []

    for (let i = 0; i < brain.sensory_inputs.length; i++) {
        let next_input = brain.sensory_inputs[i];

        if (next_input === "position.x") {
            state_observations.push(cuboid.rigidBody.translation().x)
        }

        if (next_input === "position.y") {
            state_observations.push(cuboid.rigidBody.translation().y)
        }

        if (next_input === "velocity.x") {
            state_observations.push(cuboid.rigidBody.linvel().x)
        }

        if (next_input === "velocity.y") {
            state_observations.push(cuboid.rigidBody.linvel().y)
        }

        if (next_input === "health") {
            state_observations.push(cuboid.health)
        }

        if (next_input === "age") {
            state_observations.push(cuboid.age)
        }

        if (next_input === "eye_sight.x") {

            const cuboidPosition = cuboid.rigidBody.translation();
            const cuboidRotation = cuboid.rigidBody.rotation(); // Get the rotation (in radians) from the rigid body

            // Calculate the end point of the line based on the cuboid's rotation
            const lineLength = 8;
            const endPointX = cuboidPosition.x + Math.cos(cuboidRotation) * lineLength;
            const endPointY = cuboidPosition.y + Math.sin(cuboidRotation) * lineLength;

            let ray = new RAPIER.Ray(
                {x: cuboidPosition.x, y: cuboidPosition.y},
                {x: endPointX, y: endPointY}
            );
            let maxToi = .01;
            let solid = true;

            let hitWithNormal = world.castRayAndGetNormal(ray, maxToi, solid, null, null, null, cuboid.rigidBody);
            if (hitWithNormal != null) {
                let hitPoint = ray.pointAt(hitWithNormal.toi);
                console.log("hit at point", hitPoint, "with normal", hitWithNormal.normal);

                state_observations.push(hitPoint.x - cuboid.rigidBody.translation().x);

                const material = new THREE.LineBasicMaterial({color: 0x0000ff});
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(cuboidPosition.x, cuboidPosition.y, 0),
                    new THREE.Vector3(endPointX, endPointY, 0)
                ]);

                let line = new THREE.Line(geometry, material);

                eyeLines.push(line);
                scene.add(line);

            } else {
                state_observations.push(0.0)
            }
        }

    }


    return state_observations;
}

export function applyAction(rigidBody, action) {
    const impulseStrength = .005;

    rigidBody.applyImpulse({x: action[0] * impulseStrength, y: action[1] * impulseStrength}, true);
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

