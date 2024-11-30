document.addEventListener("DOMContentLoaded", () => {
    let productosOriginales = []; // Almacena los datos originales para restablecer filtros
    let currentPopup = null; // Para controlar el popup actual

    // Función para mostrar el popup de vendedores
    function mostrarPopupVendedores(vendorsData, event) {
        if (currentPopup) {
            currentPopup.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        overlay.style.display = 'flex';

        const popup = document.createElement('div');
        popup.className = 'popup';

        // Variables para el arrastre
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Funciones para el arrastre
        function setTranslate(xPos, yOffset) {
            popup.style.transform = `translate(${xPos}px, ${yOffset}px)`;
        }

        function dragStart(e) {
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === popup || e.target.tagName === 'H3') {
                isDragging = true;
            }
        }

        function dragEnd() {
            isDragging = false;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                
                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;
                setTranslate(currentX, currentY);
            }
        }

        // Agregar eventos para arrastrar
        popup.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        popup.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);

        const closeButton = document.createElement('button');
        closeButton.className = 'popup-close';
        closeButton.innerHTML = '×';
        closeButton.type = 'button';
        closeButton.onclick = () => {
            overlay.remove();
            currentPopup = null;
        };

        const title = document.createElement('h3');
        title.textContent = 'Lista de Vendedores';

        const table = document.createElement('table');
        table.className = 'vendor-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th class="index-column">#</th>
                <th>Vendedor</th>
                <th class="center-align">Precio</th>
                <th class="center-align">Feedback</th>
                <th class="center-align">Rating</th>
                <th class="center-align">Buy Box</th>
                <th class="center-align">FBA</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        
        let vendors = [];
        try {
            vendors = Array.isArray(vendorsData) ? vendorsData : JSON.parse(vendorsData);
        } catch (error) {
            console.error('Error al parsear datos de vendedores:', error);
            vendors = [];
        }

        vendors.forEach((vendor, index) => {
            const tr = document.createElement('tr');
            const vendorUrl = `https://www.amazon.com/sp?seller=${vendor.seller}`;
            
            tr.innerHTML = `
                <td class="index-column">${index + 1}</td>
                <td><a href="${vendorUrl}" target="_blank" style="text-decoration: none; color: #0066c0;">${vendor.seller || 'N/A'}</a></td>
                <td class="center-align">$${typeof vendor.price === 'number' ? vendor.price.toFixed(2) : 'N/A'}</td>
                <td class="center-align">${vendor.seller_feedback_count?.toLocaleString() || 'N/A'}</td>
                <td class="center-align">${vendor.seller_positive_feedback_rating ? vendor.seller_positive_feedback_rating + '%' : 'N/A'}</td>
                <td class="center-align">${vendor.is_buy_box_winner ? '✅' : '❌'}</td>
                <td class="center-align">${vendor.is_fba ? '✅' : '❌'}</td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);

        popup.appendChild(closeButton);
        popup.appendChild(title);
        popup.appendChild(table);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        currentPopup = overlay;

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                currentPopup = null;
            }
        });

        event.stopPropagation();
    }

    // Función para cargar el archivo JSON de productos
    async function cargarDatos() {
        try {
            // Usamos fetch para leer los datos del archivo JSON
            const respuesta = await fetch('datos.json');        
            const datos = await respuesta.json(); // Convertir el contenido a un objeto JSON
            datos.forEach((producto, index) => {
                producto.indiceOriginal = index + 1;
            });
            productosOriginales = datos; // Guardar copia original
            llenarOpcionesTienda(datos);
            mostrarProductos(datos);
                                 
            let vendor = [];
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
        for (const producto of datos) {
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
                    <span class="index">${producto.indiceOriginal}</span>
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
                        <div class="vendor-count" style="cursor: pointer;">Vendedores: ${vendor.length}</div>
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
        
            // Agregar el event listener para el popup de vendedores
            const vendorCount = productCard.querySelector('.vendor-count');
            vendorCount.addEventListener('click', (e) => {
                mostrarPopupVendedores(vendor, e);
            });
        
            
       
        }
    }

     // Aplicar filtros
     function aplicarFiltros() {
        let filtrados = [...productosOriginales];

        // Filtros
        const roiMin = parseFloat(document.getElementById("roiMin").value) || 0;
        const roiMax = parseFloat(document.getElementById("roiMax").value) || 300;
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
          case "index":
              filtrados.sort((a, b) => a.indiceOriginal - b.indiceOriginal);
              break;
      }

      // Mostrar productos filtrados
      mostrarProductos(filtrados);
  }  
  
       // Agregar evento al botón de aplicar filtros
    document.getElementById("applyFilters").addEventListener("click", aplicarFiltros);
    document.getElementById('resetFilters').addEventListener('click', reset);

    // Reset Filtros   
     function reset() {
        let originales = [...productosOriginales];
        document.getElementById('roiMin').value = '';
        document.getElementById('roiMax').value = '';
        document.getElementById('priceMin').value = '';
        document.getElementById('priceMax').value = '';
        document.getElementById('storeFilter').value = '';
        document.getElementById('sortBy').value = 'index';
        // Mostrar productos sin filtros
        mostrarProductos(originales);
    };

    // Llamamos a la función para cargar los datos cuando la página esté lista
    cargarDatos();
});
