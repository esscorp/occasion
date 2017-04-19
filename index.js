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

	// cleanup units to be moment.js compatiable
	unit = unit.toLowerCase();
	if (unit === 'year') unit = 'years';
	if (unit === 'quarter') unit = 'quarters';
	if (unit === 'month') unit = 'months';
	if (unit === 'week') unit = 'weeks';
	if (unit === 'day') unit = 'days';
	if (unit === 'hour') unit = 'hours';
	if (unit === 'minute') unit = 'minutes';
	if (unit === 'second') unit = 'seconds';
	if (unit === 'millisecond') unit = 'milliseconds';

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
exports._auditClosed = function(opened, interval, tz) {

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
exports._auditPeriodMax = function(closed) {

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
 *
 * Note: we roll over to the start of the next day/month so the add/substract of the interval
 * has less issues regarding what day of the month you start the calculation from.
 */
exports._auditPeriodMin = function(period_max, interval, tz) {

	Prove('SSS', arguments);

	var inval = exports.interval(interval);

	var ts = Moment
		.tz(period_max, 'UTC')
		.tz(tz) // convert to client's timezone
		.add(1, 'seconds') // change to start of next day/month
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
exports._auditCarroverMax = function(period_min) {

	Prove('S', arguments);

	var ts = Moment
		.tz(period_min, 'UTC')
		.subtract(1, 'second')
		.format(format);

	return  ts;
};

/**
 * Calculate audit carryover min timestamp.
 * @param {String} audit carryover_max timestamp string in iso format in UTC timezone.
 * @param {String} positive carryover interval string.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit carryover max should be.
 *
 * Audits have an optional carryover period which users are allowed to input certificates
 * completed during previous licensure periods.
 *
 * Note: we roll over to the start of the next day/month so the add/substract of the interval
 * has less issues regarding what day of the month you start the calculation from.
 */
exports._auditCarroverMin = function(carryover_max, interval, tz) {

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

/**
 * Calculate audit timestamp recipe.
 * @param {String} audit opened date string in iso format.
 * @param {Object} audit intervals (from audits_types) object.
 * @param {String} client's timezone name.
 * @return {Object} recipe of timestamps in UTC.
 *
 */
exports.auditRecipe = function(opened, intervals, tz) {

	Prove('SOS', arguments);

	var interval_open = intervals.open;
	var interval_licet = intervals.licet;
	var interval_carry = intervals.carryover;
	var closed, period_max, period_min, carryover_max, carryover_min;

	opened = exports.toIsoString(opened);
	opened = exports.auditOpened(opened, tz);
	closed = exports._auditClosed(opened, interval_open, tz);
	period_max = exports._auditPeriodMax(closed);
	period_min = exports._auditPeriodMin(period_max, interval_licet, tz);
	if (interval_carry) carryover_max = exports._auditCarroverMax(period_min);
	if (interval_carry) carryover_min = exports._auditCarroverMin(carryover_max, interval_carry, tz);

	return {
		opened: opened,
		closed: closed,
		period_min: period_min,
		period_max: period_max,
		carryover_min: carryover_min,
		carryover_max: carryover_max
	};
};
