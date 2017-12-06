const base64url = require('base64url'),
      fetch = require('node-fetch');

function getBuildArtifact(options) {
  const url = `${options.serverUrl}/app/rest/latest/builds/buildType(id:${encodeURIComponent(options.buildTypeId)}),status:SUCCESS,branch:${encodeURIComponent(options.branch)}/artifacts/content/${encodeURIComponent(options.artifact)}`,
        fetchOpt = {
          method: 'GET',
          headers: {
            'cache-control': 'no-cache',
            'Authorization': 'Basic ' + base64url.encode(`${options.user}:${options.password}`)
          }
        };

  return fetch(url, fetchOpt)
    .then(function (response) {
      return response.ok ? response.json() : Promise.reject(response);
    });
}

module.exports = {};
module.exports.getBuildArtifact = getBuildArtifact;