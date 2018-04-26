'use strict';

var _ = require('underscore');
var Prove = require('provejs-params');
var Moment = require('moment-timezone');

var FORMAT = 'YYYY-MM-DD HH:mm:ss';
var TZ_DEFAULT_CONFIG = {
	name: 'US/Central',
	abbr: 'CST',
	format: FORMAT
};

/*
	Pulled from users helpers
*/
exports.clockDrift = function() {
	return Moment().format('x');
};
/*
	end of users helpers
*/

/*
	Pulled from admin helpers
*/
function isOptions(obj) {
	if (!_.isObject(obj)) return false;
	if (!_.has(obj, 'data')) return false;
	if (!_.has(obj, 'name')) return false;
	return true;
}

exports.convertTimezone = function(date, tzFrom, tzTo, format) {

	// return early
	if (!date) return date;

	// set defaults
	if (_.isObject(tzFrom) && tzFrom.name) tzFrom = tzFrom.name;
	if (!_.isString(tzFrom)) tzFrom = 'UTC';

	if (_.isObject(tzTo) && tzTo.name) tzTo = tzTo.name;
	if (!_.isString(tzTo)) tzTo = 'US/Central';

	if (!_.isString(format)) format = FORMAT;

	return exports.convert(date, tzFrom, tzTo, format);
};

exports.formatTimestamp = function(str) {
	return exports.convertTimezone(str, 'UTC', 'UTC');
};

exports.now = function(format) {
	return exports.convert(new Date(), 'UTC', 'UTC', format);
};

exports.parseDaterange = function(daterange, index) {

	if (!daterange || !_.isString(daterange)) return undefined;

	var dates = daterange.split(' to ');
	var date = dates[index];
	var timestamp = (index === 0) ? date + ' 00:00:00' : date + ' 23:59:59';

	return timestamp;
};

exports.datetime = function(datetime, format) {
	if (!datetime) return '';
	format = (_.isString(format)) ? format : FORMAT;
	var text = exports.convert(datetime, 'UTC', 'UTC', format);
	return text;
};

exports.timestamp = function(utcTime, tzUserConfig) {
	var cfg = (isOptions(tzUserConfig))? TZ_DEFAULT_CONFIG : tzUserConfig;
	var format = cfg.format;
	var text = exports.convert(utcTime, 'UTC', cfg.name, format);

	return text;
};

exports.timestampz = function(utcTime, tzUserConfig) {

	// Note: you must clone the object here
	var tz = (tzUserConfig && !isOptions(tzUserConfig)) ? tzUserConfig : TZ_DEFAULT_CONFIG;
	tz = _.clone(tz);

	// only add timezone if not already has timezone
	tz.format = (_.last(tz.format) === 'z') ? tz.format : tz.format + ' z';

	return exports.timestamp(utcTime, tz);
};

/*
	end of admin helpers
*/

// exposes moments diff function
exports.diff = function(fromDate, toDate, metric) {
	var to = Moment(toDate);
	var from = Moment(fromDate);
	return to.diff(from, metric);
};

// performs comparison dateLeft < dateRight
exports.lessThan = function(dateLeft, dateRight) {
	var left = Moment(dateLeft);
	var right = Moment(dateRight);

	return left < right;
};

// exposes moments add function
exports.add = function(date, units, metric, format) {

	// return early
	if (!date) return date;

	// set defaults
	format = format || FORMAT;

	var moment = Moment.tz(date, 'UTC');
	return moment.add(units, metric).format(format);
};

// exposes moments subtract function
exports.subtract = function(date, units, metric, format) {

	// return early
	if (!date) return date;

	// set defaults
	format = format || FORMAT;

	var moment = Moment.tz(date, 'UTC');
	return moment.subtract(units, metric).format(format);
};

// exposes moments endof function
exports.endOf = function(date, metric, format) {

	// return early
	if (!date) return date;

	// set defaults
	format = format || FORMAT;

	var moment = Moment.tz(date, 'UTC');
	return moment.endOf(metric).format(format);
};

// exposes moments startof function
exports.startOf = function(date, metric, format) {

	// return early
	if (!date) return date;

	// set defaults
	format = format || FORMAT;

	var moment = Moment.tz(date, 'UTC');
	return moment.startOf(metric).format(format);
};

// gives timezone abbreviation
// timezoneName should always be defined
exports.zoneAbbr = function(timezoneName) {
	return Moment().tz(timezoneName).zoneAbbr();
};

// reformats seconds into HH:mm:ss
exports.duration = function(secs) {
	secs = secs || 0;
	return Moment.utc(secs*1000).format('HH:mm:ss');
};

// checks if string is a valid date
exports.isDate = function(dateStr) {

	if (_.isDate(dateStr)) return true;

	if (!dateStr) return false;
	if (_.isFinite(dateStr)) return false;

	var isValid = Moment(new Date(dateStr)).isValid();
	if (!isValid) return false;

	// because `Moment` thinks 'A lurking danger CE 476' is a valid date
	var startsWithNumber = /^(\d)+/.test(dateStr);
	if (!startsWithNumber) return false;

	return true;
};

// convert an english date to iso date string
exports.toISOString = function(date) {

	if (!date) return '';

	if (!_.isDate(date)) date = new Date(date);

	var format = 'YYYY-MM-DD';

	return Moment(date).format(format);
};

// split interval into expr and unit
exports.interval = function(str) {

	// validate & set defaults
	if (!str) str = '0 DAY';
	if (!_.isString(str)) str = '0 DAY';

	var parts = str.split(' ');
	var sign;
	var expr;
	var unit;

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
	switch (unit) {
		case 'year': unit = 'years'; break;
		case 'quarter': unit = 'quarters'; break;
		case 'month': unit = 'months'; break;
		case 'week': unit = 'weeks'; break;
		case 'day': unit = 'days'; break;
		case 'hour': unit = 'hours'; break;
		case 'minute': unit = 'minutes'; break;
		case 'second': unit = 'seconds'; break;
		case 'millisecond': unit = 'milliseconds'; break;
	}

	var interval = {
		sign: sign,
		expr: expr,
		unit: unit
	};

	return interval;
};

exports.convert = function(date, tzFrom, tzTo, format) {

	Prove('*SSs', arguments);

	// return early
	if (!date) return date;

	// set defaults
	format = format || FORMAT;

	return Moment.tz(date, tzFrom).tz(tzTo).format(format);
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
			.format(FORMAT);
	} else if (day >= upper) {
		// early
		return Moment
			.tz(date, tz) // convert to client's timezone
			.add(1, 'month')
			.startOf('month')
			.startOf('day')
			.tz('UTC')
			.format(FORMAT);
	} else {
		// not early or late so assume client wants explicit date
		return Moment
			.tz(date, tz) // convert to client's timezone
			.tz('UTC')
			.format(FORMAT);
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
		.format(FORMAT);
	return ts;
};

/**
 * Calculate audit expired timestamp.
 * @param {String} audit opened timestamp string in iso format in UTC timezone.
 * @param {String} positive opened interval string from audit type recipe.
 * @param {String} client's timezone name.
 * @return {String} timestamp in UTC indicating when audit should be expired.
 *
 * Audits are expired at the end of the business day in the client's timezone.
 * However, we store the expired timestamp in the database in UTC.
 *
 * Note the audit expires date is different than the actual date an audit closes.
 * We store both values in the database. Don't confuse the two.
 */
exports._auditExpired = function(opened, interval, tz) {

	Prove('SSS', arguments);

	var inval = exports.interval(interval);

	var ts = Moment
		.tz(opened, 'UTC')
		.tz(tz) // convert to client's timezone
		.add(inval.expr, inval.unit) // calculate close date
		.subtract(1, 'day') // subtract one day because we are adding one day when call endOf('day')
		.endOf('day') // audits expired at end of day in client's timezone
		.tz('UTC') // convert back to UTC
		.format(FORMAT);

	return ts;
};

/**
 * Calculate audit period max timestamp.
 * @param {String} audit expired timestamp string in iso format in UTC timezone.
 * @return {String} timestamp in UTC indicating when audit period max should be.
 *
 * Audits have a period max value which indicates when max time certificates date
 * are allowed. Currently, audit period max is simply the same as the audit closes timestamp.
 */
exports._auditPeriodMax = function(expired) {

	Prove('S', arguments);

	var ts = Moment
		.tz(expired, 'UTC')
		.format(FORMAT);

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
		.format(FORMAT);

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
		.format(FORMAT);

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
		.format(FORMAT);

	return  ts;
};

/**
 * Calculate audit timestamp recipe.
 * @param {String} audit opened date string in iso format.
 * @param {String} audit interval open (from audits_types) string.
 * @param {String} audit interval licet (from audits_types) string.
 * @param {String} audit interval carry (from audits_types) string.
 * @param {String} client's timezone name.
 * @return {Object} recipe of timestamps in UTC.
 *
 */
exports.auditRecipe = function(opened, interval_open, interval_licet, interval_carry, tz) {

	Prove('SSSsS', arguments);

	var expired, period_max, period_min, carryover_max, carryover_min;

	opened = exports.toISOString(opened);
	opened = exports.auditOpened(opened, tz);
	expired = exports._auditExpired(opened, interval_open, tz);
	period_max = exports._auditPeriodMax(expired);
	period_min = exports._auditPeriodMin(period_max, interval_licet, tz);
	if (interval_carry) carryover_max = exports._auditCarroverMax(period_min);
	if (interval_carry) carryover_min = exports._auditCarroverMin(carryover_max, interval_carry, tz);

	return {
		opened: opened,
		expired: expired,
		period_min: period_min,
		period_max: period_max,
		carryover_min: carryover_min,
		carryover_max: carryover_max
	};
};
