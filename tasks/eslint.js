/* eslint-env es6*/
'use strict';

module.exports = (grunt) => {
  const {getBuildArtifact, getProperties} = require('../lib/teamcity'),
        differ = require('../lib/differ'),
        path = require('path');

  grunt.registerMultiTask('eslint', 'Validate files with ESLint', function () {
    const teamCityProps = getProperties(),
          isTeamCity = teamCityProps.isTeamcity,
          {CLIEngine} = require('eslint'),
          opts = this.options({
            outputFile: false,
            diff: false
          }),
          files = this.filesSrc.filter((filePath) => {
            return !filePath.includes('node_modules');
          }),
          formatterName = opts.format,
          outputFile = opts.outputFile,
          outputFilePathObj = outputFile ? path.parse(outputFile) : null,
          formatter = CLIEngine.getFormatter(formatterName),
          jsonFormatter = CLIEngine.getFormatter('json'),
          isDiff = opts.diff && outputFile && opts.diff.teamcity,
          done = this.async();

    let report;

    if (!formatter) {
      grunt.warn(`Could not find formatter ${formatterName}`);
    }

    try {
      report = new CLIEngine(opts).executeOnFiles(files);
    } catch (err) {
      grunt.warn(err);
      done(false);
    }

    new Promise((resolve) => {
      if (isDiff) {
        const allResultReportName = path.join(outputFilePathObj.dir, `${outputFilePathObj.name}.json`),
              getBuildOpts = Object.assign({
                artifact: allResultReportName,
                buildTypeId: teamCityProps['teamcity.buildType.id'],
                serverUrl: teamCityProps['teamcity.serverUrl'],
                login: teamCityProps['teamcity.auth.userId'],
                password: teamCityProps['teamcity.auth.password']
              }, opts.diff.teamcity);

        getBuildArtifact(getBuildOpts)
          .then((result) => {
            return result;
          }, (err) => {
            const isNotFound = err.status === 404;

            if (err.status){
              grunt.log.writeln(isNotFound ? `Master report "${getBuildOpts.artifact}" not found. This is a new version.` : `${err.status}:${err.statusText}`);
            } else {
              grunt.log.writeln(err.toString());
            }

            return isNotFound ? {errorCount: 0, warningCount: 0} : report;
          })
          .then((masterResult) => {
            const resultDiff = differ(report, masterResult);

            grunt.file.write(allResultReportName, jsonFormatter(report));
            grunt.file.write(path.join(outputFilePathObj.dir, `${outputFilePathObj.name}-diff${outputFilePathObj.ext}`), formatter(resultDiff.results));
            resolve(resultDiff);
          });
      } else {
        resolve(report);
      }
    })
      .then((processedReport) => {
        if (outputFile){
          grunt.file.write(outputFile, formatter(report.results));
        } else if (report) {
          grunt.log.writeln(formatter(report.results).toString());
        }

        if (processedReport.errorCount > 0){
          grunt.log.writeln(`ESlint: found new errors: +${processedReport.errorCount}`);
        }

        if (processedReport.warningCount > 0){
          grunt.log.writeln(`ESlint: found new warningCount: +${processedReport.warningCount}`);
        }

        grunt.log.writeln(`ESlint All: ERRORS: ${report.errorCount}, WARNINGS: ${report.warningCount}`);

        if (isTeamCity) {
          grunt.log.writeln(`##teamcity[publishArtifacts '${path.resolve(outputFilePathObj.dir)} => ${outputFilePathObj.dir}']`);
          if (isDiff && processedReport.errorCount > 0){
            grunt.log.writeln(`##teamcity[buildProblem description='ESlint: found new errors: +${processedReport.errorCount}']`);
          }
        }

        done(processedReport.errorCount === 0);
      }, () => {
        done();
      });
  });
};
