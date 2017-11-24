/* eslint-env es6*/

/**
 * Функция фильтра результатов eslint.
 * Сравнение производится по полям 'ruleId', 'fatal', 'severity', 'source', 'message'
 * @param {object[]} results текущие результаты проверки eslint
 * @param {object[]} [diffFiles] результаты с котромыми необходимо сравнивать
 * @returns {object[]} результаты проверки
 */
function differ(results, diffFiles) {
  'use strict';
  const messageEqualFields = ['ruleId', 'fatal', 'severity', 'source', 'message'],
        severityFields = {1: 'warningCount', 2: 'errorCount'},
        fixSeverityFields = {1: 'fixableWarningCount', 2: 'fixableErrorCount'};

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

  return result;
}

module.exports = differ;