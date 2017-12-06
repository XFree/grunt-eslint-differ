'use strict';

module.exports = (grunt) => {
  const {getBuildArtifact} = require('../lib/teamcity'),
        differ = require('../lib/differ'),
        path = require('path'),
        isTeamCity = process.env.TEAMCITY_VERSION;

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
          isDiff = opts.diff,
          done = this.async();

    let report,
        allResult;

    if (!formatter) {
      grunt.warn(`Could not find formatter ${formatterName}`);
    }

    try {
      report = new CLIEngine(opts).executeOnFiles(files);
    } catch (err) {
      grunt.warn(err);
      done(false);
    }

    allResult = report.results;

    Promise.all([new Promise((resolve) => {
      if (isDiff) {
        const getBuildOpts = Object.assign({artifact: outputFile}, opts.diff.teamcity);

        getBuildArtifact(getBuildOpts)
          .then((result) => {
            return differ(allResult, result);
          }, (err) => {
            const isNotFound = err.status === 404;

            if (isNotFound) {
              grunt.log.writeln(`Master report "${getBuildOpts.artifact}" not found. This is a new version.`);
            }

            return isNotFound ? {errorCount: 0} : allResult;
          })
          .then((resultDiff) => {
            grunt.file.write(path.join(outputFilePathObj.dir, `${outputFilePathObj.name}.json`), CLIEngine.getFormatter('json')(resultDiff));
            grunt.file.write(path.join(outputFilePathObj.dir, `${outputFilePathObj.name}-diff${outputFilePathObj.ext}`), formatter(resultDiff));
            resolve(resultDiff);
          });
      } else {
        resolve(allResult);
      }
    }), new Promise((resolve) => {
      const results = formatter(allResult);

      if (outputFile) {
        grunt.file.write(outputFile, results);
      } else if (results) {
        grunt.log.writeln(results.toString());
      }

      resolve(allResult);
    })])
      .then(() => {
        if (isTeamCity){
          grunt.log.writeln(`##teamcity[publishArtifacts '${outputFilePathObj.dir}\\*']`);
        }
      })
      .then((values) => {
        done(values[0].errorCount === 0);
      }, () => {
        done();
      });

  });
};
