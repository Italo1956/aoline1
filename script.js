import fetch from 'node-fetch';
import fs from 'fs';

// Función para obtener la fecha y hora actuales en formato "DD-MM-AAAA HH:MM"
function obtenerFechaYHora() {
    const ahora = new Date();
    const dia = ahora.getDate().toString().padStart(2, '0');
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const año = ahora.getFullYear();
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    return `${dia}-${mes}-${año} ${horas}:${minutos}`;
}

// Función para actualizar los datos
function actualizarDatos(nuevosProductos, productosExistentes) {
    nuevosProductos.forEach((productoNuevo) => {
        const productoExistente = productosExistentes.find((producto) => producto.asin === productoNuevo.asin);

 // Agregar la fecha y hora de descarga al producto
 const fechaYHoraDescarga = obtenerFechaYHora();
 productoNuevo.fechaDescarga = fechaYHoraDescarga;       

        if (!productoExistente) {
            productosExistentes.push(productoNuevo); // Agregar producto nuevo si no existe
        } else if (productoExistente.source_name !== productoNuevo.source_name || productoExistente.roi !== productoNuevo.roi) {
            productosExistentes.push(productoNuevo); // Agregar si hay diferencias
        }
    });

    return productosExistentes;
}
// Función para descargar y guardar los datos
async function obtenerYGuardarDatos() {
    try {
        // Descarga los nuevos productos
        const respuesta = await fetch('https://server.nepeto.com/main_page_products');
        const nuevosProductos = await respuesta.json();

        // Leer datos existentes desde el archivo
        let datosExistentes = [];
        if (fs.existsSync('datos.json')) {
            const contenidoArchivo = fs.readFileSync('datos.json', 'utf8');
            datosExistentes = JSON.parse(contenidoArchivo);
        }

        // Actualizar datos existentes con los nuevos
        const datosActualizados = actualizarDatos(nuevosProductos, datosExistentes);

        // Guardar los datos actualizados en el archivo
        fs.writeFileSync('datos.json', JSON.stringify(datosActualizados, null, 2));
        console.log('Datos actualizados en "datos.json"');
    } catch (error) {
        console.error('Error al obtener o guardar el archivo JSON:', error);
    }
}

// Ejecutar la función principal
obtenerYGuardarDatos();
