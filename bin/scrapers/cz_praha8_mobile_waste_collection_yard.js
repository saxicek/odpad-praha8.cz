var
  cheerio     = require('cheerio'),
  parserUtil  = require('../parser_util.js'),
  path        = require('path'),
  scraper     = require('../scraper.js').createScraper(path.basename(__filename, '.js'))
;

scraper.url = 'http://www.praha8.cz/Sberne-dvory';

// district used for validation of container places
scraper.districtName = 'Praha 8';

// minimum interval between scrapes; format is moment.duration(String);
scraper.minScrapeInterval = '1.00:00:00'; // once a day

// container type set to all parsed containers
scraper.containerType = 'MOBILE_WASTE_COLLECTION_YARD';

scraper.parse = function(body, callback) {
  // parse html page
  var containers = [],
    $ = cheerio.load(body);

  $('table.seda').find('tr:not(.sedaTableHeaderRow)').each(function(i) {
    // skip header
    var
      cells = $(this).find('td'),
      place_name = cells.eq(1).text(),
      raw_date = cells.eq(0).text(),
      raw_time = cells.eq(2).text().trim() + '-' + cells.eq(3).text().trim(),
      dates = parserUtil.parseDate(raw_date, raw_time);

    containers[i] = {
      place_name: place_name,
      time_from: dates.time_from,
      time_to: dates.time_to
    };
  });

  // first argument of callback is null - no error was raised
  callback(null, containers);
};

module.exports = exports = scraper;
