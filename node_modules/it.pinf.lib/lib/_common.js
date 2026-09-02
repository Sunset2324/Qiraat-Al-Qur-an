
exports.for = function (module, implementation) {

	return require("org.pinf.lib/bin/init").for(module, function (API, callback) {


		return callback();
	}, implementation);

}

