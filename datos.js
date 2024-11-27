// Este script se ejecutará cuando el documento se haya cargado completamente
document.addEventListener("DOMContentLoaded", () => {
    // Función para cargar el archivo JSON de productos
    async function cargarDatos() {
        try {
            // Usamos fetch para leer los datos del archivo JSON
            const respuesta = await fetch('datos.json');        
            const datos = await respuesta.json(); // Convertir el contenido a un objeto JSON
                                 
            let vendor = [];
            mostrarProductos(datos); // Llamamos a la función para mostrar los productos en el HTML
        } catch (error) {
            console.error('Error al cargar el archivo JSON:', error);
        }
    }

    // Función para mostrar los productos en el HTML
    function mostrarProductos(datos) {
        const container = document.querySelector('.container'); // Contenedor donde se cargarán los productos
        
        // Recorremos todos los productos
        datos.forEach((producto, index) => {
            // Creamos una nueva tarjeta de producto
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            const vendor = JSON.parse(producto.az_offers);
            // Función para recortar el título a 25 caracteres con "..."
            function recortarTitulo(titulo) {
                  
                 if (titulo.length > 25)  return titulo.slice(0, 25) + "..."; 
                 return titulo; // Recorta el título 
                
            }

            function recortarTitulo2(titulo) {
                  
                if (titulo.length > 65)  return titulo.slice(0, 65); 
                 return titulo; // Recorta el título 
               
           }

            // Insertamos el contenido del producto dentro de la tarjeta
            productCard.innerHTML = `
                    <div>Fecha: ${producto.fechaDescarga}</div>
                    <div class="header">
                    <h2>${recortarTitulo(producto.title)}</h2>
                    <span class="index">${index + 1}</span>
                </div>
                <div class="images">
                    <div class="left">
                        <a href="${producto.url}" target="_blank">
                            <img src="${producto.img}" alt="Imagen izquierda">
                        </a>
                        <div>Tienda: ${producto.source_name}</div>
                        <div>Precio: $${producto.price.toFixed([2])}</div>
                        <div>MaxOQ: ${producto.qty}</div>
                        <div>MOQ: ${producto.moq}</div>
                    </div>
                            
                    <div class="right">
                        <a href="${producto.asin}" target="_blank">
                            <img src="${producto.az_img}" alt="Imagen derecha">
                            </a>
                        <div>AMAZON</div>
                        <a href="${producto.asin}" target="_blank">
                        <div>ASIN: ${producto.asin.slice(-10)}</div>
                            </a>
                        <div>Precio: $${producto.az_price.toFixed([2])}</div>
                        <a href="https://keepa.com/#!product/1-${producto.asin.slice(-10)}" target="_blank">
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
        });

        configurarPopup();
    }

    function configurarPopup() {
        const popup = document.getElementById('seller-popup');
        const popupContent = document.getElementById('seller-list');
        const closePopupButton = document.getElementById('close-popup');

        // Cerrar el popup
        closePopupButton.addEventListener('click', () => {
            popup.classList.add('hidden');
        });

        // Mostrar el popup con datos
        document.querySelectorAll('.seller-link').forEach((link) => {
            link.addEventListener('click', () => {
                const vendors = JSON.parse(link.getAttribute('data-vendors'));

                // Ordenar vendedores por precio
                const sortedVendors = vendors.sort((a, b) => a.price - b.price);

                // Generar contenido del popup
                popupContent.innerHTML = sortedVendors
                    .map(vendor => `
                        <li>
                            <strong>Vendedor:</strong> ${vendor.seller} <br>
                            <strong>Precio:</strong> $${vendor.price.toFixed(2)} <br>
                            <strong>Feedback:</strong> ${vendor.seller_feedback_count} (${vendor.seller_positive_feedback_rating}%) <br>
                            <strong>Buy Box:</strong> ${vendor.is_buy_box_winner ? 'Sí' : 'No'} <br>
                            <strong>FBA:</strong> ${vendor.is_fba ? 'Sí' : 'No'}
                        </li>
                    `)
                    .join('');

                popup.classList.remove('hidden');
            });
        });
    }

    // Llamamos a la función para cargar los datos cuando la página esté lista
    cargarDatos();
});
