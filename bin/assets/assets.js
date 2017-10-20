#! /usr/bin/env node
'use strict';
const shell = require("shelljs");

function addLibrariesAssets() {
  addOMapModuleAssets();
  addFlagIconsAssets();
}

function addOMapModuleAssets() {
  if (shell.test('-d', './node_modules/ontimize-web-ngx-map')) {
    shell.cp('-R',
      './node_modules/ontimize-web-ngx-map/assets/leaflet/**',
      './dist/assets/css/leaflet');

    shell.cp('-R',
      './node_modules/ontimize-web-ngx-map/assets/leaflet/images/marker*',
      './dist/assets');
  }
}


function addFlagIconsAssets() {
  if (shell.test('-d', './node_modules/flag-icon-css') && !shell.test('-d', './dist/assets/flags')) {
    shell.cp('-R',
      './node_modules/flag-icon-css/flags/**',
      './dist/assets/flags');
  }
}


module.exports = addLibrariesAssets;
