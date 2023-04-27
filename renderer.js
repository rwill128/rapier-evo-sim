import * as THREE from 'https://cdn.skypack.dev/three';
import {cuboids} from "./main.js";
import {selectedCuboid} from "./inputHandler.js";

let scene, camera, renderer;

function initRenderer(world_size = 20) {
    scene = new THREE.Scene();
    const aspectRatio = window.innerWidth / window.innerHeight;
    const viewWidth = world_size; // Increase this value to view a wider portion of the world
    const viewHeight = viewWidth / aspectRatio;

    // Modify the OrthographicCamera parameters to view a larger area
    camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, 0.1, 100);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a safe zone mesh and add it to the scene
    const safeZoneGeometry = new THREE.CircleGeometry(60, 32);
    const safeZoneMaterial = new THREE.MeshBasicMaterial({ color: 0x000082 });
    const safeZoneMesh = new THREE.Mesh(safeZoneGeometry, safeZoneMaterial);
    safeZoneMesh.position.set(0, 0, -1);
    scene.add(safeZoneMesh);

    camera.position.z = 10;
    camera.zoom = .5;
    camera.updateProjectionMatrix();
}

function render() {

    // Update the position and rotation of each cuboid object
    for (const {rigidBody, mesh, age} of cuboids) {
        const position = rigidBody.translation();
        const rotation = rigidBody.rotation(); // Get the rotation (in radians) from the rigid body
        mesh.position.set(position.x, position.y, 0);
        mesh.rotation.z = rotation; // Update the mesh rotation (z-axis for 2D)

        if (mesh !== selectedCuboid?.mesh) {
            // Change the color based on the health or any other condition
            // For example, you can interpolate the color between red and brown based on the health percentage
            const healthPercentage = age / 10000; // Assuming maximum health is 100
            const color = new THREE.Color().lerpColors(new THREE.Color(0x964B00), new THREE.Color(0xff0000), healthPercentage);
            mesh.material.color = color;
        }
    }

    renderer.render(scene, camera);
}

export {initRenderer, render, scene, camera, renderer};
