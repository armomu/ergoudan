import { observable } from 'mobx';

const counterStore = observable({
    status: 1,
    setStoreKeyStatus(key, val) {
        this[key] = val;
    }
});
export default counterStore;
