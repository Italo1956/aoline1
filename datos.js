
// Este script se ejecutará cuando el documento se haya cargado completamente
document.addEventListener("DOMContentLoaded", () => {
    
    let productosOriginales = []; // Almacena los datos originales para restablecer filtros

    // Función para cargar el archivo JSON de productos
    async function cargarDatos() {
        try {
            // Usamos fetch para leer los datos del archivo JSON
            const respuesta = await fetch('datos.json');        
            const datos = await respuesta.json(); // Convertir el contenido a un objeto JSON
            productosOriginales = datos; // Guardar copia original
            llenarOpcionesTienda(datos);
            mostrarProductos(datos);
                                 
            let vendor = [];
            mostrarProductos(datos); // Llamamos a la función para mostrar los productos en el HTML
        } catch (error) {
            console.error('Error al cargar el archivo JSON:', error);
        }
    }

     // Función para verificar si la imagen existe
     function imagenExiste(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);  // Si la imagen carga correctamente
            img.onerror = () => resolve(false);  // Si hay un error al cargar la imagen
            img.src = url;  // Intentar cargar la imagen
        });
    }

    // Llena las opciones del filtro de tienda dinámicamente
    function llenarOpcionesTienda(datos) {
        const tiendas = [...new Set(datos.map((p) => p.source_name))];
        const selectTienda = document.getElementById("storeFilter");
        tiendas.forEach((tienda) => {
            const option = document.createElement("option");
            option.value = tienda;
            option.textContent = tienda;
            selectTienda.appendChild(option);
        });
    }

    // Función para mostrar los productos en el HTML
    async function mostrarProductos(datos) {
        const container = document.querySelector('.container'); // Contenedor donde se cargarán los productos
        container.innerHTML = ''; // Limpiar productos anteriores
        
        if (!container) { 
            console.error('No se encontró el contenedor .container en el DOM'); 
            return; }
        
        // Recorremos todos los productos
        for (const [index, producto] of datos.entries()) {
            // Creamos una nueva tarjeta de producto
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            const vendor = JSON.parse(producto.az_offers);

            // Verificar si la imagen existe y asignar 'imagesoon.jpg' si no
            const imgSrc = await imagenExiste(producto.img) ? producto.img : 'Imagesoon.jpg';
            const azImgSrc = await imagenExiste(producto.az_img) ? producto.az_img : 'Imagesoon.jpg';
            
            // Función para recortar el título a 25 caracteres con "..."
            function recortarTitulo(titulo) {
                  
                 if (titulo.length > 25)  return titulo.slice(0, 25) + "..."; 
                 return titulo; // Recorta el título a 25
                
            }

            function recortarTitulo2(titulo) {
                  
                if (titulo.length > 65)  return titulo.slice(0, 65); 
                 return titulo; // Recorta el título a 65 para buscar en Google Shopping
               
           }

            // Insertamos el contenido del producto dentro de la tarjeta
            productCard.innerHTML = `
                    <div>Fecha: ${producto.fechaDescarga}</div>
                    <div class="header">
                    <h2 title="${producto.title}">${recortarTitulo(producto.title)}</h2>
                    <span class="index">${index + 1}</span>
                </div>
                <div class="images">
                    <div class="left">
                        <a href="${producto.url}" target="_blank">
                            <img src="${imgSrc}" alt="Imagen izquierda" title="Buscar en la tienda">
                        </a>
                        <div>Tienda: ${producto.source_name}</div>
                        <div>Precio: $${producto.price.toFixed([2])}</div>
                        <div title="Maxima orden de compra">MaxOQ: ${producto.qty}</div>
                        <div title="Minima orden de compra">MOQ: ${producto.moq} </div>
                    </div>
                            
                    <div class="right">
                        <a href="${producto.asin}" target="_blank">
                            <img src="${azImgSrc}" alt="Imagen derecha" title="Ir a AMAZON">
                            </a>
                        <div>AMAZON</div>
                        <a href="${producto.asin}" target="_blank">
                        <div>ASIN: ${producto.asin.slice(-10)}</div>
                            </a>
                        <div>Precio: $${producto.az_price.toFixed([2])}</div>
                        <a href="https://keepa.com/#!product/1-${producto.asin.slice(-10)}" target="_blank" title="Estadisticas">
                        <div>BSR: #${producto.sales_rank}</div>
                        </a>
                        <div>Vendedores: ${vendor.length}</div>
                    </div>
                
                 </div>
                    <a class="gshop-ico"
                        href="https://www.google.com/search?tbm=shop&amp;psb=1&amp;q=${recortarTitulo2(producto.title)}" target="_blank" title="Buscar en Google Shopping">
                            <img src="GShop-32.ico" alt="Google Shopping">
                    </a>
                <div class="roi">
                    ROI: ${Math.round(producto.roi*100)}%  🔰
                </div>
            `;

            // Agregar la tarjeta de producto al contenedor
            container.appendChild(productCard);
        
            
       
        }
    }

     // Aplicar filtros
     function aplicarFiltros() {
        let filtrados = [...productosOriginales];

        // Filtros
        const roiMin = parseFloat(document.getElementById("roiMin").value) || 0;
        const roiMax = parseFloat(document.getElementById("roiMax").value) || 100;
        const priceMin = parseFloat(document.getElementById("priceMin").value) || 0;
        const priceMax = parseFloat(document.getElementById("priceMax").value) || Infinity;
        const tienda = document.getElementById("storeFilter").value;

        filtrados = filtrados.filter((p) => 
            p.roi * 100 >= roiMin &&
            p.roi * 100 <= roiMax &&
            p.price >= priceMin &&
            p.price <= priceMax &&
            (tienda === "" || p.source_name === tienda)
        );

      // Ordenar
      const sortBy = document.getElementById("sortBy").value;
      switch (sortBy) {
          case "priceAsc":
              filtrados.sort((a, b) => a.price - b.price);
              break;
          case "priceDesc":
              filtrados.sort((a, b) => b.price - a.price);
              break;
          case "roiAsc":
              filtrados.sort((a, b) => a.roi - b.roi);
              break;
          case "roiDesc":
              filtrados.sort((a, b) => b.roi - a.roi);
              break;
      }

      // Mostrar productos filtrados
      mostrarProductos(filtrados);
  }   

       // Agregar evento al botón de aplicar filtros
    document.getElementById("applyFilters").addEventListener("click", aplicarFiltros);

    // Llamamos a la función para cargar los datos cuando la página esté lista
    cargarDatos();
});
