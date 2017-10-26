#! /usr/bin/env node
'use strict';
const shell = require("shelljs");
const yargs = require("yargs");
const searchReplaceRoutingFiles = require('./aot-routing');
const parseAngularCli = require('./angular-cli-parsing');
const { addLibrariesAssets } = require('./assets/assets');

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

yargs.command("production-aot", "building aot distribution version", function (yargs) {
  var args = yargs.argv;
  /**
   * 'clean'
   */
  shell.rm('-rf', ['./dist', './tmp-src']);

  /**
   * 'copy:tasks'
   */
  shell.cp('-R', './src/**', './tmp-src');

  if (shell.test('-f', './aot-config/index_original.ejs')) {
    /* restoring index.ejs */
    shell.rm('-rf', ['./aot-config/index.ejs']);
    shell.mv('./aot-config/index_original.ejs', './aot-config/index.ejs');
  }

  if (shell.test('-f', './aot-config/webpack-aot.config_original.js')) {
    /* restoring webpack-aot.config.ejs */
    shell.rm('-rf', ['./aot-config/webpack-aot.config.js']);
    shell.mv('./aot-config/webpack-aot.config_original.js', './aot-config/webpack-aot.config.js');
  }

  /**
   * environments
   */
  if (shell.test('-d', './tmp-src/environments')) {
    shell.rm('-rf', ['./tmp-src/environments/environment.ts']);
    shell.mv('./tmp-src/environments/environment.prod.ts', './tmp-src/environments/environment.ts');
  }

  shell.cp('./aot-config/main-aot.ts', './tmp-src');

  shell.cp('./aot-config/vendor-aot.ts', './tmp-src');

  /* webpack-aot.config.js */
  shell.cp('./aot-config/webpack-aot.config.js', './aot-config/webpack-aot.config_original.js');

  parseAngularCli();

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
      shell.rm('-rf', ['./tmp-src']);

      /* restoring index.ejs */
      shell.rm('-rf', ['./aot-config/index.ejs']);
      shell.mv('./aot-config/index_original.ejs', './aot-config/index.ejs');

      /* restoring webpack-aot.config.ejs */
      shell.rm('-rf', ['./aot-config/webpack-aot.config.js']);
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
  .help("h")
  .alias("h", "help")
  .argv
