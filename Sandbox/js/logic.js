//Query for Last 7 days
var queryURL="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";


d3.json(queryURL,function(data){
    console.log(data);
    createFeatures(data.features);
});


function createFeatures(earthquakeData){
    // Function for each feature to be added as a popup describing the content in the popup
    function onEachFeature(feature,layer){
        layer.bindPopup("<h5><strong>Place: </strong> " + feature.properties.place +
        "</h5><hr><h5><strong>Magnitude: </strong> "+ feature.properties.mag +
        "</h5><hr><h5><strong>Time: </strong> " + new Date(feature.properties.time) + "</h5>")
    }

    // Converting the earthquake data to geoJSON and setting the marker as circleMarkers 
    var earthquakes= L.geoJSON(earthquakeData,{
        onEachFeature: onEachFeature,
        pointToLayer: function(feature,latlng){
            return L.circleMarker(latlng,{
                radius: feature["properties"]["mag"]*3.5,
                color: colorscale(feature["properties"]["mag"]),
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8

            });
        }
    });
    
    // Call the create Map function
    createMap(earthquakes);
}

// Function to return the color for each circle Marker
function colorscale(magnitude){
    if(magnitude>=0 & magnitude<=1){
        return "#86FF33";
    }
    else if(magnitude>1 & magnitude<=2){
        return "#F0FF33";
    }
    else if(magnitude>2 & magnitude<=3){
        return "#FFDA33";
    }
    else if(magnitude>3 & magnitude<=4){
        return "#FFBB33";
    }
    else if(magnitude>4 & magnitude<=5){
        return "#F48325";
    }
    else if(magnitude>5){
        return "#DE291D";
    }
}

// Create Map functon
function createMap(earthquakes){
    // Access token for mapbox
    var token="pk.eyJ1IjoiYWl5YW5hbGl6IiwiYSI6ImNqZWo2Y2dtZTFhMmMyd3FzYmIyYzBmbmUifQ.t0V5k-F-sJyWekd64sL-4g";
    // Creating Satellite Map tile Layer
    var satellitemap = L.tileLayer("https://api.mapbox.com/styles/v1/aiyanaliz/"+
    "cjera0p1a6lur2spiuo48c4jf/tiles/256/{z}/{x}/{y}?access_token="+token);
    // Creating Outdoor Map tile Layer
    var outdoormap = L.tileLayer("https://api.mapbox.com/styles/v1/aiyanaliz/"+
    "cjer9wyfi084m2snyzb88gd43/tiles/256/{z}/{x}/{y}?access_token="+token);
    // Creating Greyscale Map tile Layer
    var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token="+token);
    
    // Tectonic Plate Boundaries URL
    var tectonics_url = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
    // Creating a new Layer Group to show the tectonic boundaries
    var tectonics = new L.LayerGroup();


    // Access the tectonics URL and convert the response to geoJSON format and add to the Layergroup
    d3.json(tectonics_url,function(response){
        L.geoJSON(response,{
            color:"#FFC300",
            weight: 2
        }).addTo(tectonics);            
    })

    // Defining the baseMap controls
    var baseMaps={
        "Satellite":satellitemap,
        "Grayscale":darkmap,
        "Outdoors":outdoormap
    }
    // Defining the overlay Map contols
    var overlayMaps={
        "Earthquakes": earthquakes,
        "Fault Lines": tectonics
    };

    // Creating the map variables along with the default layers
    var myMap=L.map("map",{
        center: [0, -3.9962],
        zoom:2,
        layers:[satellitemap,tectonics],
        maxBounds: [[90,-180], [-90, 180]]
    });

    // Creating the control for selecting the map types
    L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
    }).addTo(myMap);
    
    // Creating legend control
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function (myMap) {

        var div = L.DomUtil.create('div', 'info legend')
        var limits = [0,1,2,3,4,5]
        var colors = ["#86FF33","#F0FF33","#FFDA33","#FFBB33","#F48325","#DE291D"]
        var labels = ["0-1","1-2","2-3","3-4","4-5","5+"];
        var legenddisplay = [];
        // Add min & max
        
        limits.forEach(function(limit, index) {
            legenddisplay.push("<li style=\"list-style:none;background-color: " + colors[index] + "\">"+ labels[index] +"</li>");
          });
        div.innerHTML += "<ul>" + legenddisplay.join("") + "</ul>";
        return div;
    };
    
    legend.addTo(myMap);

    // Timeline create function
    d3.json(queryURL, function(data) {
        var getInterval = function(quake) {
        // earthquake data only has a time, so we'll use that as a "start"
        // and the "end" will be that + some value based on magnitude
        // 18000000 = 30 minutes, so a quake of magnitude 5 would show on the
        // map for 150 minutes or 2.5 hours
        return {
            start: quake.properties.time,
            end:   quake.properties.time + quake.properties.mag * 1800000
        };
        };
        var timelineControl = L.timelineSliderControl({
        formatOutput: function(date) {
            return new Date(date).toString();
        }
        });
        var timeline = L.timeline(data, {
        getInterval: getInterval,
        pointToLayer: function(data, latlng){
            var hue_min = 120;
            var hue_max = 0;
            var hue = data.properties.mag / 10 * (hue_max - hue_min) + hue_min;
            return L.circleMarker(latlng, {
            radius: data.properties.mag * 3,
            weight: 1,
            opacity: 1,
            fillOpacity: 1,
            color: colorscale(data.properties.mag)
            }).bindPopup("<h5><strong>Place: </strong> " + data.properties.place +
            "</h5><hr><h5><strong>Magnitude: </strong> "+ data.properties.mag +
            "</h5><hr><h5><strong>Time: </strong> " + new Date(data.properties.time) + "</h5>");
        }
        });
        timelineControl.addTo(myMap);
        timelineControl.addTimelines(timeline);
        timeline.addTo(myMap);
    });
}