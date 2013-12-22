var config      = require('config'),
    request     = require('request'),
    cheerio     = require('cheerio'),
    db          = require('./db.js')
    util        = require('./util.js');

function scrape_containers() {
  var url = config.scrape_url
  // fetch the html page
  console.info('Fetching the page '+url);
  request.get(url, function (err, response, body) {
    if (err) {
      return console.error("Error in fetching URL\n", err);
    }
    if (response.statusCode != 200) {
      return console.error('Invalid response code ('+response.statusCode+')');
    }
    console.info('Loading the page');

    // parse html page
    var places = [],
        $ = cheerio.load(body);

    $('table.mcp8').find('tr:not(.mcp8TableHeaderRow)').each(function(i, elem) {
      // skip header
      var cells = $(this).find('td');
      var place = cells.eq(0).find('span').text().replace(/'/g,"''");
      var raw_date = cells.eq(1).find('span').text();
      var raw_time = cells.eq(2).find('span').text();
      var dates = util.parseDate(raw_date, raw_time);
      places[i] = [place, dates['time_from'], dates['time_to']];
      console.info('Found place '+places[i][0]+' ('+places[i][1]+' - '+places[i][2]+')');
    });

    db.importMapPoints(places);
  });
}

module.exports = exports = {
  scrapeContainers: scrape_containers
};
