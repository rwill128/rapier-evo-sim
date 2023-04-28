import { R } from "./rl.js";

const ALL_SENSORY_INPUTS = ["position.x", "position.y", "velocity.x", "velocity.y", "health", "absolute_eye_sight.x","absolute_eye_sight.y", "relative_eye_sight.x", "relative_eye_sight.y"];
const ALL_ACTIONS = ["absolute_impulse.x", "absolute_impulse.y", "relative_impulse.x", "relative_impulse.y", "rotational_impulse"];
const ALL_FILTER_LAYERS = ["tanh", "relu", "sigmoid"];

class Brain {
    constructor(parentBrain = null) {
        this.initialize(parentBrain);
    }

    initialize(parentBrain) {
        this.numNodesInHiddenLayer = Math.max(1, Math.round(Math.random() * 20 + (Math.random() * 3) - 1.5));

        const mutationRate = 0.005;

        if (parentBrain === null || Math.random() < mutationRate) {
            this.sensoryInputs = this.getRandomSubarray(ALL_SENSORY_INPUTS, Math.floor(Math.random() * (ALL_SENSORY_INPUTS.length - 1)) + 1);
        } else {
            this.sensoryInputs = parentBrain.sensoryInputs.slice();

            if (Math.random() < mutationRate && this.sensoryInputs.length > 1) {
                // Remove a random sensory input
                const removeIndex = Math.floor(Math.random() * this.sensoryInputs.length);
                this.sensoryInputs.splice(removeIndex, 1);
            } else if (Math.random() < mutationRate && this.sensoryInputs.length < ALL_SENSORY_INPUTS.length) {
                // Add a random sensory input that is not already in the list
                const availableInputs = ALL_SENSORY_INPUTS.filter(input => !this.sensoryInputs.includes(input));
                const newInput = availableInputs[Math.floor(Math.random() * availableInputs.length)];
                this.sensoryInputs.push(newInput);
            }
        }

        if (parentBrain === null) {
            this.sensoryInputs = this.getRandomSubarray(ALL_SENSORY_INPUTS, Math.floor(Math.random() * (ALL_SENSORY_INPUTS.length - 1)) + 1);
            this.firstFilterType = ALL_FILTER_LAYERS[Math.floor(Math.random() * (ALL_FILTER_LAYERS.length))];
            this.secondFilterType = ALL_FILTER_LAYERS[Math.floor(Math.random() * (ALL_FILTER_LAYERS.length))];
            this.actionTypes = this.getRandomSubarray(ALL_ACTIONS, Math.floor(Math.random() * (ALL_SENSORY_INPUTS.length - 1)) + 1)
        } else {
            this.sensoryInputs = parentBrain.sensoryInputs;
            this.firstFilterType = parentBrain.firstFilterType;
            this.secondFilterType = parentBrain.secondFilterType;
            this.actionTypes = parentBrain.actionTypes;
        }

        this.inputs = new R.Mat(this.numNodesInHiddenLayer, this.sensoryInputs.length);
        this.inputBiases = new R.Mat(this.numNodesInHiddenLayer, 1);
        this.outputs = new R.Mat(this.actionTypes.length, this.numNodesInHiddenLayer);
        this.outputBiases = new R.Mat(this.actionTypes.length, 1);

        if (parentBrain !== null) {
            this.inputs.setFromWithErrors(parentBrain.inputs.w);
            this.inputBiases.setFromWithErrors(parentBrain.inputBiases.w);
            this.outputs.setFromWithErrors(parentBrain.outputs.w);
            this.outputBiases.setFromWithErrors(parentBrain.outputBiases.w);
        }
    }

    getRandomSubarray(arr, size) {
        const shuffled = arr.slice(0);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, size);
    }

    filter(G, matrix, filterType) {
        switch (filterType) {
            case "tanh":
                return G.tanh(matrix);
            case "sigmoid":
                return G.sigmoid(matrix);
            case "relu":
                return G.relu(matrix);
            default:
                throw new Error("Invalid filter type");
        }
    }

    react(slist) {
        const s = new R.Mat(slist.length, 1);
        s.setFrom(slist);

        const G = new R.Graph(false);
        const a1mat = G.add(G.mul(this.inputs, s), this.inputBiases);
        const h1mat = this.filter(G, a1mat, this.firstFilterType);
        const a2mat = G.add(G.mul(this.outputs, h1mat), this.outputBiases);
        const result = this.filter(G, a2mat, this.secondFilterType);

        return result.w;
    }
}

export function createBrain(parentBrain = null) {
    return new Brain(parentBrain);
}
