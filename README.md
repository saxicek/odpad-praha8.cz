# Map of waste containers in Prague
*powered by RESTify, PostGIS, and Leaflet maps*

[![Dependency Status](https://david-dm.org/saxicek/odpad-praha8.cz.svg?theme=shields.io)](https://david-dm.org/saxicek/odpad-praha8.cz)
[![devDependency Status](https://david-dm.org/saxicek/odpad-praha8.cz/dev-status.svg?theme=shields.io)](https://david-dm.org/saxicek/odpad-praha8.cz#info=devDependencies)

A basic mapping application using PostGIS, node-restify, LeafLet Maps and map tiles from several map providers, to visualize the locations of waste containers in Prague 8.

<a href='http://odpad-praha8.rhcloud.com/'><img src='http://odpad-praha8.rhcloud.com/img/odpad.png'/></a>

## Instant Provisioning on OpenShift
To deploy a clone of this application using the [`rhc` command line tool](http://rubygems.org/gems/rhc), type:

    rhc app create containers nodejs-0.10 postgresql-9.2 --from-code=https://github.com/saxicek/odpad-praha8.cz.git
    
Or, [link to a web-based **clone+deploy**](https://openshift.redhat.com/app/console/application_type/custom?name=containers&cartridges%5B%5D=nodejs-0.10&cartridges%5B%5D=postgresql-9.2&initial_git_url=https%3A%2F%2Fgithub.com%2Fsaxicek%2Fodpad-praha8.cz.git) on [OpenShift Online](http://OpenShift.com) or [your own open cloud](http://openshift.github.io):

    https://openshift.redhat.com/app/console/application_type/custom?name=containers&cartridges%5B%5D=nodejs-0.10&cartridges%5B%5D=postgresql-9.2&initial_git_url=https%3A%2F%2Fgithub.com%2Fsaxicek%2Fodpad-praha8.cz.git

A live demo is available at: [http://odpad-praha8.rhcloud.com/](http://odpad-praha8.rhcloud.com/)

## Local Development
Before you spin up a local server, you'll need a copy of the source code, and an installation of [nodejs](http://nodejs.org/).

If you created a clone of the application using the `rhc` command (above), then you should already have a local copy of the source code available.  If not, you can try cloning the repo using `git`, or taking advantage of the `rhc git-clone` command to fetch a local clone of any of your existing OpenShift applications:

    rhc git-clone containers

OpenShift will automatically resolve `package.json` dependencies for hosted applications as a normal part of it's automated build process.  In your local development environment, you'll need to run `npm install` in order to ensure that your application's package dependencies are available:

    npm install

### Installing client dependencies
Project uses Bower for management of javascript library dependencies. You have to run `bower install` to download all required JS libraries. This step is required for further building of single JS script.

### Creating single minimized javascript file for distribution
RequireJS and its utility r.js builds single javascript file `static/js/containers.js` which is used by index.html. The file is built by `grunt requirejs:prod`. For development purposes there is also target `grunt requirejs:dev` which just concatenates sources and does not minify them.

### Port-forwarding for local access to your remote db
You can set up your own postgreSQL database for local development.  But, OpenShift provides a great way to get connected to your fully hosted and configured PostgreSQL database in mere seconds.  

The `rhc port-forward` command establishes a local connection to your hosted database, where your DB permissions, table schema, and map data have already been initialized.  

The command output will provides your local connection details:

    Service    Local               OpenShift
    ---------- -------------- ---- ----------------
    node       127.0.0.1:8080  =>  127.5.199.1:8080
    postgresql 127.0.0.1:5433  =>  127.5.199.2:5432

    Press CTRL-C to terminate port forwarding

Make a note of the *local* postgresql IP address and port number, and leave the command running (in order to keep the connection open).  We will need to use these values in the next step.

### Basic Configuration
This app uses the `config` npm module, which loads it's configuration details from the `config/defaults.json` file.  This configuration takes advantage of several environment variables whenever they are available.  On OpenShift, many of these values are automatically provided for your application by their associated cartridge add-on service:

    module.exports = {
      port: process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000,
      ip: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
      pg_config: process.env.OPENSHIFT_POSTGRESQL_DB_URL || 'postgresql://127.0.0.1:5432',
      table_name: process.env.OPENSHIFT_APP_NAME || 'containers'
    }

Sensible defaults allow us to run the same code in multiple environments. 

If you plan on using the port-forwarded DB connection from the [previous step](#local-db-access) in your local development stage, then you will need to supply some additional DB authentication credentials to your application via the `OPENSHIFT_POSTGRESQL_DB_URL` environment variable. 

You can find this information by running `env` while connected to your OpenShift-hosted application over ssh, or by running the `rhc app show` command from your local machine.

    rhc app show containers

### Environment Variables
Now, set your `OPENSHIFT_POSTGRESQL_DB_URL` environment variable, substituting your own `DB_USERNAME`, `DB_PASSWORD`, `LOCAL_DB_IP`, and `LOCAL_DB_PORT`:

    export OPENSHIFT_POSTGRESQL_DB_URL="postgres://DB_USERNAME:DB_PASSWORD@LOCAL_DB_IP:LOCAL_DB_PORT"

My application's command ended up looking like this:

    export OPENSHIFT_POSTGRESQL_DB_URL="postgres://admin32jk510:X_kgB-3LfUd3@127.0.0.1:5433"

This app also expects to use a Postgres `table_name` that matches your application's name (as defined within OpenShift).  When running this application on OpenShift, the `OPENSHIFT_APP_NAME` environment variable will be automatically populated.  If you didn't name your application "containers" (the default value for this option), then you will likely need to set an extra environment variable containing your table name in your local dev environment:

    export OPENSHIFT_APP_NAME=containers

#### Testing your connection
You can verify that your port-forwarding tunnel is active, and that your environment variables are configured correctly by using them to make a DB connection using the `psql` command-line client:

    psql $OPENSHIFT_POSTGRESQL_DB_URL/$OPENSHIFT_APP_NAME

This should provide a direct connection to your OpenShift-hosted database instance.

#### Starting your Local Webserver
With your dependencies installed, your port-forwarding tunnel established, and your environment variables set, firing up a local server should be as simple as typing:

    npm start

Your dev server should be available at the default address: [localhost:3000](http://localhost:3000)

## Deploying updates to OpenShift
When you're ready, you can push changes to your OpenShift-hosted application environment using the standard `git` workflow:

1. Add your changes to a changeset:

    `git add filename1 filename2`

2. Mark the changeset as a Commit:

    `git commit -m 'describe your changes here'`

3. Push the Commit to OpenShift

    `git push`

## Geo Data
Application uses geo data from [Geoportal Praha](http://www.geoportalpraha.cz/) for validation that place is located in correct district. Dataset from [this](http://www.geoportalpraha.cz/cs/clanek/159/datove-sady-ke-stazeni#.U_86uvnV-K-) location is used. Please refer to [Geo data load](doc/geo_data_load.md) documentation for step-by-step description how to load district data.

## Parsing from Google Fusion Table
There is parser that reads container data from preconfigured Google Fusion Table. You can change the table using
environment variable `GOOGLE_FUSION_TABLE_ID`. Please also change your API key - environment variable `FUSION_TABLES_API_KEY`.   

## License
This code is licensed under the MIT License. (See LICENSE.txt)

## Acknowledgements

This application makes use of or was inspired by the following projects:

 - [BootLeaf](https://github.com/bmcbride/bootleaf)
 - [Leaflet](http://leafletjs.com/)
 - [Bootstrap](http://getbootstrap.com/)
 - [Moment.js](http://momentjs.com/)
 - [Google Maps Javascript API](https://developers.google.com/maps/documentation/javascript/)
 - [OpenShift: Instant Mapping Applications with PostGIS and Nodejs](https://www.openshift.com/blogs/instant-mapping-applications-with-postgis-and-nodejs)
 - [Google Maps tiles with Leaflet](http://matchingnotes.com/using-google-map-tiles-with-leaflet)
 - [Geoportal Praha](http://www.geoportalpraha.cz/)
