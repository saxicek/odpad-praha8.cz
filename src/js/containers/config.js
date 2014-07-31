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
    bigScreen: (document.body.clientWidth > 767)
  };

});

