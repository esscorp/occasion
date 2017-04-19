'use strict';

var Moment = require('moment-timezone');
var Prove = require('provejs-params');
var format = 'YYYY-MM-DD HH:mm:ss';

// convert an english date to iso date string
exports.toIsoString = function(dateStr) {
	if (!dateStr) return '';

	var date = new Date(dateStr);

	//setup
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();

	if (month < 10) month = '0' + month;
	if (day < 10) day = '0' + day;

	dateStr = year + '-' + month + '-' + day;
	return dateStr;
};
//
// // convert date string to start of day string
// exports.startOfDay = function(dateStr, tzIn, tzOut) {
//
// 	// validate & set defaults
// 	if (!dateStr) return '';
// 	if (typeof tzIn !== 'string') tzIn = 'UTC';
// 	if (typeof tzOut !== 'string') tzOut = 'UTC';
//
// 	var moment = Moment
// 		.tz(dateStr, tzIn)
// 		.startOf('day')
// 		.tz(tzOut)
// 		.format(format);
// 	return moment;
// };

// // convert date string to end of day string
// exports.endOfDay = function(dateStr, tzIn, tzOut) {
//
// 	// validate & set defaults
// 	if (!dateStr) return '';
// 	if (typeof tzIn !== 'string') tzIn = 'UTC';
// 	if (typeof tzOut !== 'string') tzOut = 'UTC';
//
// 	var moment = Moment
// 		.tz(dateStr, tzIn)
// 		.endOf('day')
// 		.tz(tzOut)
// 		.format(format);
// 	return moment;
// };

// split interval into expr and unit
exports.interval = function(str) {

	// validate & set defaults
	if (!str) str = '0 DAY';
	if (typeof str !== 'string') str = '0 DAY';

	var parts = str.split(' ');
	var sign, expr, unit, interval;

	if (parts.length < 2) {
		return false;
	} else if (parts.length === 2) {
		sign = '+';
		expr = parts[0];
		unit = parts[1];
	} else if (parts.length >= 3) {
		sign = parts[0];
		expr = parts[1];
		unit = parts[2];
	}

	interval = {
		sign: sign,
		expr: expr,
		unit: unit
	};

	return interval;
};

exports.convert = function(date, tzFrom, tzTo, fmt) {

	Prove('*SSs', arguments);

	// return early
	if (!date) return date;

	// set defaults
	fmt = fmt || format;

	return Moment.tz(date, tzFrom).tz(tzTo).format(fmt);
};

/**
 * Calculate audit opened timestamp.
 * @param {String} timestamp string in iso format in client's timezone.
 * @param {Number} positive integer range around the beginning of month to clamp to.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit should be opened.
 *
 */
exports.auditOpenedClamped = function(date, range, tz) {

	Prove('SNS', arguments);

	var now = Moment.tz(date, tz);
	var day = now.date();
	var lower = 1 + range;
	var upper = 31 - range;

	if (day <= lower) {
		// late
		return Moment
		.tz(date, tz) // convert to client's timezone
		.startOf('month')
		.startOf('day')
		.tz('UTC')
		.format(format);
	} else if (day >= upper) {
		// early
		return Moment
		.tz(date, tz) // convert to client's timezone
		.add(1, 'month')
		.startOf('month')
		.startOf('day')
		.tz('UTC')
		.format(format);
	} else {
		// not early or late so assume client wants explicit date
		return Moment
		.tz(date, tz) // convert to client's timezone
		.tz('UTC')
		.format(format);
	}
};

/**
 * Calculate audit opened timestamp.
 * @param {String} timestamp string in iso format in client's timezone.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit should be opened.
 *
 * We open all audits at the beginning of the day in the clients timezone.
 * However, we store all timestamps in UTC in the database so we return a
 * UTC timestamp to be saved in the database.
 */
exports.auditOpened = function(opened, tz) {
	Prove('SS', arguments);
	var ts = Moment
		.tz(opened, tz)
		.startOf('day')
		.tz('UTC') // convert back to UTC
		.format(format);
	return ts;
};

/**
 * Calculate audit closed timestamp.
 * @param {String} audit opened timestamp string in iso format in UTC timezone.
 * @param {String} positive opened interval string from audit type recipe.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit should be closed.
 *
 * Audits are closed at the end of the business day in the client's timezone.
 * However, we store the closed timestamp in the database in UTC.
 */
exports.auditClosed = function(opened, interval, tz) {

	Prove('SSS', arguments);

	var inval = exports.interval(interval);

	var ts = Moment
		.tz(opened, 'UTC')
		.tz(tz) // convert to client's timezone
		.add(inval.expr, inval.unit) // calculate close date
		.subtract(1, 'day') // subtract one day because we are adding one day when call endOf('day')
		.endOf('day') // audits closed at end of day in client's timezone
		.tz('UTC') // convert back to UTC
		.format(format);

	return ts;
};

/**
 * Calculate audit period max timestamp.
 * @param {String} audit closed timestamp string in iso format in UTC timezone.
 * @return {String} timestamp in UTC indicating when audit period max should be.
 *
 * Audits have a period max value which indicates when max time certificates date
 * are allowed. Currently, audit period max is simply the same as the audit closes timestamp.
 */
exports.auditPeriodMax = function(closed) {

	Prove('S', arguments);

	var ts = Moment
		.tz(closed, 'UTC')
		.format(format);

	return  ts;
};

/**
 * Calculate audit period min timestamp.
 * @param {String} audit period_max timestamp string in iso format in UTC timezone.
 * @param {String} positive licensure interval string.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit period max should be.
 *
 * Audits have a period min value which indicates when min time certificates date
 * are allowed.
 */
exports.auditPeriodMin = function(period_max, interval, tz) {

	Prove('SSS', arguments);

	var inval = exports.interval(interval);

	// todo: we should be adding one second to move the timestamp to the beginning of
	// the period before we substract the interval. Other you can have artifacts regarding
	// the number of days in month of the interval substraction.

	// var ts = Moment
	// 	.tz(period_max, 'UTC')
	// 	.tz(tz) // convert to client's timezone
	// 	.subtract(inval.expr, inval.unit) // calculate min moment
	// 	.add(1, 'day')  // add one day because we are removing one day when call startOf('day')
	// 	.startOf('day')
	// 	.tz('UTC') // convert back to UTC
	// 	.format(format);

	var ts = Moment
		.tz(period_max, 'UTC')
		.tz(tz) // convert to client's timezone
		.add(1, 'seconds') // change to start of next day
		.subtract(inval.expr, inval.unit) // calculate min moment
		.tz('UTC') // convert back to UTC
		.format(format);

	return  ts;
};

/**
 * Calculate audit carryover max timestamp.
 * @param {String} audit period min timestamp string in iso format in UTC timezone.
 * @return {String} timestamp in UTC indicating when audit carryover max should be.
 *
 * Audits have an optional carryover period which users are allowed to input certificates
 * completed during previous licensure periods. Currently, audit carryover max is simply
 * the same as the audit closes timestamp.
 */
exports.auditCarroverMax = function(period_min) {

	Prove('S', arguments);

	var ts = Moment
		.tz(period_min, 'UTC')
		.subtract(1, 'second')
		.format(format);

	return  ts;
};

/**
 * Calculate audit carryover min timestamp.
 * @param {String} audit period_min timestamp string in iso format in UTC timezone.
 * @param {String} positive carryover interval string.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit carryover max should be.
 *
 * Audits have an optional carryover period which users are allowed to input certificates
 * completed during previous licensure periods.
 *
 * Note: you must pass in period_min here otherwise you can have artifacts in the
 * subtract method when the number of days in the month causes problems.
 */
exports.auditCarroverMin = function(carryover_max, interval, tz) {

	Prove('SSS', arguments);

	var inval = exports.interval(interval);

	var ts = Moment
		.tz(carryover_max, 'UTC')
		.tz(tz) // convert to client's timezone
		.add(1, 'seconds') // change to start of next day/month
		.subtract(inval.expr, inval.unit) // calculate min moment
		.tz('UTC') // convert back to UTC
		.format(format);

	return  ts;
};
