/* eslint-env es6*/
'use strict';

const base64url = require('base64url'),
      fetch = require('node-fetch');

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

module.exports = {
  getBuildArtifact: getBuildArtifact
};
