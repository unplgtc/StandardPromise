'use strict';

const _ = require('./../src/StandardPromise');
const StandardError = require('@unplgtc/standard-error');
const CBLogger = require('@unplgtc/cblogger');

test('Resolving a StandardPromise stores value in data attribute', async() => {
	// Setup
	var p = new Promise(async(resolve, reject) => {
		setTimeout(() => {resolve('testing')}, 1);
	});

	// Execute
	var sp = await _(p);

	// Test
	expect(sp.err).toBe(undefined);
	expect(sp.data).toBe('testing');
});

test('Rejecting a StandardPromise stores value in err attribute', async() => {
	// Setup
	var p = new Promise(async(resolve, reject) => {
		setTimeout(() => {reject('testing')}, 1);
	});

	// Execute
	var sp = await _(p);

	// Test
	expect(sp.err).toBe('testing');
	expect(sp.data).toBe(undefined);
});

test('Passing a StandardPromise into another StandardPromise returns the original StandardPromise without nesting', async() => {
	// Setup
	var p = new Promise(async(resolve, reject) => {
		setTimeout(() => {resolve('testing')}, 1);
	});
	var p2 = new Promise(async(resolve, reject) => {
		setTimeout(() => {resolve('testing')}, 1);
	});
	var p3 = new Promise(async(resolve, reject) => {
		setTimeout(() => {resolve('testing')}, 1);
	});

	// Execute
	var sp = await _( await _(p) );
	var sp2 = await _( _(p) );

	var sp3 = await _(p3);
	var sp4 = await _(sp3);
	var sp5 = _(sp4);

	// Test
	expect(sp.err).toBe(undefined);
	expect(sp.data).toBe('testing');
	expect(sp2.err).toBe(undefined);
	expect(sp2.data).toBe('testing');
	expect(sp3.err).toBe(undefined);
	expect(sp3.data).toBe('testing');
	expect(sp4.err).toBe(undefined);
	expect(sp4.data).toBe('testing');
	expect(sp5.err).toBe(undefined);
	expect(sp5.data).toBe('testing');
});

test('Same as above but reject the promises', async() => {
	// Setup
	var p = new Promise(async(resolve, reject) => {
		setTimeout(() => {reject('testing')}, 1);
	});
	var p2 = new Promise(async(resolve, reject) => {
		setTimeout(() => {reject('testing')}, 1);
	});
	var p3 = new Promise(async(resolve, reject) => {
		setTimeout(() => {reject('testing')}, 1);
	});

	// Execute
	var sp = await _( await _(p) );
	var sp2 = await _( _(p2) );

	var sp3 = await _(p3);
	var sp4 = await _(sp3);
	var sp5 = _(sp4);

	// Test
	expect(sp.err).toBe('testing');
	expect(sp.data).toBe(undefined);
	expect(sp2.err).toBe('testing');
	expect(sp2.data).toBe(undefined);
	expect(sp3.err).toBe('testing');
	expect(sp3.data).toBe(undefined);
	expect(sp4.err).toBe('testing');
	expect(sp4.data).toBe(undefined);
	expect(sp5.err).toBe('testing');
	expect(sp5.data).toBe(undefined);
});

test('Can resolve a StandardPromise with undefined', async() => {
	// Setup
	var p = new Promise(async(resolve, reject) => {
		setTimeout(() => {resolve()}, 1);
	});
	var p2 = new Promise(async(resolve, reject) => {
		setTimeout(() => {resolve(undefined)}, 1);
	});

	// Execute
	var sp = await _(p);
	var sp2 = await _(p2);

	// Test
	expect(sp.err).toBe(undefined);
	expect(sp.data).toBe(undefined);
	expect(sp2.err).toBe(undefined);
	expect(sp2.data).toBe(undefined);
});

test('Rejecting a StandardPromise with undefined value stores StandardPromise_502 StandardError in err attribute', async() => {
	// Setup
	var p = new Promise(async(resolve, reject) => {
		setTimeout(() => {reject()}, 1);
	});
	var p2 = new Promise(async(resolve, reject) => {
		setTimeout(() => {reject(undefined)}, 1);
	});

	// Execute
	var sp = await _(p);
	var sp2 = await _(p2);

	// Test
	expect(sp.err).toBe(StandardError.StandardPromise_502);
	expect(sp.data).toBe(undefined);
	expect(sp2.err).toBe(StandardError.StandardPromise_502);
	expect(sp2.data).toBe(undefined);
});

test('Can resolve or reject a StandardPromise with null', async() => {
	// Setup
	var p = new Promise(async(resolve, reject) => {
		setTimeout(() => {resolve(null)}, 1);
	});
	var p2 = new Promise(async(resolve, reject) => {
		setTimeout(() => {reject(null)}, 1);
	});

	// Execute
	var sp = await _(p);
	var sp2 = await _(p2);

	// Test
	expect(sp.err).toBe(undefined);
	expect(sp.data).toBe(null);
	expect(sp2.err).toBe(null);
	expect(sp2.data).toBe(undefined);
});

test('Error thrown during promise resolution results in CBLogger.error output and return of the thrown error', async() => {
	// Setup
	CBLogger.error = jest.fn();

	var mockedError = new Error();
	var p = new Promise(async(resolve, reject) => {
		setTimeout(() => {resolve(null)}, 1);
	});
	p.then = () => {throw mockedError};

	// Execute
	var sp = await _(p);

	// Test
	expect(CBLogger.error).toHaveBeenCalledWith('promise_resolution_error', {message: 'Unexpected error thrown while trying to resolve a Promise in StandardPromise'}, {}, mockedError);
	expect(sp.err).toBe(mockedError);
	expect(sp.data).toBe(undefined);
});
