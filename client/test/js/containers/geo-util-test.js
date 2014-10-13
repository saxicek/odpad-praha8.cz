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
      it('should search in Praha by default', function() {
        geoUtil.locationAddress('Na Pecích').should.equal('Na Pecích, Praha');
      });
      it('should use just the first street', function() {
        geoUtil.locationAddress('Modřínová x Javorová').should.equal('Modřínová, Praha');
      });
      it('should remove any additional information', function() {
        geoUtil.locationAddress('Kubíkova (u DD)').should.equal('Kubíkova, Praha');
        geoUtil.locationAddress('U Sluncové x Za Invalidovnou (parkoviště)').should.equal('U Sluncové, Praha');
      });
      it('should intelligently fix typos', function() {
        geoUtil.locationAddress('Kandertovax Lindnerova').should.equal('Kandertova, Praha');
      });
      it('should use district name if passed', function() {
        geoUtil.locationAddress('Kandertovax Lindnerova', 'Praha 8').should.equal('Kandertova, Praha 8');
      });
      it('should remove any additional information', function() {
        geoUtil.locationAddress('ul. Opálkova (u autobazaru)').should.equal('Opálkova, Praha');
      });
      it('should remove any additional information', function() {
        geoUtil.locationAddress('křižovatka ul. Drahanská – Chlumínská').should.equal('Drahanská, Praha');
      });
      it('should remove &nbsp;', function() {
        geoUtil.locationAddress('křižovatka ul.&nbsp;Ke&nbsp;Stírce – Pod&nbsp;Statky').should.equal('Ke Stírce, Praha');
      });
    });

  });

});
