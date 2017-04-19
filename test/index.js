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

	/*
	The following tests use some simple intervals to make the calculations easier to reason about.
	Specifically, we set the open interval and licet interval to one month each. This means the
	audit period and audit open period overlap.
	*/
	describe('Audit Recipe: 1 MONTH, Opened 3/1/2017', function() {

		var tz = 'US/Central';
		var opened = '3/1/2017';
		var interval_open = '1 MONTHS';
		var interval_licet = '1 MONTHS';
		var interval_carry = '1 MONTHS';
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
			closed = Occasion._auditClosed(opened, interval_open, tz);
			assert.equal(closed, '2017-04-01 04:59:59');
		});

		it('period_max of 2017-04-01 04:59:59 UTC', function() {
			period_max = Occasion._auditPeriodMax(closed);
			assert.equal(period_max, '2017-04-01 04:59:59');
		});

		it('period_min of 2017-03-01 06:00:00 UTC', function() {
			period_min = Occasion._auditPeriodMin(period_max, interval_licet, tz);
			assert.equal(period_min, '2017-03-01 06:00:00');
		});

		it('period_min equals opened', function() {
			assert.equal(period_min, opened);
		});

		it('carryover_max of 2017-03-01 05:59:59 UTC (one second before period_max)', function() {
			carryover_max = Occasion._auditCarroverMax(period_min);
			assert.equal(carryover_max, '2017-03-01 05:59:59');
		});

		it('carryover_min of 2017-02-01 06:00:00 UTC', function() {
			carryover_min = Occasion._auditCarroverMin(carryover_max, interval_carry, tz);
			assert.equal(carryover_min, '2017-02-01 06:00:00');
		});
	});

	describe('Occasion.auditRecipe(`3/1/2017`)', function() {

		var tz = 'US/Central';
		var opened = '3/1/2017';
		var intervals = {
			interval_open: '1 MONTHS',
			interval_licet: '1 MONTHS',
			interval_carry: '1 MONTHS'
		};

		var recipe = Occasion.auditRecipe(opened, intervals, tz);

		it('expect opened of 2017-03-01 06:00:00 UTC', function() {
			assert.equal(recipe.opened, '2017-03-01 06:00:00');
		});

		it('closes of 2017-04-01 04:59:59 UTC', function() {
			assert.equal(recipe.closed, '2017-04-01 04:59:59');
		});

		it('period_max of 2017-04-01 04:59:59 UTC', function() {
			assert.equal(recipe.period_max, '2017-04-01 04:59:59');
		});

		it('period_min of 2017-03-01 06:00:00 UTC', function() {
			assert.equal(recipe.period_min, '2017-03-01 06:00:00');
		});

		it('period_min equals opened', function() {
			assert.equal(recipe.period_min, recipe.opened);
		});

		it('carryover_max of 2017-03-01 05:59:59 UTC (one second before period_max)', function() {
			assert.equal(recipe.carryover_max, '2017-03-01 05:59:59');
		});

		it('carryover_min of 2017-02-01 06:00:00 UTC', function() {
			assert.equal(recipe.carryover_min, '2017-02-01 06:00:00');
		});
	});
});
