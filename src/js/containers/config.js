define(function () {

  "use strict";

  return {
    // set map center
    mapCenter: [50.11, 14.47],
    // Prague 8 borders
    borders: {
      minLat: 50.082975,
      maxLat: 50.158379,
      minLng: 14.386769,
      maxLng: 14.504686
    },
    // big screen detection
    bigScreen: (document.body.clientWidth > 767),
    containerTypes: {
      "BIO_WASTE": {
        label: 'Bioodpad',
        icon: {
          icon: 'tree-deciduous',
          markerColor: 'green'
        }
      },
      "ELECTRO_WASTE": {
        label: 'Elektroodpad',
        icon: {
          icon: 'flash',
          markerColor: 'orange'
        }
      },
      "HAZARDOUS_WASTE": {
        label: 'Nebezpečný odpad',
        icon: {
          icon: 'warning-sign',
          markerColor: 'red'
        }
      },
      "TEXTILE": {
        label: 'Textil',
        icon: {
          icon: 'trash',
          markerColor: 'darkred'
        }
      },
      "BULK_WASTE": {
        label: 'Velkoobjemový odpad',
        icon: {
          icon: 'trash',
          iconColor: 'blue'
        }
      },
      "WASTE_COLLECTION_YARD": {
        label: 'Sběrný dvůr',
        icon: {
          icon: 'home',
          markerColor: 'cadetblue'
        }
      },
      // this special type is fall back variant
      // it is used for all other container types
      "__DEFAULT__": {
        label: 'Ostatní',
        icon: {
          icon: 'tree-deciduous',
          markerColor: 'green'
        }
      }
    }
  };

});

