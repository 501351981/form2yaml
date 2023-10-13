import {get} from 'lodash';
export function isObject(data){
    if(Array.isArray(data) || data === null){
        return false;
    }

    return typeof data === 'object';
}

export function deepDeleteKey(json, key){
    if(!key.includes('.')){
        delete json[key];
        return;
    }

    let keyArr = key.split('.');
    let deleteKey = keyArr.pop();
    let parentKey = keyArr.join('.');
    let data = get(json, parentKey);
    if(isObject(data)){
        delete data[deleteKey];
    }
}