[![CircleCI master build status](https://img.shields.io/circleci/project/github/unplgtc/StandardPromise/master.svg?label=master&logo=circleci)](https://circleci.com/gh/unplgtc/StandardPromise/tree/master)
[![npm version](https://img.shields.io/npm/v/@unplgtc/standard-promise.svg)](https://www.npmjs.com/package/@unplgtc/standard-promise)

# StandardPromise

### Promise wrapper to simplify asyncronous error handling in Node applications

Error logic in Node applications can rapidly grow complex and unreadable. Nested try/catch blocks or lengthy chains of `.then()` and `.catch()` are difficult to parse and can conceal bugs if you aren't careful. Miss a try/catch or misplace a `.catch()` block in a chain and you're in for a headache somewhere down the line.

We don't think it has to be this way, and StandardPromise is our proposed solution to streamline error handling without opening up vectors for uncaught exceptions or unhandled promise rejections.

## Wrapping Resolved Promises

StandardPromise exports a function called `promisify`, which takes a Promise as input and returns a StandardPromise. `promisify` calls `.then()` on the input Promise, then generates a new StandardPromise Object and places the result in either its `data` or `err` attribute. If the Promise resolved then the basic format can be thought of as `{data: <resolved value>, err: undefined}`. If the Promise rejected then the rejection will be caught and the basic format of the returned Object will be `{err: <caught error>, data: undefined}`.

The key to StandardPromise is this: regardless of whether the input Promise resolved or rejected, the StandardPromise will be returned as a _resolved_ Promise. That means that in your code you can `await` a StandardPromise and then carry on without worrying about catching any errors or exceptions. StandardPromise catches them all for you and returns them in its `err` attribute. You can then check `err` in a clear and readable manner and continue on your way without any nesting or try/catch blocks.

## Usage

First import StandardPromise. You're free to import it as whatever name you like, but we like importing it as `_` for nicer-looking code.

```js
const _ = require('@unplgtc/StandardPromise');
```

Now just wrap any function call that returns a Promise to transform that Promise's value into a StandardPromise:

```js
async function testSP() {
	var sp = await _(Promise.resolve('Resolved value'));
	// { data: 'Resolved value', err: undefined }

	var sp2 = await _(Promise.reject('Error value'));
	// { err: 'Error value', data: undefined }
}
```

With StandardPromises, you can just check whether the `err` attribute is defined or not. If it is, your Promise either rejected or threw an error and you can return or output that error in whatever manner you wish. If `err` is `undefined` then you can continue execution as normal without needing to nest your remaining code in an if/else, try/catch, or `.then()`/`.catch()`.

```js
async function testSP() {
	var sp = await _(Promise.resolve('Resolved value'));
	if (sp.err) {
		return sp.err;
	}

	// Only gets here if sp succeeded
	var sp2 = await _(Promise.reject('Error value'));
	if (sp2.err) {
		return sp2.err;
	}

	// Only gets here if both sp and sp2 succeeded
	return {sp: sp.data, sp2: sp2.data};
}
```

Sometimes you might want the simplicity of StandardPromise's error handling but also have a requirement to return a normal Promise from your function. StandardPromise Objects include a `normalize()` function for just such an occassion. You can call `normalize()` on any StandardPromise to have a `.then()` function added to the object. That will make the StandardPromise behave just like a normal Promise: if `.then()` is called and the StandardPromise has a value in its `err` attribute, it will return a new `Promise.reject()` with that error. If the StandardPromise did not have anything in `err`, it will return a new `Promise.resolve()` with its `data` attribute.

```js
async function testSP() {
	var sp = await _(Promise.resolve('Resolved value'));
	return sp.normalize();
}
```

If you don't know what other functions might be calling your function, we recommend always normalizing your StandardPromises if you need to return them. This way receiving functions can handle them however they want, including just wrapping their value as a new StandardPromise if they want to use one. If you know the receiving function expects a StandardPromise, you can just pass regular StandardPromises to it so that you save the added work of unwrapping and rewrapping.

In general, we've found that if your function is returning a StandardPromise then it often might not need to be unwrapping the Promise at all. The best practice we recommend is to think carefully about your code and only wrap a Promise into a StandardPromise when you absolutely need to. If there's only a single Promise being awaited in your function, you may be ableto get away with a simple `.catch()` statement following your `await` line, which is going to be lighter weight and slightly faster than wrapping into a StandardPromise. In the last example above, the StandardPromise wrapping is almost definitely not necessary — just return the Promise without wrapping and normalizing it.

StandardPromise excels in situations where you are awaiting multiple functions, and particularly when those awaited values depend on each other so that there is an order that needs to be enforced. These complex situations are what lead to complicated chains and confusing nesting when using normal Promises. StandardPromise will keep your code flat and your logic safe and simple.

## StandardPromise in Practice

Let's check out some examples. Here's some code that uses normal Promises and awaits two consecutive requests. The first request needs to refresh an expired access token, and the second request needs to use that refreshed token to athenticate its own request.

```js
const rp = require('request-promise-native');

async function refreshAndSend(apiUrl, clientId, secret, refreshToken) {
	try {
		var accessToken = await rp.post( {url: apiUrl, body: {clientId: clientId, secret: secret, refreshToken: refreshToken}} );

		try {
			var res = await rp.get( {url: apiUrl + '/action', body: {clientId: clientId, secret: secret, accessToken: accessToken}} );

			return res;
		} catch (err) {
			return Promise.reject(err);
		}
	} catch (err) {
		return Promise.reject(err);
	}
}
```

Now here's the same process, but using StandardPromise:

```js
const rp = require('request-promise-native');
const _ = require('@unplgtc/StandardPromise');

async function refreshAndSend(apiUrl, clientId, secret, refreshToken) {
	var accessToken = await _(rp.post( {url: apiUrl, body: {clientId: clientId, secret: secret, refreshToken: refreshToken}} ));
	if (accessToken.err) {
		return Promise.reject(accessToken.err);
	}

	var res = await _(rp.get( {url: apiUrl + '/action', body: {clientId: clientId, secret: secret, accessToken: accessToken.data}} ));
	if (res.err) {
		return Promise.reject(res.err);
	}
	return res;
}
```

Both functions are the same length, but the StandardPromise version has a perfectly flat hierarchy while the Promise version is a muddle of nested try/catch blocks. If a third dependent step needed to be added (such as checking a database for an existing accessToken before attempting to refresh it) then you're looking at a third level of nesting. Adding a third, fourth, or any number of dependent Promise `await` calls to the StandardPromise version will never alter its flat hierarchy.

You can of course flatten out the Promise version by just using one overarching try/catch statement, but that's generally a terrible idea because you will lose the ability to pinpoint exactly which Promise triggered the error.

Now, if the Promises that you are awaiting are _not_ dependent on one another, and you want them all to run regardless of whether any of them fail, there is a better method. Adding a single `.catch()` statement below your `await` calls is lighter than the StandardPromise logic. If your Promises truly do not depend on each other, StandardPromise should be avoided in the situation:

```js
const rp = require('request-promise-native');

async function makeRequests(apiUrl, token) {
	var someRequest = await rp.get( {url: apiUrl + '/firstCall', body: {token: token}} )
		.catch((err) => { console.error('Failed request to /firstCall', err) });

	var someOtherRequest = await rp.get( {url: apiUrl + '/secondCall', body: {token: token}} )
		.catch((err) => { console.error('Failed request to /secondCall', err) });

	return Promise.resolve({someRequestValue: someRequest, someOtherRequestValue: someOtherRequest});
}
```

The drawback of `.catch()` though is that the error which gets returned is confined to the function passed into `.catch()`. If you need to check for and return errors then the function grows a little more complicated:

```js
const rp = require('request-promise-native');

async function makeRequests(apiUrl, token) {
	var someErr;
	var someRequest = await rp.get( {url: apiUrl + '/firstCall', body: {token: token}} )
		.catch((err) => { someErr = err });

	var someOtherErr;
	var someOtherRequest = await rp.get( {url: apiUrl + '/secondCall', body: {token: token}} )
		.catch((err) => { someOtherErr = err });

	if (someErr || someOtherErr) {
		return Promise.reject({someRequestValue: someRequest, someErr: someErr, someOtherRequestValue: someOtherRequest, someOtherErr: someOtherErr});
	} else {
		return Promise.resolve({someRequestValue: someRequest, someOtherRequestValue: someOtherRequest});
	}
}
```

And of course, if those two Promises depend on each other, you end up with something more like this:

```js
const rp = require('request-promise-native');

async function makeRequests(apiUrl, token) {
	var someErr;

	var someRequest = await rp.get( {url: apiUrl + '/firstCall', body: {token: token}} )
		.catch((err) => { someErr = err });

	if (!someErr) {
		var someOtherErr;

		someOtherRequest = await rp.get( {url: apiUrl + '/secondCall', body: {token: token}} )
			.catch((err) => { someOtherErr = err });

		if (!someOtherRequest) {
			return Promise.resolve({someRequestValue: someRequest, someOtherRequestValue: someOtherRequest});
		} else {
			return Promise.reject({someRequestValue: someRequest, someOtherErr: someOtherErr});
		}
	} else {
		return Promise.reject(someErr);
	}
}
```

Now we're back to the nesting problem all over again, gross. Just like above we can use StandardPromise to get much nicer looking code with no nesting:

```js
const rp = require('request-promise-native');
const _ = require('@unplgtc/StandardPromise');

async function makeRequests(apiUrl, token) {
	var someRequest = await _(rp.get( {url: apiUrl + '/firstCall', body: {token: token}} ));
	if (someRequest.err) {
		return Promise.reject(someRequest.err);
	}

	var someOtherRequest = await _(rp.get( {url: apiUrl + '/secondCall', body: {token: token}} ));
	if (someOtherRequest.err) {
		return Promise.reject(someRequestValue: someRequest.data, someOtherRequestErr: someOtherRequest.err);
	}

	return Promise.resolve({someRequestValue: someRequest.data, someOtherRequestValue: someOtherRequest.data});
}
```