/*
 * Function parses date and time interval
 */
function parse_date(date, time) {
  // expecting format '31.12.', '13.00–17.00'
  if (!date || !date.search('^\d{2}\.\d{2}\.$')) {
    console.error('Invalid date ['+date+']');
    return null;
  }
  if (!time || !time.search('^\d{2}\.\d{2}-\d{2}\.\d{2}$')) {
    console.error('Invalid time interval ['+time+']');
    return null;
  }

  var parsed_date = date.split('.');
  var parsed_time_from = time.substring(0, 5).split('.');
  var parsed_time_to = time.substring(6).split('.');
  var current_year = (new Date()).getFullYear();
  var year = null;
  var parsed_month = parsed_date[1] - 1;
  var parsed_day = parsed_date[0];

  // detect year: if current day and month > parsed day and month then set next year
  var current_month = new Date().getMonth();
  if (current_month - parsed_month > 6) {
    // set next year
    year = current_year + 1;
  } else if (current_month - parsed_month < -6) {
    // set previous year
    year = current_year - 1;
  } else {
    // set this year
    year = current_year;
  }

  return {
    'time_from': new Date(year, parsed_month, parsed_day, parsed_time_from[0], parsed_time_from[1]),
    'time_to': new Date(year, parsed_month, parsed_day, parsed_time_to[0], parsed_time_to[1])
  }
}

module.exports = exports = {
  parseDate: parse_date
};

