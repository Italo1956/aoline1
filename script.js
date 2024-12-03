import fetch from 'node-fetch';
import fs from 'fs';
import schedule from 'node-schedule'; // Importar la librería

function obtenerFechaYHora() {
    const ahora = new Date();
    return ahora.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function actualizarDatos(nuevosProductos, productosExistentes) {
    const productosMap = new Map();

    // Agregar productos existentes al Map
    productosExistentes.forEach((producto) => {
        const clave = `${producto.asin}-${producto.roi}-${producto.source_name}`;
        productosMap.set(clave, producto);
    });

    // Agregar o actualizar productos nuevos en el Map
    nuevosProductos.forEach((productoNuevo) => {
        const clave = `${productoNuevo.asin}-${productoNuevo.roi}-${productoNuevo.source_name}`;
        productoNuevo.fechaDescarga = obtenerFechaYHora();
        productosMap.set(clave, productoNuevo);
    });

    return Array.from(productosMap.values());
}

async function obtenerYGuardarDatos() {
    try {
        console.log(`[INFO] Iniciando descarga de datos: ${new Date().toLocaleString()}`);
        const respuesta = await fetch('https://server.nepeto.com/main_page_products');
        const nuevosProductos = await respuesta.json();

        let datosExistentes = [];
        if (fs.existsSync('datos.json')) {
            try {
                const contenidoArchivo = fs.readFileSync('datos.json', 'utf8');
                datosExistentes = JSON.parse(contenidoArchivo);
            } catch (error) {
                console.error('[ERROR] Error al leer o parsear el archivo "datos.json":', error);
                datosExistentes = [];
            }
        }

        const datosActualizados = actualizarDatos(nuevosProductos, datosExistentes);
        fs.writeFileSync('datos.json', JSON.stringify(datosActualizados, null, 2));
        console.log('[INFO] Datos actualizados en "datos.json"');
    } catch (error) {
        console.error('[ERROR] Error al obtener o guardar el archivo JSON:', error);
    }
}

// Programar ejecución cada 60 minutos
schedule.scheduleJob('0 * * * *', async () => {
    console.log(`[INFO] Ejecutando tarea programada: ${new Date().toLocaleString()}`);
    await obtenerYGuardarDatos();
});

// Ejecutar inmediatamente al iniciar
obtenerYGuardarDatos();
