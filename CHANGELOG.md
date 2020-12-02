# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).
## 1.4.0
* Update storeon@3.1.1

## 1.3.0
* Scoped events 

## 1.2.0
* Update storeon@3.0.4
* Better support for @changed event, handler now will be called only/always when the related sub state
will be changed 

## 1.1.0
* Update storeon@3.0.3
* Better types handling for optional state properties

## 1.0.0
* Reimplenting in typescript
* Update storeon@2.0.1

## 0.5.0
* Simplification.
#### Breaking Changes
* The state returned from events handler have to be full sub state. 
It will be not merged with previous but will be replacing old one. 

  Example :

  ```javascript
  import createStore from "storeon";
  const store = createStore([]);
  const featureStore = createSubstore(store, 'feature');
  featureStore.on('a', (state, data) => ({ a: data}));
  featureStore.on('b', (state, data) => ({ b: data }));
  featureStore.dispatch('a', 'a');
  featureStore.dispatch('b', 'b');
  
  // previously 
  console.log(store.get()); // {feature: {a: 'a', b: 'b'}}
  
  // now
  console.log(store.get()); // {feature: {b: 'b'}}
  ```  
  
  To have same behaviour as before the change always merge current state with new one:
  
  ```javascript
  import createStore from "storeon";
  const store = createStore([]);
  const featureStore = createSubstore(store, 'feature');
  featureStore.on('a', (state, data) => ({ ...state, a: data}));
  featureStore.on('b', (state, data) => ({ ...state, b: data }));
  featureStore.dispatch('a', 'a');
  featureStore.dispatch('b', 'b');
  
  console.log(store.get()); // {feature: {a: 'a', b: 'b'}}
  ```  
  
## 0.4.0
* Performance optimization.
## 0.3.0
* Fix for infinite loop on undefined return from handler.
## 0.2.0
* Added support to reduce primitive values.
## 0.1.0
* Initial release.
