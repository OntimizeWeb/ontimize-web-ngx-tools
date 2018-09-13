#! /usr/bin/env node
'use strict';
const shell = require("shelljs");
const fs = require('fs');
const { getAssetsStyleFiles } = require('./assets/assets');
const AVOID_ASSETS = [];

function writeStylesFile(stylesArray) {
  return new Promise((resolve, reject) => {
    var content = '';
    for (var i = 0, len = stylesArray.length; i < len; i++) {
      content += '@import \"' + stylesArray[i] + '\";';
    }

    var filename = './tmp-src/styles-aot.scss';
    fs.writeFile(filename, content, function (err) {
      if (err) {
        console.log(err);
        reject();
      } else {
        resolve();
      }
    });
  });
}

function parseAngularCli(projectName) {
  fs.readFile('angular.json', 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    try {
      var projectsData = JSON.parse(data).projects;

      var appData = projectsData[projectName].architect.build.options;
      /*styles*/
      var stylesArray = [];

      var assetsCssFiles = getAssetsStyleFiles();
      for (var i = 0, len = assetsCssFiles.length; i < len; i++) {
        stylesArray.push(assetsCssFiles[i]);
      }
      if (appData && appData.styles && appData.styles.length) {
        for (var i = 0, len = appData.styles.length; i < len; i++) {
          stylesArray.push(appData.styles[i]);
        }
      }
      writeStylesFile(stylesArray);
      /*scripts*/
      var scriptsArray = [];
      if (appData && appData.scripts && appData.scripts.length) {
        for (var i = 0, len = appData.scripts.length; i < len; i++) {
          scriptsArray.push('tmp-src/' + appData.scripts[i]);
        }
      }
      var scriptsArrayString = scriptsArray.length > 0 ? JSON.stringify(scriptsArray) : '';
      shell.ls('./aot-config/webpack-aot.config.js').forEach(function (file) {
        shell.sed('-i', /APP_SCRIPTS/, scriptsArrayString, file);
      });

      /*assets*/

      // if (appData && appData.assets && appData.assets.length) {
      //   for (var i = 0, len = appData.assets.length; i < len; i++) {
      //     if (AVOID_ASSETS.indexOf(appData.assets[i]) === -1) {

      //     }

      //   }
      // }

    } catch (e) {
      console.error(e);
    }
  });
}
/**
 * Expose `parseAngularCli`
 */
module.exports = parseAngularCli;
