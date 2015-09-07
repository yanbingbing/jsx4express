var reactTools = require('react-tools');
var path = require('path');
var fs = require('fs');

function getErrorScript(errorMessage) {
    var cleanErrorMessage = errorMessage.replace('\n', '\\n').replace('"', '\\"');
    return [
        '/**********************************************************',
        errorMessage.split('\n').map(function (str) {
            return ' * ' + str;
        }).join('\n'),
        ' *********************************************************/',
        ';console.info("' + cleanErrorMessage + '");'
    ].join('\n');
}

module.exports = function (maps) {
    function getFullPath(file) {
        if (Array.isArray(maps)) {
            var item, prefix;
            for (var i = maps.length - 1; i >= 0; i--) {
                item = maps[i];
                prefix = item.path || '';
                if (prefix === file.substr(0, prefix.length)) {
                    return path.join(item.dirPath || '', file.substr(prefix.length));
                }
            }
        } else {
            return path.join(maps || '', file);
        }
    }

    return function (req, res, next) {
        if (!/\.jsx?$/.test(req.path)) {
            return next();
        }
        var file = req.path;
        var fullPath = getFullPath(file);
        var jsxPath, jsPath;

        // path/to/file.jsx.js
        if (/jsx\.js$/.test(file)) {
            jsPath = fullPath.substring(0, fullPath.length - 4);
        }
        // path/to/file.jsx
        else if (/jsx$/.test(file)) {
            jsPath = fullPath.substring(0, jsxPath.length - 1);
        }
        // path/to/file.js
        else {
            jsPath = fullPath;
        }
        jsxPath = jsPath + 'x';
        fullPath = jsxPath + '.js';

        function transform() {
            fs.readFile(jsxPath, 'utf8', function (err, code) {
                if (err) {
                    return next('ENOENT' == err.code ? null : err);
                }
                try {
                    code = reactTools.transform(code)
                } catch (e) {
                    var errorMessage = e.message + '\nIn file: ' + req.originalUrl;
                    code = getErrorScript(errorMessage);
                }
                res.setHeader('Content-Type', 'application/javascript');
                res.setHeader('Content-Length', Buffer.byteLength(code));
                res.end(code);
            });
        }

        // try find:
        //   path/to/file.jsx
        //   path/to/file.jsx.js
        //   path/to/file.js
        function tryTransform(path, callback) {
            console.info('try find:'+path);
            fs.stat(jsxPath, function (err) {
                if (err) {
                    if (err.code === 'ENOENT') {
                        console.info(path + ' not found');
                        callback(null);
                    } else {
                        next(err);
                    }
                } else {
                    console.info(path + ' found, transform');
                    transform();
                }
            });
        }

        tryTransform(jsxPath, function () {
            tryTransform(fullPath, function () {
                tryTransform(jsPath, next);
            });
        });
    }
};
