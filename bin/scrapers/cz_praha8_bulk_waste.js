var
  cheerio     = require('cheerio'),
  util        = require('../util.js'),
  path        = require('path'),
  scraper     = require('../scraper.js').createScraper(path.basename(__filename, '.js'))
;

scraper.url = 'http://www.praha8.cz/Velkoobjemove-kontejnery';

// district used for validation of container places
scraper.districtName = 'Praha 8';

// minimum interval between scrapes; format is moment.duration(String);
scraper.minScrapeInterval = '1.00:00:00'; // once a day

scraper.parse = function(body, callback) {
  // parse html page
  var containers = [],
    $ = cheerio.load(body);

  $('table.mcp8').each(function() {
    var
      place_idx,
      time_idx,
      date_idx;

    // detect which column has what information
    $(this).find('tr.mcp8TableHeaderRow').find('td').each(function(i) {
      var value = $(this).text();
      if (value.indexOf('Místo') > -1 || value.indexOf('Lokalita') > -1) {
        place_idx = i;
      } else if (value.indexOf('Datum') > -1) {
        date_idx = i;
      } else if (value.indexOf('Čas') > -1 || value.indexOf('Ćas') > -1) {
        time_idx = i;
      }
    });

    $(this).find('tr:not(.mcp8TableHeaderRow)').each(function() {
      // skip header
      var
        cells,
        place_name,
        raw_date,
        raw_time,
        dates;

      cells = $(this).find('td');
      place_name = cells.eq(place_idx).text().trim().replace(/'/g,"''");
      raw_date = cells.eq(date_idx).text().trim();
      raw_time = cells.eq(time_idx).text().trim();
      dates = util.parseDate(raw_date, raw_time);
      containers.push({
        place_name: place_name,
        time_from: dates.time_from,
        time_to: dates.time_to,
        container_type: 'BULK_WASTE'
      });
    });

  });

  // first argument of callback is null - no error was raised
  callback(null, containers);
};

module.exports = exports = scraper;
