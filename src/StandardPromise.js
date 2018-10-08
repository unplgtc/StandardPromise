'use strict';

const StandardError = require('@unplgtc/standard-error');
const CBLogger = require('@unplgtc/cblogger');

const StandardPromise = {
	get isStandardPromise() {
		return true;
	},

	build(err, data) {
		this.err = err;
		this.data = data;
		return this;
	},

	normalize() {
		this.then = function(onFulfilled, onRejected) {
			if (this.err === undefined) {
				onFulfilled(this.data);
			} else {
				onRejected(this.err);
			}
		}
		return this;
	}
}

function isStandardPromise(object) {
	return !!(object && typeof object === 'object' && object.isStandardPromise);
}

function promisify(promise, normalize) {
	if (isStandardPromise(promise)) {
		return normalize ? promise.normalize() : promise;
	}
	try {
		return promise.then((data) => {
			if (isStandardPromise(data)) {
				return normalize ? data.normalize() : data;
			}
			var sp = Object.create(StandardPromise);
			if (normalize) {
				sp.normalize();
			}
			return sp.build(undefined, data);
		}).catch((err) => {
			var sp = Object.create(StandardPromise);
			if (normalize) {
				sp.normalize();
			}
			return Promise.resolve(
				err !== undefined
				    ? sp.build(err)
				    : sp.build(StandardError.StandardPromise_502)
			);
		});
	} catch(err) {
		CBLogger.error('promise_resolution_error', StandardError.StandardPromise_500, {}, err);
		var sp = Object.create(StandardPromise);
		if (normalize) {
			sp.normalize();
		}
		return Promise.resolve(sp.build({...StandardError.StandardPromise_500, err: err}));
	}
}

StandardError.add([
	{code: 'StandardPromise_500', domain: 'StandardPromise', title: 'Unexpected Error', message: 'Unexpected error thrown attempting to resolve promise'},
	{code: 'StandardPromise_502', domain: 'StandardPromise', title: 'Bad Gateway', message: 'The promise was rejected with an undefined error from an upstream service'}
]);

module.exports = promisify;
