document.addEventListener("DOMContentLoaded", () => {
    let productosOriginales = []; // Almacena los datos originales para restablecer filtros
    let currentPopup = null; // Para controlar el popup actual

    // Función para mostrar el popup de vendedores
    function mostrarPopupVendedores(vendorsData, event) {
        if (currentPopup) {
            currentPopup.remove();
        }

        // Asegurarnos que vendorsData sea un array
        let vendors = [];
        try {
            // Asegurarnos que vendorsData ya está parseado desde az_offers
            vendors = vendorsData;
            console.log('Datos de vendedores:', vendors); // Para debug
        } catch (error) {
            console.error('Error al parsear datos de vendedores:', error);
            vendors = [];
        }

        // Obtener la tabla y su tbody
        const tbody = document.querySelector('#vendor-list');
        if (!tbody) {
            console.error('No se encontró el elemento #vendor-list');
            return;
        }
        tbody.innerHTML = ''; // Limpiar contenido anterior

        // Llenar la tabla con los datos
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

        // Mostrar el popup
        const popup = document.getElementById('seller-popup');
        popup.classList.remove('hidden');
        
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
            document.querySelector('.contador-productos').textContent = datos.length;
                                 
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
      document.querySelector('.contador-productos').textContent = filtrados.length;
  }  
  
       // Agregar evento al botón de aplicar filtros
    document.getElementById("applyFilters").addEventListener("click", aplicarFiltros);
    document.getElementById('resetFilters').addEventListener('click', reset);
    document.getElementById('updateData').addEventListener('click', actualizarDatos);

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
        document.querySelector('.contador-productos').textContent = originales.length;
    };

    // Función para actualizar los datos
    async function actualizarDatos() {
        try {
            const updateButton = document.getElementById('updateData');
            const originalText = updateButton.innerHTML;
            updateButton.innerHTML = '⌛ Actualizando...';
            updateButton.disabled = true;

            // Ejecutar script.js mediante PHP
            const respuesta = await fetch('ejecutar_script.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (respuesta.ok) {
                console.log('Base de datos actualizada correctamente');
                await cargarDatos(); // Recargar los datos
                updateButton.innerHTML = '✅ Actualizado';
                setTimeout(() => {
                    updateButton.innerHTML = originalText;
                    updateButton.disabled = false;
                }, 2000);
            } else {
                console.error('Error al actualizar la base de datos');
                updateButton.innerHTML = '❌ Error';
                setTimeout(() => {
                    updateButton.innerHTML = originalText;
                    updateButton.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error('Error en la actualización:', error);
            const updateButton = document.getElementById('updateData');
            updateButton.innerHTML = '❌ Error';
            setTimeout(() => {
                updateButton.innerHTML = '🔄 Actualizar';
                updateButton.disabled = false;
            }, 2000);
        }
    }

    // Agregar el event listener para el botón de actualización
    document.getElementById('updateData').addEventListener('click', actualizarDatos);

    // Llamamos a la función para cargar los datos cuando la página esté lista
    cargarDatos();

    // Agregar después de mostrarProductos()
    function initializeCarousel() {
        if (window.innerWidth <= 500) {
            const container = document.querySelector('.container');
            const cards = document.querySelectorAll('.product-card');
            
            // Clonar las primeras y últimas tarjetas para el efecto continuo
            const firstCards = Array.from(cards).slice(0, 2);
            const lastCards = Array.from(cards).slice(-2);
            
            // Agregar clones al principio y final
            lastCards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.classList.add('clone');
                container.insertBefore(clone, container.firstChild);
            });
            
            firstCards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.classList.add('clone');
                container.appendChild(clone);
            });
            
            // Crear indicadores de desplazamiento
            const leftIndicator = document.createElement('div');
            const rightIndicator = document.createElement('div');
            leftIndicator.className = 'scroll-indicator scroll-left';
            rightIndicator.className = 'scroll-indicator scroll-right';
            leftIndicator.innerHTML = '‹';
            rightIndicator.innerHTML = '›';

            // Agregar eventos de desplazamiento
            leftIndicator.onclick = () => {
                const scrollAmount = container.offsetWidth;
                const currentScroll = container.scrollLeft;
                
                if (currentScroll <= 0) {
                    // Si estamos al inicio, saltar al final real
                    container.scrollLeft = container.scrollWidth - (2 * scrollAmount);
                } else {
                    container.scrollBy({
                        left: -container.offsetWidth,
                        behavior: 'smooth'
                    });
                }
            };

            rightIndicator.onclick = () => {
                const scrollAmount = container.offsetWidth;
                const currentScroll = container.scrollLeft;
                
                if (currentScroll <= 0) {
                    // Si estamos al inicio, saltar al final real
                    container.scrollLeft = container.scrollWidth - (2 * scrollAmount);
                } else {
                    container.scrollBy({
                        left: container.offsetWidth,
                        behavior: 'smooth'
                    });
                }
            };

            document.body.appendChild(leftIndicator);
            document.body.appendChild(rightIndicator);

            // Mostrar/ocultar indicadores según la posición
            container.addEventListener('scroll', () => {
                leftIndicator.style.display = 'flex';
                rightIndicator.style.display = 'flex';
            });
            
            // Manejar el scroll infinito
            container.addEventListener('scrollend', () => {
                const scrollAmount = container.offsetWidth;
                const currentScroll = container.scrollLeft;
                const maxScroll = container.scrollWidth - container.offsetWidth;
                
                if (currentScroll <= 0) {
                    container.scrollLeft = container.scrollWidth - (3 * scrollAmount);
                } else if (currentScroll >= maxScroll) {
                    container.scrollLeft = scrollAmount;
                }
            });
        }
    }

    // Llamar a la función después de cargar los productos
    window.addEventListener('resize', initializeCarousel);
    document.addEventListener('DOMContentLoaded', initializeCarousel);

    // Agregar el event listener para cerrar el popup
    document.querySelector('.popup-close').addEventListener('click', () => {
        document.getElementById('seller-popup').classList.add('hidden');
    });

    // Agregar funcionalidad para colapsar/expandir filtros
    const filtrosToggle = document.querySelector('.filtros-toggle');
    const filterMenu = document.querySelector('.filter-menu');
    let isExpanded = true;

    filtrosToggle.addEventListener('click', () => {
        isExpanded = !isExpanded;
        filterMenu.classList.toggle('collapsed');
        filtrosToggle.textContent = `Filtros ${isExpanded ? '▼' : '▲'}`;
    });
});
