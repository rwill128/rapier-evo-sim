import {R} from "./rl.js";

// const EYE_SENSORY_INPUTS = ["absolute_eye_sight.x", "absolute_eye_sight.y", "relative_eye_sight.x", "relative_eye_sight.y"];
const EYE_SENSORY_INPUTS = ["relative_eye_sight.x", "relative_eye_sight.y", "witnessed_creature_type"];
const ALL_SENSORY_INPUTS = ["position.x", "position.y", "velocity.x", "velocity.y", "health"];
const ALL_ACTIONS = ["absolute_impulse.x", "absolute_impulse.y", "relative_impulse.x", "relative_impulse.y", "rotational_impulse"];
const ALL_FILTER_LAYERS = ["tanh", "relu", "sigmoid"];

class Brain {
    constructor(parent = null) {
        this.initialize(parent);
    }

    initialize(parent) {
        this.numNodesInHiddenLayer = Math.max(1, Math.round(Math.random() * 20 + (Math.random() * 3) - 1.5));

        const mutationRate = 0.005;

        if (parent === null || Math.random() < mutationRate) {
            this.sensoryInputs = this.getRandomSubarray(ALL_SENSORY_INPUTS, Math.floor(Math.random() * (ALL_SENSORY_INPUTS.length - 1)) + 1);
            this.visionInputs = EYE_SENSORY_INPUTS;
        } else {
            this.sensoryInputs = parent.brain.sensoryInputs.slice();
            this.visionInputs = parent.brain.visionInputs.slice();

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

        if (parent === null) {
            this.sensoryInputs = ALL_SENSORY_INPUTS;
            this.visionInputs = EYE_SENSORY_INPUTS;;
            this.firstFilterType = ALL_FILTER_LAYERS[Math.floor(Math.random() * (ALL_FILTER_LAYERS.length))];
            this.secondFilterType = ALL_FILTER_LAYERS[Math.floor(Math.random() * (ALL_FILTER_LAYERS.length))];
            this.actionTypes = ALL_ACTIONS;
        } else {
            this.sensoryInputs = parent.brain.sensoryInputs;
            this.visionInputs = parent.brain.visionInputs;
            this.firstFilterType = parent.brain.firstFilterType;
            this.secondFilterType = parent.brain.secondFilterType;
            this.actionTypes = parent.brain.actionTypes;
        }

        this.inputs = new R.Mat(this.numNodesInHiddenLayer, this.sensoryInputs.length + this.visionInputs.length);
        this.inputBiases = new R.Mat(this.numNodesInHiddenLayer, 1);
        this.outputs = new R.Mat(this.actionTypes.length, this.numNodesInHiddenLayer);
        this.outputBiases = new R.Mat(this.actionTypes.length, 1);

        if (parent !== null) {
            this.inputs.setFromWithErrors(parent.brain.inputs.w);
            this.inputBiases.setFromWithErrors(parent.brain.inputBiases.w);
            this.outputs.setFromWithErrors(parent.brain.outputs.w);
            this.outputBiases.setFromWithErrors(parent.brain.outputBiases.w);
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

    react(sList, eyeList) {
        const s = new R.Mat(sList.length + eyeList.length, 1);
        s.setFrom(sList.concat(eyeList));

        const G = new R.Graph(false);
        const a1mat = G.add(G.mul(this.inputs, s), this.inputBiases);
        const h1mat = this.filter(G, a1mat, this.firstFilterType);
        const a2mat = G.add(G.mul(this.outputs, h1mat), this.outputBiases);
        const result = this.filter(G, a2mat, this.secondFilterType);

        return result.w;
    }
}

export function createBrain(parent = null) {
    return new Brain(parent);
}
