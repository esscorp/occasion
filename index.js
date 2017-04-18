'use strict';

var Moment = require('moment-timezone');
// var tzIn = 'US/Central';
// var tzOut = 'UTC';
var tzFormat = 'YYYY-MM-DD HH:mm:ss';

// ***** public function *****


//
exports.mdy2iso = function(str) {
	if (!str) return '';

	var date = new Date(str);

	//setup
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();

	if (month < 10) month = '0' + month;
	if (day < 10) day = '0' + day;

	str = year + '-' + month + '-' + day;
	return str;
};

exports.startOfDay = function(dateStr, tzIn, tzOut) {
	var moment = Moment
		.tz(dateStr, tzIn)
		.startOf('day')
		.tz(tzOut)
		.format(tzFormat);
	return moment;
};

exports.endOfDay = function(dateStr, tzIn, tzOut) {
	var moment = Moment
		.tz(dateStr, tzIn)
		.endOf('day')
		.tz(tzOut)
		.format(tzFormat);
	return moment;
};

// Allow BON to seed audits in advance of opened date.
// BON does not submit an audit opened date therefore, we
// calcuate an audit opened date for them. If an audit is
// seeded after the 15th of the month assume they want to
// open the audit at the beginning of next month. If before
// the 15th of the month assume they wanted beginning of the
// current month. Not this can result in an audit.opened date
// which is before the audit.created date. I see no problem
// with this.
exports.startOfMonthClamped = function(str, tzIn, tzOut) {

	if (!str) str = new Date();

	var now = Moment.tz(str, tzIn);
	var day = now.date();

	if (day < 15) {
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
