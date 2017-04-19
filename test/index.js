'use strict';

var assert = require('assert');
var Occasion = require('..');

var tz = 'US/Central';
var range = 7;

describe('Tests', function() {
	describe('exports.toIsoString()', function() {
		it('should return empty string when the value is not present', function() {
			assert.equal(Occasion.toIsoString(), '');
		});
		it('should return 1968-01-01 when the value is 1/1/1968', function() {
			assert.equal(Occasion.toIsoString('1/1/1968'), '1968-01-01');
		});
		it('should return 1968-01-01 when the value is new Date(1/1/1968)', function() {
			assert.equal(Occasion.toIsoString(new Date('1/1/1968')), '1968-01-01');
		});
	});

	// describe('exports.startOfDay()', function() {
	// 	it('should return empty string when the value is not present', function() {
	// 		assert.equal(Occasion.startOfDay(), '');
	// 	});
	// 	it('should return 1968-01-01 00:00:00 when the value is 1968-01-01 01:00:00', function() {
	// 		assert.equal(Occasion.startOfDay('1968-01-01 01:00:00'), '1968-01-01 00:00:00');
	// 	});
	// 	it('should return 1968-01-01 06:00:00 when the value is 1968-01-01 00:00:00, US/Central, UTC', function() {
	// 		assert.equal(Occasion.startOfDay('1968-01-01 00:00:00', 'US/Central', 'UTC'), '1968-01-01 06:00:00');
	// 	});
	// });

	// describe('exports.endOfDay()', function() {
	// 	it('should return empty string when the value is not present', function() {
	// 		assert.equal(Occasion.endOfDay(), '');
	// 	});
	// 	it('should return 1968-01-01 23:59:59 when the value is 1968-01-01 00:00:00', function() {
	// 		assert.equal(Occasion.endOfDay('1968-01-01 00:00:00'), '1968-01-01 23:59:59');
	// 	});
	// 	it('should return 1968-01-02 05:59:59 when the value is 1968-01-01 00:00:00, US/Central, UTC', function() {
	// 		assert.equal(Occasion.endOfDay('1968-01-01 00:00:00', 'US/Central', 'UTC'), '1968-01-02 05:59:59');
	// 	});
	// });

	describe('exports.interval()', function() {
		it('should return 0 DAY interval when the value is not present', function() {
			assert.equal(Occasion.interval().sign, '+');
			assert.equal(Occasion.interval().expr, '0');
			assert.equal(Occasion.interval().unit, 'DAY');
		});
		it('should return 0 DAY interval when the value is not a string', function() {
			assert.equal(Occasion.interval(1).sign, '+');
			assert.equal(Occasion.interval(1).expr, '0');
			assert.equal(Occasion.interval(1).unit, 'DAY');
		});
		it('should return interval object when the value is 1 YEAR', function() {
			assert.equal(Occasion.interval('1 YEAR').sign, '+');
			assert.equal(Occasion.interval('1 YEAR').expr, '1');
			assert.equal(Occasion.interval('1 YEAR').unit, 'YEAR');
		});
	});

	describe('exports.auditOpenedClamped()', function() {
		it('should return 2000-01-01 06:00:00 when the value is new `2000-01-02`', function() {
			assert.equal(Occasion.auditOpenedClamped('2000-01-02', range, tz), '2000-01-01 06:00:00');
		});
		it('should return 2000-01-01 06:00:00 when the value is new Date(1999-12-30)', function() {
			assert.equal(Occasion.auditOpenedClamped('1999-12-30', range, tz), '2000-01-01 06:00:00');
		});
	});

	// describe('exports.auditOpened()', function() {
	// 	it('should return 2000-01-01 06:00:00 when the value is `2000-01-01`', function() {
	// 		assert.equal(Occasion.auditOpened('2000-01-01', tz), '2000-01-01 06:00:00');
	// 	});
	// 	it('should return 1991-12-30 06:00:00 when the value is `1999-12-30`', function() {
	// 		assert.equal(Occasion.auditOpened('1991-12-30', tz), '1991-12-30 06:00:00');
	// 	});
	// });

	// describe('exports.auditClosed()', function() {
	// 	it('should return 2000-12-31 05:59:59 when the value is `2000-01-01 06:00:00`, `1 YEAR`', function() {
	// 		assert.equal(Occasion.auditClosed('2000-01-01 06:00:00', '3 MONTH', tz), '2000-03-31 05:59:59');
	// 	});
	// });

	// describe('exports.auditPeriodMax()', function() {
	// 	it('should return 2000-03-31 05:59:59 when the value is `2000-03-31 05:59:59`', function() {
	// 		assert.equal(Occasion.auditPeriodMax('2000-03-31 05:59:59'), '2000-03-31 05:59:59');
	// 	});
	// });

	// describe('exports.auditPeriodMin()', function() {
	// 	it('should return 1999-04-01 06:00:00 when the value is `2000-03-31 05:59:59`', function() {
	// 		assert.equal(Occasion.auditPeriodMin('2000-03-31 05:59:59', '1 YEAR', tz), '1999-04-01 06:00:00');
	// 	});
	// });


	/*
	The following tests use some simple intervals to make the calculations easier to reason about.
	Specifically, we set the open interval and licet interval to one month each. This means the
	audit period and audit open period overlap. Therefore, we should expect the following:

	1. opened is the start of the month,
	2. closed is the end of the month,
	3. opened = period_min
	*/
	describe('Audit Recipe: 1 MONTH, Opened 3/1/2017', function() {

		var tz = 'US/Central';
		var opened = '3/1/2017';
		var interval_open = '1 MONTHS';
		var interval_licet = '1 MONTHS';
		var interval_carryover = '1 MONTHS';
		var closed, period_max, period_min, carryover_max, carryover_min;

		it('expect opened converted to `2017-03-01`', function() {
			opened = Occasion.toIsoString(opened);
			assert.equal(opened, '2017-03-01');
		});
		it('expect opened of 2017-03-01 06:00:00 UTC', function() {
			opened = Occasion.auditOpened(opened, tz);
			assert.equal(opened, '2017-03-01 06:00:00');
		});

		it('closes of 2017-04-01 04:59:59 UTC', function() {
			closed = Occasion.auditClosed(opened, interval_open, tz);
			assert.equal(closed, '2017-04-01 04:59:59');
		});

		it('period_max of 2017-04-01 04:59:59 UTC', function() {
			period_max = Occasion.auditPeriodMax(closed);
			assert.equal(period_max, '2017-04-01 04:59:59');
		});

		it('period_min of 2017-03-01 06:00:00 UTC', function() {
			period_min = Occasion.auditPeriodMin(period_max, interval_licet, tz);
			assert.equal(period_min, '2017-03-01 06:00:00');
		});

		it('period_min equals opened', function() {
			period_min = Occasion.auditPeriodMin(closed, interval_licet, tz);
			assert.equal(period_min, opened);
		});

		it('carryover_max of 2017-03-01 05:59:59 UTC (one second before period_max)', function() {
			carryover_max = Occasion.auditCarroverMax(period_min);
			assert.equal(carryover_max, '2017-03-01 05:59:59');
		});

		it('carryover_min of 2017-02-01 06:00:00 UTC', function() {
			carryover_min = Occasion.auditCarroverMin(carryover_max, interval_carryover, tz);
			assert.equal(carryover_min, '2017-02-01 06:00:00');
		});

	});

});
