var exec = require('cordova/exec');

exports.coolMethod = function (arg0, success, error) {
    exec(success, error, 'Global-121-Indy', 'coolMethod', [arg0]);
};
