/*
 * Function parses date and time interval
 */
function date_without_year(date) {
  var parsed_date = date.split('.');
  var parsed_month = parsed_date[1] - 1;
  var parsed_day = parsed_date[0];
  var current_year = (new Date()).getFullYear();
  var year = null;

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

  return [year, parsed_month, parsed_day];
}

function date_with_year(date) {
  var parsed_date = date.split('.');
  return [parsed_date[2], parsed_date[1] - 1, parsed_date[0]];
}

function parse_date(date, time) {
  var date_fields,
    time_from_fields,
    time_to_fields;
  if (!date) {
    console.error('Missing date!');
    return;
  }
  // remove spaces
  date = date.replace(' ', '');

  if (date.search(/^\d{1,2}\.\d{1,2}\.$/) != -1) {
    // expecting date format '31.12.'
    date_fields = date_without_year(date);
  } else if (date.search(/^\d{1,2}\.\d{1,2}\.\d{4}$/) != -1) {
    // expecting date format '31.12.2014'
    date_fields = date_with_year(date);
  } else {
    console.error('Invalid date ['+date+']');
    return;
  }

  if (!time) {
    console.error('Missing time interval!');
    return;
  } else if (time.search(/^\d{1,2}\.\d{2}[-\u2013]\d{1,2}\.\d{2}.*$/) != -1) {
    // expecting time format '13.00–17.00.*'
    time_from_fields = time.substring(0, 5).split('.');
    time_to_fields = time.substring(6, 11).split('.');
  } else if (time.search(/^\d{1,2}\.\d{2} [-\u2013]\d{1,2}\.\d{2}.*$/) != -1) {
    // time format with typo '13.00 –17.00.*'
    time_from_fields = time.substring(0, 5).split('.');
    time_to_fields = time.substring(7, 12).split('.');
  } else {
    console.error('Invalid time interval ['+time+']');
    return;
  }

  return {
    'time_from': new Date(date_fields[0], date_fields[1], date_fields[2], time_from_fields[0], time_from_fields[1]),
    'time_to': new Date(date_fields[0], date_fields[1], date_fields[2], time_to_fields[0], time_to_fields[1])
  };
}

function split_date_list(date_list) {
  var
    dates,
    year,
    year_index;
  if (date_list) {
    // search for year
    year_index = date_list.search(/\d{2}\.\d{2}\.\d{4}/);

    if (year_index != -1) {
      year = date_list.slice(year_index + 6, year_index + 10);
      dates = date_list.split(',');
      // iterate through dates and modify them where required
      dates.forEach(function(value, index, array) {
        if (value.search(/\d{2}\.\d{2}\.\d{4}/) == -1) {
          // add year to date string
          array[index] = value.trim() + year;
        } else {
          array[index] = value.trim();
        }
      });
    }
  }
  return dates;
}

function normalize_place(place) {
  if (!place) return null;
  return place
    .replace(/\u00A0/g, ' ')
    .replace(/[ ]+/g, ' ');
}

module.exports = exports = {
  parseDate: parse_date,
  splitDateList: split_date_list,
  dateWithoutYear: date_without_year,
  normalizePlace: normalize_place
};

