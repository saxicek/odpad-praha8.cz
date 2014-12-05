var
  cheerio     = require('cheerio'),
  parserUtil  = require('../parser_util.js'),
  path        = require('path'),
  scraper     = require('../scraper.js').createScraper(path.basename(__filename, '.js'))
;

scraper.url = 'http://www.praha8.cz/Svoz-bioodpadu.html';

// district used for validation of container places
scraper.districtName = 'Praha 8';

// minimum interval between scrapes; format is moment.duration(String);
scraper.minScrapeInterval = '1.00:00:00'; // once a day

// container type set to all parsed containers
scraper.containerType = 'BIO_WASTE';

scraper.parse = function(body, callback) {
  // parse html page
  var containers = [],
    $ = cheerio.load(body);

  $('table.mcp8').find('tr:not(.mcp8TableHeaderRow)').each(function(i, elem) {
    // skip header
    var cells = $(this).find('td');
    var place_name = cells.eq(0).text();

    var raw_date,
      raw_time;
    // check if there is a column with number of containers
    if (cells.eq(1).text().trim().match(/^\d+$/)) {
      raw_date = cells.eq(2).text().trim();
      raw_time = cells.eq(3).text().trim();
    } else {
      raw_date = cells.eq(1).text().trim();
      raw_time = cells.eq(2).text().trim();
    }
    var dates = parserUtil.parseDate(raw_date, raw_time);
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
