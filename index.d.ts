import { Store } from 'storeon';

export declare function createSubstore<State, Events, K extends keyof State>(
    store: Store<State, Events>,
    key: K
): Store<State[K], Events>;

export default createSubstore;