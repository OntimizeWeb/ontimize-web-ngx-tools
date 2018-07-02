#! /usr/bin/env node
'use strict';
const shell = require("shelljs");

function addLibrariesAssets() {
  addOntimizeIconSet();
  addOMapModuleAssets();
  addFlagIconsAssets();
}

function addOMapModuleAssets() {
  if (shell.test('-d', './node_modules/ontimize-web-ngx/assets/svg')) {
    shell.cp('-R',
      './node_modules/ontimize-web-ngx/assets/svg/**',
      './dist/assets/svg');
  }
}

function addOMapModuleAssets() {
  if (shell.test('-d', './node_modules/ontimize-web-ngx-map')) {
    shell.cp('-R',
      './node_modules/ontimize-web-ngx-map/images/**',
      './dist/assets/css/images');
    shell.cp('-R',
      './node_modules/ontimize-web-ngx-map/images/marker**',
      './dist/assets');
  }
}

function addFlagIconsAssets() {
  if (shell.test('-d', './node_modules/flag-icon-css')) {
    if (!shell.test('-d', './dist/assets/flags')) {
      shell.cp('-R', './node_modules/flag-icon-css/flags/**',
        './dist/assets/flags');
    }
    shell.cp('./node_modules/ontimize-web-ngx-tools/assets/flag-icon/es_gl.svg',
      './dist/assets/flags/1x1/es_gl.svg');
    shell.cp('./node_modules/ontimize-web-ngx-tools/assets/flag-icon/es_gl.svg',
      './dist/assets/flags/4x3/es_gl.svg');
  }
}

function getAssetsStyleFiles() {
  return getFlagIconsStyleFiles();
}

function getFlagIconsStyleFiles() {
  let result = [];
  if (shell.test('-d', './node_modules/flag-icon-css')) {
    result.push('./node_modules/ontimize-web-ngx-tools/assets/flag-icon/styles.scss');
  }
  return result;
}

module.exports = {
  addLibrariesAssets: addLibrariesAssets,
  getAssetsStyleFiles: getAssetsStyleFiles
};
