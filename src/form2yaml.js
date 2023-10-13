import {get, set, has, cloneDeep} from 'lodash'
import jsYaml from "js-yaml";
import Schema from 'async-validator';
import YAWN from './yawn/index.js'
import {isObject, deepDeleteKey} from "./utils.js";
/*
options:
  keyMap:{
      formKey1: yamlKey1
      formKey2: yamlKey2
  }
  rules: {
      formKey1: [
          {required: true, message: 'test'}
      ]
  }
  emptyMode: {
      formKey1: 'delete'
  },
  mergeJsonOfYaml: true,
  ignoreExtra: false
 */
let defaultOptions = {
    mergeJsonOfYaml: true,
    ignoreExtra: false,
}

function Form2Yaml(defaultYaml,options={}){
    this.yaml = defaultYaml;
    this.options = {
        ...defaultOptions,
        ...options
    };
}
Form2Yaml.prototype.getYaml = function (){
    return this.yaml;
}

Form2Yaml.prototype.setYaml = function (yaml){
    this.yaml = yaml;
    return this;
}

Form2Yaml.prototype.getJson = function (type='keyMap'){
    const jsonData = jsYaml.load(this.yaml);
    let keyMap = this.options.keyMap;
    if(type === 'keyMap' && keyMap && Object.keys(keyMap).length){
        let result = Array.isArray(jsonData) ? [] : {}
        Object.keys(keyMap).forEach(formKey => {
            let yamlKey =  keyMap[formKey];
            set(result, formKey, get(jsonData, yamlKey));
        })
        return  result;
    }else{
        if(keyMap && Object.keys(keyMap).length){
            Object.keys(keyMap).forEach(formKey => {
                let yamlKey =  keyMap[formKey];
                if(has(jsonData, yamlKey)){
                    set(jsonData, formKey, get(jsonData, yamlKey))
                    deepDeleteKey(jsonData, yamlKey)
                }

            })
        }
        return jsonData;
    }
}

Form2Yaml.prototype.setJson = function (json){
    let yawn = new YAWN(this.yaml);
    let cloneJson = cloneDeep(json);
    let keyMap = this.options.keyMap;
    if(keyMap && Object.keys(keyMap).length){
        Object.keys(keyMap).forEach(formKey => {
            if(has(cloneJson, formKey)){
                let formData = get(cloneJson, formKey);
                deepDeleteKey(cloneJson, formKey)
                set(cloneJson,  keyMap[formKey], formData)
            }
        })

    }

    if(this.options.mergeJsonOfYaml){
        this.syncMissingDataToSource(cloneJson, yawn.json);
    }
    if(this.options.ignoreExtra){
        this.ignoreExtraJsonKey(cloneJson, yawn.json)
    }

    if(this.options.emptyMode){
        this.formatByEmptyMode(cloneJson)
    }

    yawn.json = cloneJson;

    this.yaml = yawn.yaml;
    return this;
}

Form2Yaml.prototype.formatByEmptyMode = function (sourceData){
    let emptyMode = this.options.emptyMode;
    let keyMap = this.options.keyMap;
    if(emptyMode && isObject(emptyMode)){
        Object.keys(emptyMode).forEach(formKey=>{
            let key = get(keyMap, formKey) || formKey;
            if(emptyMode[formKey] === 'retain' && (!has(sourceData, key) || get(sourceData, key) === undefined)){
                set(sourceData, key, '')
            }
        })
    }
}
Form2Yaml.prototype.ignoreExtraJsonKey = function (sourceData, yamlJsonData){
    if(isObject(sourceData)){
        Object.keys(sourceData).forEach(sourceKey =>{
            if(!has(yamlJsonData, sourceKey)){
                delete sourceData[sourceKey]
            } else if(isObject(sourceData[sourceKey]) && isObject(yamlJsonData[sourceKey])){
                this.ignoreExtraJsonKey(sourceData[sourceKey], yamlJsonData[sourceKey])
            }
        })
    }
}
Form2Yaml.prototype.syncMissingDataToSource = function (sourceData, yamlJsonData, parentKey){
    let nonMergeableKeys = this.options.nonMergeableKeys || [];
    if(isObject(yamlJsonData)){
        Object.keys(yamlJsonData).forEach(key => {
            let fullKey = parentKey ? `${parentKey}.${key}` : key;
            if(nonMergeableKeys.includes(fullKey)){
                return
            }
            if(!has(sourceData, key)){
                set(sourceData, key, yamlJsonData[key])
            }else if(isObject(sourceData[key]) && isObject(yamlJsonData[key])){
                this.syncMissingDataToSource(sourceData[key], yamlJsonData[key], fullKey)
            }
        })
    }
}
Form2Yaml.prototype.validate = function (){
    return new Promise(((resolve, reject) => {
        if(!this.options.rules || !Object.keys(this.options.rules).length){
            resolve();
            return
        }
        const validator = new Schema(this.options.rules);
        let jsonData = this.getJson();

        let checkData = {};
        Object.keys(this.options.rules).forEach(formKey => {
            checkData[formKey] = get(jsonData,formKey);
        })
        validator.validate(checkData, (errors, fields) => {
            if(!errors){
                resolve();
            }else{
                reject(errors, fields);
            }
        })
    }))
}
export default Form2Yaml;