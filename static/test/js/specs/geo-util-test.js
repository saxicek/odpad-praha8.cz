define(['geo-util'], function(geoUtil) {

  describe('geoUtil', function() {

    describe('geoLocate', function() {
      it('should be a function', function() {
        geoUtil.geoLocate.should.be.a('function');
      });
    });

    describe('locationAddress', function() {
      it('should be a function', function() {
        geoUtil.locationAddress.should.be.a('function');
      });
      it('should search in Praha 8', function() {
        geoUtil.locationAddress('Na Pecích').should.equal('Na Pecích, Praha 8');
      });
      it('should use just the first street', function() {
        geoUtil.locationAddress('Modřínová x Javorová').should.equal('Modřínová, Praha 8');
      });
      it('should remove any additional information', function() {
        geoUtil.locationAddress('Kubíkova (u DD)').should.equal('Kubíkova, Praha 8');
        geoUtil.locationAddress('U Sluncové x Za Invalidovnou (parkoviště)').should.equal('U Sluncové, Praha 8');
      });
      it('should intelligently fix typos', function() {
        geoUtil.locationAddress('Kandertovax Lindnerova').should.equal('Kandertova, Praha 8');
      });
    });

  });

});
