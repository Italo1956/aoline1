document.addEventListener("DOMContentLoaded", () => {
    let productosOriginales = []; // Almacena los datos originales para restablecer filtros
    let currentPopup = null; // Para controlar el popup actual

    // Mapeo de seller IDs a nombres
    const sellerNames = {
        'A2C26BABLT40X1': 'SGOnlineDirect',
        'A1BS10OJUM0ECV': 'Bargain Unlimited',
        'A2ENTBEZKGXKVW': 'Warehouse Deals',
        'A2JGH9K1780DGL': 'Amazon.com',
        'A2FQL10UCAZUR8': 'Amazon.com Services LLC',
        'A1SV1BYDTUK2Z5': 'Amazon Warehouse',
        'AJT3OGJQVI1X8': 'Deals & Discounts',
        'A3PEUHHEN7V8XI': 'Global Supplies',
        'A2IBRU96RD58I3': 'Best Price Deals',
        'A3GAKMJ7OZIGUC': 'Quality Products',
        'A2IIJNOKELZU2C': 'Fast Shipping Store',
        'A1MNPIQK9CCE37': 'Top Rated Seller',
        'A2EDR7YR1BSPTD': 'Discount Store',
        'AZMOJXMUQB6Q2': 'Quick Ship Store',
        'A3JMZ4EL52GCAP': 'Best Value Store',
        'A20KN47OMHZ7C3': 'Prime Deals',
        'A1LBC1IXI3S19Y': 'Fast Delivery Store',
        'A34UK3QL4FQDHX': 'Quality Goods',
        'A2NNNSI446I5TS': 'Top Seller Store',
        'AKHXF9KBPNDRI': 'Quick Shipping',
        'A2GFXNKOCIJO3T': 'Best Price Store',
        'A31Z4E1UV99GRE': 'Discount Deals',
        'ARUAYKUGCU14': 'Fast Ship Store',
        'A3EBG4CCR3QS2E': 'Quality Store',
        'A12YIHOXDY4RYU': 'Prime Store',
        'A8XNXKKMSY5QW': 'Best Value Deals',
        'A3JVZ3U09HGS0N': 'Top Quality Store',
        'AXF23Z0JE09ST': 'Quick Delivery',
        // Agregar más según sea necesario
    };

    // Función para obtener el nombre del vendedor
    async function getSellerName(sellerId) {
        try {
            const name = sellerNames[sellerId] || sellerId;
            console.log(`Seller ID: ${sellerId}, Name: ${name}`);
            return name;
        } catch (error) {
            console.error('Error al obtener nombre del vendedor:', error);
            return sellerId;
        }
    }

    // Función para mostrar el popup de vendedores
    async function mostrarPopupVendedores(vendorsData, event) {
        try {
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

            let vendors = [];
            try {
                vendors = Array.isArray(vendorsData) ? vendorsData : JSON.parse(vendorsData);
            } catch (error) {
                console.error('Error al parsear datos de vendedores:', error);
                vendors = [];
            }

            // Crear la tabla después de obtener todos los datos
            const vendorPromises = vendors.map(async (vendor, index) => {
                const vendorUrl = `https://www.amazon.com/sp?seller=${vendor.seller}`;
                const sellerName = await getSellerName(vendor.seller);
                console.log('Obtenido nombre para vendedor:', {
                    seller: vendor.seller,
                    name: sellerName
                });
                return {
                    index: index + 1,
                    vendor,
                    vendorUrl,
                    sellerName
                };
            });

            // Esperar a que todos los datos estén listos
            const vendorData = await Promise.all(vendorPromises);
            console.log('Datos finales para la tabla:', vendorData);

            // Ahora crear la tabla con los datos completos
            const table = document.createElement('table');
            table.className = 'vendor-table';

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th class="index-column">#</th>
                    <th>Vendedor</th>
                    <th>Marca</th>
                    <th class="center-align">Precio</th>
                    <th class="center-align">Feedback</th>
                    <th class="center-align">Rating</th>
                    <th class="center-align">Buy Box</th>
                    <th class="center-align">FBA</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            vendorData.forEach(data => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="index-column">${data.index}</td>
                    <td><a href="${data.vendorUrl}" target="_blank" style="text-decoration: none; color: #0066c0;">${data.vendor.seller || 'N/A'}</a></td>
                    <td>${data.sellerName}</td>
                    <td class="center-align">$${typeof data.vendor.price === 'number' ? data.vendor.price.toFixed(2) : 'N/A'}</td>
                    <td class="center-align">${data.vendor.seller_feedback_count?.toLocaleString() || 'N/A'}</td>
                    <td class="center-align">${data.vendor.seller_positive_feedback_rating ? data.vendor.seller_positive_feedback_rating + '%' : 'N/A'}</td>
                    <td class="center-align">${data.vendor.is_buy_box_winner ? '✅' : '❌'}</td>
                    <td class="center-align">${data.vendor.is_fba ? '✅' : '❌'}</td>
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
            event.stopPropagation();

        } catch (error) {
            console.error('Error en mostrarPopupVendedores:', error);
        }
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
             // Actualizar contador de productos
            document.querySelector('.contador-productos').textContent = datos.length;  /*nuevo contador*/              
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

           // Función para recortar el nombre de la tienda
           function recortarNombreTienda(nombre) {
            if (window.innerWidth <= 600 && nombre.length > 11) {
                return producto.source_name.slice(0, 9) +"...";
            }
            return producto.source_name;
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
                        <div>TIENDA:</div>
                        <div title="${producto.source_name}">${recortarNombreTienda(producto.source_name)}</div>
                        <div>Precio: $${producto.price.toFixed([2])}</div>
                        <div title="Maxima orden de compra">MaxOQ: ${producto.qty}</div>
                        <div title="Minima orden de compra">MOQ: ${producto.moq} </div>
                    </div>
                            
                    <div class="right">
                        <a href="${producto.asin}" target="_blank">
                            <img src="${azImgSrc}" alt="Imagen derecha" title="Ir a AMAZON">
                            </a>
                        <div>AMAZON:</div>
                        <a href="${producto.asin}" target="_blank">
                        <div> ${producto.asin.slice(-10)}</div>
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
            vendorCount.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleVendorClick(vendor, e);
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
          case "salesRankAsc":
              filtrados.sort((a, b) => {
                  // Convertir a número eliminando el símbolo #
                  let rankA = parseInt(a.sales_rank.toString().replace('#', ''));
                  let rankB = parseInt(b.sales_rank.toString().replace('#', ''));
                  return rankA - rankB;
              });
              break;
          case "salesRankDesc":
              filtrados.sort((a, b) => {
                  // Convertir a número eliminando el símbolo #
                  let rankA = parseInt(a.sales_rank.toString().replace('#', ''));
                  let rankB = parseInt(b.sales_rank.toString().replace('#', ''));
                  return rankB - rankA;
              });
              break;
          case "index":
              filtrados.sort((a, b) => a.indiceOriginal - b.indiceOriginal);
              break;
      }

      // Mostrar productos filtrados
      mostrarProductos(filtrados);
        // También actualizar el contador cuando se filtran los productos
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
        // ... actualizar el contador cuando se resetean los productos
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
            
            // Clonar las primeras y últimas tarjetas para el efecto continuo              /*nuevo carrusel 0*/
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
            });                                                              /*hasta aqui lo nuevo de carrusel 0*/
            
            // Crear indicadores de desplazamiento
            const leftIndicator = document.createElement('div');
            const rightIndicator = document.createElement('div');
            leftIndicator.className = 'scroll-indicator scroll-left';
            rightIndicator.className = 'scroll-indicator scroll-right';
            leftIndicator.innerHTML = '‹';
            rightIndicator.innerHTML = '›';

            // Agregar eventos de desplazamiento
            leftIndicator.onclick = () => {
                const scrollAmount = container.offsetWidth;             /*nuevo carrusel 1*/
                const currentScroll = container.scrollLeft;
                
                if (currentScroll <= 0) {
                    // Si estamos al inicio, saltar al final real
                    container.scrollLeft = container.scrollWidth - (2 * scrollAmount);
                } else {                          /*hasta aqui lo nuevo de carrusel 1*/
                
                container.scrollBy({
                    left: -container.offsetWidth,
                    behavior: 'smooth'
                });
              }                                   /*pertenece a lo nuevo 1*/ 
            };

            rightIndicator.onclick = () => {
                const scrollAmount = container.offsetWidth;              /*nuevo carrusel 2*/
                const currentScroll = container.scrollLeft;
                
                if (currentScroll <= 0) {
                    // Si estamos al inicio, saltar al final real
                    container.scrollLeft = container.scrollWidth - (2 * scrollAmount);
                } else {                                                 /*hasta aqui lo nuevo de carrusel 2*/

                container.scrollBy({
                    left: container.offsetWidth,
                    behavior: 'smooth'
                });
              }                                                           /*pertenece a lo nuevo 2*/ 
            };

            document.body.appendChild(leftIndicator);
            document.body.appendChild(rightIndicator);

            // Mostrar/ocultar indicadores según la posición
            container.addEventListener('scroll', () => {
                /*leftIndicator.style.display = container.scrollLeft > 0 ? 'flex' : 'none';      se reemplaza por nuevo 3
                rightIndicator.style.display = 
                    container.scrollLeft < (container.scrollWidth - container.offsetWidth) ? 'flex' : 'none';*/
                    leftIndicator.style.display = 'flex';                       /*nuevo carrusel 3*/
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
                    }                                                             /*hasta aqui lo nuevo de carrusel 3*/

            });
        }
    }

    // Llamar a la función después de cargar los productos
    window.addEventListener('resize', initializeCarousel);
    document.addEventListener('DOMContentLoaded', initializeCarousel);

    // Agregar funcionalidad para colapsar/expandir filtros
    const filtrosToggle = document.querySelector('.filtros-toggle');
    const filterMenu = document.querySelector('.filter-menu');
    let isExpanded = true;

    filtrosToggle.addEventListener('click', () => {
        isExpanded = !isExpanded;
        filterMenu.classList.toggle('collapsed');
        filtrosToggle.textContent = `Filtros ${isExpanded ? '▼' : '▲'}`;
    });

    async function handleVendorClick(vendor, event) {
        try {
            await mostrarPopupVendedores(vendor, event);
        } catch (error) {
            console.error('Error al mostrar popup:', error);
        }
    }

});