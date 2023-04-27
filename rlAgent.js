import {R} from "./rl.js";

export function createBrain(parentBrain = null) {

    let brain = {}
    let d = Math.max(1, Math.round(Math.random() * 20 + (Math.random() * 3) - 1.5));
    brain.inputs = new R.RandMat(d, 4, 0, 0.01)
    brain.input_biases = new R.Mat(d, 1, 0, 0.01);
    brain.outputs = new R.RandMat(4, d, 0, 0.01);
    brain.output_biases = new R.Mat(4, 1, 0, 0.01);

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
        var s = new R.Mat(4, 1);
        s.setFrom(slist);

        var G = new R.Graph(false);
        var a1mat = G.add(G.mul(this.inputs, s), this.input_biases);
        var h1mat = G.relu(a1mat);
        var a2mat = G.add(G.mul(this.outputs, h1mat), this.output_biases);

        return sampleIndexFromSoftmax(R.softmax(a2mat).w);
    }

    return brain;
}
