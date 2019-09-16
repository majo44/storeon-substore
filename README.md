# storeon-substore

[![npm version](https://badge.fury.io/js/storeon-substore.svg)](https://badge.fury.io/js/storeon-substore)
[![Build Status](https://travis-ci.org/majo44/storeon-substore.svg?branch=master)](https://travis-ci.org/majo44/storeon-substore)
[![Coverage Status](https://coveralls.io/repos/github/majo44/storeon-substore/badge.svg?branch=master)](https://coveralls.io/github/majo44/storeon-substore?branch=master)

<img src="https://storeon.github.io/storeon/logo.svg" align="right"
     alt="Storeon logo by Anton Lovchikov" width="160" height="142">
     
Utility for creating feature sub store for [Storeon](https://github.com/storeon/storeon).    

It size is 121 B (minified and gzipped) and uses [Size Limit](https://github.com/ai/size-limit) to control size.

### Overview
The key goal of this library is provide the easy way to create child feature store, 
which allows to work on sub state within the storeon events handler and returns 
sub state on `get` call. Important notice. Sub store operates on same events like parent store,
what means that dispatched event on sub store will be also propagated to parent, 
and event dispatched on parent will be also handled by handlers registered on sub store
for that event.   

### Install
> npm i storeon-substore --save

### Usage
 
```javascript
import createStore from "storeon";
import { substore } from "storeon-substore";

// create store 
const store = createStore([(store) => {
    store('@init', () => ({
        feature: {
            flag: true,
        },
    }));    
}]);

// create sub store
const featureStore = createSubstore(store, 'feature');

// registering handler on substore
featureStore.on('toggleFeatureBooleanFlag', (state) => ({
    flag: state ? !state.flag : true, 
}));

// which is equivalent to 
// store.on('toggleFeatureBooleanFlag', (state) => ({
//     feature: {
//         ...state.feature,
//        flag: !state.feature.flag, 
//    }   
// }));

// dispatching event on sub store works exactly in same way as on parent one 
featureStore.dispatch('toggleFeatureBooleanFlag');

// taking state
featureStore.get(); // returns { flag: false }

// which is equivalent to 
// featureStore.get().feature; // returns { flag: false }

```

### Api
- `createSubstore` - is factory function which returns sub store. Params:
  - `parent` the parent store, can be a result of `createStore` or other sub store created by `createSubstore`
  - `key` the sub state property key in parent state 
