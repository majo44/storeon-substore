import { StoreonStore, createStoreon } from 'storeon';

const p = Object.getPrototypeOf({});

const isChangeEventHandler = <State, Event extends PropertyKey>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: Event, handler: createStoreon.EventHandler<State, any, any>): handler is createStoreon.EventHandler<State, any, '@changed'> => {
    return event === '@changed';
}

const isPromise = <T>(x: T | Promise<any>): x is Promise<any> => {
    return typeof (x as Promise<any>).then === 'function'
}

const isObject = (x: any): boolean => {
    return x && Object.getPrototypeOf(x) === p;
}

const diff = (oldState: any = {}, newState: any = {}): any => {
    return [...Object.keys(oldState), ...Object.keys(newState)].reduce((r, key) => {
        if (oldState[key] !== newState[key]) {
            r[key] = newState[key]
        }
        return r;
    }, {} as any)
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
 */
export function createSubstore<State, K extends keyof NonNullable<State>, Events>(
    store: StoreonStore<State, Events>,
    key: K): StoreonStore<NonNullable<State>[K], Events> {
    const k = key as unknown as keyof State;
    const get = () => {
        const s = store.get();
        return s ? (s as Readonly<NonNullable<State>>)[key] : undefined;
    }

    return {
        on: (event, handler) => {
            if (isChangeEventHandler(event, handler)) {
                let localState = get();
                const unregister = store.on('@changed', (state) => {
                    const newState = state ? (state as any)[key] : undefined;
                    if (localState !== newState) {
                        const changes = isObject(newState) ? diff(localState, newState): {};
                        localState = newState;
                        handler(newState, changes);
                    }
                });
                return () => {
                    localState = undefined;
                    unregister();
                }
            }
            return store.on(event, (state, data) => {
                const r = handler(state ? (state as any)[key] : undefined, data as any);
                if (typeof r !== 'undefined' && r !== null) {
                    if (isPromise(r)) return r;
                    if (!state || r !== state[k]) {
                        return ({
                            [key]: isObject(r)
                                ? { ...(state ? state[k] : undefined), ...r }
                                : r,
                        }) as Partial<State>;
                    }
                }
            });
        },
        get,
        dispatch: store.dispatch.bind(null) as any,
    };
}
