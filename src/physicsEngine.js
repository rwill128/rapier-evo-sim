import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat';

let world;

async function initPhysicsEngine() {
    await RAPIER.init();

    const gravity = {x: 0.0, y: 0.0}; // Set gravity to zero
    world = new RAPIER.World(gravity);

}

export {initPhysicsEngine, world, RAPIER};
