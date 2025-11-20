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

    // Lista de archivos GeoJSON a cargar (cada archivo es una categoría)
    const geojsonFiles = [
        // 'general',
        'sample'
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
                marker.addTo(map);
            } else {
                map.removeLayer(marker);
            }
        });

        updateResultsList();
    }

    // Mostrar marcadores
    function displayMarkers(features) {
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
            marker.addTo(map);
            allMarkers.push(marker);
        });
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
                            .filter(f => f.g && f.g[0] !== null && f.g[1] !== null) // Filtrar features con coordenadas válidas
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
                                
                                return {
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: [feature.g[0], feature.g[1]]
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
            
            processCategories();
            displayMarkers(allFeatures);
            createFilterUI();
        } catch (error) {
            console.error('Error cargando GeoJSON:', error);
            alert('Error al cargar los datos del mapa');
        }
    }

    loadAllGeoJSON();

    // Búsqueda
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterMarkers();
    });

});