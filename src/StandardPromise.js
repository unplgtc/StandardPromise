'use strict';

const StandardError = require('./StandardError');

const StandardPromise = function(promise) {
	try {
		return promise.then((data) => {
			return data != undefined
			            ? {err: undefined, data: data}
			            : {err: StandardError[600], data: undefined}
		}).catch((error) => {
			return Promise.resolve( {err: error, data: undefined} );
		});
	} catch(err) {
		CBLogger.error('Critical error thrown in StandardPromise', StandardError[500], err);
	}
}

module.exports = StandardPromise;

