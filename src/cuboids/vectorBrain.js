
// const EYE_SENSORY_INPUTS = ["absolute_eye_sight.x", "absolute_eye_sight.y", "relative_eye_sight.x", "relative_eye_sight.y"];
const EYE_SENSORY_INPUTS = ["relative_eye_sight.x", "relative_eye_sight.y", "witnessed_creature_type"];
const ALL_SENSORY_INPUTS = ["position.x", "position.y", "velocity.x", "velocity.y", "health"];
// const ALL_SENSORY_INPUTS = ["health"];
// const ALL_ACTIONS = ["absolute_impulse.x", "absolute_impulse.y", "relative_impulse.x", "relative_impulse.y", "rotational_impulse"];
const ALL_ACTIONS = ["relative_impulse.x", "relative_impulse.y", "rotational_impulse"];
const ALL_FILTER_LAYERS = ["tanh", "relu", "sigmoid"];

export class VectorBrain {
    constructor(parent = null, state = null) {
        this.actionTypes = ALL_ACTIONS;
        this.sensoryInputs = ALL_SENSORY_INPUTS;
        if (state) {
            this.deserialize(state);
        } else {
            this.initialize(parent);
        }
    }

    initialize(parent) {
        if (parent) {
            if (parent.xWeight) {
                this.xWeight = parent.xWeight;
            } else {
                this.xWeight = Math.random();
            }
            if (parent.yWeight) {
                this.yWeight = parent.yWeight;
            } else {
                this.yWeight = Math.random();
            }
            if (parent.yWeight) {
                this.yWeight = parent.yWeight;
            } else {
                this.typeWeight = Math.random();
            }
        } else {
            this.xWeight = Math.random();
            this.yWeight = Math.random();
            this.typeWeight = Math.random();
        }
    }


    react(sList, eyeList) {
        let eyeReaction = eyeList[0] * this.xWeight;
        let eyeReaction2 = eyeList[1] * this.yWeight;

        if (isNaN(eyeReaction)) {
            console.log("eyeReaction value is Nan")
        }

        if (isNaN(eyeReaction2)) {
            console.log("eyeReaction2 value is Nan")
        }

        return [eyeReaction, eyeReaction2, 0];
    }

    serialize() {
    }
    deserialize(state) {
    }
}