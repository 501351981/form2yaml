'use strict';

import { EOL } from 'os';
import {compose, serialize} from 'yaml-js';
import {load, dump} from 'js-yaml';
import {
  isArray,
  isString,
  isObject,
  isUndefined,
  isNull,
  isNumber,
  isEqual,
  repeat,
  each,
  includes,
  last
} from 'lodash';

import YAWNError from './error.js';
const NULL_TAG = 'tag:yaml.org,2002:null';
const STR_TAG = 'tag:yaml.org,2002:str';
const INT_TAG = 'tag:yaml.org,2002:int';
const FLOAT_TAG = 'tag:yaml.org,2002:float';
const MAP_TAG = 'tag:yaml.org,2002:map';
const SEQ_TAG = 'tag:yaml.org,2002:seq';

const SPACE = ' ';
const DASH = '-';

// export default class YAWN {
export default class YAWN {

  constructor(str) {
    if (!isString(str)) {
      throw new TypeError('str should be a string');
    }

    this.yaml = str;
  }

  get json() {
    return load(this.yaml);
  }

  set json(newJson) {
    if (isEqual(this.json, newJson)) {
      return;
    }

    const ast = compose(this.yaml);

    if (isUndefined(newJson)) {
      this.yaml = '';
      return;
    }

    // -------------------------------------------------------------------------
    // check if entire json is changed
    // -------------------------------------------------------------------------
    //看看json的类型和之前是否一致，是对象map，还是数字、字符串、数值等
    let newTag = getTag(newJson);
    if (ast.tag !== newTag) {
      let newYaml = cleanDump(newJson);

      if (!isObject(newJson)) {
        //头部注释  +  新yaml内容   + 尾部注释
        this.yaml = replacePrimitive(ast, newYaml, this.yaml, 0);

      } else {
        // 添加老yaml的缩进
        //头部注释  +  新yaml内容   + 尾部注释
        this.yaml = replaceNode(ast, newYaml, this.yaml, 0);
      }

      return;
    }
    // -------------------------------------------------------------------------
    // NULL_TAG, STR_TAG, INT_TAG, FLOAT_TAG
    // -------------------------------------------------------------------------
    if (includes([NULL_TAG, STR_TAG, INT_TAG, FLOAT_TAG], ast.tag)) {
      this.yaml = replacePrimitive(ast, newJson, this.yaml, 0);

      return;
    }

    // -------------------------------------------------------------------------
    // MAP_TAG
    // -------------------------------------------------------------------------
    if (ast.tag === MAP_TAG) {
      let json = this.json;

      this.yaml = updateMap(ast, newJson, json, this.yaml, 0);
    }
    // -------------------------------------------------------------------------
    // SEQ_TAG
    // -------------------------------------------------------------------------
    if (ast.tag === SEQ_TAG) {
      this.yaml = updateSeq(ast, newJson, this.yaml, 0);
    }

    // Trim trailing whitespaces
    this.yaml = this.yaml
      .split(EOL)
      .map(line=> line.replace(/[ \t]+$/, ''))
      .join(EOL);
  }

  toString() {
    return this.yaml;
  }

  toJSON() {
    return this.json;
  }

  getRemark(path) {
    const ast = compose(this.yaml);
    let pathlist = path.split('.');
    let node = getNode(ast, pathlist);
    return node && getNodeRemark(node, this.yaml);
  }

  setRemark(path, remark) {
    const ast = compose(this.yaml);
    let pathlist = path.split('.');
    let node = getNode(ast, pathlist);
    return !!node && !!(this.yaml = setNodeRemark(node, remark, this.yaml));
  }
}

/*
 * Determines the AST tag of a JSON object
 *
 * @param {any} - json
 * @returns {boolean}
 * @throws {YAWNError} - if json has weird type
*/
function getTag(json) {
  let tag = null;

  if (isArray(json)) {
    tag = SEQ_TAG;
  } else if (isObject(json)) {
    tag = MAP_TAG;
  } else if (isNull(json)) {
    tag = NULL_TAG;
  } else if (isNumber(json)) {
    if (json % 10 === 0) {
      tag = INT_TAG;
    } else {
      tag = FLOAT_TAG;
    }
  } else if (isString(json)) {
    tag = STR_TAG;
  } else {
    throw new YAWNError('Unknown type');
  }
  return tag;
}

/*
 * Update a sequence with new JSON
 *
 * @param {Node} ast
 * @param {object} newJson
 * @param {string} yaml
 *
 * @returns {string}
 *
*/
function updateSeq(ast, newJson, yaml, offset, keyNode) {
  let values = load(serialize(ast));
  let min = Math.min(values.length, newJson.length);
  for (let i = 0; i < min; i++) {
    let valNode = ast.value[i];
    let value = values[i];
    let newValue = newJson[i];
    if(newValue === value){
      continue;
    }

    //两个都是数组
    if(isArray(newValue) && isArray(value)){
      const newYaml = updateSeq(valNode, newValue, yaml, offset, valNode);
      offset = offset + newYaml.length - yaml.length;
      yaml = newYaml;
      continue;
    }

    //两个都是对象
    if(isObject(newValue) && !isArray(newValue) && isObject(value) && !isArray(value)){
      //都是对象
      const newYaml = updateMap(valNode, newValue, value, yaml, offset, valNode);
      offset = offset + newYaml.length - yaml.length;
      yaml = newYaml;
      continue;
    }

    const newYaml = changeArrayElement(valNode, newJson[i], yaml, offset,ast, ast.flow_style);
    offset = offset + newYaml.length - yaml.length;
    yaml = newYaml;
  }

  if (values.length > min) {
    for (let i = min; i < values.length; i++) {
      const newYaml = removeArrayElement(ast.value[i], yaml, offset);
      offset = offset + newYaml.length - yaml.length;
      yaml = newYaml;
    }
  } else if (newJson.length > min) {
    //移动到末尾

    let tailYaml = yaml.substring(getNodeEndMark(ast).pointer + offset);
    if(tailYaml && tailYaml.trimLeft().startsWith('#')){
      let arr = tailYaml.split(EOL);
      for(let i = 0; i < arr.length; i++){
        if(arr[i].trim() === ''){
          offset+=1;
        }else if(arr[i].trim().startsWith('#')){
          offset += arr[i].length;
        }else{
          break;
        }
      }

    }
    let insertValue;
    if(ast.flow_style){
      insertValue = dumpJson(newJson.slice(min));
      insertValue = insertValue.substring(1, insertValue.length-1);
    }else{
      insertValue = cleanDump(newJson.slice(min));
    }
    yaml = insertAfterNode(ast,insertValue , yaml, offset, keyNode, ast.flow_style);
  }

  return yaml;
}

/*
 * update a map structure with new values
 *
 * @param {AST} ast - a map AST
 * @param {any} newJson
 * @param {any} - json
 * @param {string} yaml
 * @returns {boolean}
 * @throws {YAWNError} - if json has weird type
*/
function updateMap(ast, newJson, json, yaml, offset, keyNode) {
  // look for changes
  each(ast.value, pair => {
    let [keyNode, valNode] = pair;

    if (isUndefined(newJson[keyNode.value])) {
      let newYaml = deleteObjectRow(keyNode, valNode, yaml, offset);
      offset = offset + newYaml.length - yaml.length;
      yaml = newYaml;
      return;
    }

    //新值不是undefined
    let value = json[keyNode.value]; //老json的值
    let newValue = newJson[keyNode.value]; //新json的值

    //如果老值是普通值
    //value为对象或者数组时，valNode.value都是数组
    //valNode.value非数组，则说明是value是普通值：数字、字符串、布尔值
    if (newValue !== value && !isArray(valNode.value)) {

      let newYaml;
      if(!isObject(newValue)){
        //老值：普通值； 新值： 普通值
        newYaml = replacePrimitive(valNode, newValue, yaml, offset, keyNode);
      }else if(isArray(newValue) && newValue.length === 0){
        //老值：普通值； 新值： 空数组
        newYaml = replaceNewEmptyArray(valNode, newValue, yaml, offset, keyNode);
      }else if(!isArray(newValue) && Object.keys(newValue).length === 0){
        //老值：普通值； 新值： 空对象
        newYaml = replaceNewEmptyObject(valNode, newValue, yaml, offset, keyNode);
      }else{
        newYaml = replaceOldPrimitiveNewObject(valNode, newValue, yaml, offset, keyNode);
      }

      offset = offset + newYaml.length - yaml.length;
      yaml = newYaml;
      delete newJson[keyNode.value];
      return;
    }

    // 老值是对象或者数组
    if (!isEqual(newValue, value) && isArray(valNode.value)) {
      let newYaml;
      if(!isObject(newValue) && !isArray(newValue)){
        //老值：对象/数组； 新值： 普通值
        newYaml = replaceOldObjectNewPrimitive(valNode, newValue, yaml, offset, keyNode);
      }else if(isArray(newValue) && !isArray(value) || !isArray(newValue) && isArray(value)){
        //新老值是对象或数组，但是格式不一样
        if(isArray(newValue) && newValue.length === 0){
           newYaml = replaceNewEmptyArray(valNode, newValue, yaml, offset, keyNode);
        }else if(typeof newValue === 'object' && Object.keys(newValue).length ===0){
          newYaml = replaceNewEmptyObject(valNode, newValue, yaml, offset, keyNode);
        }else{
          newYaml = replaceNonPrimitive(valNode, newValue, yaml, offset, keyNode);
        }
      }else if (isArray(newValue)) {
        if(valNode.value.length === 0){
          newYaml = replaceNonPrimitive(valNode, newValue, yaml, offset, keyNode);
        }else if(newValue.length === 0){
          newYaml = replaceNewEmptyArray(valNode, newValue, yaml, offset, keyNode);
        }else{
          newYaml = updateSeq(valNode, newValue, yaml, offset, keyNode);
        }
      } else {
        //newValue是对象
        if(valNode.value.length === 0){
          newYaml = replaceNonPrimitive(valNode, newValue, yaml, offset, keyNode);
        }else if(Object.keys(newValue).length === 0){
          newYaml = replaceNewEmptyObject(valNode, newValue, yaml, offset, keyNode);
        }else{
          newYaml = updateMap(valNode, newValue, value, yaml, offset, keyNode);
        }
      }
      offset = offset + newYaml.length - yaml.length;
      yaml = newYaml;
      delete newJson[keyNode.value];
      return;
    }
  });

  // look for new items to add
  each(newJson, (value, key)=> {

    if (isUndefined(json[key])) {

      let tailYaml = yaml.substring(getNodeEndMark(ast).pointer + offset);
      if(tailYaml){
        if(tailYaml.startsWith(']')){
          for(let i = 0; i < tailYaml.length; i++){
            offset++;
            if(tailYaml[i]===']'){
              break;
            }
          }
        }

        if(tailYaml.trimLeft().startsWith('#')){
          let arr = tailYaml.split(EOL);
          let count = 0;
          for(let i = 0; i < arr.length; i++){
            if(arr[i].trim() === ''){
              offset+=2;
              count++;
            }else if(arr[i].trim().startsWith('#')){
              offset += arr[i].length + 1;
              count++;
            }else{
              break;
            }
          }
          if(count >= 1){
            offset--;
          }
        }
      }

      let insertValue;
      if(ast.flow_style){
        insertValue = dumpJson({[key]: value});
        insertValue = insertValue.substring(1, insertValue.length-1);
      }else{
        insertValue = cleanDump({[key]: value});
      }

      const newYaml = insertAfterNode(ast, insertValue, yaml, offset, keyNode, ast.flow_style);
      offset = offset + newYaml.length - yaml.length;
      yaml = newYaml;
    }
  });

  return yaml;
}

function dumpJson(json){
  let str = '';
  if(isArray(json)){
    str += '[';
    str += json.map(item =>{
      if(isObject(item)){
         return dumpJson(item);
      }
      return item;
    }).join(', ');
    str += ']';
  }else if(isObject(json)){
    str = '{';
    str += Object.keys(json).map(key =>{
      if(isObject(json[key])){
        return `${key}: ${dumpJson(json[key])}`;
      }
      return `${key}: ${json[key]}`;
    }).join(', ');
    str += '}';
  }else{
    str += json;
  }
  return str;
}
/*
 * Place value in node range in yaml string
 *
 * @param node {Node} 原始ast
 * @param value {string} 新yaml
 * @param yaml {string}  老yaml
 *
 * @returns {string}
*/

function findNodeEndMarkPoint(node, yaml, offset){

  if([SEQ_TAG, MAP_TAG].includes(node.tag)){
    let value = node.value;
    if(value.length === 0){
      return node.end_mark.pointer + offset;
    }
    let lastValue = value[value.length-1];
    // if(node.tag === SEQ_TAG && isArray(lastValue.value)){
    //   return findNodeEndMarkPoint(lastValue, yaml, offset);
    // }else if(node.tag === MAP_TAG &&isArray(lastValue[1].value)){
    //   return findNodeEndMarkPoint(lastValue[1], yaml, offset);
    // }
    let point = node.tag === SEQ_TAG ? lastValue.end_mark.pointer : lastValue[1].end_mark.pointer;

    let tailYaml = yaml.substring(point+offset);
    if(tailYaml.startsWith('\n') || tailYaml.startsWith(EOL)){
      return point + offset;
    }else if(tailYaml.trimLeft().startsWith('#')){
      let componentLength = 0;
      while (!['\n', EOL].includes(tailYaml[componentLength])){
        componentLength++;
      }
      return point + offset + componentLength + 1;
    }
  }
  return node.end_mark.pointer + offset;
}

function deleteObjectRow(keyNode, valNode, yaml, offset){
  let newYaml = yaml.substr(0, keyNode.start_mark.pointer + offset);

  //如果后面没有任何内容，只剩一个空行，则删除这个空行
  let lineBreak = yaml[getNodeEndMark(valNode).pointer + offset] === '\n';
  if(lineBreak){
    newYaml = newYaml.trimRight() + '\n' + yaml.substring(getNodeEndMark(valNode).pointer + offset +1);
  }else{
    let commentLength = 0;
    let tailYaml = yaml.substring(getNodeEndMark(valNode).pointer + offset);
    if(tailYaml.trimLeft().startsWith('#')){
      while (!['\n', EOL].includes(tailYaml[commentLength])){
        commentLength++;
      }
      newYaml += yaml.substring(getNodeEndMark(valNode).pointer + offset + commentLength + 1);
    }else{
      newYaml += tailYaml;
    }
  }
  return newYaml;
}
// 新 空对象 老 非空对象
function replaceNewEmptyObject(node, value, yaml, offset, parentKeyNode){
  return yaml.substr(0, node.start_mark.pointer + offset).trimRight() + ' {}' + EOL +
      yaml.substring(findNodeEndMarkPoint(node, yaml, offset));
}

// 新 空数组 老 非空数组
function replaceNewEmptyArray(node, value, yaml, offset, parentKeyNode){
  let tailYaml= yaml.substring(findNodeEndMarkPoint(node, yaml, offset));
  if(tailYaml && !['\n',EOL].includes(tailYaml[0])){
    tailYaml = EOL + tailYaml;
  }
  return yaml.substr(0, node.start_mark.pointer + offset).trimRight() + ' []' +
      tailYaml;
}


// 新老都是非普通值
function replaceNonPrimitive(node, value, yaml, offset, parentKeyNode){
  let defaultIndent = new Array(parentKeyNode.start_mark.column + 2).fill(' ').join('');
  let newValueYaml = cleanDump(value).split(EOL).map(item => `${defaultIndent}${item}`).join(EOL);

  return yaml.substr(0, node.start_mark.pointer + offset).trimRight() + EOL +
      String(newValueYaml) +
      yaml.substring(findNodeEndMarkPoint(node, yaml, offset));
}

// 老 对象， 新普通值
function replaceOldObjectNewPrimitive(node, value, yaml, offset, parentKeyNode){
  return yaml.substr(0, node.start_mark.pointer + offset).trimRight() +' ' +
      formatString(value, parentKeyNode) +
      yaml.substring(findNodeEndMarkPoint(node, yaml, offset));
}

// 老 普通值， 新对象
function replaceOldPrimitiveNewObject(node, value, yaml, offset, parentKeyNode){
  let defaultIndent = new Array(parentKeyNode.start_mark.column + 2).fill(' ').join('');
  let newValueYaml = cleanDump(value).split(EOL).map(item => `${defaultIndent}${item}`).join(EOL);

  return yaml.substr(0, node.start_mark.pointer + offset) + EOL +
      String(newValueYaml) +
      yaml.substring(findNodeEndMarkPoint(node, yaml, offset));
}
function replacePrimitive(node, value, yaml, offset, parentKeyNode) {
  return yaml.substr(0, node.start_mark.pointer + offset) + formatString(value, parentKeyNode) +
      yaml.substring(findNodeEndMarkPoint(node, yaml, offset));
}

function formatString(value, parentKeyNode){
  if(typeof value === 'string' && value.includes('\n')){
    let defaultIndent = parentKeyNode ?
        new Array(parentKeyNode.start_mark.column + 2).fill(' ').join('') : 2;
     return '|-'+EOL + value.split('\n').map(item => `${defaultIndent}${item || ''}`).join(EOL);
  }
  return String(value);
}

/*
 * Place value in node range in yaml string
 *
 * @param node {Node}
 * @param value {string}
 * @param yaml {string}
 *
 * @returns {string}
*/
function replaceNode(node, value, yaml, offset) {
  //原始yaml的缩进几个，新的yaml前面就加几个
  let indentedValue = indent(value, node.start_mark.column);

  let lineStart = node.start_mark.pointer - node.start_mark.column + offset;

  return yaml.substr(0, lineStart) +
    indentedValue +
    yaml.substring(getNodeEndMark(node).pointer + offset);
}

/*
 * Place value after node range in yaml string
 *
 * @param node {Node}
 * @param value {string}
 * @param yaml {string}
 *
 * @returns {string}
*/
function insertAfterNode(node, value, yaml, offset, keyNode, flowStyle) {
  if(flowStyle){
    return yaml.substr(0, getNodeEndMark(node).pointer + offset) + ', ' +
        value +
        yaml.substring(getNodeEndMark(node).pointer + offset);
  }else{
    let indentedValue = indent(value, node.start_mark.column);

    return yaml.substr(0, getNodeEndMark(node).pointer + offset) +
        EOL +
        indentedValue +
        yaml.substring(getNodeEndMark(node).pointer + offset);
  }

}

/*
 * Removes a node from array
 *
 * @param {Node} node
 * @param {string} yaml
 *
 * @returns {string}
*/
function removeArrayElement(node, yaml, offset) {
  let index = node.start_mark.pointer - node.start_mark.column - 1 + offset;

  return yaml.substr(0, index) +
      yaml.substring(getNodeEndMark(node).pointer + offset);
}

/*
 * Changes a node from array
 *
 * @param {Node} node
 * @param value {string}
 * @param {string} yaml
 *
 * @returns {string}
*/
function changeArrayElement(node, value, yaml, offset, parentNode, flowStyle) {
  if(flowStyle){
    return yaml.substr(0, node.start_mark.pointer + offset) +
        String(value) +
        yaml.substring(getNodeEndMark(node).pointer + offset);
  }else{
    let indentedValue;
    if(typeof value === 'string' && value.includes('\n')){
      indentedValue = new Array(node.start_mark.column).fill(' ').map(item => ' ').join('')
          + formatString(value, parentNode) + EOL;
    }else{
      value = cleanDump(value);
      indentedValue = indent(value, node.start_mark.column);
    }

    let index = node.start_mark.pointer + offset;
    while (index > 0 && yaml[index] !== DASH) {
      index--;
    }

    return yaml.substr(0, index + 2) +
        indentedValue.substr(node.start_mark.column) +
        yaml.substring(getNodeEndMark(node).pointer + offset);
  }

}

/*
 * Gets end mark of an AST
 *
 * @param {Node} ast
 *
 * @returns {Mark}
*/
function getNodeEndMark(ast) {
  if (isArray(ast.value) && ast.value.length) {
    let lastItem = last(ast.value);

    if (isArray(lastItem) && lastItem.length) {
      return getNodeEndMark(last(lastItem));
    }

    return getNodeEndMark(lastItem);
  }

  return ast.end_mark;
}

/*
 * Indents a string with number of characters
 *
 * @param {string} str
 * @param {integer} depth - can be negative also
 *
 * @returns {string}
*/

//给一个字符串str的每一行添加depth个空格前缀
function indent(str, depth) {
  return str
    .split(EOL)
    // .filter(line => line)
    .map(line => repeat(SPACE, depth) + line)
    .join(EOL);
}

/*
 * Dump a value to YAML sting without the trailing new line
 *
 * @param {any} value
 *
 * @returns {string}
 *
*/
function cleanDump(value, options={}) {
  let yaml = dump(value, options).replace(/\n$/, '');

  if (EOL !== '\n') {
    yaml = yaml.replace(/\n/g, EOL);
  }

  return yaml;
}

/*
 * Gets remark of an AST
 *
 * @param {Node} ast
 * @param {string} yaml
 *
 * @returns {string}
*/
function getNodeRemark(ast, yaml) {
  let index = getNodeEndMark(ast).pointer;
  while (index < yaml.length && yaml[index] !== '#' && yaml[index] !== EOL) {
    ++index;
  }

  if (EOL === yaml[index] || index === yaml.length) {
    return '';
  } else {
    while (index < yaml.length && (yaml[index] === '#' || yaml[index] === ' ')) {
      ++index;
    }
    let end = index;
    while (end < yaml.length && yaml[end] !== EOL) {
      ++end;
    }
    return yaml.substring(index, end);
  }
}

/*
 * Sets remark of an AST
 *
 * @param {Node} ast
 * @param {string} remark
 * @param {string} yaml
 *
 * @returns {boolean}
*/
function setNodeRemark(ast, remark, yaml) {
  let index = getNodeEndMark(ast).pointer;
  while (index < yaml.length && yaml[index] !== '#' && yaml[index] !== EOL) {
    ++index;
  }

  if (EOL === yaml[index] || index === yaml.length) {
    return yaml.substr(0, index) + ' # ' + remark +
        yaml.substring(index);
  } else {
    while (index < yaml.length && (yaml[index] === '#' || yaml[index] === ' ')) {
      ++index;
    }
    let end = index;
    while (end < yaml.length && yaml[end] !== EOL) {
      ++end;
    }
    return yaml.substr(0, index) + remark +
        yaml.substring(end);
  }
}

/*
 * Gets node of an AST which path
 *
 * @param {Node} ast
 * @param {array} path
 *
 * @returns {Node}
*/
function getNode(ast, path) {
  if (path.length) {
    if (ast.tag === MAP_TAG) {
      let value = ast.value;
      for (let i = 0; i < value.length; ++i) {
        let [keyNode, valNode] = value[i];
        if (path[0] === keyNode.value) {
          return getNode(valNode, path.slice(1));
        }
      }
      return undefined;
    } else if (ast.tag === SEQ_TAG) {
      return ast.value[path[0]] && getNode(ast.value[path[0]], path.slice(1));
    }
  }
  return ast;
}
