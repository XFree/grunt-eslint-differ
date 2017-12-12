/* eslint-env es6*/
'use strict';

const base64url = require('base64url'),
      fetch = require('node-fetch'),
      fs = require('fs');

/**
 * Возвращает стандартные заголовки для запроса
 * @param {object} options артифакта по опциям
 * @param {string} options.login логин
 * @param {string} options.password пароль
 * @returns {object} {{'cache-control': string, 'accept': 'application/json', 'Authorization': string}} объект заголовка
 */
function headers(options) {
  return {
    'cache-control': 'no-cache',
    'accept': 'application/json',
    'Authorization': 'Basic ' + base64url.encode(`${options.login || 'sbmsg_autotest'}:${options.password || 'Gh$348fD'}`)
  };
}

/**
 * Получение нормализованых опций
 * @param {object} options объект опций
 * @param {string} options.serverUrl базовый url teamcity
 * @param {string} options.login логин
 * @param {string} options.password пароль
 * @param {string} options.buildTypeId build type id
 * @param {string|function} options.branch имя ветки
 * @returns {PromiseLike<object> | Promise<object>} набор нормализованных опций,
 */
function normalizeBuildOptions(options) {
  let result;

  if (typeof options.branch === 'function') {
    result = getBranches(options)
      .then((result) => options.branch(result.branch.map((branch) => branch.internalName)))
      .then((branch) => Object.assign({}, options, {branch: branch}));
  } else {
    result = Promise.resolve(options);
  }

  return result;
}


/**
 * Получение json артифакта по опциям
 * @param {object} options объект опций
 * @param {string} options.serverUrl базовый url teamcity
 * @param {string} options.login логин
 * @param {string} options.password пароль
 * @param {string} options.buildTypeId build type id
 * @param {string|function} options.branch имя ветки
 * @param {string} [options.artifact] путь к файлу
 * @returns {object} объект с результатами запроса
 */
function getBuildArtifact(options) {
  return normalizeBuildOptions(options)
    .then(_getBuildArtifact);
}


/**
 * @private
 * Получение json артифакта по опциям
 * @param {object} options объект опций
 * @param {string} options.serverUrl базовый url teamcity
 * @param {string} options.login логин
 * @param {string} options.password пароль
 * @param {string} options.buildTypeId build type id
 * @param {string} options.branch имя ветки
 * @param {string} [options.artifact] путь к файлу
 * @returns {object} объект с результатами запроса
 */
function _getBuildArtifact(options) {
  const url = `${options.serverUrl}/app/rest/latest/builds/buildType(id:${encodeURIComponent(options.buildTypeId)}),status:SUCCESS,branch:${encodeURIComponent(options.branch)}/artifacts/content/${encodeURIComponent(options.artifact)}`,
        fetchOpt = {
          method: 'GET',
          headers: headers(options)
        };

  return fetch(url, fetchOpt)
    .then(function (response) {
      return response.ok ? response.json() : Promise.reject(response);
    });
}


/**
 * Получение артифакта по опциям
 * @param {object} options объект опций
 * @param {string} options.serverUrl базовый url teamcity
 * @param {string} options.login логин
 * @param {string} options.password пароль
 * @param {string} options.buildTypeId build type id
 * @returns {object} объект с набором веток
 */
function getBranches(options) {
  const url = `${options.serverUrl}/app/rest/buildTypes/id:${encodeURIComponent(options.buildTypeId)}/branches?locator=policy:ALL_BRANCHES&fields=branch(internalName,default,active)`,
        fetchOpt = {
          method: 'GET',
          headers: headers(options)
        };

  return fetch(url, fetchOpt)
    .then(function (response) {
      return response.ok ? response.json() : Promise.reject(response);
    });
}


/**
 * Получаем опции teamCity
 * @returns {object} объект свойств
 */
function getProperties() {
  if (!isTeamcity()){
    return {isTeamcity: false};
  }

  const REGEXP_PROPERTY = /^([^#\s].*?)=(.*)$/,
        stringToProps = (src) => {
          return src.split('\n')
            .reduce((result, prop) => {
              if (REGEXP_PROPERTY.test(prop)){
                // Какой-то треш в тимсити. Экранирует все :
                result[RegExp.$1] = RegExp.$2.replace('\\:', ':');
              }
              return result;
            }, {});
        },
        buildProps = stringToProps(fs.readFileSync(process.env.TEAMCITY_BUILD_PROPERTIES_FILE, 'utf8')),
        runnerProps = stringToProps(fs.readFileSync(buildProps['teamcity.runner.properties.file'], 'utf8')),
        configProps = stringToProps(fs.readFileSync(buildProps['teamcity.configuration.properties.file'], 'utf8'));

  return Object.assign({isTeamcity: true}, buildProps, runnerProps, configProps);
}

/**
 * Мы в teamCity?
 * @returns {boolean} да/нет
 */
function isTeamcity(){
  return Boolean(process.env.TEAMCITY_VERSION);
}

module.exports = {
  getProperties: getProperties,
  getBuildArtifact: getBuildArtifact
};
