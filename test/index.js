'use strict';

var assert = require('assert');
var Occasion = require('..');

describe('Tests', function() {
	describe('exports.mdy2iso()', function() {
		it('should return empty string when the value is not present', function() {
			assert.equal(Occasion.mdy2iso(), '');
		});
		it('should return 1968-01-01 when the value is 1/1/1968', function() {
			assert.equal(Occasion.mdy2iso('1/1/1968'), '1968-01-01');
		});
		it('should return 1968-01-01 when the value is new Date(1/1/1968)', function() {
			assert.equal(Occasion.mdy2iso(new Date('1/1/1968')), '1968-01-01');
		});
	});

	describe('exports.startOfDay()', function() {
		it('should return empty string when the value is not present', function() {
			assert.equal(Occasion.startOfDay(), '');
		});
		it('should return 1968-01-01 00:00:00 when the value is 1968-01-01 01:00:00', function() {
			assert.equal(Occasion.startOfDay('1968-01-01 01:00:00'), '1968-01-01 00:00:00');
		});
		it('should return 1968-01-01 06:00:00 when the value is 1968-01-01 00:00:00, US/Central, UTC', function() {
			assert.equal(Occasion.startOfDay('1968-01-01 00:00:00', 'US/Central', 'UTC'), '1968-01-01 06:00:00');
		});
	});

	describe('exports.endOfDay()', function() {
		it('should return empty string when the value is not present', function() {
			assert.equal(Occasion.endOfDay(), '');
		});
		it('should return 1968-01-01 23:59:59 when the value is 1968-01-01 00:00:00', function() {
			assert.equal(Occasion.endOfDay('1968-01-01 00:00:00'), '1968-01-01 23:59:59');
		});
		it('should return 1968-01-02 05:59:59 when the value is 1968-01-01 00:00:00, US/Central, UTC', function() {
			assert.equal(Occasion.endOfDay('1968-01-01 00:00:00', 'US/Central', 'UTC'), '1968-01-02 05:59:59');
		});
	});

	describe('exports.startOfMonthClamped()', function() {
		it('should return 2000-01-01 00:00:00 when the value is new Date(2000-01-02)', function() {
			assert.equal(Occasion.startOfMonthClamped(new Date('2000-01-02')), '2000-01-01 00:00:00');
		});
		it('should return 2000-01-01 00:00:00 when the value is new Date(1999-12-30)', function() {
			assert.equal(Occasion.startOfMonthClamped(new Date('1999-12-30')), '2000-01-01 00:00:00');
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

	describe('exports.addInterval()', function() {
		it('should return same value when the 2nd param is not present', function() {
			assert.equal(Occasion.addInterval('2000-01-01 00:00:00'), '2000-01-01 00:00:00');
		});
		it('should return 1 YEAR later when the 2nd param is 1 YEAR', function() {
			assert.equal(Occasion.addInterval('2000-01-01 00:00:00', '1 YEAR'), '2001-01-01 00:00:00');
		});
		it('should return 1 YEAR before when the 2nd param is - 1 YEAR', function() {
			assert.equal(Occasion.addInterval('2000-01-01 00:00:00', '- 1 YEAR'), '1999-01-01 00:00:00');
		});
	});

	describe('exports.subInterval()', function() {
		it('should return same value when the 2nd param is not present', function() {
			assert.equal(Occasion.subInterval('2000-01-01 00:00:00'), '2000-01-01 00:00:00');
		});
		it('should return 1 YEAR before when the 2nd param is 1 YEAR', function() {
			assert.equal(Occasion.subInterval('2000-01-01 00:00:00', '1 YEAR'), '1999-01-01 00:00:00');
		});
		it('should return 1 YEAR later when the 2nd param is - 1 YEAR', function() {
			assert.equal(Occasion.subInterval('2000-01-01 00:00:00', '- 1 YEAR'), '2001-01-01 00:00:00');
		});
	});
});
