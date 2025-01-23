
const map = L.map('map').setView([0,0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

document.getElementById('fileInput').addEventListener('change', function(event) {
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = async function(e) {
            var content = e.target.result;
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
                    const thinStyle = { weight: 1 };

                    const geometries_gdf = JSON.parse(data.geometries_gdf);
                    const geometries_gdf1 = JSON.parse(data.geometries_gdf1);

                    const geoJsonLayer1 = L.geoJSON(geometries_gdf, { style: redStyle }).addTo(map);
                    const geoJsonLayer2 = L.geoJSON(geometries_gdf1, { style: thinStyle }).addTo(map);

                    map.fitBounds(geoJsonLayer1.getBounds());

                    // Store the layers globally for later use
                    window.geoJsonLayers = [geoJsonLayer1, geoJsonLayer2];

                    // Save each polygon in geometries_gdf to a variable
                    window.polygons_gdf = geometries_gdf.features.map(feature => feature.geometry);
                    window.polygons_gdf1 = geometries_gdf1.features.map(feature => feature.geometry);

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
    coordinatesDiv.innerText = `Coordinates: ${lat}, ${lng}`;

    // Check if clicked place is within the bounds of drawn geometries
    let withinBounds = false;
    let withinBounds1 = false;

    // Check if point is within any of the polygons in geometries_gdf
    if (window.polygons_gdf) {
        for (const polygon of window.polygons_gdf) {
            if (turf.booleanPointInPolygon(turf.point([lng, lat]), polygon)) {
                withinBounds = true;
                break;
            }
        }
    }

    // Check if point is within any of the polygons in geometries_gdf1
    if (window.polygons_gdf1) {
        for (const polygon of window.polygons_gdf1) {
            if (turf.booleanPointInPolygon(turf.point([lng, lat]), polygon)) {
                withinBounds1 = true;
                break;
            }
        }
    }

    if (withinBounds || withinBounds1) {
        coordinatesDiv.style.color = "green";
        // check in which polygon the point is
        if (withinBounds1) {
            if (withinBounds) {
                coordinatesDiv.innerText += '\n' + " (kliknięte w działkach i konturach)" + '\n';
                // give the user the option to choose which polygon to select - show 2 buttons
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
                            break;
                        }
                        
                    }
                };
                coordinatesDiv.appendChild(button1);

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
                            break;
                        }
                    }
                };
                coordinatesDiv.appendChild(button2);
                
            } else {
                
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
                        break;
                    }
                }
            }
        } else {
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
                    break;
                }
                
            }
        }
    } else {
        coordinatesDiv.style.color = "black";
    }
});