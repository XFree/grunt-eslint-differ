'use strict';

module.exports = (grunt) => {
  const tcArtFetcher = require('../lib/teamcity'),
        differ = require('../lib/differ'),
        path = require('path');

  grunt.registerMultiTask('eslint', 'Validate files with ESLint', function () {
    const {CLIEngine} = require('eslint'),
          opts = this.options({
            outputFile: false,
            diff: false
          }),
          files = this.filesSrc.filter((filePath) => {
            return !filePath.includes('node_modules');
          }),
          formatterName = opts.format,
          outputFile = opts.outputFile,
          outputFilePathObj = path.parse(outputFile),
          formatter = CLIEngine.getFormatter(formatterName),
          done = this.async();

    let report;

    if (!formatter) {
      grunt.warn(`Could not find formatter ${formatterName}`);
    }

    try {
      report = new CLIEngine(opts).executeOnFiles(files);
    } catch (err) {
      grunt.warn(err);
      return false;
    }

    Promise.all([new Promise((resolve) => {
      if (opts.diff) {

        tcArtFetcher(opts.diff.teamcity)
          .then((result) => {
            return differ(report.results, result);
          }, (err) => {
            return report.results;
          })
          .then((resultDiff) => {
            grunt.file.write(path.join(outputFilePathObj.dir, outputFilePathObj.name + '.json'), CLIEngine.getFormatter('json')(resultDiff));
            grunt.file.write(path.join(outputFilePathObj.dir, outputFilePathObj.name + '-diff' + outputFilePathObj.ext), formatter(resultDiff));
            resolve();
          });
      } else {
        resolve();
      }
    }), new Promise((resolve) => {
      const results = formatter(report.results);

      if (outputFile) {
        grunt.file.write(outputFile, results);
      } else if (results) {
        console.log(results);
      }
      resolve();
    })])
      .finally(() => {
        done(report.errorCount === 0);
      });


    return report.errorCount === 0;
  }
  )
  ;
}
;
