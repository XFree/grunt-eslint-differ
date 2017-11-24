/* eslint-env es6*/
module.exports = function (results) {
  'use strict';
  const path = require('path'),
        diffFilePath = process.env.ESLINT_DIFF_FORMATTER_FILE && process.env.ESLINT_DIFF_FORMATTER_FILE.trim(),
        diffFiles = diffFilePath ? require(path.resolve(diffFilePath)) : null,
        messageEqualFields = ['ruleId', 'fatal', 'severity', 'source', 'message'],
        severityFields = {1: 'warningCount', 2: 'errorCount'},
        fixSeverityFields = {1: 'fixableWarningCount', 2: 'fixableErrorCount'},
        {CLIEngine} = require('eslint'),
        htmlFormatter = CLIEngine.getFormatter('html');

  let result = diffFiles ? results.reduce((result, file) => {
    const diffFile = diffFiles.find((item) => {
      return item.filePath === file.filePath;
    });

    file.messages = file.messages.filter((message) => {
      const foundMessage = diffFile.messages.find((diffMessage) => {
        return messageEqualFields.reduce((a, b) => {
          return a && diffMessage[b] === message[b];
        }, true);
      });

      if (foundMessage) {
        file[severityFields[foundMessage.severity]]--;
        if (foundMessage.fix) {
          file[fixSeverityFields[foundMessage.severity]]--;
        }
      }

      return !foundMessage;
    });

    if (file.messages.length) {
      result.push(file);
    }

    return result;
  }, []) : results;

  return htmlFormatter(result);
};