import {camera, renderer} from "./renderer.js";
import {cuboids} from "./main.js";
import * as THREE from 'https://cdn.skypack.dev/three';

let controls;
let selectedCuboid;

function initInputHandler() {
    controls = {
        panSpeed: 1.0,
        zoomSpeed: 0.001,
        up: false,
        down: false,
        left: false,
        right: false
    };

    // Keyboard event listeners
    window.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW':
                controls.up = true;
                break;
            case 'KeyS':
                controls.down = true;
                break;
            case 'KeyA':
                controls.left = true;
                break;
            case 'KeyD':
                controls.right = true;
                break;
        }
    });

    window.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW':
                controls.up = false;
                break;
            case 'KeyS':
                controls.down = false;
                break;
            case 'KeyA':
                controls.left = false;
                break;
            case 'KeyD':
                controls.right = false;
                break;
        }
    });

    // Scroll event listener
    window.addEventListener('wheel', (event) => {
        event.preventDefault();
        const delta = event.deltaY * -controls.zoomSpeed;
        camera.zoom = Math.max(0.1, Math.min(5, camera.zoom + delta));
        camera.updateProjectionMatrix();
    });

}

export function onMouseClick(event) {
    // Get the normalized mouse coordinates
    const {x, y} = getNormalizedMouseCoordinates(event);

    // Create a Raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Find the intersections between the ray and the cuboids
    const intersects = raycaster.intersectObjects(cuboids.map(cuboid => cuboid.mesh));

    // If there's an intersection, select the first intersected cuboid
    if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object;

        // Find the corresponding cuboid object
        const intersectedCuboid = cuboids.find(cuboid => cuboid.mesh === intersectedMesh);

        // Deselect the previously selected cuboid, if any
        if (selectedCuboid) {
            selectedCuboid.mesh.material.color.set(0xff0000);
        }

        // Select the intersected cuboid
        selectedCuboid = intersectedCuboid;
        selectedCuboid.mesh.material.color.set(0x00ff00);
    } else {
        // Deselect the previously selected cuboid, if any
        if (selectedCuboid) {
            selectedCuboid.mesh.material.color.set(0xff0000);
            selectedCuboid = null;
        }
    }
}


function getNormalizedMouseCoordinates(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    return {x, y};
}

export function updateInfoWindow() {
    const infoWindow = document.getElementById("info-window");

    if (selectedCuboid) {
        const position = selectedCuboid.rigidBody.translation();
        const health = selectedCuboid.health;
        const age = selectedCuboid.age;
        const agent = selectedCuboid.agent;

        const actorWeights1 = agent.inputs.toJSON();
        const actorBiases1 = agent.input_biases.toJSON();

        const actorWeights2 = agent.outputs.toJSON();
        const actorBiases2 = agent.output_biases.toJSON();

        const actorWeights1Table = weightsToTable(actorWeights1, actorBiases1);
        const actorWeights2Table = weightsToTable(actorWeights2, actorBiases2);

        infoWindow.innerHTML = `
      <h3>Selected Cuboid</h3>
      <p>Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})</p>
      <p>Health: ${health.toFixed(2)}</p>
      <p>Age: ${age.toFixed(2)}</p>
      <h3>Brains Weights</h3>
        <h4>Inputs</h4>
        ${actorWeights1Table}
        <h4>Outputs</h4>
        ${actorWeights2Table}
    `;
    } else {
        infoWindow.innerHTML = `<p>No cuboid selected.</p>`;
    }
}

function weightsToTable(weights, biases) {
    const { n, d, w } = weights;
    const { w: b } = biases;

    let table = "<table>";
    table += "<tr><th></th>";

    for (let j = 0; j < d; j++) {
        table += `<th>${j + 1}</th>`;
    }

    table += "<th>Biases</th>";
    table += "</tr>";

    for (let i = 0; i < n; i++) {
        table += `<tr><th>${i + 1}</th>`;
        for (let j = 0; j < d; j++) {
            const key = i * d + j;
            table += `<td>${w[key].toFixed(4)}</td>`;
        }
        table += `<td>${b[i].toFixed(4)}</td>`;
        table += "</tr>";
    }

    table += "</table>";
    return table;
}


function updateCamera() {
    // Update camera position based on controls
    if (controls.up) camera.position.y += controls.panSpeed;
    if (controls.down) camera.position.y -= controls.panSpeed;
    if (controls.left) camera.position.x -= controls.panSpeed;
    if (controls.right) camera.position.x += controls.panSpeed;
}

export function deselect() {
    selectedCuboid = null;
}

export {initInputHandler, updateCamera, controls, selectedCuboid};
