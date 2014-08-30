# Loading geo data into PostgreSQL
Application uses geo data from [Geoportal Praha](http://www.geoportalpraha.cz/) for validations. Specifically for validation that `place` is located in correct `district` is used [this](http://www.geoportalpraha.cz/cs/clanek/159/datove-sady-ke-stazeni#.U_86uvnV-K-) dataset.

1. Download MC.zip and extract it.

2. Transform [S-JTSK / Krovak East North](http://geoportal.cuzk.cz/(S(jefzbmm3ocvmh0qaocrtw3tr))/Default.aspx?lng=EN&mode=TextMeta&side=sit.trans&text=souradsystemy) to _WGS 84_. I used QGIS for this task as PostGIS does not support EPSG 5514. Just add vector layer (Ctrl+Shift+V) and then Layer -> Save As... Choose WSG 84 as SRS and confirm.

3. Export MC.shp to insert script. It creates table import_mc with data structure based on original dataset:

    `shp2pgsql -I -s 4326 -W "Windows-1250" MC.shp import_mc > import_mc.sql`

4. Load import_mc.sql to database. It creates new table IMPORT_MC.

5. Insert data from IMPORT_MC to DISTRICT table:
    ```sql
    INSERT INTO district
      (district_name
      ,description
      ,the_geom)
      SELECT nazev
            ,nazev_1
            ,geom
        FROM import_mc
       WHERE nazev NOT IN (SELECT district_name FROM district);
    ```

5. Drop IMPORT_MC table.
