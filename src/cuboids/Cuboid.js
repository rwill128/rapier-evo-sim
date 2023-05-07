import {RAPIER, world} from "../physicsEngine.js";
import {scene, THREE} from "../renderer.js";
import {Brain} from "../brain.js";
import {deselect, selectedCuboid} from "../inputHandler.js";

const CREATURE_TYPES = ["Plant", "Predator", "SceneObjects.Healer"]

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
    constructor(x, y, width, height, health, parentAgent = null, state = null) {

        if (state) {
            this.health = state.health;
            this.interactionType = state.interactionType;
            this.age = state.age;
            this.children = state.children;
            // You may need to modify the brain deserialization depending on its structure
            this.brain = new Brain(parentAgent, JSON.parse(state.brain));
        } else {
            this.health = health;
            this.age = 1;
            this.children = 0;
            this.brain = new Brain(parentAgent);
        }

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

    reactToWorld() {
        const state = this.observeWorld();
        const eyeInputs =  this.getVision();
        const action = this.brain.react(state, eyeInputs);
        this.brain.lastAction = action;
        this.takeAction(action);
    }

    calculateEnvironmentalEffects() {
        this.age++;
        if (this.interactionType === "Plant") {
            this.health -= 1;
        } else {
            this.health -= .1;
        }
    }

    dieGracefully() {
        if (selectedCuboid === this) {
            deselect();
        }

        // Remove the rigid body from the physics world
        world.removeRigidBody(this.rigidBody);
        world.removeCollider(this.collider);
        world.removeCollider(this.eyeColliders[0]);

        // Remove the mesh from the scene
        scene.remove(this.cuboidBodyMesh);
        scene.remove(this.eyeMesh);

        // Dispose of the geometry and material resources
        this.cuboidBodyMesh.geometry.dispose();
        this.cuboidBodyMesh.material.dispose();
        this.eyeMesh.geometry.dispose();
        this.eyeMesh.material.dispose();
    }

    takeAction(action) {

        const actionTypes = this.brain.actionTypes;
        const orientation = this.rigidBody.rotation();

        const linearImpulseStrength = 0.5;
        const rotationalImpulseStrength = 0.05;

        for (let i = 0; i < actionTypes.length; i++) {
            const actionType = actionTypes[i];
            const impulseValue = action[i];

            switch (actionType) {
                case "absolute_impulse.x":
                    this.rigidBody.applyImpulse({x: impulseValue * linearImpulseStrength, y: 0}, true);
                    break;
                case "absolute_impulse.y":
                    this.rigidBody.applyImpulse({x: 0, y: impulseValue * linearImpulseStrength}, true);
                    break;
                case "relative_impulse.x":
                    const impulseX = impulseValue * (Math.cos(orientation) * linearImpulseStrength);
                    const impulseY = impulseValue * (Math.sin(orientation) * linearImpulseStrength);
                    this.rigidBody.applyImpulse({x: impulseX, y: impulseY}, true);
                    break;
                case "relative_impulse.y":
                    const impulseXNeg = -impulseValue * (Math.sin(orientation) * linearImpulseStrength);
                    const impulseYPos = impulseValue * (Math.cos(orientation) * linearImpulseStrength);
                    this.rigidBody.applyImpulse({x: impulseXNeg, y: impulseYPos}, true);
                    break;
                case "rotational_impulse":
                    this.rigidBody.applyTorqueImpulse(impulseValue * rotationalImpulseStrength);
                    break;
                default:
                    throw new Error(`Invalid action type: ${actionType}`);
            }
        }
    }

    serialize() {
        return JSON.stringify({
            x: this.rigidBody.translation.x,
            y: this.rigidBody.translation.y,
            width: this.cuboidBodyMesh.scale.x,
            height: this.cuboidBodyMesh.scale.y,
            health: this.health,
            interactionType: this.interactionType,
            age: this.age,
            children: this.children,
            // You may need to modify the brain serialization depending on its structure
            brain: this.brain.serialize()
        });
    }

    observeWorld() {
        let stateObservations = [];

        for (let i = 0; i < this.brain.sensoryInputs.length; i++) {
            const nextInput = this.brain.sensoryInputs[i];

            if (nextInput === "position.x") {
                stateObservations.push(this.rigidBody.translation().x);
            } else if (nextInput === "position.y") {
                stateObservations.push(this.rigidBody.translation().y);
            } else if (nextInput === "velocity.x") {
                stateObservations.push(this.rigidBody.linvel().x);
            } else if (nextInput === "velocity.y") {
                stateObservations.push(this.rigidBody.linvel().y);
            } else if (nextInput === "health") {
                stateObservations.push(this.health);
            } else if (nextInput === "age") {
                stateObservations.push(this.age);
            }
        }
        return stateObservations;
    }

    getVision() {
        let eyeObservations = [];

        for (const eyeCollider of this.eyeColliders) {
            world.intersectionsWith(eyeCollider, (otherCollider) => {
                if (otherCollider.parent().userData !== undefined) {
                    const otherCuboid = otherCollider.parent().userData;
                    eyeObservations.push(otherCuboid.rigidBody.translation().x - this.rigidBody.translation().x);
                    eyeObservations.push(otherCuboid.rigidBody.translation().y - this.rigidBody.translation().y);
                    eyeObservations.push(CREATURE_TYPES.indexOf(otherCuboid.interactionType));
                    return false;
                } else {
                    eyeObservations.push(otherCollider.parent().translation().x - otherCollider.parent().translation().x);
                    eyeObservations.push(otherCollider.parent().translation().y - otherCollider.parent().translation().y);
                    eyeObservations.push(0);
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

}