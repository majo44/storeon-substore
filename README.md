# storeon-substore

[![npm version](https://badge.fury.io/js/storeon-substore.svg)](https://badge.fury.io/js/storeon-substore)
[![Build Status](https://travis-ci.org/majo44/storeon-substore.svg?branch=master)](https://travis-ci.org/majo44/storeon-substore)
[![Coverage Status](https://coveralls.io/repos/github/majo44/storeon-substore/badge.svg?branch=master)](https://coveralls.io/github/majo44/storeon-substore?branch=master)

<img src="https://storeon.github.io/storeon/logo.svg" align="right"
     alt="Storeon logo by Anton Lovchikov" width="160" height="142">
     
Utility for creating feature sub store for [Storeon](https://github.com/storeon/storeon).    

It size is 420 B (minified and gzipped) and uses [Size Limit](https://github.com/ai/size-limit) to control size.

### Overview
The goal of this library is provide the easy way to create feature sub store, 
which allows to work on sub state (projection of parent state) within the storeon events handler and returns 
sub state on `get` method call. 

During work with mid scale application you can notice that on multiple places
you have to make the projection of state, eg:
```javascript
/**
 * @param {Store<{feature: {counter: number}}>} store 
 */
export function featureCounterModule(store) {
    store.on('@init', () => ({
        feature: {
            counter: 0
        }
    }));
    store.on('featureIncrement', state => ({
        feature: {
            ...state.feature,
            counter: state.feature.counter + 1,  
        }   
    }));
    store.on('featureDecrement', state => ({
        feature: {
            ...state.feature,
            counter: state.feature.counter - 1,  
        }   
    }));
    store.on('featureSet', (state, count) => ({
        feature: {
            ...state.feature,
            counter: count  
        }   
    }));
}
``` 
To eliminate the duplication of state projection each time when you reduce your state 
you can use feature sub store:
```javascript
/**
 * @param {Store<{feature: {counter: number}}>} store 
 */
export function featureCounterModule(store) {
    const featureStore = createSubstore(store, 'feature'); 
    featureStore.on('@init', () => ({
        counter: 0
    }));
    featureStore.on('featureIncrement', state => ({
        counter: state.counter + 1,  
    }));
    featureStore.on('featureDecrement', state => ({
        counter: state.counter - 1,  
    }));
    featureStore.on('featureSet', (state, count) => ({
        counter: count  
    }));

}
```
Or even use sub store of sub store:
```javascript
/**
 * @param {Store<{feature: {counter: number}}>} store 
 */
export function featureCounterModule(store) {
    const featureStore = createSubstore(store, 'feature'); 
    const featureCounterStore = createSubstore(featureStore, 'counter'); 
    featureCounterStore.on('@init', () => 0);
    featureCounterStore.on('featureIncrement', state => state + 1);
    featureCounterStore.on('featureDecrement', state => state - 1);
    featureCounterStore.on('featureDecrement', (state, count) => count);
}
```

Three important remarks:
* The state delivered to handler attached to sub store, can get the `undefined` 
value if the state of the feature is not yet set.

### Install
> npm i storeon-substore --save

### Usage
 
```javascript
import createStore from "storeon";
import { createSubstore } from "storeon-substore";

// create store 
const store = createStore([]);

// create sub store
const featureStore = createSubstore(store, 'feature');

// registering handler on substore
featureStore.on('toggleFeatureBooleanFlag', (state) => ({
    // please notice that sub state can be undefined
    flag: state ? !state.flag : true, 
}));

// which is equivalent to 
// store.on('toggleFeatureBooleanFlag', (state) => ({
//     feature: {
//         ...state.feature,
//        flag: state.feature ? !state.feature.flag : true, 
//    }   
// }));

// @changed event
featureStore.on('@changed', (state, diff) => {
    // here the state is a state of featureStore
    // and diff contains only properties which are changed on featureStore level 
});

// dispatching event on sub store works exactly in same way as on parent one 
featureStore.dispatch('toggleFeatureBooleanFlag');

// taking state
featureStore.get(); // returns { flag: true }

// which is equivalent to 
// featureStore.get().feature; // returns { flag: true }
```

### Scoped events
This library allows also to scope the events. By default, substore is operates on same set of events 
like parent store. But there is possibility to narrow scope of all dispatched events only to 
substore handlers. This can be useful for storeon modules reuse. Look at the example:

```typescript
import createStore from "storeon";
import { createSubstore } from "storeon-substore";
// lets create generic counter module
const counterModule = (store: StoreonStore<any>) => {
    store.on('inc', state => ({
        count: (state?.count || 0) + 1
    }));
    store.on('dec', state => ({
        count: (state?.count || 0) + 1
    }));
}
// create master store
const store = createStoreon<any>([]);

// create counterA substore
// please notice that we are using third argument
const counterAStore = createSubstore(store, 'counterA', true);
counterModule(counterAStore);

// create counterB substore
// please notice that we are using third argument
const counterBStore = createSubstore(store, 'counterB', true);
counterModule(counterBStore);

// now lets dispatch events first on counterAStore
counterAStore.dispatch('inc');
console.log(store.get()) // { counterA: { count: 1 } }

// then on counterBStore
counterBStore.dispatch('inc');
console.log(store.get()) // { counterA: { count: 1 }, counterB: { count: 1 } }
```

### Api
- `createSubstore` - is factory function which returns sub feature store. Params:
  - `parent` the parent store, can be a result of `createStore` or other sub store created by `createSubstore`
  - `key` the sub state property key in parent state 
  - `scopeEvents` (optional) boolean flag which will enable the events scoping, 
  so every event dispatched on the substore will be only scoped to this substore, 
  so only handlers attached to this substore will handle the event  
