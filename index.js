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

// convert date string to start of day string
exports.startOfDay = function(dateStr, tzIn, tzOut) {

	// validate & set defaults
	if (!dateStr) return '';
	if (typeof tzIn !== 'string') tzIn = 'UTC';
	if (typeof tzOut !== 'string') tzOut = 'UTC';

	var moment = Moment
		.tz(dateStr, tzIn)
		.startOf('day')
		.tz(tzOut)
		.format(format);
	return moment;
};

// convert date string to end of day string
exports.endOfDay = function(dateStr, tzIn, tzOut) {

	// validate & set defaults
	if (!dateStr) return '';
	if (typeof tzIn !== 'string') tzIn = 'UTC';
	if (typeof tzOut !== 'string') tzOut = 'UTC';

	var moment = Moment
		.tz(dateStr, tzIn)
		.endOf('day')
		.tz(tzOut)
		.format(format);
	return moment;
};


exports.startOfMonthClamped = function(dateStr, range, tzIn, tzOut) {

	// validate & set defaults
	if (!dateStr) return '';
	if (typeof range !== 'number') range = 7;
	if (typeof tzIn !== 'string') tzIn = 'UTC';
	if (typeof tzOut !== 'string') tzOut = 'UTC';

	var now = Moment.tz(dateStr, tzIn);
	var day = now.date();
	var lower = 1 + range;
	var upper = 31 - range;
	var fmt = format;

	if (day <= lower) {
		// late
		return now
		.startOf('month')
		.startOf('day')
		.tz(tzOut)
		.format(fmt);
	} else if (day >= upper) {
		// early
		return now
		.add(1, 'month')
		.startOf('month')
		.startOf('day')
		.tz(tzOut)
		.format(fmt);
	} else {
		// not early or late so assume
		return now
		.tz(tzOut)
		.format(fmt);
	}
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

	interval = {
		sign: sign,
		expr: expr,
		unit: unit
	};

	return interval;
};

exports.addInterval = function(dateStr, intervalStr) {

	// validate & set defaults
	if (!intervalStr) intervalStr = '0 DAY';

	var moment = Moment.tz(dateStr, 'UTC');
	var interval = exports.interval(intervalStr);
	var fmt = format;

	if (interval.sign === '+') {
		return moment
		.add(interval.expr, interval.unit)
		.format(fmt);
	} else {
		return moment
		.subtract(interval.expr, interval.unit)
		.format(fmt);
	}
};

exports.subInterval = function(dateStr, intervalStr) {

	// validate & set defaults
	if (!intervalStr) intervalStr = '0 DAY';

	var moment = Moment.tz(dateStr, 'UTC');
	var interval = exports.interval(intervalStr);
	var fmt = format;

	if (interval.sign === '+') {
		return moment
		.subtract(interval.expr, interval.unit)
		.format(fmt);
	} else {
		return moment
		.add(interval.expr, interval.unit)
		.format(fmt);
	}
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
 * @param {String} or {Date}  timestamp string in iso format in client's timezone.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit should be opened.
 *
 * We open all audits at the beginning of the day in the clients timezone.
 * However, we store all timestamps in UTC in the database so we return a
 * UTC timestamp to be saved in the database.
 */
exports.auditOpened = function(opened, tz) {
	Prove('*S', arguments);
	var ts = exports.startOfDay(opened, tz, 'UTC');
	return ts;
};

/**
 * Calculate audit closed timestamp.
 * @param {String} or {Date}  audit opened timestamp string in iso format in UTC timezone.
 * @param {String} positive opened interval string from audit type recipe.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit should be closed.
 *
 * Audits are closed at the end of the business day in the client's timezone.
 * However, we store the closed timestamp in the database in UTC.
 */
exports.auditClosed = function(opened, interval, tz) {

	Prove('*SS', arguments);

	var inval = exports.interval(interval);

	var ts = Moment
		.tz(opened, 'UTC')
		.tz(tz) // convert to client's timezone
		.add(inval.expr, inval.unit) // calculate close date
		.endOf('day') // audits closed at end of day in client's timezone
		.tz('UTC') // convert back to UTC
		.format(format);

	return ts;
};

/**
 * Calculate audit period max timestamp.
 * @param {String} or {Date}  audit closed timestamp string in iso format in UTC timezone.
 * @param {String} positive licensure interval string.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit period max should be.
 *
 * Audits have a period max value which indicates when max time certificates date
 * are allowed. Currently, audit period max is simply the same as the audit closes timestamp.
 */
exports.auditPeriodMax = function(closed, interval, tz) { //eslint-disable-line no-unused-vars

	Prove('*SS', arguments);

	var ts = Moment
		.tz(closed, 'UTC')
		.format(format);

	return  ts;
};

/**
 * Calculate audit period min timestamp.
 * @param {String} or {Date}  audit closed timestamp string in iso format in UTC timezone.
 * @param {String} positive licensure interval string.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit period max should be.
 *
 * Audits have a period min value which indicates when min time certificates date
 * are allowed.
 */
exports.auditPeriodMin = function(closed, interval, tz) {

	Prove('*SS', arguments);

	var inval = exports.interval(interval);

	var ts = Moment
		.tz(closed, 'UTC')
		.tz(tz) // convert to client's timezone
		.subtract(inval.expr, inval.unit) // calculate min moment
		.startOf('day')
		.tz('UTC') // convert back to UTC
		.format(format);

	return  ts;
};

/**
 * Calculate audit carryover max timestamp.
 * @param {String} or {Date} audit period min timestamp string in iso format in UTC timezone.
 * @param {String} positive carryover interval string.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit carryover max should be.
 *
 * Audits have an optional carryover period which users are allowed to input certificates
 * completed during previous licensure periods. Currently, audit carryover max is simply
 * the same as the audit closes timestamp.
 */
exports.auditCarroverMax = function(period_min, interval, tz) { //eslint-disable-line no-unused-vars

	Prove('*SS', arguments);

	var ts = Moment
		.tz(period_min, 'UTC')
		.format(format);

	return  ts;
};

/**
 * Calculate audit carryover min timestamp.
 * @param {String} or {Date} audit period min timestamp string in iso format in UTC timezone.
 * @param {String} positive carryover interval string.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit carryover max should be.
 *
 * Audits have an optional carryover period which users are allowed to input certificates
 * completed during previous licensure periods. Currently, audit carryover max is simply
 * the same as the audit closes timestamp.
 */
exports.auditCarroverMax = function(period_min, interval, tz) {

	Prove('*SS', arguments);

	var inval = exports.interval(interval);

	var ts = Moment
		.tz(period_min, 'UTC')
		.tz(tz) // convert to client's timezone
		.subtract(inval.expr, inval.unit) // calculate min moment
		.startOf('day')
		.tz('UTC') // convert back to UTC
		.format(format);

	return  ts;
};
