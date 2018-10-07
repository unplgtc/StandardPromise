'use strict';

const StandardError = require('@unplgtc/standard-error');
const CBLogger = require('@unplgtc/cblogger');

const StandardPromise = {
	build(err, data) {
		return {
			err: err,
			data: data,
			get isStandardPromise() {
				return true;
			}
		}
	},

	isSP(object) {
		return !!(object && typeof object == 'object' && object.isStandardPromise === true);
	}
}

const promisify = function(promise) {
	if (StandardPromise.isSP(promise)) {
		return promise;
	}
	try {
		return promise.then((data) => {
			if (StandardPromise.isSP(data)) {
				return data;
			}
			return StandardPromise.build(undefined, data);
		}).catch((err) => {
			return Promise.resolve(
				err !== undefined
				    ? StandardPromise.build(err)
				    : StandardPromise.build(StandardError.StandardPromise_502)
			);
		});
	} catch(err) {
		CBLogger.error('promise_resolution_error', StandardError.StandardPromise_500, {}, err);
		return Promise.resolve(StandardPromise.build({...StandardError.StandardPromise_500, err: err}));
	}
}

StandardError.add([
	{code: 'StandardPromise_500', domain: 'StandardPromise', title: 'Unexpected Error', message: 'Unexpected error thrown attempting to resolve promise'},
	{code: 'StandardPromise_502', domain: 'StandardPromise', title: 'Bad Gateway', message: 'The promise was rejected with an undefined error from an upstream service'}
]);

module.exports = promisify;
