/* eslint-env es6*/
'use strict';

/**
 * Квотирование строки для использования в регулярном выражении
 * @param {string} src исходная строка
 * @returns {string} строка с квотированием
 */
function regExpQuote(src) {
  return src.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Функция фильтра результатов eslint.
 * Сравнение производится по полям 'ruleId', 'fatal', 'severity', 'source', 'message'
 * @param {object[]} report текущие результаты проверки eslint
 * @param {object[]} [masterReport] результаты с котромыми необходимо сравнивать
 * @returns {object[]} результаты проверки
 */
function differ(report, masterReport) {
  const messageEqualFields = ['ruleId', 'fatal', 'severity', 'source', 'message'],
        severityFields = {1: 'warningCount', 2: 'errorCount'},
        fixSeverityFields = {1: 'fixableWarningCount', 2: 'fixableErrorCount'},
        path = require('path'),
        basePath = path.join(process.cwd()),
        resultReport = Object.assign({}, report);


  if (resultReport && (resultReport.errorCount || resultReport.warningCount)){
    resultReport.results = resultReport.results.reduce((result, file) => {
      const diffFile = masterReport.results.find((item) => {
        const resultFilePath = path.relative(basePath, file.filePath);

        return resultFilePath === path.normalize(item.filePath).replace(new RegExp(`.*?(${regExpQuote(resultFilePath)})$`), '$1');
      });

      if (diffFile) {
        file = Object.assign({}, file);
        file.messages = file.messages.filter((message) => {
          const foundMessage = diffFile.messages.find((diffMessage) => {
            return messageEqualFields.reduce((a, b) => {
              return a && diffMessage[b] === message[b];
            }, true);
          });

          if (foundMessage) {
            file[severityFields[foundMessage.severity]]--;
            resultReport[severityFields[foundMessage.severity]]--;
            if (foundMessage.fix) {
              file[fixSeverityFields[foundMessage.severity]]--;
              resultReport[fixSeverityFields[foundMessage.severity]]--;
            }
          }

          return !foundMessage;
        });


      }

      if (file.messages.length) {
        result.push(file);
      }

      return result;
    }, []);
  }


  return resultReport;
}

module.exports = differ;