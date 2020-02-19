import * as createStore from 'storeon';
import { createSubstore } from '../index.js';

describe(`simple scenarions`, () => {

    let store;
    let subStore;

    beforeEach(() => {
        store = createStore([]);
        subStore = createSubstore(store, 'feature');
    });

    it(`event dispatched on child should be propagate to parent`, async () => {
        const spy = sinon.spy();
        store.on('a', spy);
        subStore.dispatch('a');
        expect(spy).to.be.calledOnce;
    });

    it(`event dispatched on parent should be propagate to child`, async () => {
        const spy = sinon.spy();
        subStore.on('a', spy);
        store.dispatch('a');
        expect(spy).to.be.calledOnce;
    });

    it(`get on child should return undefined when there is no state of feature`, async () => {
        expect(subStore.get()).to.be.undefined;
    });

    it(`get on child should return undefined when there is no state of feature of feature`, async () => {
        const subSubStore = createSubstore(subStore, 'feature');
        expect(subSubStore.get()).to.be.undefined;
    });

    it(`get on child should return proper state when there is state of feature of feature`, async () => {
        store.on('a', () => ({
            feature: {
                feature: 'proper state'
            }
        }));
        const subSubStore = createSubstore(subStore, 'feature');
        store.dispatch('a');
        expect(subSubStore.get()).to.be.eq('proper state');
    });


    it(`should allows to dispatch async events`, async () => {
        const spy = sinon.spy();
        let continu;
        const semaphore = new Promise(res => continu = res);
        subStore.on('a', async () => {
            spy();
            continu();
        });
        store.dispatch('a');
        await semaphore;
        expect(spy).to.be.calledOnce;
    });

    it (`should allow to properly read and set the state from handler`, async () => {
        store.on('a', () => ({
            feature: {
                flag: true
            }
        }));
        store.dispatch('a');
        subStore.on('b', (state) => ({
            flag: !state.flag
        }));
        subStore.dispatch('b');
        expect(subStore.get()).to.be.eql({ flag: false});
    });

    it(`should allow to properly read and set the state in handler on child store`, async () => {
        subStore.on('a', (state) => ({
            flag: state ? !state.flag : true,
        }));
        subStore.dispatch('a');
        expect(subStore.get()).to.be.eql({ flag: true});
    });

    it(`should allow to properly read and set the state in handler on child of child store`, async () => {
        const subSubStore = createSubstore(subStore, 'feature');
        subSubStore.on('a', (state) => ({
            flag: state ? !state.flag : true,
        }));
        subSubStore.dispatch('a');
        expect(subSubStore.get()).to.be.eql({ flag: true});
    });

    it('should behave in same way as regular store', () => {
        function feature1CounterModule(store) {
            store.on('@init', () => ({
                feature: {
                    counter: 0
                }
            }));
            store.on('increment', state => ({
                feature: {
                    ...state.feature,
                    counter: state.feature.counter + 1,
                }
            }));
        }
        function feature2CounterModule(store) {
            const featureStore = createSubstore(store, 'feature');
            featureStore.on('@init', () => ({
                counter: 0
            }));
            featureStore.on('increment', state => ({
                counter: state.counter + 1,
            }));
        }
        function feature3CounterModule(store) {
            const featureStore = createSubstore(store, 'feature');
            const featureCounterStore = createSubstore(featureStore, 'counter');
            featureCounterStore.on('@init', () => 0);
            featureCounterStore.on('increment', state => state + 1);
        }
        const store1 = createStore([feature1CounterModule]);
        const store2 = createStore([feature2CounterModule]);
        const store3 = createStore([feature3CounterModule]);
        store1.dispatch('increment');
        store2.dispatch('increment');
        store3.dispatch('increment');
        expect(store1.get().feature.counter).to.be.eql(store2.get().feature.counter);
        expect(store2.get().feature.counter).to.be.eql(store3.get().feature.counter);
    });

    it ('should return same state as previous if value in sub state not changed on primitives', () => {
        subStore.on('set', (s, data) => data);
        subStore.dispatch('set', 1);
        let st1 = store.get();
        subStore.dispatch('set', 2);
        let st2 = store.get();
        subStore.dispatch('set', 2);
        let st3 = store.get();
        expect(st1).to.not.be.eq(st2);
        expect(st2).to.be.eq(st3);
    });

    // As storeon is not checking that as well, we will not do that on the substore level
    // so each time when handler is returning data, we will update the state even the data is same
    // it ('should return same state as previous if value in sub state not changed on complex object', () => {
    //     const featureStore = createSubstore(subStore, 'sub');
    //     featureStore.on('set', (s, data) => data);
    //     const val1 = { x : "1"};
    //     const val2 = { x : "2"};
    //     store.dispatch('set', val1);
    //     let st1 = store.get();
    //     store.dispatch('set', val2);
    //     let st2 = store.get();
    //     store.dispatch('set', val2);
    //     let st3 = store.get();
    //     expect(st1).to.not.be.eq(st2);
    //     expect(st2).to.be.eq(st3);
    // });

    it ('should support multi branch store', () => {
        const feature1Store = createSubstore(store, 'feature1');
        const feature2Store = createSubstore(store, 'feature2');
        feature2Store.on('feat2', (s, data) => data);
        const subStore1 = createSubstore(feature1Store, 'sub1');
        subStore1.on('set1', (s, data) => data);
        const subStore2 = createSubstore(feature1Store, 'sub2');
        subStore2.on('set2', (s, data) => data);
        const val1 = { x : "1"};
        const val2 = { x : "2"};
        const val3 = { x : "3"};
        subStore1.dispatch('set1', val1);
        subStore2.dispatch('set2', val2);
        feature2Store.dispatch('feat2', val3);
        expect(store.get().feature1.sub1).to.be.eql(val1);
        expect(store.get().feature1.sub2).to.be.eql(val2);
        expect(store.get().feature2).to.be.eql(val3);
    });

    it ('should properly call the @changed event handler', () => {
        const spy = sinon.spy(/*() => console.log(arguments)*/);
        const newData = {feature: { test: 1 }};
        const newFeatureData = { test2: 1 };

        store.on('set', (s, data) => data);
        subStore.on('setFeature', (s, data) => data);
        subStore.on('@changed', spy);

        store.dispatch('set', {a : 1});
        expect(spy).to.be.not.called;

        store.dispatch('set', newData);
        expect(spy).to.be.calledOnce;
        expect(spy).to.be.calledWith(subStore.get(), newData.feature);

        subStore.dispatch('setFeature', newFeatureData);
        expect(spy).to.be.calledTwice;
        expect(spy).to.be.calledWith(subStore.get(), newFeatureData);

    })

});
