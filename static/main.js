
const map = L.map('map').setView([0,0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const content = e.target.result;
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content: content })
                });
                const data = await response.json();
                if (data.status === "success") {
                    // Parse and add geometries to the map
                    const redStyle = { color: "red" };
                    const thinStyle = { color: "green", weight: 1 };
                    const blackStyle = { color: "black", weight: 2 };

                    const geometries_gdf = JSON.parse(data.geometries_gdf);
                    const geometries_gdf1 = JSON.parse(data.geometries_gdf1);
                    const geometries_gdf2 = JSON.parse(data.geometries_gdf2);

                    // get geometries from geometries_gdf and add them to the map
                    const polygons_gdf = geometries_gdf.features.map(feature => feature.geometry);
                    const polygons_gdf1 = geometries_gdf1.features.map(feature => feature.geometry);
                    const polygons_gdf2 = geometries_gdf2.features.map(feature => feature.geometry);

                    const geoJsonLayer2 = L.geoJSON(polygons_gdf1, { style: redStyle }).addTo(map);
                    const geoJsonLayer1 = L.geoJSON(polygons_gdf, { style: thinStyle }).addTo(map);
                    const geoJsonLayer3 = L.geoJSON(polygons_gdf2, { style: blackStyle }).addTo(map);

                    // zoom the map to the bounds of the geometries
                    map.fitBounds(geoJsonLayer1.getBounds());

                    // Store the layers globally for later use
                    window.geoJsonLayers = [geoJsonLayer1, geoJsonLayer2, geoJsonLayer3];

                    // Save each polygon in geometries_gdf to a variable
                    window.polygons_gdf = geometries_gdf.features.map(feature => feature.geometry);
                    window.polygons_gdf1 = geometries_gdf1.features.map(feature => feature.geometry);
                    window.polygons_gdf2 = geometries_gdf2.features.map(feature => feature.geometry);

                    // Dane dla konturów
                    window.idKonturu = geometries_gdf1.features.map(feature => feature.properties.idKonturu);
                    window.OZU = geometries_gdf1.features.map(feature => feature.properties.OZU);
                    window.OZK = geometries_gdf1.features.map(feature => feature.properties.OZK);

                    // Dane dla działek
                    window.idDzialki = geometries_gdf.features.map(feature => feature.properties.idDzialki);
                    window.numerKW = geometries_gdf.features.map(feature => feature.properties.numerKW);
                    window.poleEwidencyjne = geometries_gdf.features.map(feature => feature.properties.poleEwidencyjne);

                    // Dane dla budynków
                    window.idBudynku = geometries_gdf2.features.map(feature => feature.properties.idBudynku);
                    window.liczbaKondygnacjiNadziemnych = geometries_gdf2.features.map(feature => feature.properties.liczbaKondygnacjiNadziemnych);
                    window.liczbaKondygnacjiPodziemnych = geometries_gdf2.features.map(feature => feature.properties.liczbaKondygnacjiPodziemnych);
                    window.powZabudowy = geometries_gdf2.features.map(feature => feature.properties.powZabudowy);


                } else {
                    alert("Error: " + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
        reader.readAsText(file);
    }
});

// if user clicks on the map, show the coordinates in the frame in the top right corner
map.on('click', function (e) {
    const coordinatesDiv = document.getElementById('coordinates');
    const lat = e.latlng.lat.toFixed(5);
    const lng = e.latlng.lng.toFixed(5);
    coordinatesDiv.innerText = `Coordinates: ${lat}, ${lng} \n`;

    // Check if point is within any of the polygons in geometries_gdf
    if (window.polygons_gdf) {
        for (const polygon of window.polygons_gdf) {
            if (turf.booleanPointInPolygon(turf.point([lng, lat]), polygon)) {
                createDzialkiButton();
                break;
            }
        }
    }

    // Check if point is within any of the polygons in geometries_gdf1
    if (window.polygons_gdf1) {
        for (const polygon of window.polygons_gdf1) {
            if (turf.booleanPointInPolygon(turf.point([lng, lat]), polygon)) {
                createKonturyButton();
                break;
            }
        }
    }

    // Check if point is within any of the polygons in geometries_gdf2
    if (window.polygons_gdf2) {
        for (const polygon of window.polygons_gdf2) {
            if (turf.booleanPointInPolygon(turf.point([lng, lat]), polygon)) {
                createBudynkiButton();
                break;
            }
        }
    }


    // function to create a button
    function createDzialkiButton() {
        const button1 = document.createElement('button');
        button1.innerText = 'Wybierz działki';
        button1.onclick = function() {
            coordinatesDiv.innerText = "Wybrano działkę";
            // check in which polygon the point is and return the polygons coordinates
            for (const polygon of window.polygons_gdf) {
                if (turf.booleanPointInPolygon(turf.point([lng, lat]), polygon)) {
                    const coordinates = polygon.coordinates;
                    console.log(coordinates);
                    // print lat and lng of the polygon
                    let latlngs = coordinates[0].map(function (coord) {
                        return coord[1].toFixed(5) + ', ' + coord[0].toFixed(5);
                    });
                    coordinatesDiv.innerText = 'Współrzędne działki: ';
                    for (const coord of latlngs) {
                        coordinatesDiv.innerText += '\n' + coord;
                    }
                    const index = window.polygons_gdf.findIndex(p => JSON.stringify(p.coordinates) === JSON.stringify(polygon.coordinates));
                    const idDzialki = window.idDzialki[index];
                    coordinatesDiv.innerText += '\n' + 'ID działki: ' + idDzialki;

                    const numerKW = window.numerKW[index];
                    coordinatesDiv.innerText += '\n' + 'Numer KW: ' + numerKW;

                    const poleEwidencyjne = window.poleEwidencyjne[index];
                    coordinatesDiv.innerText += '\n' + 'Pole ewidencyjne: ' + poleEwidencyjne;

                    break;
                }
                
            }
        };
        coordinatesDiv.appendChild(button1);
    };

    // function - kontury button
    function createKonturyButton() {
        const button2 = document.createElement('button');
        button2.innerText = 'Wybierz kontury';
        button2.onclick = function() {
            coordinatesDiv.innerText = "Wybrano kontury";
            // check in which polygon the point is and return the polygons coordinates
            for (const polygon of window.polygons_gdf1) {
                if (turf.booleanPointInPolygon(turf.point([lng, lat]), polygon)) {
                    const coordinates = polygon.coordinates;
                    console.log(coordinates);
                    // print lat and lng of the polygon
                    let latlngs = coordinates[0].map(function (coord) {
                        return coord[1].toFixed(5) + ', ' + coord[0].toFixed(5);
                    });
                    coordinatesDiv.innerText = 'Współrzęne konturów: ';
                    for (const coord of latlngs) {
                        coordinatesDiv.innerText += '\n' + coord;
                    }

                    const index = window.polygons_gdf1.findIndex(p => JSON.stringify(p.coordinates) === JSON.stringify(polygon.coordinates));
                    const idKonturu = window.idKonturu[index];
                    coordinatesDiv.innerText += '\n' + 'ID konturu: ' + idKonturu;

                    const OZU = window.OZU[index];
                    coordinatesDiv.innerText += '\n' + 'OZU: ' + OZU;

                    const OZK = window.OZK[index];
                    coordinatesDiv.innerText += '\n' + 'OZK: ' + OZK;

                    break;
                }
            }
        };
        coordinatesDiv.appendChild(button2);
    };

    // function - budynki button
    function createBudynkiButton() {
        const button3 = document.createElement('button');
        button3.innerText = 'Wybierz budynki';
        button3.onclick = function() {
            coordinatesDiv.innerText = "Wybrano budynek";
            // check in which polygon the point is and return the polygons coordinates
            for (const polygon of window.polygons_gdf2) {
                if (turf.booleanPointInPolygon(turf.point([lng, lat]), polygon)) {
                    const coordinates = polygon.coordinates;
                    console.log(coordinates);
                    // print lat and lng of the polygon
                    let latlngs = coordinates[0][0].map(function (coord) {
                        return coord[1].toFixed(5) + ', ' + coord[0].toFixed(5);
                    });
                    coordinatesDiv.innerText = 'Współrzędne budynku: ';
                    for (const coord of latlngs) {
                        coordinatesDiv.innerText += '\n' + coord;
                    }
                    const index = window.polygons_gdf2.findIndex(p => JSON.stringify(p.coordinates) === JSON.stringify(polygon.coordinates));
                    const idBudynku = window.idBudynku[index];
                    coordinatesDiv.innerText += '\n' + 'ID budynku: ' + idBudynku;

                    const liczbaKondygnacjiNadziemnych = window.liczbaKondygnacjiNadziemnych[index];
                    coordinatesDiv.innerText += '\n' + 'Liczba kondygnacji nadziemnych: ' + liczbaKondygnacjiNadziemnych;

                    const liczbaKondygnacjiPodziemnych = window.liczbaKondygnacjiPodziemnych[index];
                    coordinatesDiv.innerText += '\n' + 'Liczba kondygnacji podziemnych: ' + liczbaKondygnacjiPodziemnych;

                    const powZabudowy = window.powZabudowy[index];
                    coordinatesDiv.innerText += '\n' + 'Powierzchnia zabudowy: ' + powZabudowy;
                    
                    break;
                }
                
            }
        };
        coordinatesDiv.appendChild(button3);
    };
});
