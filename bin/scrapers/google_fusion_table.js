var
    config      = require('config'),
    moment      = require('moment'),
    scraper     = require('../scraper.js').createScraper(path.basename(__filename, '.js'))
;

scraper.url = 'https://www.googleapis.com/fusiontables/v2/query?sql=SELECT%20*%20FROM%20' + config.google_fusion_table_id + '&key=' + config.fusion_tables_api_key;

// district used for validation of container places
// not used - fusion table contains name of the district
// scraper.districtName = '';

// minimum interval between scrapes; format is moment.duration(String);
scraper.minScrapeInterval = '1.00:00:00'; // once a day

// container type set to all parsed containers
// not used - fusion table contains container type
// scraper.containerType = '';

scraper.parse = function(body, callback) {
    // parse html page
    var containers = [],
        data = JSON.parse(body);

    containers = data.rows.map(function(obj) {
        var container = {};
        container.district_name = obj[0];
        container.place_name = obj[1];
        container.time_from = moment(obj[2], 'YYYY-MM-DD HH:mm').toDate();
        container.time_to = moment(obj[3], 'YYYY-MM-DD HH:mm').toDate();
        container.container_type = obj[4];
        return container;
    });

    // first argument of callback is null - no error was raised
    callback(null, containers);
};

module.exports = exports = scraper;
