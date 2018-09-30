'use strict';

const StandardError = require('@unplgtc/standard-error');
const CBLogger = require('@unplgtc/cblogger');

const StandardPromise = {
	build(err, data) {
		return {
			err: err,
			data: data,
			get isSP() {
				return true;
			}
		}
	}
}

const promisify = function(promise) {
	if (promise.isSP) {
		return promise;
	}
	try {
		return promise.then((data) => {
			return data !== undefined
			            ? StandardPromise.build(undefined, data)
			            : StandardPromise.build(StandardError[204]);
		}).catch((err) => {
			return Promise.resolve(
				err !== undefined
				    ? StandardPromise.build(err)
				    : StandardPromise.build(StandardError.StandardPromise_502)
			);
		});;
	} catch(err) {
		CBLogger.error('promise_resolution_error', {message: 'Unexpected error thrown while trying to resolve a Promise in StandardPromise'}, {}, err);
		return Promise.resolve(StandardPromise.build(err));
	}
}

StandardError.add([
	{code: 'StandardPromise_502', domain: 'StandardPromise', title: 'Bad Gateway', message: 'The promise was rejected with an undefined error from an upstream service'}
]);

module.exports = promisify;
