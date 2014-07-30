var pg = require('../bin/db.js').pg;

exports.up = function(next){
  pg("UPDATE container SET container_type = 'BULK_WASTE';", next);
};

exports.down = function(next){
  pg("UPDATE container SET container_type = NULL;", next);
};
