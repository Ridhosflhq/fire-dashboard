const API_KEY = "39266418effc2e46f90565894fd8c5dcY";


const MODIS_URL = `https://firms.modaps.eosdis.nasa.gov/api/area/json/MODIS_NRT/world/24h?key=${API_KEY}`;
const VIIRS_URL = `https://firms.modaps.eosdis.nasa.gov/api/area/json/VIIRS_SNPP_NRT/world/24h?key=${API_KEY}`;

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 15
}).addTo(map);

let modisLayer = L.layerGroup();
let viirsLayer = L.layerGroup();

let allFiresMODIS = [];
let allFiresVIIRS = [];

fetch('aoi.json')
    .then(res => res.json())
    .then(aoi => {
        const aoiLayer = L.geoJSON(aoi, {
        style: {
            color: 'red',     
            weight: 2,        
            fillColor: 'transparent', 
            fillOpacity: 0    
            }
                }).addTo(map);
        map.fitBounds(aoiLayer.getBounds());

        loadFires(aoi);


        setInterval(() => loadFires(aoi), 1800000);
    });

function loadFires(aoi) {
    modisLayer.clearLayers();
    viirsLayer.clearLayers();


    fetch(MODIS_URL)
        .then(res => res.json())
        .then(data => {
            allFiresMODIS = data.features.filter(f => turf.booleanPointInPolygon(f, aoi));
            L.geoJSON(allFiresMODIS, {
                pointToLayer: (feature, latlng) =>
                    L.circleMarker(latlng, {radius: 5, color: 'orange'}),
                onEachFeature: (feature, layer) =>
                    layer.bindPopup(`<b>MODIS Fire</b><br>Brightness: ${feature.properties.brightness}<br>Date: ${feature.properties.acq_date}`)
            }).addTo(modisLayer);

            modisLayer.addTo(map);
        });

    fetch(VIIRS_URL)
        .then(res => res.json())
        .then(data => {
            allFiresVIIRS = data.features.filter(f => turf.booleanPointInPolygon(f, aoi));
            L.geoJSON(allFiresVIIRS, {
                pointToLayer: (feature, latlng) =>
                    L.circleMarker(latlng, {radius: 5, color: 'blue'}),
                onEachFeature: (feature, layer) =>
                    layer.bindPopup(`<b>VIIRS Fire</b><br>Brightness: ${feature.properties.brightness}<br>Date: ${feature.properties.acq_date}`)
            }).addTo(viirsLayer);

            viirsLayer.addTo(map);
        });


    L.control.layers({}, {
        "MODIS Fires": modisLayer,
        "VIIRS Fires": viirsLayer
    }).addTo(map);


    updateChart();
}

function updateChart() {
    const combinedData = [...allFiresMODIS, ...allFiresVIIRS];
    const counts = {};
    combinedData.forEach(f => {
        const date = f.properties.acq_date;
        counts[date] = (counts[date] || 0) + 1;
    });

    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: 'Fires per day',
                data: Object.values(counts),
                backgroundColor: 'orange'
            }]
        }
    });
}
