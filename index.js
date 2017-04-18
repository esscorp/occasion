'use strict';

var Moment = require('moment-timezone');
var Prove = require('provejs-params');
// var tzIn = 'US/Central';
// var tzOut = 'UTC';
var tzFormat = 'YYYY-MM-DD HH:mm:ss';

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
		.format(tzFormat);
	return moment;
};

// convert date string to end of day string
exports.endOfDay = function(dateStr, tzIn, tzOut) {

	Prove('SSS', arguments);

	var moment = Moment
		.tz(dateStr, tzIn)
		.endOf('day')
		.tz(tzOut)
		.format(tzFormat);
	return moment;
};


exports.startOfMonthClamped = function(str, range, tzIn, tzOut) {

	Prove('sNSS', arguments);

	var now = Moment.tz(str, tzIn);
	var day = now.date();

	if (day < range) {
		return now
		.startOf('month')
		.startOf('day')
		.tz(tzOut)
		.format(tzFormat);
	} else {
		return now
		.add(1, 'month')
		.startOf('month')
		.startOf('day')
		.tz(tzOut)
		.format(tzFormat);
	}
};
