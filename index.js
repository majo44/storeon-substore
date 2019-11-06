/**
 * @param {Object} obj1
 * @param {Object} obj2
 * @returns {boolean}
 */
function same(obj1, obj2) {
    const keys = Object.keys(obj2);
    for (let i = 0; i < keys.length; i += 1) {
        if (obj1[keys[i]] !== obj2[keys[i]]) {
            return false;
        }
    }
    return true;
}

/**
 * Creates instance of storeon feature sub store.
 *
 * @example
 * import createStore from "storeon";
 * import { substore } from "storeon-substore";
 * // create store
 * const store = createStore([(store) => {
 *    store('@init', () => ({
 *        feature: {
 *            flag: true,
 *        },
 *    }));
 * }]);
 * const featureStore = createSubstore(store, 'feature');
 * featureStore.on('toggleFeatureBooleanFlag', (state) => ({
 *   flag: state ? !state.flag : true,
 * }));
 * featureStore.dispatch('toggleFeatureBooleanFlag');
 * featureStore.get(); // returns { flag: false }
 *
 * @template {object} State
 * @template Events
 * @template {keyof State} K
 * @param {import('storeon').Store<State, Events>} store
 * @param {K} key
 * @return {import('storeon').Store<State[K], Events>} store
 */
export function createSubstore(store, key) {
    return {
        on: (event, handler) => store.on(event, (state, data) => {
            const result = handler(state ? state[key] : undefined, data);
            if (typeof result !== 'undefined' && result !== null) {
                if (typeof result.then === 'function') {
                    return result;
                }
                if (Object(result) !== result) {
                    if (!state || result !== state[key]) {
                        return {
                            ...state,
                            [key]: result,
                        };
                    }
                } else if (!state || !state[key] || !same(state[key], result)) {
                    return {
                        ...state,
                        [key]: {
                            ...(state ? state[key] : {}),
                            ...result,
                        },
                    };
                }
            }
            return undefined;
        }),
        get: () => {
            const state = store.get();
            return state ? state[key] : undefined;
        },
        dispatch: /** @type {*} */(store.dispatch.bind(null)),
    };
}

export default createSubstore;
