#! /usr/bin/env node
'use strict';
const shell = require("shelljs");
const fs = require('fs');

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

function parseAngularCli() {
  fs.readFile('.angular-cli.json', 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    try {
      var appData = JSON.parse(data).apps[0];
      /*styles*/
      var stylesArray = [];
      if (appData && appData.styles && appData.styles.length) {
        writeStylesFile(appData.styles);
      }
      /*scripts*/
      var scriptsArray = [];
      if (appData && appData.scripts && appData.scripts.length) {
        for (var i = 0, len = appData.scripts.length; i < len; i++) {
          scriptsArray.push('tmp-src/' + appData.scripts[i]);
        }
      }
      if (scriptsArray.length) {
        var scriptsArrayString = JSON.stringify(scriptsArray);
        shell.ls('./aot-config/webpack-aot.config.js').forEach(function (file) {
          shell.sed('-i', /APP_SCRIPTS/, scriptsArrayString, file);
        });
      }
    } catch (e) {
      console.error(e);
    }
  });
}
/**
 * Expose `parseAngularCli`
 */
module.exports = parseAngularCli;
