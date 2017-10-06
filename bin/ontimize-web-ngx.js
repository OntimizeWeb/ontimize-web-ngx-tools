#! /usr/bin/env node
'use strict';
const shell = require("shelljs");
const yargs = require("yargs");

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

const searchReplaceRoutingFiles = require('./aot-routing');

yargs.command("production-aot", "building dist aot", function (yargs) {
  /**
   * 'clean'
   */
  shell.rm('-rf', ['./dist', './tmp-src']);

  /**
   * 'copy:tasks'
   */
  shell.cp('-R', './src/**', './tmp-src');

  shell.cp('./aot-config/main-aot.ts', './tmp-src');

  /**
  *  modify:routing
  */
  searchReplaceRoutingFiles().then(
    () => {
      /* 'aot:compile' */
      console.log('THEN');
      shell.exec('node_modules\\.bin\\ngc -p tsconfig.aot.json');

      /* 'aot:bundle'*/
      shell.exec('webpack --config aot-config/webpack-aot.config.js --bail');

      /* 'styles' */
      shell.exec('node_modules\\.bin\\node-sass src/styles-aot.scss dist/assets/css/app.css --output-style compressed');

      /* 'clean:aot' */
      shell.rm('-rf', ['./tmp-src']);
    },
    () => console.log("Task Errored!")
  );
})

var argv = yargs.usage("$0 command").demand(1, "must provide a valid command")
  .help("h")
  .alias("h", "help")
  .argv
