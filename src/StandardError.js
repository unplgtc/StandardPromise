'use strict';

// Generic HTTP Errors
const StandardError = {
	400: {code: 400, domain: 'generic', key: 'bad_request', message: 'The server cannot or will not process the request'},

	401: {code: 401, domain: 'generic', key: 'unauthorized', message: 'Authentication required'},

	403: {code: 403, domain: 'generic', key: 'forbidden', message: 'Valid request, but the requested action is forbidden'},

	404: {code: 404, domain: 'generic', key: 'not_found', message: 'The requested resource could not be found'},

	405: {code: 405, domain: 'generic', key: 'method_not_allowed', message: 'The requested method is not supported for the requested resource'},

	500: {code: 500, domain: 'generic', key: 'internal_error', message: 'Unexpected condition was encounterd'}
}

// Application specific errors
const ApplicationError = {
	460: {code: 460, domain: 'application', key: 'unsupported', message: 'The requested endpoint or the requested method on that endpoint is not supported by this application'},

	550: {code: 550, domain: 'application', key: 'undefined_promise_resolution', message: 'Promise unexpectedly resolved as undefined'},

	600: {code: 600, domain: 'application', key: 'no_data', message: 'No data returned in Promise resolution'}
}

// Domain specific errors
const DomainError = {
	// HttpRequestExecutor
	700: {code: 700, domain: 'HttpRequestExecutor', key: 'undefined_request', message: 'Undefined request passed to HttpRequestExecutor'}
}

// Set delegation tree to StandardError -> ApplicationError -> DomainError
Object.setPrototypeOf(ApplicationError, DomainError);
Object.setPrototypeOf(StandardError, ApplicationError);

module.exports = StandardError

