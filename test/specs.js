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

    it (`should allow to properly read and set the state in handler on child store`, async () => {
        subStore.on('a', (state) => ({
            flag: state ? !state.flag : true,
        }));
        subStore.dispatch('a');
        expect(subStore.get()).to.be.eql({ flag: true});
    });

    it (`should allow to properly read and set the state in handler on child of child store`, async () => {
        const subSubStore = createSubstore(subStore, 'feature');
        subSubStore.on('a', (state) => ({
            flag: state ? !state.flag : true,
        }));
        subSubStore.dispatch('a');
        expect(subSubStore.get()).to.be.eql({ flag: true});
    })

});
