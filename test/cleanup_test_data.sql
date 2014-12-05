/*
SELECT DISTINCT scraper_name FROM scrape_status;
SELECT DISTINCT place_name FROM place ORDER BY place_name;
SELECT DISTINCT district_name FROM district ORDER BY district_name;
*/
DELETE FROM scrape_status WHERE scraper_name LIKE 'test_scraper%' OR scraper_name IS NULL;
DELETE FROM container
 WHERE place_id IN (SELECT id FROM place WHERE place_name LIKE 'test_place%' OR place_name LIKE 'TEST_SCRAPE_PLACE%')
    OR container_type LIKE 'TEST_CONTAINER_TYPE%';
DELETE FROM place WHERE place_name LIKE 'test_place%' OR place_name LIKE 'TEST_SCRAPE_PLACE%';
DELETE FROM district WHERE district_name LIKE 'TEST_SCRAPE_DISTRICT%';
