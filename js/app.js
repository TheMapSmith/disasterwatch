/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global mapboxgl, mapboxgl, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

var map = new mapboxgl.Map({
        container: 'map',
        center: [0, 10],
        zoom: 1,
        attributionControl: true,
        minZoom: 0,
        maxZoom: 8
    });

var draw = mapboxgl.Draw({
    displayControlsDefault: false
});

map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

map.addControl(draw);
map.addControl(new mapboxgl.Navigation());
mapboxgl.accessToken = 'pk.eyJ1IjoidmluY2VudHNhcmFnbyIsImEiOiJjaWlleG1vdmowMWhydGtrc2xqcmQzNmhlIn0.80HAFLCQ6yUWCk4mwm6zbw';

map.on('style.load', function () {

    var geojson = {
      "type": "FeatureCollection",
      "features": []
    };

    map.addSource('earthquakes', {
        'type': 'geojson',
        'data': geojson
    });
    getEarthquake();

    var quakeColour = 'hsl(26, 89%, 44%)';
    map.addLayer({
        "id": "earthquakes-blur",
        "type": "circle",
        "source": "earthquakes",
        "maxzoom":9,
        "layout": {'visibility' : 'none'},
        "paint": {
            "circle-color": quakeColour,
            "circle-opacity": 0.5,
            'circle-radius': {
                'property': 'mag',
                "base": 1.8,
                'stops': [
                    [{zoom: 0,  value: 2}, 0.25],
                    [{zoom: 0,  value: 8}, 16],
                    [{zoom: 9, value: 2}, 10],
                    [{zoom: 9, value: 8}, 100]
                ]
            },
            'circle-color': {
                property: 'mag',
                stops: [
                    ['4.5', '#fff'],
                    ['8', '#f00']
                ]
            }
        }
    });

    map.addLayer({
       "id": "earthquakes-point",
       "type": "circle",
       "source": "earthquakes",
       "layout": {'visibility' : 'none'},
       "paint": {
           "circle-color": 'rgb(23, 14, 3)',
           'circle-radius': {
               "base": 1.1,
               "stops": [
                 [0, 0.5],
                 [8, 3]
               ]
           }
       },
    });

    if (document.getElementById("earthquake-checkbox").checked) {
        map.setLayoutProperty('earthquakes-point', 'visibility', 'visible');
        map.setLayoutProperty('earthquakes-blur', 'visibility', 'visible');
    } else {
        map.setLayoutProperty('earthquakes-point', 'visibility', 'none');
        map.setLayoutProperty('earthquakes-blur', 'visibility', 'none');
    }

    map.on('mousemove', function(e) {
        var mouseRadius = 1;
            if (map.getLayer("earthquakes-point").getLayoutProperty('visibility') !== 'none') {
                var feature = map.queryRenderedFeatures([[e.point.x-mouseRadius,e.point.y-mouseRadius],[e.point.x+mouseRadius,e.point.y+mouseRadius]], {layers:["earthquakes-point"]})[0];
                if (feature) {
                    map.getCanvas().style.cursor = 'pointer';

                } else {
                    map.getCanvas().style.cursor = 'inherit';
                }
            }
    }).on('click', function(e){
        var mouseRadius = 1;
        if (map.getLayer("earthquakes-point").getLayoutProperty('visibility') !== 'none') {
            var feature = map.queryRenderedFeatures([[e.point.x-mouseRadius,e.point.y-mouseRadius],[e.point.x+mouseRadius,e.point.y+mouseRadius]], {layers:["earthquakes-point"]})[0];
            if (feature) {
                var popup = new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML('<div class="nom-eq">Name: ' + feature.properties.title + '</div>' +
                                '<div class="linetab">Date: ' + moment(feature.properties.time).utc().format('YYYY-MM-DD HH:mm:ss') + '(UTC)</div>' +
                                '<div class="linetab">Magnitude: ' + feature.properties.mag + '</div>' +
                                '<div class="linetab">Felt: ' + ((feature.properties.felt === null) ? 'No' : 'Yes') + '</div>' +
                                '<div class="linetab">Duration (min): ' + feature.properties.dmin + '</div>' +
                                '<div class="linetab">Tsunami: ' + ((feature.properties.tsunami === 0) ? 'No' : 'Yes') + '</div>' +
                                '<div class="linetab"><a target="_blank" href="' + feature.properties.url + '">Info</a></div>')
                    .addTo(map);
            }
        }
    })
})

map.on('draw.create', function(e){
    "use strict";
    $(".disaster-img").addClass('in');

    $("button[dwmenu]").each(function () {
        $(this).attr('disabled', true);
    });

    map.resize();

    if (e.features[0].geometry.type === "Polygon") {
        var bbox = turf.extent(e.features[0].geometry);
        map.fitBounds(bbox, {padding: 20});
    }

    if (e.features[0].geometry.type === "Point") {
        var round = turf.buffer(e.features[0], 100, 'kilometers'),
            bbox = turf.extent(round);
        map.fitBounds(bbox, {padding: 20});
    }
})

function addDisast() {
    "use strict";
    console.log('halo');
}

function cancelAdd() {
    "use strict";
    $("button[dwmenu]").each(function () {
        $(this).attr('disabled', false);
    });
    $(".disaster-img").removeClass('in');
    map.resize();
}

$("#earthquake-checkbox").change(function () {
    "use strict";
    $("#earthquake-checkbox").parent().toggleClass('green');
    if (document.getElementById("earthquake-checkbox").checked) {
        map.setLayoutProperty('earthquakes-point', 'visibility', 'visible');
        map.setLayoutProperty('earthquakes-blur', 'visibility', 'visible');
    } else {
        map.setLayoutProperty('earthquakes-point', 'visibility', 'none');
        map.setLayoutProperty('earthquakes-blur', 'visibility', 'none');
    }
});

function getEarthquake() {
    "use strict";
    var urlusgs = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';
    $.get("https://u4h2tjydjl.execute-api.us-west-2.amazonaws.com/remotepixel/https?url=" + urlusgs)
        .done(function (data) {
             map.getSource('earthquakes').setData(data);
        });
}

function drawOnMap(type) {
    "use strict";

    draw.deleteAll();

    switch (type) {
    case 'point':
        draw.changeMode('draw_point');
        break;

    case 'polygon':
        draw.changeMode('draw_polygon');
        break;

    case null:
        break;
    }
}

function toggleParam(setting) {
    "use strict";
    switch (setting) {
    case 'basemaps':
        $('#settings-panel').removeClass('on');
        $('#settings-btn').removeClass('on');
        $('#basemaps-panel').toggleClass('on');
        $('#basemaps-btn').toggleClass('on');
        break;

    case 'settings':
        $('#basemaps-panel').removeClass('on');
        $('#basemaps-btn').removeClass('on');
        $('#settings-panel').toggleClass('on');
        $('#settings-btn').toggleClass('on');
        break;

    case 'add':
        $('#settings-panel').removeClass('on');
        $('#settings-btn').removeClass('on');
        $('#basemaps-panel').removeClass('on');
        $('#basemaps-btn').removeClass('on');
        break;

    case null:
        break;
    }
}

function getStyle(basename) {
    "use strict";

    $(".date-button").attr('disabled', 'disabled');

    switch (basename) {
    case 'MapboxMap':
        var style = 'mapbox://styles/mapbox/light-v9';
        break;

    case 'MapboxSat':
        var style = 'mapbox://styles/mapbox/satellite-streets-v9';
        break;

    default:
        $(".date-button").attr('disabled', false);
        var dateValue = document.getElementsByClassName('date-button')[0].textContent,
            basemaps_url = "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/" + basename + "/default/" + dateValue + "/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
            style = {
                "version": 8,
                "sources": {
                    "gibs-tiles": {
                        "type": "raster",
                        "tiles": [
                            basemaps_url
                        ],
                        "attribution" : [
                            ' <a href="http://openstreetmap.com">&copy; OpenStreetMap</a> ' +
                            ' <a href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs" >NASA EOSDIS GIBS</a>'
                        ],
                        "tileSize": 256
                    }
                },
                "layers": [{
                    "id": "gibs-tiles",
                    "type": "raster",
                    "source": 'gibs-tiles',
                    "minZoom": 1,
                    "maxZoom": 9
                }]
            };
            style.sources["coast"] = {
                "type": "raster",
                "tiles": [
                    "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/Reference_Features/default/0/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
                ],
                "tileSize": 256
            };
            style.sources["places"] = {
                "type": "raster",
                "tiles": [
                    "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/Reference_Labels/default/0/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
                ],
                "tileSize": 256
            };
            style.layers.push({
                "id": "coast",
                "type": "raster",
                "source": 'coast',
                "minZoom": 1,
                "maxZoom": 8
            });
            style.layers.push({
                "id": "places",
                "type": "raster",
                "source": 'places',
                "minZoom": 1,
                "maxZoom": 8
            });
    }

    return style
}

function changeOverlay(lyr_name) {
    "use strict";
    $("#basemaps-panel .side-view-content .side-element .link-on").each(function () {
        $(this).removeClass('on');
    });

    $("#" + lyr_name + " .link-on").addClass('on');
    map.setStyle(getStyle(lyr_name));
}

function update_basemaps() {
    "use strict";
    var overlay = document.getElementsByClassName('link-on on')[0].parentElement.getAttribute('id');
    map.setStyle(getStyle(overlay));
}

$(document).ready(function () {
    "use strict";

    $(".date-button").datepicker({
        format : 'yyyy-mm-dd',
        autoclose : true,
        todayHighlight : true,
        startDate : '2012-05-08',
        endDate : moment.utc().format('YYYY-MM-DD')
    }).on('changeDate', function (e) {
        var dateValue = moment(e.date).format('YYYY-MM-DD'),
            overlay = document.getElementsByClassName('link-on on')[0].parentElement.getAttribute('id');

        $(".date-button").text(dateValue);

        if (moment(dateValue).isBefore('2015-11-24')) {
            var sat = overlay.slice(0,5);
            if (sat == 'VIIRS'){
                changeOverlay('MODIS_Terra_CorrectedReflectance_TrueColor');
            }
        }
        update_basemaps();
    });

    $(".date-button").datepicker('setDate', moment.utc().subtract(1, 'days').format('YYYY-MM-DD'));

    // $('#modalUnderConstruction').modal();
});
