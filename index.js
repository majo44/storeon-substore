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
            if (result && result.then) {
                return result;
            }
            if (Object(result) !== result) {
                return {
                    ...state,
                    [key]: result,
                };
            }
            return {
                ...state,
                [key]: {
                    ...(state ? state[key] : {}),
                    ...result,
                },
            };
        }),
        get: () => {
            const state = store.get();
            return state ? state[key] : undefined;
        },
        dispatch: /** @type {*} */(store.dispatch.bind(null)),
    };
}

export default createSubstore;
