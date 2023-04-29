import {eyeLines, scene} from "./renderer.js";
import {RAPIER, world} from "./physicsEngine.js";
import * as THREE from 'https://cdn.skypack.dev/three';
import {createBrain} from "./brain.js";
import {deselect, selectedCuboid} from "./inputHandler.js";

let cuboidLookupByCollider = {};
let cuboidLookupByRigidBody = {};
let cuboidLookupByEyeCollider = {};
let sceneObjectLookupBySensorCollider = {};
let sceneObjectLookupByRigidBody = {};
let sceneObjectLookupByCollider = {};


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
    let eyeColliderDesc = RAPIER.ColliderDesc.cuboid(width, height).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setSensor(true);
    let eyeCollider = world.createCollider(eyeColliderDesc, rigidBody);

    // Create a cuboid mesh and add it to the scene
    const eyeGeometry = new THREE.BoxGeometry(2 * width, 2 * height, 0.1);
    // Create an eye mesh material with transparency enabled
    const eyeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.1 // Adjust the opacity value between 0 (completely transparent) and 1 (completely opaque)
    });
    const eyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
    scene.add(eyeMesh);

    const brain = createBrain(parentAgent);

    let age = 1;
    let children = 0;

    let cuboid = {rigidBody, mesh: cuboidMesh, eyeMesh: eyeMesh, health, brain, collider, age, children, eyeCollider: eyeCollider};
    cuboidLookupByCollider[String(collider.handle)] = cuboid;
    cuboidLookupByRigidBody[String(rigidBody.handle)] = cuboid;
    cuboidLookupByEyeCollider[String(eyeCollider.handle)] = cuboid;

    return cuboid;
}

export function createSceneObject(x, y, width, height) {
    // Create a dynamic rigid-body.
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y).setAdditionalMass(1000);
    let rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create a cuboid collider attached to the dynamic rigidBody.
    let colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
    let collider = world.createCollider(colliderDesc, rigidBody);


    // Create a cuboid mesh and add it to the scene
    const cuboidGeometry = new THREE.BoxGeometry(width, height, 0.1);
    const cuboidMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff});
    const cuboidMesh = new THREE.Mesh(cuboidGeometry, cuboidMaterial);
    scene.add(cuboidMesh);

    // Create a sensor collider that is twice the size of the scene object.
    let sensorColliderDesc = RAPIER.ColliderDesc.cuboid(width, height).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setSensor(true);
    let sensorCollider = world.createCollider(sensorColliderDesc, rigidBody);

    // Create a cuboid mesh and add it to the scene
    const sensorGeometry = new THREE.BoxGeometry(2 * width, 2 * height, 0.1);
    // Create a sensor mesh material with transparency enabled
    const sensorMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.1 // Adjust the opacity value between 0 (completely transparent) and 1 (completely opaque)
    });
    const sensorMesh = new THREE.Mesh(sensorGeometry, sensorMaterial);
    scene.add(sensorMesh);

    let sceneObject = {rigidBody, mesh: cuboidMesh, sensorMesh: sensorMesh, sensorCollider};
    sceneObjectLookupBySensorCollider[String(sensorCollider.handle)] = sceneObject;
    sceneObjectLookupByRigidBody[String(rigidBody.handle)] = sceneObject;
    sceneObjectLookupByCollider[String(collider.handle)] = sceneObject;
    return sceneObject;
}


function performRaycast(cuboid, world) {
    const cuboidPosition = cuboid.rigidBody.translation();
    const cuboidRotation = cuboid.rigidBody.rotation();

    const lineLength = 10;
    const endPointX = cuboidPosition.x + Math.cos(cuboidRotation) * lineLength;
    const endPointY = cuboidPosition.y + Math.sin(cuboidRotation) * lineLength;

    const ray = new RAPIER.Ray(
        {x: cuboidPosition.x, y: cuboidPosition.y},
        {x: endPointX, y: endPointY}
    );
    const maxToi = .1;
    const solid = true;

    const hitWithNormal = world.castRayAndGetNormal(
        ray,
        maxToi,
        solid,
        null,
        null,
        null,
        cuboid.rigidBody
    );

    return hitWithNormal !== null ? ray.pointAt(hitWithNormal.toi) : null;
}

export function getState(cuboid, brain) {
    let stateObservations = [];

    const hasEyeSightInput = brain.sensoryInputs.some((input) =>
        input.startsWith("absolute_eye_sight") || input.startsWith("relative_eye_sight")
    );

    const hitPoint = hasEyeSightInput ? performRaycast(cuboid, world) : null;

    for (let i = 0; i < brain.sensoryInputs.length; i++) {
        const nextInput = brain.sensoryInputs[i];

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
        } else if (
            nextInput === "absolute_eye_sight.x" ||
            nextInput === "absolute_eye_sight.y" ||
            nextInput === "relative_eye_sight.x" ||
            nextInput === "relative_eye_sight.y"
        ) {
            if (hitPoint !== null) {
                const cuboidPosition = cuboid.rigidBody.translation();
                const cuboidRotation = cuboid.rigidBody.rotation();

                const lineLength = 10;
                const endPointX = cuboidPosition.x + Math.cos(cuboidRotation) * lineLength;
                const endPointY = cuboidPosition.y + Math.sin(cuboidRotation) * lineLength;

                if (nextInput === "absolute_eye_sight.x") {
                    stateObservations.push(hitPoint.x - cuboidPosition.x);
                } else if (nextInput === "absolute_eye_sight.y") {
                    stateObservations.push(hitPoint.y - cuboidPosition.y);
                } else if (nextInput === "relative_eye_sight.x") {
                    const relativeHitPointX =
                        (hitPoint.x - cuboidPosition.x) * Math.cos(-cuboidRotation) -
                        (hitPoint.y - cuboidPosition.y) * Math.sin(-cuboidRotation);
                    stateObservations.push(relativeHitPointX);
                } else if (nextInput === "relative_eye_sight.y") {
                    const relativeHitPointY =
                        (hitPoint.x - cuboidPosition.x) * Math.sin(-cuboidRotation) +
                        (hitPoint.y - cuboidPosition.y) * Math.cos(-cuboidRotation);
                    stateObservations.push(relativeHitPointY);
                }

                const material = new THREE.LineBasicMaterial({color: 0x0000ff});
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(cuboidPosition.x, cuboidPosition.y, 0),
                    new THREE.Vector3(endPointX, endPointY, 0),
                ]);

                const line = new THREE.Line(geometry, material);

                eyeLines.push(line);
                scene.add(line);
            } else {
                stateObservations.push(0.0);
            }
        }
    }
    return stateObservations;
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


export function calculateEnvironmentalEffects(cuboid) {
    const targetPosition = {x: 0, y: 0};
    const distanceToTarget = Math.sqrt(
        Math.pow(targetPosition.x - cuboid.rigidBody.translation().x, 2) +
        Math.pow(targetPosition.y - cuboid.rigidBody.translation().y, 2)
    );

    // Provide a positive reward if the agent is within 10 units of the center
    const reward = (distanceToTarget <= 60) ? 100 / distanceToTarget : -distanceToTarget;

    cuboid.health += reward;
}

export function removeCuboid(cuboid) {
    if (selectedCuboid === cuboid) {
        deselect();
    }

    delete cuboidLookupByCollider[String(cuboid.collider.handle)];
    delete cuboidLookupByRigidBody[String(cuboid.rigidBody.handle)];
    delete cuboidLookupByEyeCollider[String(cuboid.eyeCollider.handle)];

    // Remove the rigid body from the physics world
    world.removeRigidBody(cuboid.rigidBody);
    world.removeCollider(cuboid.collider);
    world.removeCollider(cuboid.eyeCollider);

    // Remove the mesh from the scene
    scene.remove(cuboid.mesh);
    scene.remove(cuboid.eyeMesh);

    // Dispose of the geometry and material resources
    cuboid.mesh.geometry.dispose();
    cuboid.mesh.material.dispose();
    cuboid.eyeMesh.geometry.dispose();
    cuboid.eyeMesh.material.dispose();
}


export {cuboidLookupByCollider, cuboidLookupByRigidBody, sceneObjectLookupBySensorCollider, sceneObjectLookupByRigidBody, sceneObjectLookupByCollider}