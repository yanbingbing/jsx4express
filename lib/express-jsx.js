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
    function getFilePath(file) {
        var item, prefix;
        for (var i = maps.length - 1; i >= 0; i--) {
            item = maps[i];
            prefix = item.path || '';
            if (prefix === file.substr(0, prefix.length)) {
                return path.join(item.dirPath, file.substr(prefix.length));
            }
        }
    }

    return function (req, res, next) {
        if (!/\.jsx?$/.test(req.path)) {
            return next();
        }
        var file = req.path;
        if (!/jsx$/.test(file)) {
            file += 'x';
        }

        var jsxPath = getFilePath(file);

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

        fs.stat(jsxPath, function (err) {
            if (err) {
                return next('ENOENT' == err.code ? null : err);
            }
            transform();
        });
    }
};
