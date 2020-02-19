const p = Object.getPrototypeOf({});

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
    /**
     * @type {Partial<State[K]>}
     */
    let diff;
    return {
        on: (event, handler) => {
            if (event === '@changed') {
                return store.on('@changed', (state, data) => {
                    if (key in data) {
                        /** @type {(
                         *  state: Readonly<State>,
                         *  data: Partial<State[K]>) => Promise<void> | null | void}
                         */
                        (handler)(state ? state[key] : undefined, diff || data[key]);
                        diff = undefined;
                    }
                });
            }
            return store.on(event, (state, data) => {
                const r = handler(state ? state[key] : undefined, data);
                if (typeof r !== 'undefined' && r !== null) {
                    if (typeof r.then === 'function') {
                        return r;
                    }
                    if (!state || r !== state[key]) {
                        diff = r;
                        return /** @type {Partial<State>} */ ({
                            [key]: Object.getPrototypeOf(r) === p
                                ? { ...(state ? state[key] : undefined), ...r } : r,
                        });
                    }
                }
                return undefined;
            });
        },
        get: () => {
            const s = store.get();
            return s ? s[key] : undefined;
        },
        dispatch: /** @type {*} */(store.dispatch.bind(null)),
    };
}

export default createSubstore;
