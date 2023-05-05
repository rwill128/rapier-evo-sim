import {camera, renderer, THREE} from "./renderer.js";
import {cuboids} from "./main.js";

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
    const intersects = raycaster.intersectObjects(cuboids.map(cuboid => cuboid.cuboidBodyMesh));

    // If there's an intersection, select the first intersected cuboid
    if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object;

        // Find the corresponding cuboid object
        const intersectedCuboid = cuboids.find(cuboid => cuboid.cuboidBodyMesh === intersectedMesh);

        // Deselect the previously selected cuboid, if any
        if (selectedCuboid) {
            selectedCuboid.cuboidBodyMesh.material.color.set(0xff0000);
        }

        // Select the intersected cuboid
        selectedCuboid = intersectedCuboid;
        selectedCuboid.cuboidBodyMesh.material.color.set(0x00ff00);
    } else {
        // Deselect the previously selected cuboid, if any
        if (selectedCuboid) {
            selectedCuboid.cuboidBodyMesh.material.color.set(0xff0000);
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
