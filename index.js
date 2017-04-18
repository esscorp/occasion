'use strict';

var Moment = require('moment-timezone');
var Prove = require('provejs-params');
var fmt = 'YYYY-MM-DD HH:mm:ss';

// convert an english date to iso date string
exports.mdy2iso = function(dateStr) {
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

	Prove('SSS', arguments);

	var moment = Moment
		.tz(dateStr, tzIn)
		.startOf('day')
		.tz(tzOut)
		.format(fmt);
	return moment;
};

// convert date string to end of day string
exports.endOfDay = function(dateStr, tzIn, tzOut) {

	Prove('SSS', arguments);

	var moment = Moment
		.tz(dateStr, tzIn)
		.endOf('day')
		.tz(tzOut)
		.format(fmt);
	return moment;
};


exports.startOfMonthClamped = function(str, range, tzIn, tzOut) {

	Prove('sNSS', arguments);

	var now = Moment.tz(str, tzIn);
	var day = now.date();
	var lower = 1 + range;
	var upper = 31 - range;

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

	Prove('S', arguments);

	var parts = str.split(' ');
	var sign, expr, unit;

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

	return {
		sign: sign,
		expr: expr,
		unit: unit
	};
};

exports.addInterval = function(dateStr, intervalStr) {

	Prove('SS', arguments);

	var moment = Moment.tz(dateStr);
	var interval = exports.inverval(intervalStr);

	if (interval.sign === '+') {
		return moment
		.add(interval.expr, interval.unit)
		.format(fmt);
	} else {
		return moment
		.sub(interval.expr, interval.unit)
		.format(fmt);
	}
};

exports.subInterval = function(dateStr, intervalStr) {

	Prove('SS', arguments);

	var moment = Moment.tz(dateStr);
	var interval = exports.inverval(intervalStr);

	if (interval.sign === '+') {
		return moment
		.sub(interval.expr, interval.unit)
		.format(fmt);
	} else {
		return moment
		.add(interval.expr, interval.unit)
		.format(fmt);
	}
};
