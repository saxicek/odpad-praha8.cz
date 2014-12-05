var
  cheerio     = require('cheerio'),
  parserUtil  = require('../parser_util.js'),
  path        = require('path'),
  scraper     = require('../scraper.js').createScraper(path.basename(__filename, '.js'))
;

scraper.url = 'http://www.praha8.cz/Kontejnery-na-elektrozarizeni';

// district used for validation of container places
scraper.districtName = 'Praha 8';

// minimum interval between scrapes; format is moment.duration(String);
scraper.minScrapeInterval = '1.00:00:00'; // once a day

// container type set to all parsed containers
scraper.containerType = 'ELECTRO_WASTE';

// all existing containers should be removed
scraper.removeExisting = true;

scraper.parse = function(body, callback) {
  // parse html page
  var containers = [],
    $ = cheerio.load(body);

  $('table.mcp8').find('tr:not(.mcp8TableHeaderRow)').each(function(i, elem) {
    // skip header
    var cells = $(this).find('td');
    var place_name = cells.eq(2).text();

    containers[i] = {
      place_name: place_name,
      time_from: null,
      time_to: null
    };
  });

  // first argument of callback is null - no error was raised
  callback(null, containers);
};

module.exports = exports = scraper;
