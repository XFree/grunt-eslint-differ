const differ = require('../lib/differ');

module.exports = (results, diffResult) => {
  const path = require('path'),
        diffFilePath = process.env.ESLINT_DIFF_FILE && process.env.ESLINT_DIFF_FILE.trim(),
        diffFiles = !diffResult && diffFilePath ? require(path.resolve(diffFilePath)) : diffResult,
        {CLIEngine} = require('eslint'),
        htmlFormatter = CLIEngine.getFormatter(process.env.ESLINT_DIFF_FORMATER);

  return htmlFormatter(differ(results, diffFiles));
};