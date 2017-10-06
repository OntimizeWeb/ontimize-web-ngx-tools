#! /usr/bin/env node
'use strict';

const shell = require("shelljs");
const yargs = require("yargs");
const glob = require("glob");
const fs = require('fs');

function searchReplaceRoutingFiles() {
  return new Promise((resolve, reject) => {
    var promisesArr = [];
    new Promise((resolveglob, rejectglob) => {
      glob('./tmp-src/**/*-routing.module.ts', function (er, files) {
        for (var i = 0, len = files.length; i < len; i++) {
          promisesArr.push(searchReplaceRoutingFile(files[i]));
        }
        resolveglob();
      });
    }).then(values => {
      Promise.all(promisesArr).then(values => {
        resolve(true);
      }, reason => {
        reject(false);
      });
    }, reason => {
      reject(false);
    });
  });
}

function searchReplaceRoutingFile(filename) {
  return new Promise((resolve, reject) => {
    var file = fs.createReadStream(filename, 'utf8');
    var newContent = '';

    file.on('data', function (chunk) {
      newContent += processFile(chunk.toString());
    });

    file.on('end', function () {
      fs.writeFile(filename, newContent, function (err) {
        if (err) {
          console.log(err);
          reject();
        } else {
          resolve();
        }
      });
    });
  });
}

function processFile(content) {
  var indexes = getLoadChildrenIndexes(content);
  if (indexes.length) {
    var ordered = indexes.sort(compareByProp('loadChildPos'));
    content = replaceLoadChildren(content, ordered);
    content = deleteDefsAndImports(content, ordered);
  }
  return content;
}

function replaceLoadChildren(content, array) {
  for (var i = array.length - 1; i >= 0; i--) {
    var curr = array[i];
    var newStr = '\'' + curr.modulePath + '#' + curr.moduleName + '\'';
    var endIdx = content.substring(curr.loadChildPos, content.length).indexOf(curr.moduleFn);
    endIdx = (endIdx + curr.moduleFn.length) + curr.loadChildPos;
    content = content.substring(0, curr.loadChildPos)
      + newStr
      + content.substring(endIdx, content.length);
  }
  return content;
}

function deleteDefsAndImports(content, array) {
  for (var i = 0, len = array.length; i < len; i++) {
    var curr = array[i];
    content = content.replace(curr.importDef, '').replace(curr.moduleFnDef, '');
  }
  return content;
}

function getLoadChildrenIndexes(content) {
  var startIndex = 0, index, indexes = [];
  var loadChildrenStr = 'loadChildren:';
  var returnStr = 'return ';
  var fromStr = 'from ';
  while ((index = content.indexOf(loadChildrenStr, startIndex)) > -1) {
    var moduleFnCallPos = index + loadChildrenStr.length;
    var moduleFn, moduleFnDef, moduleName, modulePath;
    var fnDefStartIdx, fnDefEndIdx, importStartIdx, importEndIdx, importDef;

    var nextSpaceIdx = content.indexOf(' ', moduleFnCallPos + 1);
    var nextCommaIdx = content.indexOf(',', moduleFnCallPos + 1);
    var endFnNameIdx = Math.min(nextSpaceIdx, nextCommaIdx);

    moduleFn = content.substring(moduleFnCallPos, endFnNameIdx).trim();
    if (moduleFn && moduleFn.length) {
      fnDefStartIdx = content.indexOf(moduleFn);
      if (fnDefStartIdx !== -1) {
        fnDefStartIdx = content.substring(0, fnDefStartIdx).lastIndexOf('export');
        fnDefEndIdx = content.indexOf('}', fnDefStartIdx) + 1;

        moduleFnDef = content.substring(fnDefStartIdx, fnDefEndIdx)

        var moduleNameStartIdx = content.indexOf(returnStr, fnDefStartIdx) + returnStr.length;
        moduleName = content.substring(moduleNameStartIdx, content.indexOf(';', fnDefStartIdx));

        var importModuleIdx = content.substring(0, moduleNameStartIdx).indexOf(moduleName);
        if (importModuleIdx !== -1) {
          importStartIdx = content.substring(0, importModuleIdx).lastIndexOf('import');
          importEndIdx = content.indexOf(';', importStartIdx) + 1;
          importDef = content.substring(importStartIdx, importEndIdx);
          modulePath = content.substring(content.indexOf(fromStr, importStartIdx) + fromStr.length + 1, importEndIdx - 2);
        }
      }
    }

    indexes.push({
      loadChildPos: moduleFnCallPos,
      moduleFnDef: moduleFnDef,
      moduleFn: moduleFn,
      moduleName: moduleName,
      modulePath: modulePath,
      importDef: importDef
    });
    startIndex = moduleFnCallPos;
  }
  return indexes;
}

function compareByProp(property) {
  return function compare(a, b) {
    if (a[property] < b[property])
      return -1;
    if (a[property] > b[property])
      return 1;
    return 0;
  }
}

/**
 * Expose `searchReplaceRoutingFiles`
 */
module.exports = searchReplaceRoutingFiles;
