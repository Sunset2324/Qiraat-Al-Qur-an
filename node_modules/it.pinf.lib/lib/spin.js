
exports.for = function (API) {

	return {
		spin: function () {


console.log("it.pinf.lib spin:", API.getRootPath());

			return API.Q.resolve();
		}
	}

}
