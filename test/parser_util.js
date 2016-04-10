/* Disable Chai Expect jshint errors: https://github.com/chaijs/chai/issues/41 */
/* jshint -W024 */
/* jshint expr:true */
var expect   = require('chai').expect,
    sinon    = require('sinon'),
  parserUtil = require('../bin/parser_util.js');

describe('parserUtil', function() {

  describe('parseDate()', function() {
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function() {
      this.clock = sinon.useFakeTimers((new Date(2012, 11, 15)).getTime(), 'Date');
    });

    it('should expose a function', function () {
      expect(parserUtil.parseDate).to.be.a('function');
    });

    it('should parse valid input', function() {
      expect(parserUtil.parseDate('31.12.', '13.00-17.00')).to.eql({
        'time_from': new Date(2012, 11, 31, 13, 0),
        'time_to': new Date(2012, 11, 31, 17, 0)
      });
    });

    it('should support unicode "en dash" character', function() {
      expect(parserUtil.parseDate('31.12.', '13.00\u201317.00')).to.eql({
        'time_from': new Date(2012, 11, 31, 13, 0),
        'time_to': new Date(2012, 11, 31, 17, 0)
      });
    });

    it('should set date to next year if current date > parsed date', function() {
      expect(parserUtil.parseDate('01.01.', '13.00-17.00')).to.eql({
        'time_from': new Date(2013, 0, 1, 13, 0),
        'time_to': new Date(2013, 0, 1, 17, 0)
      });
    });

    it('should parse valid input', function() {
      expect(parserUtil.parseDate('31.12.2014', '13.00-17.00 hod.')).to.eql({
        'time_from': new Date(2014, 11, 31, 13, 0),
        'time_to': new Date(2014, 11, 31, 17, 0)
      });
    });

    it('should parse input with space in time interval', function() {
      expect(parserUtil.parseDate('31.12.2014', '13.00 -17.00 hod.')).to.eql({
        'time_from': new Date(2014, 11, 31, 13, 0),
        'time_to': new Date(2014, 11, 31, 17, 0)
      });
    });

    it('should parse input with space in date', function() {
      expect(parserUtil.parseDate('31. 12.', '13.00-17.00 hod.')).to.eql({
        'time_from': new Date(2012, 11, 31, 13, 0),
        'time_to': new Date(2012, 11, 31, 17, 0)
      });
    });

    after(function() {
      this.clock.restore();
    });
  });

  describe('parseDate()', function() {
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function() {
      this.clock = sinon.useFakeTimers((new Date(2013, 2, 15)).getTime(), 'Date');
    });

    it('should parse valid input', function() {
      expect(parserUtil.parseDate('31.2.', '13.00-17.00')).to.eql({
        'time_from': new Date(2013, 1, 31, 13, 0),
        'time_to': new Date(2013, 1, 31, 17, 0)
      });
    });

    it('should parse valid input', function() {
      expect(parserUtil.parseDate('31.1.', '13.00-17.00')).to.eql({
        'time_from': new Date(2013, 0, 31, 13, 0),
        'time_to': new Date(2013, 0, 31, 17, 0)
      });
    });

    it('should set date to previous year if current date < parsed date', function () {
      expect(parserUtil.parseDate('01.12.', '13.00-17.00')).to.eql({
        'time_from':new Date(2012, 11, 1, 13, 0),
        'time_to':new Date(2012, 11, 1, 17, 0)
      });
    });

    after(function() {
      this.clock.restore();
    });
  });

  describe('splitDateList()', function() {
    // parse date is sensitive to current date since it is
    // guessing year from current date and input parameters
    before(function() {
      this.clock = sinon.useFakeTimers((new Date(2016, 2, 15)).getTime(), 'Date');
    });

    it('should expose a function', function () {
      expect(parserUtil.splitDateList).to.be.a('function');
    });

    it('should parse valid input with year', function() {
      expect(parserUtil.splitDateList('17.03., 28.04., 07.07., 15.09., 27.10.2014')).to.eql([
        '17.03.2014',
        '28.04.2014',
        '07.07.2014',
        '15.09.2014',
        '27.10.2014'
      ]);
    });

    it('should parse valid input without year', function() {
      expect(parserUtil.splitDateList('27. 4. (st), 1. 6. (st), 8. 9. (čt), 25. 10. (út)')).to.eql([
        '27.04.2016',
        '01.06.2016',
        '08.09.2016',
        '25.10.2016'
      ]);
    });

    after(function() {
      this.clock.restore();
    });
  });

  describe('normalizePlace()', function() {
    it('should expose a function', function() {
      expect(parserUtil.normalizePlace).to.be.a('function');
    });

    it('should support null on input', function() {
      expect(parserUtil.normalizePlace(null)).to.equal.null;
    });
    it('should remove &nbsp;', function() {
      expect(parserUtil.normalizePlace('a\u00A0b')).to.equal('a b');
      expect(parserUtil.normalizePlace('First\u00A0and\u00A0second.')).to.equal('First and second.');
    });

    it('should remove double spaces', function() {
      expect(parserUtil.normalizePlace('a  b')).to.equal('a b');
      expect(parserUtil.normalizePlace('a\u00A0\u00A0b')).to.equal('a b');
      expect(parserUtil.normalizePlace('First\u00A0\u00A0and\u00A0\u00A0second     and\u00A0third.')).to.equal('First and second and third.');
    });

    it('should trim spaces', function() {
      expect(parserUtil.normalizePlace(' test ')).to.equal('test');
    });

    it('should replace one single quote with two single quotes', function() {
      expect(parserUtil.normalizePlace("'")).to.equal("''");
    });
  });

});
