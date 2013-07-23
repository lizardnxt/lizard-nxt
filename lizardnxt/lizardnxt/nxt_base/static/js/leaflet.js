// create a map in the "map" div, set the view to a given place and zoom
var map = L.map('map').setView([52.026726,4.397621], 13);


var funcLayer = new L.TileLayer.Functional(function (view) {
    var deferred = new jQuery.Deferred();
    $.ajax({
        url: '/jsonp',
        data: { url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png' },
        dataType: 'jsonp',
        success: function(response) {
            // Resolve the defered to return the URL
            var url = response.url
                .replace('{z}', view.zoom)
                .replace('{y}', view.tile.row)
                .replace('{x}', view.tile.column)
                .replace('{s}', view.subdomain);
            deferred.resolve(url);
        }
    });
    return deferred;
});

map.addLayer(funcLayer);