
require("../node_modules/org.pinf.lib/node_modules/require.async")(require);


exports.for = function (API) {

	return {
		turn: function () {

            function loadPINF () {
                var deferred = API.Q.defer();
                try {
                    API.console.debug("Loading pinf (this will be sped up significantly) ...");
                    require.async(
                        API.PATH.join(
                            __dirname,
                            "../node_modules/org.pinf.lib/node_modules/pinf-for-nodejs"
                        ),
                        function (PINF) {
                            return deferred.resolve(PINF);
                        }
                    );
                } catch (err) {
                    deferred.reject(err);
                }
                return deferred.promise;
            }

            return loadPINF().then(function (PINF) {
                return API.Q.denodeify(function (callback) {
                    return PINF.contextForModule(module, {
                        "PINF_PROGRAM": API.getRootPath(),
                        "PINF_RUNTIME": "",
                        verbose: API.VERBOSE,
                        debug: API.DEBUG
                    }, function(err, context) {
                        if (err) return callback(err);
                        // TODO: Determine target path through config.
                        return context.bundleProgram({
                            distPath: API.PATH.join(API.getRootPath(), "../bundles")
                        }, function(err, summary) {
                            if (err) return callback(err);
                            API.console.verbose("Finished creating bundles:", summary);
                            return callback();
                        });
                    });
                })();
            });

			return API.Q.resolve();
		}
	}

}
