addEventListener('DOMContentLoaded', () => {
    // Inicializar mapa centrado en Tenerife
    const map = L.map('map').setView([28.2916, -16.6291], 11);

    // Añadir capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Variables globales
    let allMarkers = [];
    let allFeatures = [];
    let categories = new Map();
    let activeFilters = new Set();
    let heatmapLayer = null;
    let heatmapData = [];
    let isHeatmapActive = false;
    let municipalBoundariesLayer = null;
    let markerClusterGroup = null; // Grupo de clustering

    // Lista de archivos GeoJSON a cargar (cada archivo es una categoría)
    const geojsonFiles = [
        'general'
    ];

    // Procesar categorías
    function processCategories() {
        // Las categorías son los nombres de los archivos
        geojsonFiles.forEach(fileName => {
            const categoryFeatures = allFeatures.filter(f => f.properties.categoria === fileName);
            categories.set(fileName, categoryFeatures.length);
        });
    }

    // Crear interfaz de filtros
    function createFilterUI() {
        const container = document.getElementById('filterContainer');

        let html = '<div class="filter-title">Seleccionar categorías:</div>';
        html += `<div class="points-counter">Total: ${allFeatures.length} puntos</div>`;

        categories.forEach((count, category) => {
            const id = `category-${category.replace(/\s+/g, '-')}`;
            const displayName = category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
            html += `
                    <div class="filter-item">
                        <div class="filter-checkbox">
                            <input type="checkbox" id="${id}" value="${category}" checked>
                            <label for="${id}">
                                ${displayName}
                                <span class="category-count">(${count})</span>
                            </label>
                        </div>
                    </div>
                `;
        });

        html += '<button class="clear-filters" onclick="resetFilters()">Limpiar filtros</button>';

        container.innerHTML = html;

        // Añadir event listeners a los checkboxes
        document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', handleFilterChange);
        });
    }

    // Manejar cambios en filtros
    function handleFilterChange(e) {
        const category = e.target.value;
        if (e.target.checked) {
            activeFilters.delete(category);
        } else {
            activeFilters.add(category);
        }
        filterMarkers();
    }

    // Filtrar marcadores
    function filterMarkers() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        // Limpiar el grupo de clustering
        if (markerClusterGroup) {
            markerClusterGroup.clearLayers();
        }

        // Filtrar y añadir marcadores al grupo de clustering
        allMarkers.forEach((marker, index) => {
            const feature = allFeatures[index];
            const category = feature.properties.categoria || 'Sin categoría';
            const name = feature.properties.nombre || '';
            const description = feature.properties.descripcion || '';

            const matchesFilter = !activeFilters.has(category);
            const matchesSearch = searchTerm === '' ||
                name.toLowerCase().includes(searchTerm) ||
                description.toLowerCase().includes(searchTerm);

            if (matchesFilter && matchesSearch) {
                markerClusterGroup.addLayer(marker);
            }
        });

        updateResultsList();
    }

    // Mostrar marcadores
    function displayMarkers(features) {
        // Crear el grupo de clustering con configuración optimizada
        markerClusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            chunkInterval: 200, // Tiempo entre chunks para no bloquear la UI
            chunkDelay: 50,
            maxClusterRadius: 80, // Radio para agrupar marcadores
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 17 // Deshabilitar clustering en zoom cercano
        });

        features.forEach(feature => {
            // Verificar que tenga coordenadas válidas
            if (!feature.geometry || !feature.geometry.coordinates || 
                feature.geometry.coordinates[0] === null || 
                feature.geometry.coordinates[1] === null) {
                return; // Saltar features sin coordenadas
            }

            const coords = feature.geometry.coordinates;
            const props = feature.properties;

            const marker = L.marker([coords[1], coords[0]]);

            const popupContent = `
                    <div class="popup-content">
                        <h3>${props.nombre || props.descripcion || 'Sin nombre'}</h3>
                        <p><strong>Categoría:</strong> ${props.categoria || 'Sin categoría'}</p>
                        ${props.descripcion && props.descripcion !== props.nombre ? `<p>${props.descripcion}</p>` : ''}
                        ${props.direccion ? `<p><strong>Dirección:</strong> ${props.direccion}</p>` : ''}
                    </div>
                `;

            marker.bindPopup(popupContent);
            allMarkers.push(marker);
            markerClusterGroup.addLayer(marker); // Añadir al grupo de clustering
        });

        // Añadir el grupo de clustering al mapa
        map.addLayer(markerClusterGroup);
    }

    // Actualizar lista de resultados
    function updateResultsList() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const resultsList = document.getElementById('resultsList');

        if (searchTerm === '') {
            resultsList.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px;">Escribe para buscar comercios</p>';
            return;
        }

        const filteredFeatures = allFeatures.filter((feature, index) => {
            const category = feature.properties.categoria || 'Sin categoría';
            const name = feature.properties.nombre || '';
            const description = feature.properties.descripcion || '';

            const matchesFilter = !activeFilters.has(category);
            const matchesSearch = name.toLowerCase().includes(searchTerm) ||
                description.toLowerCase().includes(searchTerm);

            return matchesFilter && matchesSearch;
        });

        if (filteredFeatures.length === 0) {
            resultsList.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px;">No se encontraron resultados</p>';
            return;
        }

        let html = '';
        filteredFeatures.forEach((feature, index) => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;
            html += `
                    <div class="result-item" onclick="flyToMarker(${coords[1]}, ${coords[0]}, ${allFeatures.indexOf(feature)})">
                        <h4>${props.nombre || 'Sin nombre'}</h4>
                        <p>${props.categoria || 'Sin categoría'}</p>
                    </div>
                `;
        });

        resultsList.innerHTML = html;
    }

    // Volar a marcador
    window.flyToMarker = function(lat, lng, index) {
        map.flyTo([lat, lng], 16);
        allMarkers[index].openPopup();
    }

    // Reset filtros
    window.resetFilters = function() {
        activeFilters.clear();
        document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
            checkbox.checked = true;
        });
        filterMarkers();
    }

    // Cargar GeoJSON
    async function loadAllGeoJSON() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.add('active');
        }

        try {
            const promises = geojsonFiles.map(async (fileName) => {
                try {
                    const response = await fetch(`geojson/${fileName}.geojson`);
                    if (!response.ok) {
                        console.warn(`No se pudo cargar ${fileName}.geojson`);
                        return [];
                    }
                    const data = await response.json();
                    
                    // Procesar el formato comprimido si existe
                    if (data.propertyKeys && data.features) {
                        return data.features
                            .filter(f => {
                                // La longitud está en p[15] (último elemento) y la latitud en g[1]
                                const lng = f.p && f.p.length > 15 ? f.p[15] : null;
                                const lat = f.g && f.g.length > 1 ? f.g[1] : null;
                                return lng !== null && lat !== null && typeof lng === 'number' && typeof lat === 'number';
                            })
                            .map(feature => {
                                const properties = {};
                                data.propertyKeys.forEach((key, index) => {
                                    const cleanKey = key.replace(/"/g, '').trim();
                                    properties[cleanKey] = feature.p[index];
                                });
                                properties.categoria = fileName; // Añadir categoría basada en el nombre del archivo
                                
                                // Intentar obtener el nombre de diferentes campos posibles
                                properties.nombre = properties.nombre || 
                                                   properties['idactividad,descripcion'] || 
                                                   properties.descripcion || 
                                                   'Sin nombre';
                                
                                // Guardar descripción si existe
                                if (!properties.descripcion && properties['idactividad,descripcion']) {
                                    properties.descripcion = properties['idactividad,descripcion'];
                                }
                                
                                // Las coordenadas están en: lng = p[15], lat = g[1]
                                const lng = feature.p[15];
                                const lat = feature.g[1];
                                
                                return {
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: [lng, lat]
                                    },
                                    properties: properties
                                };
                            });
                    }
                    
                    // Si es formato GeoJSON estándar
                    if (data.features) {
                        return data.features.map(f => {
                            f.properties.categoria = fileName;
                            return f;
                        });
                    }
                    
                    return [];
                } catch (error) {
                    console.error(`Error cargando ${fileName}:`, error);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            allFeatures = results.flat();
            
            console.log(`Cargando ${allFeatures.length} puntos...`);
            
            processCategories();
            displayMarkers(allFeatures);
            createFilterUI();

            // Ocultar indicador de carga
            if (loadingIndicator) {
                loadingIndicator.classList.remove('active');
            }
        } catch (error) {
            console.error('Error cargando GeoJSON:', error);
            alert('Error al cargar los datos del mapa');
            
            // Ocultar indicador de carga en caso de error
            if (loadingIndicator) {
                loadingIndicator.classList.remove('active');
            }
        }
    }

    loadAllGeoJSON();

    // Cargar límites municipales
    async function loadMunicipalBoundaries() {
        try {
            const response = await fetch('geojson/municipal_boundaries.geojson');
            const data = await response.json();
            
            municipalBoundariesLayer = L.geoJSON(data, {
                style: {
                    color: '#666',
                    weight: 2,
                    opacity: 0.6,
                    fillColor: 'transparent',
                    fillOpacity: 0
                }
            }).addTo(map);
            
            console.log('Municipal boundaries loaded');
        } catch (error) {
            console.error('Error loading municipal boundaries:', error);
        }
    }

    // Cargar datos del heatmap
    async function loadHeatmapData() {
        try {
            const response = await fetch('geojson/heatmap_data.geojson');
            const data = await response.json();
            
            // Convertir desde GeoJSON a formato [[lat, lng, intensity], ...]
            if (data.features && Array.isArray(data.features)) {
                heatmapData = data.features.map(feature => {
                    const coords = feature.geometry.coordinates;
                    const intensity = feature.properties.intensity || 0.5;
                    return [coords[1], coords[0], intensity]; // lat, lng, intensity
                });
            } else if (Array.isArray(data)) {
                heatmapData = data.map(point => [point[0], point[1], point[2]]);
            } else {
                heatmapData = [];
            }
            
            // Crear la capa de heatmap (pero no añadirla aún)
            heatmapLayer = L.heatLayer(heatmapData, {
                radius: 15,
                blur: 10,
                minOpacity: 0.4,
                gradient: {
                    0.0: '#0000ff',
                    0.2: '#00ffff', 
                    0.4: '#00ff00',
                    0.6: '#ffff00',
                    0.8: '#ff8000',
                    1.0: '#ff0000'
                }
            });
            
            console.log('Heatmap data loaded:', heatmapData.length, 'points');
        } catch (error) {
            console.error('Error loading heatmap data:', error);
        }
    }

    // Toggle heatmap
    function toggleHeatmap() {
        const button = document.getElementById('toggleHeatmap');
        
        if (!heatmapLayer) {
            console.error('Heatmap layer not loaded yet');
            return;
        }
        
        if (isHeatmapActive) {
            // Desactivar heatmap, mostrar marcadores
            map.removeLayer(heatmapLayer);
            if (markerClusterGroup) {
                map.addLayer(markerClusterGroup);
            }
            button.classList.remove('active');
            isHeatmapActive = false;
        } else {
            // Activar heatmap, ocultar marcadores
            if (markerClusterGroup) {
                map.removeLayer(markerClusterGroup);
            }
            heatmapLayer.addTo(map);
            button.classList.add('active');
            isHeatmapActive = true;
        }
    }

    // Event listener para el botón de heatmap
    document.getElementById('toggleHeatmap').addEventListener('click', toggleHeatmap);

    // Cargar capas adicionales
    loadMunicipalBoundaries();
    loadHeatmapData();

    // Búsqueda
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterMarkers();
    });

});