import {R} from "./rl.js";

export function createBrain(parentBrain = null) {

    let brain = {}
    let d = Math.max(1, Math.round(Math.random() * 20 + (Math.random() * 3) - 1.5));

    function getRandomSubarray(arr, size) {
        const shuffled = arr.slice(0);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, size);
    }

    const allSensoryInputs = ["position.x", "position.y", "velocity.x", "velocity.y", "health", "eye_sight.x"];
    const subsetSize = Math.floor(Math.random() * (allSensoryInputs.length - 1)) + 1;
    brain.sensory_inputs = getRandomSubarray(allSensoryInputs, subsetSize);

    brain.inputs = new R.Mat(d, brain.sensory_inputs.length);
    brain.input_biases = new R.Mat(d, 1);
    brain.outputs = new R.Mat(2, d);
    brain.output_biases = new R.Mat(2, 1);

    if (parentBrain !== null) {
        brain.inputs.setFromWithErrors(parentBrain.inputs.w);
        brain.input_biases.setFromWithErrors(parentBrain.input_biases.w);
        brain.outputs.setFromWithErrors(parentBrain.outputs.w);
        brain.output_biases.setFromWithErrors(parentBrain.output_biases.w);
    }

    function sampleIndexFromSoftmax(probabilities) {
        const randomValue = Math.random();
        let accumulatedProb = 0;

        for (let index = 0; index < probabilities.length; index++) {
            accumulatedProb += probabilities[index];
            if (randomValue <= accumulatedProb) {
                return index;
            }
        }

        // If there's some floating-point precision issue, return the last index
        return probabilities.length - 1;
    }


    brain.react = function(slist) {
        var s = new R.Mat(slist.length, 1);
        s.setFrom(slist);

        var G = new R.Graph(false);
        var a1mat = G.add(G.mul(this.inputs, s), this.input_biases);
        var h1mat = G.tanh(a1mat);
        var a2mat = G.add(G.mul(this.outputs, h1mat), this.output_biases);

        var tanh = G.tanh(a2mat);

        return tanh.w;

        // return sampleIndexFromSoftmax(R.softmax(a2mat).w);
    }

    return brain;
}
