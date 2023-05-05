import {RAPIER, world} from "../physicsEngine.js";
import {scene, THREE} from "../renderer.js";
import {createBrain} from "../brain.js";

const customFragmentShader = `
    varying vec3 vColor;
    void main() {
        gl_FragColor = vec4(0.0, 0.0, 1.0, sqrt(vColor.r*vColor.r + vColor.g*vColor.g) *.01);
    }
`;
const customVertexShader = `
    varying vec3 vColor;
    void main() {
        vColor = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export class Cuboid {
    constructor(x, y, width, height, health, parentAgent = null) {

        this.health = health;

        // Create a dynamic rigid-body.
        let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
        this.rigidBody = world.createRigidBody(rigidBodyDesc);

        // Create a cuboid collider attached to the dynamic rigidBody.
        let colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
        this.collider = world.createCollider(colliderDesc, this.rigidBody);

        // Create a cuboid mesh and add it to the scene
        const cuboidGeometry = new THREE.BoxGeometry(width, height, 0.1);
        const cuboidMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
        this.cuboidBodyMesh = new THREE.Mesh(cuboidGeometry, cuboidMaterial);
        scene.add(this.cuboidBodyMesh);

        const eyeRadius = Math.max(width, height) * 7 / 2;
        // Create an eye collider that is twice the size of the cuboid object.
        let eyeColliderDesc = RAPIER.ColliderDesc.ball(eyeRadius).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setSensor(true);
        this.eyeCollider = world.createCollider(eyeColliderDesc, this.rigidBody);

        // Create a cuboid mesh and add it to the scene
        const eyeGeometry = new THREE.CircleGeometry(eyeRadius, 32);
        // Create an eye mesh material with transparency enabled
        const eyeShaderMaterial = new THREE.ShaderMaterial({
            vertexShader: customVertexShader,
            fragmentShader: customFragmentShader,
            transparent: true, // Enable transparency to allow blending
            blending: THREE.NormalBlending, // Set the blending mode to additive
        });

        this.eyeMesh = new THREE.Mesh(eyeGeometry, eyeShaderMaterial);
        scene.add(this.eyeMesh);

        this.brain = createBrain(parentAgent);

        this.age = 1;
        this.children = 0;
        this.eyeColliders = [this.eyeCollider]

        if (parentAgent === null) {
            if (Math.random() < .3) {
                this.interactionType = "Predator";
            } else {
                this.interactionType = "Plant"
            }
        } else {
            this.interactionType = parentAgent.interactionType;
        }

        this.rigidBody.userData = this;
    }

    get health() {
        return this._health;
    }

    set health(newHealth) {
        this._health = newHealth;
        // Set a breakpoint here to see what's affecting the health
    }

}

export function createCuboid(x, y, width, height, health, parentAgent = null) {
    return new Cuboid(x, y, width, height, health, parentAgent);
}
