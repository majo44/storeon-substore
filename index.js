/**
 * @param {*} event
 * @return {boolean}
 */
const isBuildInEvent = (event) => event === '@init' || event === '@dispatch' || event === '@changed';


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
        on: (event, handler) => store.on(event,
            /**
             * @param {*} state
             * @param {*} data
             */
            (state, data) => {
                let result;
                if (data && data.____scoped) {
                    if (data.scope === key) {
                        result = handler(state ? state[key] : undefined, data.payload);
                    }
                } else {
                    result = handler(state ? state[key] : undefined, data);
                }
                if (typeof result !== 'undefined' && result !== null) {
                    if (typeof result.then === 'function') {
                        return result;
                    }
                    if (!state || result !== state[key]) {
                        return {
                            ...state,
                            [key]: result,
                        };
                    }
                }
                return undefined;
            }),
        get: () => {
            const state = store.get();
            return state ? state[key] : undefined;
        },
        dispatch: /** @type {*} */(
            /**
             * @param {*} event
             * @param {*} data
             */
            (event, data) => {
                if (isBuildInEvent(event)) {
                    /** @type {*} */(store).dispatch(event, data);
                } else {
                    /** @type {*} */(store).dispatch(event, {
                        ____scoped: true,
                        payload: data,
                        scope: key,
                    });
                }
            }),
    };
}


export default createSubstore;
