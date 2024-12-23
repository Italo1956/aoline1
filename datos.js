document.addEventListener("DOMContentLoaded", () => {
    let productosOriginales = []; 
    let currentPopup = null;

    // Funcion para indicar numero de tiendas en Todas y ordenarlas(#)
    function populateStoreFilter() {
        const storeFilter = document.getElementById('storeFilter');
        const uniqueStores = [...new Set(productosOriginales.map(p => p.source_name))];
        const storeCount = uniqueStores.length;
        
        storeFilter.innerHTML = `<option value="">Todas (${storeCount})</option>`;
        
        uniqueStores.sort().forEach(store => {
            const option = document.createElement('option');
            option.value = store;
            option.textContent = store;
            storeFilter.appendChild(option);
        });
    }
    
    // Función para cargar el archivo JSON de productos
    async function cargarDatos() {
        try {
            const respuesta = await fetch('datos.json');        
            const datos = await respuesta.json(); 
            datos.forEach((producto, index) => {
                producto.indiceOriginal = index + 1;
            });
            productosOriginales = datos; // Guardar copia original
            populateStoreFilter();
            // Aplicar ordenamiento inicial
            const ordenar = document.getElementById('sortBy').value;
            let datosOrdenados = [...datos];
            
            switch (ordenar) {
                case 'salesRankAsc':
                    datosOrdenados.sort((a, b) => a.sales_rank - b.sales_rank);
                    break;
                case 'salesRankDesc':
                    datosOrdenados.sort((a, b) => b.sales_rank - a.sales_rank);
                    break;
                case 'roiDesc':
                    datosOrdenados.sort((a, b) => b.roi - a.roi);
                    break;
                case 'roiAsc':
                    datosOrdenados.sort((a, b) => a.roi - b.roi);
                    break;
                case 'priceAsc':
                    datosOrdenados.sort((a, b) => a.price - b.price);
                    break;
                case 'priceDesc':
                    datosOrdenados.sort((a, b) => b.price - a.price);
                    break;
                case 'vendedoresDesc':
                    datosOrdenados.sort((a, b) => {
                        const vendedoresA = JSON.parse(a.az_offers).length;
                        const vendedoresB = JSON.parse(b.az_offers).length;
                        return vendedoresB - vendedoresA;
                    });
                    break;
                case 'vendedoresAsc':
                    datosOrdenados.sort((a, b) => {
                        const vendedoresA = JSON.parse(a.az_offers).length;
                        const vendedoresB = JSON.parse(b.az_offers).length;
                        return vendedoresA - vendedoresB;
                    });
                    break;
                case 'fechaDesc':
                    datosOrdenados.sort((a, b) => ordenarPorFecha(a, b, true));
                    break;
                case 'fechaAsc':
                    datosOrdenados.sort((a, b) => ordenarPorFecha(a, b, false));
                    break;
            }

            llenarOpcionesTienda(datos);
            mostrarProductos(datosOrdenados);
            document.querySelector('.contador-productos').textContent = datos.length;
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    }

    // Función para verificar si la imagen existe
    function imagenExiste(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    // Llena las opciones del filtro de tienda
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

    // Función para mostrar los productos
    async function mostrarProductos(datos) {
        const container = document.querySelector('.container');
        container.innerHTML = '';
        
        if (!container) { 
            console.error('No se encontró el contenedor .container');
            return;
        }
        
        for (const producto of datos) {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            let vendor = [];
            try {
                // Reemplazar apóstrofes antes del parse
                const sanitizedOffers = producto.az_offers.replace(/'/g, '´');
                vendor = JSON.parse(sanitizedOffers);
                
                if (!Array.isArray(vendor)) {
                    console.error('az_offers no es un array:', producto.asin);
                    vendor = [];
                }
            } catch (error) {
                console.error('Error parseando az_offers:', producto.asin, error);
                vendor = [];
            }

            // Sanitizar el JSON antes de ponerlo en el atributo
            const vendorsJson = JSON.stringify(vendor)
                /*.replace(/'/g, '&apos;')  // Convertir apóstrofes a entidad HTML
                .replace(/"/g, '&quot;'); // Convertir comillas a entidad HTML*/

            const imgSrc = await imagenExiste(producto.img) ? producto.img : 'Imagesoon.jpg';
            const azImgSrc = await imagenExiste(producto.az_img) ? producto.az_img : 'Imagesoon.jpg';
            
            function recortarTitulo(titulo) {
                if (titulo.length > 25) return titulo.slice(0, 25) + "...";
                return titulo;
            }

            function recortarTitulo2(titulo) {
                if (titulo.length > 65) return titulo.slice(0, 65);
                return titulo;
            }

            function recortarNombreTienda(nombre) {
                if (window.innerWidth <= 600 && nombre.length > 11) {
                    return producto.source_name.slice(0, 9) + "...";
                }
                return producto.source_name;
            }
            
            // Insertamos el contenido del producto dentro de la tarjeta
            producto.profit = (producto.price)*(producto.roi)*(producto.qty);
            productCard.innerHTML = `
                <div>Fecha: ${producto.fechaDescarga || 'No disponible'}</div>
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
                        <div>Precio: $${producto.price.toFixed(2)}</div>
                        <div title="Maxima orden de compra">MaxOQ: ${producto.qty}</div>
                        <div title="Minima orden de compra">MOQ: ${producto.moq}</div>
                        <div title="Ganancia Neta">NETO: $${((producto.price)*(producto.roi)).toFixed([2])} </div>
                        <div title="Ganancia Neta x MaxOQ">PROFIT: $${(producto.profit).toFixed([2])} </div>
                    </div>
                    <div class="right">
                        <a href="${producto.asin}" target="_blank">
                            <img src="${azImgSrc}" alt="Imagen derecha" title="Ir a AMAZON">
                        </a>
                        <div>AMAZON:</div>
                        <a href="${producto.asin}" target="_blank">
                            <div>${producto.asin.slice(-10)}</div>
                        </a> 
                        <div>Precio: $${producto.az_price.toFixed(2)}</div>
                        <a href="https://www.sellersprite.com/v2/tools/sales-estimator?market=US&asin=${producto.asin.slice(-10)}" target="_blank" title="Estadisticas">
                            <div>BSR: #${producto.sales_rank}</div>
                        </a>
                        <div class="vendor-count" 
                             style="cursor: pointer;" 
                             data-vendors='${encodeURIComponent(JSON.stringify(vendor))}' 
                             data-indice='${producto.indiceOriginal}'>
                            Vendedores: ${vendor.length}
                        </div>
                        <div class="categoria">
                            Categoría: ${producto.categoria || 'No disponible'}
                        </div>
                    </div>
                </div>
            <a class="gshop-ico" href="https://www.google.com/search?tbm=shop&amp;psb=1&amp;q=${recortarTitulo2(producto.title)}" target="_blank" title="Buscar en Google Shopping">
                    <img src="GShop-32.ico" alt="Google Shopping">
            </a>
                <div class="roi">
                    ROI: ${Math.round(producto.roi*100)}% 🔰
                </div>
            `;
            
            container.appendChild(productCard);
        }
    }

    // Aplicar Filtros
    function aplicarFiltros() {
        let filtrados = [...productosOriginales];
        console.log('Contador antes de filtrar:', filtrados.length);
        
        const roiMin = parseFloat(document.getElementById('roiMin').value) || 0;
        const roiMax = parseFloat(document.getElementById('roiMax').value) || Infinity;
        const priceMin = parseFloat(document.getElementById('priceMin').value) || 0;
        const priceMax = parseFloat(document.getElementById('priceMax').value) || Infinity;
        const salesRankMin = parseFloat(document.getElementById('salesRankMin').value) || 0;
        const salesRankMax = parseFloat(document.getElementById('salesRankMax').value) || Infinity;
        const tienda = document.getElementById('storeFilter').value;
        const ordenar = document.getElementById('sortBy').value;

        // Aplicar filtros
        filtrados = filtrados.filter((producto) => {
            // Verificar si el producto tiene todos los campos necesarios
            if (!producto.roi || !producto.price || !producto.sales_rank) {
                console.log('Producto filtrado por falta de datos:', producto);
                return false;
            }

            const roi = producto.roi * 100;
            return (
                roi >= roiMin &&
                roi <= roiMax &&
                producto.price >= priceMin &&
                producto.price <= priceMax &&
                producto.sales_rank >= salesRankMin &&
                producto.sales_rank <= salesRankMax &&
                (tienda === "" || producto.source_name === tienda)
            );
        });

        // Después de aplicar los filtros, ordenar los resultados
        switch (ordenar) {
            case 'salesRankAsc':
                filtrados.sort((a, b) => a.sales_rank - b.sales_rank);
                break;
            case 'salesRankDesc':
                filtrados.sort((a, b) => b.sales_rank - a.sales_rank);
                break;
            case 'roiDesc':
                filtrados.sort((a, b) => b.roi - a.roi);
                break;
            case 'roiAsc':
                filtrados.sort((a, b) => a.roi - b.roi);
                break;
            case 'priceAsc':
                filtrados.sort((a, b) => a.price - b.price);
                break;
            case 'priceDesc':
                filtrados.sort((a, b) => b.price - a.price);
                break;
            case "profitDesc":
               filtrados.sort((a, b) => b.profit - a.profit);
               break;
            case "profitAsc":
               filtrados.sort((a, b) => a.profit - b.profit);
               break
            case 'vendedoresDesc':
                filtrados.sort((a, b) => {
                    const vendedoresA = JSON.parse(a.az_offers).length;
                    const vendedoresB = JSON.parse(b.az_offers).length;
                    return vendedoresB - vendedoresA;
                });
                break;
            case 'vendedoresAsc':
                filtrados.sort((a, b) => {
                    const vendedoresA = JSON.parse(a.az_offers).length;
                    const vendedoresB = JSON.parse(b.az_offers).length;
                    return vendedoresA - vendedoresB;
                });
                break;
            case 'fechaDesc':
                filtrados.sort((a, b) => ordenarPorFecha(a, b, true));
                break;
            case 'fechaAsc':
                filtrados.sort((a, b) => ordenarPorFecha(a, b, false));
                break;
        }

        console.log('Contador después de filtrar:', filtrados.length);
        mostrarProductos(filtrados);
        document.querySelector('.contador-productos').textContent = filtrados.length;
    }

    // Reset Filtros
    function reset() {
        let originales = [...productosOriginales];
        document.getElementById('roiMin').value = '';
        document.getElementById('roiMax').value = '';
        document.getElementById('priceMin').value = '';
        document.getElementById('priceMax').value = '';
        document.getElementById('storeFilter').value = '';
        document.getElementById('sortBy').value = 'index';
        mostrarProductos(originales);
        document.querySelector('.contador-productos').textContent = originales.length;
    }

    // Actualizar datos
    async function actualizarDatos() {
        try {
            const updateButton = document.getElementById('updateData');
            const originalText = updateButton.innerHTML;
            updateButton.innerHTML = '⌛ Actualizando...';
            updateButton.disabled = true;

            // Llamar al nuevo endpoint
            const response = await fetch('http://localhost:3000/actualizar-datos', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Error actualizando datos');
            }

            // Recargar datos
            await obtenerYGuardarDatos();
            await cargarDatos();
            
            updateButton.innerHTML = '✅ Actualizado';
            setTimeout(() => {
                updateButton.innerHTML = originalText;
                updateButton.disabled = false;
            }, 2000);
        } catch (error) {
            console.error('Error:', error);
            updateButton.innerHTML = '❌ Error';
            setTimeout(() => {
                updateButton.innerHTML = '🔄';
                updateButton.disabled = false;
            }, 2000);
        }
    }

    // Event Listeners
    document.getElementById("applyFilters").addEventListener("click", aplicarFiltros);
    document.getElementById('resetFilters').addEventListener('click', reset);
    document.getElementById('updateData').addEventListener('click', actualizarDatos);

    // Carrusel para móvil
    function initializeCarousel() {
        if (window.innerWidth <= 499) {
            const container = document.querySelector('.container');
            
            // Remover botones existentes
            document.querySelectorAll('.scroll-indicator').forEach(btn => btn.remove());
            
            // Agregar botones de navegación
            const leftButton = document.createElement('div');
            const rightButton = document.createElement('div');
            leftButton.className = 'scroll-indicator scroll-left';
            rightButton.className = 'scroll-indicator scroll-right';
            leftButton.innerHTML = '‹';
            rightButton.innerHTML = '›';

            // Calcular el ancho de cada tarjeta + margen
            const cardWidth = 230; // 220px + 10px gap

            // Función para manejar el scroll
            const handleScroll = (direction) => {
                const currentPosition = container.scrollLeft;
                const totalWidth = container.scrollWidth;
                const visibleWidth = container.offsetWidth;
                
                let newPosition;
                
                if (direction === 'left') {
                    newPosition = currentPosition - cardWidth;
                    // Si llegamos al inicio, ir al final
                    if (newPosition < 0) {
                        newPosition = totalWidth - visibleWidth;
                    }
                } else {
                    newPosition = currentPosition + cardWidth;
                    // Si llegamos al final, ir al inicio
                    if (newPosition > totalWidth - visibleWidth) {
                        newPosition = 0;
                    }
                }

                container.scrollTo({
                    left: newPosition,
                    behavior: 'smooth'
                });
            };

            // Event listeners para los botones
            leftButton.onclick = () => handleScroll('left');
            rightButton.onclick = () => handleScroll('right');

            // Agregar botones al DOM
            document.body.appendChild(leftButton);
            document.body.appendChild(rightButton);

            // Mostrar/ocultar botones según la posición
            container.addEventListener('scroll', () => {
                const position = container.scrollLeft;
                const maxScroll = container.scrollWidth - container.offsetWidth;
                
                leftButton.style.opacity = position <= 0 ? '0.5' : '1';
                rightButton.style.opacity = position >= maxScroll ? '0.5' : '1';
            });
        } else {
            // Remover botones si no estamos en móvil
            document.querySelectorAll('.scroll-indicator').forEach(btn => btn.remove());
        }
    }

    // Inicializar carrusel
    window.addEventListener('resize', initializeCarousel);
    document.addEventListener('DOMContentLoaded', initializeCarousel);

    // Colapsar/expandir filtros
    const filtrosToggle = document.querySelector('.filtros-toggle');
    const filterMenu = document.querySelector('.filter-menu');
    let isExpanded = true; filtrosToggle.textContent = `${isExpanded ? '▼ Ocultar' : '▲ Mostrar'} Filtros`;

    // Crear y agregar los filtros
    const filtros = crearFiltros();
    filterMenu.appendChild(filtros);

    filtrosToggle.addEventListener('click', () => {
        isExpanded = !isExpanded;
        filterMenu.classList.toggle('collapsed');
        filtrosToggle.textContent = `${isExpanded ? '▼ Ocultar' : '▲ Mostrar'} Filtros`;
    });

    // Cargar datos iniciales
    cargarDatos();

    // En la sección de filtros
    function crearFiltros() {
        const filtrosDiv = document.createElement('div');
        filtrosDiv.className = 'filtros';
        
        return filtrosDiv;
    }

    document.getElementById('sortBy').innerHTML = `
        <option value="index">Indice</option>
        <option value="salesRankAsc">Sales Rank ↑</option>
        <option value="salesRankDesc">Sales Rank ↓</option>
        <option value="roiAsc">ROI ↑</option>
        <option value="roiDesc">ROI ↓</option>
        <option value="priceAsc">Precio ↑</option>
        <option value="priceDesc">Precio ↓</option>
        <option value="profitAsc">Profit ↑</option>
        <option value="profitDesc">Profit ↓</option>
        <option value="vendedoresAsc">#Vendedores ↑</option>
        <option value="vendedoresDesc">#Vendedores ↓</option>
        <option value="fechaAsc">Fecha ↑</option>
        <option value="fechaDesc">Fecha ↓</option>
        
    `;

    document.getElementById('sortBy').addEventListener('change', (e) => {
        console.log('Ordenando por:', e.target.value);
        aplicarFiltros();
    });

    // Función para convertir fecha a valor numérico
    const fechaToTimestamp = (fechaString) => {
        if (!fechaString) return 0;

        try {
            // Separar fecha y hora
            const [fechaPart, horaPart] = fechaString.split(",");
            
            // Procesar la fecha (DD/MM/YYYY)
            const [dia, mes, anio] = fechaPart.trim().split("/");
            
            // Procesar la hora (HH:MM) asegurando formato de 2 dígitos
            const [hora, minuto] = horaPart.trim().split(":");
            const horaFormateada = hora.padStart(2, '0');
            const minutoFormateado = minuto.padStart(2, '0');
            
            // Crear fecha y retornar timestamp
            return new Date(
                parseInt(anio),
                parseInt(mes) - 1,
                parseInt(dia),
                parseInt(horaFormateada),
                parseInt(minutoFormateado)
            ).getTime();
        } catch (error) {
            console.error('Error procesando fecha:', fechaString, error);
            return 0;
        }
    };

    // Función simple para ordenar fechas
    const ordenarPorFecha = (a, b, descendente = true) => {
        console.log('Ordenando:', {
            fechaA: a?.fechaDescarga,
            fechaB: b?.fechaDescarga
        });

        if (!a?.fechaDescarga || !b?.fechaDescarga) {
            console.log('Fecha faltante');
            return 0;
        }

        const valorA = fechaToTimestamp(a.fechaDescarga);
        const valorB = fechaToTimestamp(b.fechaDescarga);
        console.log('Valores:', {valorA, valorB});

        return descendente ? valorB - valorA : valorA - valorB;
    };
});