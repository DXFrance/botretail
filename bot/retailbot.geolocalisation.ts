exports.Geolocalisation = {

  getDistanceFromLatLonInKm: function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    var R = 6371;
    var dLat = this.deg2rad(lat2-lat1);
    var dLon = this.deg2rad(lon2-lon1);
    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
  },
  deg2rad: function deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }
  
}
