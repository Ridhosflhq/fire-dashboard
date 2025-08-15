const API_KEY = "39266418effc2e46f90565894fd8c5dc";
const FIRMS_URL = `https://firms.modaps.eosdis.nasa.gov/api/area/json/MODIS_NRT/world/24h?key=${API_KEY}`;

// Create map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

let fireLayer;
let fireData = [];

// load aoi
fetch('aoi.json')
    .then(res => res.json())
    .then(aoi => {
        L.geoJSON(aoi, {color: 'red'}).addTo(map);
        map.fitBounds(L.geoJSON(aoi).getBounds());

        // Load fires
        loadFires(aoi);

        // 30 minutes interval
        setInterval(() => loadFires(aoi), 1800000);
    });

function loadFires(aoi) {
    fetch(FIRMS_URL)
        .then(res => res.json())
        .then(data => {
            fireData = data.features.filter(f => turf.booleanPointInPolygon(f, aoi));

            if (fireLayer) map.removeLayer(fireLayer);
            fireLayer = L.geoJSON(fireData, {
                pointToLayer: (feature, latlng) => L.circleMarker(latlng, {radius: 5, color: 'orange'}),
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(`Brightness: ${feature.properties.brightness}<br>Date: ${feature.properties.acq_date}`);
                }
            }).addTo(map);

            updateChart();
        });
}

function updateChart() {
    const counts = {};
    fireData.forEach(f => {
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
