import * as THREE from 'https://cdn.skypack.dev/three';
import {cuboids, sceneObjects} from "./main.js";
import {selectedCuboid} from "./inputHandler.js";

let scene, camera, renderer;
let eyeLines = [];

function initRenderer(world_size) {
    scene = new THREE.Scene();
    const aspectRatio = window.innerWidth / window.innerHeight;
    const viewWidth = world_size; // Increase this value to view a wider portion of the world
    const viewHeight = viewWidth / aspectRatio;

    // Modify the OrthographicCamera parameters to view a larger area
    camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, 0.1, 100);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 10;
    camera.zoom = .5;
    camera.updateProjectionMatrix();
}

function render() {

    // Update the position and rotation of each cuboid object
    for (const {rigidBody, mesh, eyeMesh, collider} of cuboids) {
        const position = rigidBody.translation();
        const rotation = rigidBody.rotation(); // Get the rotation (in radians) from the rigid body
        mesh.position.set(position.x, position.y, 0);
        mesh.rotation.z = rotation; // Update the mesh rotation (z-axis for 2D)

        eyeMesh.position.set(position.x, position.y, 0);
        eyeMesh.rotation.z = rotation; // Update the eyeMesh rotation (z-axis for 2D)

        const eyeColor = new THREE.Color(0x48e870);
        eyeMesh.material.color = eyeColor;

        if (mesh !== selectedCuboid?.mesh) {
            // Change the color based on the health or any other condition
            // For example, you can interpolate the color between red and brown based on the health percentage
            let color = new THREE.Color(0x27b049);
            if (collider.interactionType === "Predator") {
                color = new THREE.Color(0xb02a3e);
            }
            mesh.material.color = color;
        }
    }

    for (const {rigidBody, mesh, sensorMesh} of sceneObjects) {
        const position = rigidBody.translation();
        const rotation = rigidBody.rotation(); // Get the rotation (in radians) from the rigid body
        mesh.position.set(position.x, position.y, 0);
        mesh.rotation.z = rotation; // Update the mesh rotation (z-axis for 2D)

        const color = new THREE.Color(0x785f1c);
        mesh.material.color = color;

        sensorMesh.position.set(position.x, position.y, 0);
        sensorMesh.rotation.z = rotation; // Update the sensorMesh rotation (z-axis for 2D)

        const sensorColor = new THREE.Color(0xbf8f0a);
        sensorMesh.material.color = sensorColor;
    }

    renderer.render(scene, camera);

    for (const line of eyeLines) {
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
    }

    eyeLines.length = 0;
}

export {initRenderer, render, scene, camera, renderer, eyeLines, THREE};
