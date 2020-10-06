import { StoreonStore } from 'storeon';

interface DispatchableEvents<State> {
    '@init': never;
    '@changed': State;
}

type EventHandler<
    State,
    Events,
    Event extends keyof (Events & DispatchableEvents<State>)
    > = (
    state: Readonly<State>,
    data: (Events & DispatchableEvents<State>)[Event]
) => Partial<State> | Promise<void> | null | void

function isChangeEventHandler<State, Event extends PropertyKey>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: Event, handler: EventHandler<State, any, any>): handler is EventHandler<State, any, '@changed'> {
    return event === '@changed';
}

function isPromise<T>(x: T | Promise<any>): x is Promise<any> {
    return typeof (x as Promise<any>).then === 'function'
}

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
 */
export function createSubstore<State, K extends keyof NonNullable<State>, Events>(
    store: StoreonStore<State, Events>,
    key: K): StoreonStore<NonNullable<State>[K], Events> {
    const k = key as unknown as keyof State;
    let diff: Partial<NonNullable<State>[K]>;
    return {
        on: (event, handler) => {
            if (isChangeEventHandler(event, handler)) {
                return store.on('@changed', (state, data) => {
                    if (key in data) {
                        handler(state ? (state as Readonly<NonNullable<State>>)[key] : undefined, diff || data[k]);
                        diff = undefined;
                    }
                });
            }
            return store.on(event, (state, data) => {
                const r = handler(state ? (state as Readonly<NonNullable<State>>)[key] : undefined, data as any);
                if (typeof r !== 'undefined' && r !== null) {
                    if (isPromise(r)) return r;
                    if (!state || r !== state[k]) {
                        diff = r;
                        return ({
                            [key]: Object.getPrototypeOf(r) === p
                                ? { ...(state ? state[k] : undefined), ...r } : r,
                        }) as Partial<State>;
                    }
                }
                return null;
            });
        },
        get: () => {
            const s = store.get();
            return s ? (s as Readonly<NonNullable<State>>)[key] : undefined;
        },
        dispatch: store.dispatch.bind(null) as any,
    };
}
