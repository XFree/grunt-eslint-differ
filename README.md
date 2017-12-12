# grunt-eslint-differ
## ESLint репортер с позможностью определения разницы в ошибках, как в Sonar
####Интеграция с TeamCity
* для работы в режиме сравнения необходимо настроить следующие переменные окружения
    ```javascript
      module.exports = function (grunt, config) {
        return {
          options: {
            diff: {
              teamcity: {
                // Опциональный параметр    
                // buildTypeId: process.env.TEAMCITY_BUILD_TYPE_ID,
                // Опциональный параметр
                // serverUrl: process.env.TEAMCITY_SERVER_URL,
                login: process.env.TEAMCITY_AUTH_USERID,
                password: process.env.TEAMCITY_AUTH_PASSWORD,
                // string|function
                branch: function (branches) {
                  return branches[0];
                }
              }
            }
          },
          'all': {
            src: ['test/unit/**/*.js',
              'test/e2e/**/*.js',
              'src/**/*.js'
            ]
          }
        }
      }
    ```
