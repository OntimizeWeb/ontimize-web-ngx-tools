#! /usr/bin/env node
'use strict';
const shell = require("shelljs");
const yargs = require("yargs");
const searchReplaceRoutingFiles = require('./aot-routing');
const angularJSONParsing = require('./angular-json-parsing');
const { addLibrariesAssets } = require('./assets/assets');

yargs.command("production-aot", "building aot distribution version", function (yargs) {
  var args = yargs.argv;
  /**
   * 'clean'
   */
  shell.rm('-Rf', ['./dist', './tmp-src']);

  /**
   * 'copy:tasks'
   */
  shell.cp('-R', './src/**', './tmp-src');

  if (shell.test('-f', './aot-config/index_original.ejs')) {
    /* restoring index.ejs */
    shell.rm('-Rf', ['./aot-config/index.ejs']);
    shell.mv('./aot-config/index_original.ejs', './aot-config/index.ejs');
  }

  if (shell.test('-f', './aot-config/webpack-aot.config_original.js')) {
    /* restoring webpack-aot.config.ejs */
    shell.rm('-Rf', ['./aot-config/webpack-aot.config.js']);
    shell.mv('./aot-config/webpack-aot.config_original.js', './aot-config/webpack-aot.config.js');
  }

  /**
   * environments
   */
  if (shell.test('-d', './tmp-src/environments') && shell.test('-d', './src/environments')) {
    shell.rm('-Rf', ['./tmp-src/environments/**']);
    var environmentFile = (args && args.environment) ? args.environment : 'environment.prod';
    if (!environmentFile.endsWith('.ts')) {
      environmentFile += '.ts';
    }
    shell.cp('./src/environments/' + environmentFile, './tmp-src/environments/environment.ts');
  }

  if (shell.test('-f', './aot-config/main-aot.ts')) {
    shell.cp('./aot-config/main-aot.ts', './tmp-src');
  }

  shell.cp('./aot-config/vendor-aot.ts', './tmp-src');

  /* webpack-aot.config.js */
  shell.cp('./aot-config/webpack-aot.config.js', './aot-config/webpack-aot.config_original.js');

  angularJSONParsing(args.projectName);

  /* index.ejs */
  shell.cp('./aot-config/index.ejs', './aot-config/index_original.ejs');

  shell.ls('./aot-config/index.ejs').forEach(function (file) {
    var newBaseHref = './';
    if (args && args.href !== undefined) {
      newBaseHref = args.href;
    }
    shell.sed('-i', /<base href=\".*\">/, '<base href="' + newBaseHref + '">', file);
  });

  /**
  *  modify:routing
  */
  searchReplaceRoutingFiles().then(
    () => {
      /* 'aot:compile' */
      shell.exec('ngc -p tsconfig.aot.json');

      /* 'aot:bundle'*/
      shell.exec('webpack --config aot-config/webpack-aot.config.js --bail');

      /* 'styles' */
      shell.exec('node-sass --output-style compressed ./tmp-src/styles-aot.scss ./dist/assets/css/app.css ');

      addLibrariesAssets();

      /* 'clean:aot' */
      shell.rm('-Rf', ['./tmp-src']);

      /* restoring index.ejs */
      shell.rm('-Rf', ['./aot-config/index.ejs']);
      shell.mv('./aot-config/index_original.ejs', './aot-config/index.ejs');

      /* restoring webpack-aot.config.ejs */
      shell.rm('-Rf', ['./aot-config/webpack-aot.config.js']);
      shell.mv('./aot-config/webpack-aot.config_original.js', './aot-config/webpack-aot.config.js');
    },
    () => console.log("Task Errored!")
  );
})

var argv = yargs.usage("$0 command")
  .demand(1, "must provide a valid command")
  .option("href", {
    alias: "href",
    demand: false,
    describe: "index.html <base href=> value (default './')",
    type: "string"
  })
  .option("environment", {
    alias: "environment",
    demand: false,
    default: 'environment.prod.ts',
    describe: "environment file name (it must be stored in src/environments)",
    type: "string"
  })
  .option("project-name", {
    alias: "projectName",
    demand: true,
    default: '',
    describe: "angular.json project name",
    type: "string"
  })
  .help("h")
  .alias("h", "help")
  .argv
