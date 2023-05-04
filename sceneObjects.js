import {RAPIER, world} from "./physicsEngine.js";
import {scene, THREE} from "./renderer.js";

export function createSceneObject(x, y, width, height) {
    // Create a dynamic rigid-body.
    let rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y).setAdditionalMass(1000);
    let rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create a cuboid collider attached to the dynamic rigidBody.
    let colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
    RAPIER.ActiveCollisionTypes.DEFAULT | RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED
    let collider = world.createCollider(colliderDesc, rigidBody);


    // Create a cuboid mesh and add it to the scene
    const cuboidGeometry = new THREE.BoxGeometry(width, height, 0.1);
    const cuboidMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff});
    const cuboidMesh = new THREE.Mesh(cuboidGeometry, cuboidMaterial);
    scene.add(cuboidMesh);

    // Create a sensor collider that is twice the size of the scene object.
    let sensorColliderDesc = RAPIER.ColliderDesc.cuboid(2/2 * width, 2/2 * height).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setSensor(true);
    let sensorCollider = world.createCollider(sensorColliderDesc, rigidBody);

    // Create a cuboid mesh and add it to the scene
    const sensorGeometry = new THREE.BoxGeometry(2 * width, 2 * height, 0.1);
    // Create a sensor mesh material with transparency enabled
    const sensorMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.01 // Adjust the opacity value between 0 (completely transparent) and 1 (completely opaque)
    });
    const sensorMesh = new THREE.Mesh(sensorGeometry, sensorMaterial);
    scene.add(sensorMesh);

    return {
        rigidBody: rigidBody,
        collider: collider,
        mesh: cuboidMesh,
        sensorMesh: sensorMesh,
        sensorCollider: sensorCollider
    };
}

export function calculateEnvironmentalEffects(cuboid) {
    cuboid.age++;
    cuboid.health -= 1;
}