module.exports = {
  siteUrl: 'http://odpad-praha8.rhcloud.com',
  port: process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000,
  ip: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
  pg_config: process.env.OPENSHIFT_POSTGRESQL_DB_URL || 'postgresql://127.0.0.1:5432',
  schema_name: process.env.OPENSHIFT_APP_NAME || process.env.PG_MAP_TABLE_NAME || 'odpad',
  scrape_interval: 60 * 60 * 1000, // hourly (in milliseconds)
  db_inserts_parallel_limit: 5, // number of inserts into DB we want to run in parallel

  // google_fusion_table scraper
  google_fusion_table_id: process.env.GOOGLE_FUSION_TABLE_ID || '1nE1D6lm8qrW6CTJuP0bHiR_tZ_oHd62Qqo7xuj2T',
  fusion_tables_api_key:  process.env.FUSION_TABLES_API_KEY || 'AIzaSyDUcLHUJTfdg26-GsNTATPStvTLJI4oU4k'
};
