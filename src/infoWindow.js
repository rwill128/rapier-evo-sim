import {selectedCuboid} from "./inputHandler.js";

export function updateInfoWindow() {
    const infoWindow = document.getElementById("info-window");

    if (selectedCuboid) {
        const position = selectedCuboid.rigidBody.translation();
        const health = selectedCuboid.health;
        const age = selectedCuboid.age;
        const children = selectedCuboid.children;
        const brain = selectedCuboid.brain;

        // const actorWeights1 = brain.inputs.toJSON();
        // const actorBiases1 = brain.inputBiases.toJSON();
        //
        // const actorWeights2 = brain.outputs.toJSON();
        // const actorBiases2 = brain.outputBiases.toJSON();

        // const actorWeights1Table = weightsToTable(actorWeights1, actorBiases1);
        // const actorWeights2Table = weightsToTable(actorWeights2, actorBiases2);

        infoWindow.innerHTML = `
      <h3>Selected Cuboid</h3>
      <p>Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})</p>
      <p>Health: ${health.toFixed(2)}</p>
      <p>Age: ${age}</p>
      <p>Children: ${children}</p>
      <p>Sensory inputs: ${brain.sensoryInputs}</p>
      <p>Num hidden nodes: ${brain.numNodesInHiddenLayer}</p>
      <p>First filter: ${brain.firstFilterType}</p>
      <p>Second filter: ${brain.secondFilterType}</p>
      <p>Action types: ${brain.actionTypes}</p>
      <p>Last Actions: ${brain.lastAction}</p>
    `;
    } else {
        infoWindow.innerHTML = `<p>No cuboid selected.</p>`;
    }
}


function weightsToTable(weights, biases) {
    const {n, d, w} = weights;
    const {w: b} = biases;

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