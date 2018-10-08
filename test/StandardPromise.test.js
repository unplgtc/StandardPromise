'use strict';

const _ = require('./../src/StandardPromise');
const StandardError = require('@unplgtc/standard-error');
const CBLogger = require('@unplgtc/cblogger');

test('Resolving a StandardPromise stores value in data attribute', async() => {
	// Setup
	var p = Promise.resolve('testing');

	// Execute
	var sp = await _(p);

	// Test
	expect(sp.err).toBe(undefined);
	expect(sp.data).toBe('testing');
});

test('Rejecting a StandardPromise stores value in err attribute', async() => {
	// Setup
	var p = Promise.reject('testing');

	// Execute
	var sp = await _(p);

	// Test
	expect(sp.err).toBe('testing');
	expect(sp.data).toBe(undefined);
});

test('Passing a StandardPromise into another StandardPromise returns the original StandardPromise without nesting', async() => {
	// Setup
	var p = Promise.resolve('testing');
	var p2 = Promise.resolve('testing');
	var p3 = Promise.resolve('testing');

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
	var p = Promise.reject('testing');
	var p2 = Promise.reject('testing');
	var p3 = Promise.reject('testing');

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
	var p = Promise.resolve();
	var p2 = Promise.resolve(undefined);

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
	var p = Promise.reject();
	var p2 = Promise.reject(undefined);

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
	var p = Promise.resolve(null);
	var p2 = Promise.reject(null);

	// Execute
	var sp = await _(p);
	var sp2 = await _(p2);

	// Test
	expect(sp.err).toBe(undefined);
	expect(sp.data).toBe(null);
	expect(sp2.err).toBe(null);
	expect(sp2.data).toBe(undefined);
});

test('Error thrown during promise resolution results in CBLogger.error output custom 500 StandardError response', async() => {
	// Setup
	CBLogger.error = jest.fn();

	var mockedError = new Error();
	var p = Promise.resolve(null);
	p.then = () => {throw mockedError};

	// Execute
	var sp = await _(p);

	// Test
	expect(CBLogger.error).toHaveBeenCalledWith('promise_resolution_error', StandardError.StandardPromise_500, {}, mockedError);
	expect(sp.err).toEqual({...StandardError.StandardPromise_500, err: mockedError});
	expect(sp.data).toBe(undefined);
});

test('Can normalize a StandardPromise into an object resolvable as a normal Promise', async() => {
	// Setup
	var p = Promise.resolve('testing');

	// Execute
	var sp = await _(p);
	sp.normalize();
	var sp2 = await sp;

	// Test
	expect(sp.err).toBe(undefined);
	expect(sp.data).toBe('testing');
	expect(sp2).toBe('testing');
});

test('Can normalize a StandardPromise during creation', async() => {
	// Setup
	var p = Promise.resolve('testing');

	// Execute
	var sp = await _(p, true);

	// Test
	expect(sp).toBe('testing');
});

test('Normalized StandardPromises reject normally', async() => {
	// Setup
	var p = Promise.reject('testing');

	// Execute
	var spErr;
	var sp = await _(p, true)
		.catch((err) => { spErr = err; });

	// Test
	expect(sp).toBe(undefined);
	expect(spErr).toBe('testing');
});

test('Promise.all works with StandardPromises and normalized StandardPromises', async() => {
	// Execute
	var spErr;
	var spErr2;
	var spErr3;
	var p = await Promise.all([_(Promise.resolve('testing')), _(Promise.resolve('testing'))])
		.catch((err) => {spErr = err});
	var p2 = await Promise.all([_(Promise.resolve('testing')), _(Promise.reject('testing'))])
		.catch((err) => {spErr2 = err});
	// Normalized
	var p3 = await Promise.all([_(Promise.resolve('testing'), true), _(Promise.reject('testing'), true)])
		.catch((err) => {spErr3 = err});

	// Test
	expect(p).toEqual([{err: undefined, data: 'testing'}, {err: undefined, data: 'testing'}]);
	expect(spErr).toBe(undefined);
	expect(p2).toEqual([{err: undefined, data: 'testing'}, {err: 'testing', data: undefined}]);
	expect(spErr2).toBe(undefined);
	expect(p3).toBe(undefined);
	expect(spErr3).toBe('testing');
});
