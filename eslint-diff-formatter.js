/* eslint-env es6*/
const differ = require('./lib/differ');

module.exports = (results) => {
  const path = require('path'),
        diffFilePath = process.env.ESLINT_DIFF_FILE && process.env.ESLINT_DIFF_FILE.trim(),
        diffFiles = diffFilePath ? require(path.resolve(diffFilePath)) : null,
        htmlFormatter = CLIEngine.getFormatter(process.env.ESLINT_DIFF_FORMATER);

  return htmlFormatter(differ(results, diffFiles));
};