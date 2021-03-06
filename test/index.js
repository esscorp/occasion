'use strict';

var Assert = require('assert');
var Occasion = require('..');

var TZ = 'US/Central';
var RANGE = 7;

describe('Tests', function() {
	describe('exports.toISOString()', function() {
		it('should return empty string when the value is not present', function() {
			Assert.strictEqual(Occasion.toISOString(), '');
		});
		it('should return 1968-01-01 when the value is 1/1/1968', function() {
			Assert.strictEqual(Occasion.toISOString('1/1/1968'), '1968-01-01');
		});
		it('should return 1968-01-01 when the value is new Date(1/1/1968)', function() {
			Assert.strictEqual(Occasion.toISOString(new Date('1/1/1968')), '1968-01-01');
		});
	});

	describe('exports.interval()', function() {
		it('should return 0 DAY interval when the value is not present', function() {
			Assert.strictEqual(Occasion.interval().sign, '+');
			Assert.strictEqual(Occasion.interval().expr, '0');
			Assert.strictEqual(Occasion.interval().unit, 'days');
		});
		it('should return 0 DAY interval when the value is not a string', function() {
			Assert.strictEqual(Occasion.interval(1).sign, '+');
			Assert.strictEqual(Occasion.interval(1).expr, '0');
			Assert.strictEqual(Occasion.interval(1).unit, 'days');
		});
		it('should return interval object when the value is 1 YEAR', function() {
			Assert.strictEqual(Occasion.interval('1 YEAR').sign, '+');
			Assert.strictEqual(Occasion.interval('1 YEAR').expr, '1');
			Assert.strictEqual(Occasion.interval('1 YEAR').unit, 'years');
		});
	});

	describe('exports.auditOpenedClamped()', function() {
		it('should return 2000-01-01 06:00:00 when the value is new `2000-01-02`', function() {
			Assert.strictEqual(Occasion.auditOpenedClamped('2000-01-02', RANGE, TZ), '2000-01-01 06:00:00');
		});
		it('should return 2000-01-01 06:00:00 when the value is new Date(1999-12-30)', function() {
			Assert.strictEqual(Occasion.auditOpenedClamped('1999-12-30', RANGE, TZ), '2000-01-01 06:00:00');
		});
	});

	/*
	The following tests use some simple intervals to make the calculations easier to reason about.
	Specifically, we set the open interval and licet interval to one month each. This means the
	audit period and audit open period overlap.
	*/
	describe('Audit Recipe: 1 MONTH, Opened 3/1/2017', function() {

		var opened = '3/1/2017';
		var interval_open = '1 MONTHS';
		var interval_licet = '1 MONTHS';
		var interval_carry = '1 MONTHS';
		var expired;
		var period_max;
		var period_min;
		var carryover_max;
		var carryover_min;

		it('expect opened converted to `2017-03-01`', function() {
			opened = Occasion.toISOString(opened);
			Assert.strictEqual(opened, '2017-03-01');
		});
		it('expect opened of 2017-03-01 06:00:00 UTC', function() {
			opened = Occasion.auditOpened(opened, TZ);
			Assert.strictEqual(opened, '2017-03-01 06:00:00');
		});

		it('closes of 2017-04-01 04:59:59 UTC', function() {
			expired = Occasion._auditExpired(opened, interval_open, TZ);
			Assert.strictEqual(expired, '2017-04-01 04:59:59');
		});

		it('period_max of 2017-04-01 04:59:59 UTC', function() {
			period_max = Occasion._auditPeriodMax(expired);
			Assert.strictEqual(period_max, '2017-04-01 04:59:59');
		});

		it('period_min of 2017-03-01 06:00:00 UTC', function() {
			period_min = Occasion._auditPeriodMin(period_max, interval_licet, TZ);
			Assert.strictEqual(period_min, '2017-03-01 06:00:00');
		});

		it('period_min equals opened', function() {
			Assert.strictEqual(period_min, opened);
		});

		it('carryover_max of 2017-03-01 05:59:59 UTC (one second before period_max)', function() {
			carryover_max = Occasion._auditCarroverMax(period_min);
			Assert.strictEqual(carryover_max, '2017-03-01 05:59:59');
		});

		it('carryover_min of 2017-02-01 06:00:00 UTC', function() {
			carryover_min = Occasion._auditCarroverMin(carryover_max, interval_carry, TZ);
			Assert.strictEqual(carryover_min, '2017-02-01 06:00:00');
		});
	});

	describe('Occasion.auditRecipe(`3/1/2017`)', function() {

		var opened = '3/1/2017';
		var interval_open = '1 MONTHS';
		var interval_licet = '1 MONTHS';
		var interval_carry = '1 MONTHS';

		var recipe = Occasion.auditRecipe(opened, interval_open, interval_licet, interval_carry, TZ);

		it('expect opened of 2017-03-01 06:00:00 UTC', function() {
			Assert.strictEqual(recipe.opened, '2017-03-01 06:00:00');
		});

		it('closes of 2017-04-01 04:59:59 UTC', function() {
			Assert.strictEqual(recipe.expired, '2017-04-01 04:59:59');
		});

		it('period_max of 2017-04-01 04:59:59 UTC', function() {
			Assert.strictEqual(recipe.period_max, '2017-04-01 04:59:59');
		});

		it('period_min of 2017-03-01 06:00:00 UTC', function() {
			Assert.strictEqual(recipe.period_min, '2017-03-01 06:00:00');
		});

		it('period_min equals opened', function() {
			Assert.strictEqual(recipe.period_min, recipe.opened);
		});

		it('carryover_max of 2017-03-01 05:59:59 UTC (one second before period_max)', function() {
			Assert.strictEqual(recipe.carryover_max, '2017-03-01 05:59:59');
		});

		it('carryover_min of 2017-02-01 06:00:00 UTC', function() {
			Assert.strictEqual(recipe.carryover_min, '2017-02-01 06:00:00');
		});
	});

	describe('Occasion.lessThan', function() {

		var smallValue = '2017-03';
		var largeValue = '2017-04';

		it('true for less than', function() {
			Assert.strictEqual(true, Occasion.lessThan(smallValue, largeValue));
		});

		it('false for less than', function() {
			Assert.strictEqual(false, Occasion.lessThan(largeValue, smallValue));
		});

		it('false for equal', function() {
			Assert.strictEqual(false, Occasion.lessThan(largeValue, largeValue));
		});
	});

	describe('Occasion.diff', function() {

		var smallValue = '2017-03-10';
		var largeValue = '2017-03-20';

		it('ten days difference', function() {
			Assert.strictEqual(10, Occasion.diff(smallValue, largeValue, 'days'));
		});
	});

	describe('Occasion.add', function() {

		it('ten days added to 2017-03-01', function() {
			Assert.strictEqual('2017-03-11', Occasion.add('2017-03-01', 10, 'days', 'YYYY-MM-DD'));
		});
	});

	describe('Occasion.subtract', function() {

		it('ten days difference', function() {
			Assert.strictEqual('2017-03-01', Occasion.subtract('2017-03-11', 10, 'days', 'YYYY-MM-DD'));
		});
	});

	describe('Occasion.endOf', function() {

		it('last day of month for 2017-12', function() {
			Assert.strictEqual('2017-12-31', Occasion.endOf('2017-12-01', 'month', 'YYYY-MM-DD'));
		});
	});

	describe('Occasion.startOf', function() {

		it('first day of month for 2017-12', function() {
			Assert.strictEqual('2017-12-01', Occasion.startOf('2017-12-10', 'month', 'YYYY-MM-DD'));
		});
	});

	describe('Occasion.zoneAbbr', function() {

		it('test for America/Chicago', function() {
			var zoneAbbr = Occasion.zoneAbbr('America/Chicago');
			Assert.ok(zoneAbbr === 'CST' || zoneAbbr === 'CDT', zoneAbbr);
		});
	});
});
