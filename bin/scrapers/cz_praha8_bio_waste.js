var
  cheerio     = require('cheerio'),
  util        = require('../util.js'),
  path        = require('path'),
  scraper     = require('../scraper.js').createScraper(path.basename(__filename, '.js'))
;

scraper.url = 'http://www.praha8.cz/Svoz-bioodpadu.html';

// district used for validation of container places
scraper.districtName = 'Praha 8';

// minimum interval between scrapes; format is moment.duration(String);
scraper.minScrapeInterval = '1.00:00:00'; // once a day

scraper.parse = function(body, callback) {
  // parse html page
  var containers = [],
    $ = cheerio.load(body);

  $('table.mcp8').find('tr:not(.mcp8TableHeaderRow)').each(function(i, elem) {
    // skip header
    var cells = $(this).find('td');
    var place_name = cells.eq(0).find('span').text().replace(/'/g,"''");

    var raw_date,
      raw_time;
    // check if there is a column with number of containers
    if (cells.eq(1).find('span').text().match(/^\d+$/)) {
      raw_date = cells.eq(2).find('span').text();
      raw_time = cells.eq(3).find('span').text();
    } else {
      raw_date = cells.eq(1).find('span').text();
      raw_time = cells.eq(2).find('span').text();
    }
    var dates = util.parseDate(raw_date, raw_time);
    containers[i] = {
      place_name: place_name,
      time_from: dates.time_from,
      time_to: dates.time_to,
      container_type: 'BIO_WASTE'
    };
  });

  // first argument of callback is null - no error was raised
  callback(null, containers);
};

module.exports = exports = scraper;