# Mapa de Comercio - Tenerife

Aplicación web estática y minimalista para visualizar datos geográficos de comercios y servicios en Tenerife mediante mapas interactivos.

## 🗺️ Características

- **Mapa interactivo** con OpenStreetMap y Leaflet
- **Panel de búsqueda** en tiempo real por nombre o descripción
- **Panel de filtros** por categorías (cada archivo GeoJSON es una categoría)
- **Visualización de marcadores** con información detallada en popups
- **Diseño responsive** adaptado a diferentes dispositivos
- **Sin dependencias del servidor** - funciona como sitio estático

## 📁 Estructura del Proyecto

```
tenerife-comercio-simple/
├── index.html          # Página principal
├── style.css          # Estilos de la aplicación
├── script.js          # Lógica de la aplicación
├── geojson/           # Carpeta con archivos GeoJSON
│   ├── sample.geojson
│   ├── actividad.geojson
│   ├── administracion.geojson
│   ├── agricultura.geojson
│   ├── alimentacion.geojson
│   ├── ciudadania.geojson
│   ├── comercio.geojson
│   ├── deporte.geojson
│   ├── educacion.geojson
│   ├── hosteleria.geojson
│   ├── industria.geojson
│   ├── locales.geojson
│   ├── medicina.geojson
│   ├── otros.geojson
│   ├── recursos_emprender.geojson
│   ├── recursos_socioculturales.geojson
│   ├── servicios.geojson
│   └── transporte.geojson
└── README.md          # Este archivo
```

## 🚀 Uso

### Instalación Local

1. Clona o descarga este repositorio
2. Abre `index.html` directamente en un navegador web, o
3. Usa un servidor local como:

   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js con http-server
   npx http-server
   
   # VS Code con Live Server o Five Server
   ```

4. Accede a `http://localhost:8000` (o el puerto que uses)

### Navegación

- **Panel Izquierdo**: Usa el buscador para encontrar comercios por nombre
- **Mapa Central**: Navega, haz zoom y click en los marcadores para ver información
- **Panel Derecho**: Activa/desactiva categorías para filtrar los datos mostrados
- **Click en resultados**: Vuela automáticamente al marcador en el mapa

## 📊 Formato de Datos GeoJSON

Los archivos GeoJSON utilizan un formato comprimido:

```json
{
  "propertyKeys": ["clase", "mun", "nombre", "sigla", "dir", ...],
  "features": [
    {
      "g": [longitude, latitude],
      "p": [value1, value2, value3, ...]
    }
  ]
}
```

- `propertyKeys`: Array con los nombres de las propiedades
- `g`: Coordenadas geográficas [longitud, latitud]
- `p`: Array de valores correspondientes a cada propiedad

## 🛠️ Tecnologías

- **HTML5** - Estructura
- **CSS3** - Estilos y diseño responsive
- **JavaScript (ES6+)** - Lógica de la aplicación
- **Leaflet 1.9.4** - Librería de mapas interactivos
- **OpenStreetMap** - Proveedor de mapas base

## 🎨 Personalización

### Añadir Nuevas Categorías

1. Añade un nuevo archivo `.geojson` en la carpeta `geojson/`
2. Agrega el nombre del archivo (sin extensión) al array `geojsonFiles` en `script.js`:

```javascript
const geojsonFiles = [
    'actividad',
    'administracion',
    // ... otros archivos
    'tu-nueva-categoria'  // Añadir aquí
];
```

### Cambiar el Centro del Mapa

Modifica las coordenadas en `script.js`:

```javascript
const map = L.map('map').setView([28.2916, -16.6291], 11);
//                                 [lat,     lon    ] zoom
```

### Personalizar Colores

Edita las variables CSS en `style.css`:

```css
.panel-header {
    background: #2c3e50;  /* Color del encabezado */
}
```

## 📝 Propiedades Soportadas

La aplicación reconoce automáticamente estas propiedades de los GeoJSON:

- `nombre` - Nombre del establecimiento
- `descripcion` - Descripción adicional
- `direccion` / `dir` - Dirección física
- `email` - Correo electrónico
- `tf` - Teléfono
- `web` - Sitio web
- `clase` - Clasificación
- `mun` - Municipio

## 🔧 Desarrollo

### Estructura del Código

- **`loadAllGeoJSON()`**: Carga todos los archivos GeoJSON
- **`processCategories()`**: Procesa las categorías y cuenta elementos
- **`createFilterUI()`**: Genera la interfaz de filtros
- **`displayMarkers()`**: Crea los marcadores en el mapa
- **`filterMarkers()`**: Aplica filtros de búsqueda y categorías
- **`updateResultsList()`**: Actualiza la lista de resultados de búsqueda

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Contacto

Para preguntas o sugerencias sobre este proyecto, abre un issue en el repositorio.

---

**Nota**: Este proyecto es una herramienta de visualización de datos geográficos para el Cabildo de Tenerife.
