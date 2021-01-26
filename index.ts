import { StoreonStore, createStoreon, StoreonDispatch } from 'storeon';
import DispatchableEvents = createStoreon.DispatchableEvents;

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

const isSymbol = (x: any): boolean => {
    return x && typeof x === 'symbol';
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
    key: K,
    scopeEvents?: boolean): StoreonStore<NonNullable<State>[K], Events> {

    const k = key as unknown as keyof State;

    const scopeEventsMap: Record<PropertyKey, PropertyKey> = {
        '@init': '@init',
        '@changed': '@changed',
        '@dispatch': '@dispatch'
    };

    const getEvent = (event: any): any => {
        if (!scopeEvents) {
            return event;
        }
        if (!scopeEventsMap[event]) {
            scopeEventsMap[event] = isSymbol(event)
                ? Symbol(`[@${key}] ${event.description || event.toString()}`)
                : scopeEventsMap[event] = `[@${key}] ${event} `;
        }
        return scopeEventsMap[event];
    }

    const get = () => {
        const s = store.get();
        return s ? (s as Readonly<NonNullable<State>>)[key] : undefined;
    }

    const newStore: StoreonStore<NonNullable<State>[K], Events> = {
        on: (event, handler) => {
            if (isChangeEventHandler(event, handler)) {
                let localState = get();
                const unregister = store.on('@changed', (state) => {
                    const newState = state ? (state as any)[key] : undefined;
                    if (localState !== newState) {
                        const changes = isObject(newState) ? diff(localState, newState): {};
                        localState = newState;
                        handler(newState, changes, newStore);
                    }
                });
                return () => {
                    localState = undefined;
                    unregister();
                }
            }
            return store.on(getEvent(event), (state, data) => {
                const r = handler(state ? (state as any)[key] : undefined, data as any, newStore);
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
        dispatch: ((event, ...data): void => {
            store.dispatch(getEvent(event), ...(data as any || []));
        }) as StoreonDispatch<Events & DispatchableEvents<NonNullable<State>[K]>>
    };
    return newStore;
}
