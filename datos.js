document.addEventListener("DOMContentLoaded", () => {
    let db;
    let productosOriginales = [];
    let currentPopup = null;
    let currentPage = 1;
    let itemsPerPage = 100;
    let totalPages = 1;
    let datosFiltrados = [];

    // ---------------------- IndexedDB ----------------------
    const request = indexedDB.open("AOLINE", 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("productos")) {
            db.createObjectStore("productos", { keyPath: "asin" });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        cargarDatos();
    };

    request.onerror = function (event) {
        console.error("Error abriendo IndexedDB", event.target.error);
    };

    async function agregarOActualizarProductos(datos) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["productos"], "readwrite");
            const store = transaction.objectStore("productos");
            datos.forEach(producto => store.put(producto));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async function borrarProductos(asins) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["productos"], "readwrite");
            const store = transaction.objectStore("productos");
            asins.forEach(asin => store.delete(asin));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async function obtenerTodosProductos() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["productos"], "readonly");
            const store = transaction.objectStore("productos");
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function exportarAJSON() {
        const todos = await obtenerTodosProductos();
        const blob = new Blob([JSON.stringify(todos, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "datos.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    // ---------------------- Funciones existentes ----------------------
    const filtrosToggle = document.querySelector('.filtros-toggle');
    const filterMenu = document.querySelector('.filter-menu');
    let isExpanded = false;
    if (filterMenu) filterMenu.classList.toggle('collapsed');

    const filtros = crearFiltros();
    if (filterMenu) filterMenu.appendChild(filtros);

    if (filtrosToggle) filtrosToggle.addEventListener('click', () => {
        isExpanded = !isExpanded;
        filterMenu.classList.toggle('collapsed');
        filtrosToggle.textContent = `${isExpanded ? 'Ocultar Filtros: ▲ ' : ' Mostrar Filtros: ▼'}`;
    });

    function crearFiltros() {
        const filtrosDiv = document.createElement('div');
        filtrosDiv.className = 'filtros';
        return filtrosDiv;
    }

    function updatePaginationInfo() {
        const paginationInfo = document.getElementById('currentPageInfo');
        if (paginationInfo) paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;

        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        if (prevButton) prevButton.disabled = currentPage === 1;
        if (nextButton) nextButton.disabled = currentPage === totalPages;

        const goToPageInput = document.getElementById('goToPage');
        if (goToPageInput) {
            goToPageInput.max = totalPages;
            goToPageInput.value = currentPage;
        }
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            aplicarFiltros();
        }
    }

    function populateStoreFilter() {
        const storeFilter = document.getElementById('storeFilter');
        if (!storeFilter) return;
        const uniqueStores = [...new Set(productosOriginales.map(p => p.source_name))];
        storeFilter.innerHTML = `<option value="">Todas (${uniqueStores.length})</option>`;
        uniqueStores.sort().forEach(store => {
            const option = document.createElement('option');
            option.value = store;
            option.textContent = store;
            storeFilter.appendChild(option);
        });
    }

    async function cargarDatos() {
    try {
        // 🔹 Obtener todos los productos almacenados en IndexedDB
        let datos = await obtenerTodosProductos();

        if (!datos || datos.length === 0) {
            console.warn("⚠️ No hay productos guardados en IndexedDB/AOLINE/productos");
            const container = document.querySelector(".container");
            if (container) container.innerHTML = "<p style='color:orange'>No hay productos almacenados en esta base de datos.</p>";
            return;
        }

        // 🔹 Preparar datos para mostrar
        datos.forEach((producto, index) => {
            producto.indiceOriginal = index + 1;
        });

        productosOriginales = datos;
        populateStoreFilter();

        // 🔹 Orden inicial (si el usuario tiene un criterio seleccionado)
        const ordenar = document.getElementById("sortBy")?.value || "";
        let datosOrdenados = [...datos];

        switch (ordenar) {
            case "salesRankAsc": datosOrdenados.sort((a, b) => a.sales_rank - b.sales_rank); break;
            case "salesRankDesc": datosOrdenados.sort((a, b) => b.sales_rank - a.sales_rank); break;
            case "roiDesc": datosOrdenados.sort((a, b) => b.roi - a.roi); break;
            case "roiAsc": datosOrdenados.sort((a, b) => a.roi - b.roi); break;
            case "priceAsc": datosOrdenados.sort((a, b) => a.price - b.price); break;
            case "priceDesc": datosOrdenados.sort((a, b) => b.price - a.price); break;
            case "fechaDesc": datosOrdenados.sort((a, b) => ordenarPorFecha(a, b, true)); break;
            case "fechaAsc": datosOrdenados.sort((a, b) => ordenarPorFecha(a, b, false)); break;
        }

        // 🔹 Mostrar los productos
        await mostrarProductos(datosOrdenados);

        // 🔹 Actualizar contador visual
        const contador = document.querySelector(".contador-productos");
        if (contador) contador.textContent = datos.length;

        console.log(`✅ Productos cargados desde IndexedDB: ${datos.length}`);
    } catch (error) {
        console.error("❌ Error al cargar datos desde IndexedDB:", error);
    }
}


    async function imagenExiste(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    async function mostrarProductos(datos) {
        
        datosFiltrados = datos;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = datos.slice(startIndex, endIndex);
        totalPages = Math.ceil(datos.length / itemsPerPage);
        updatePaginationInfo();

        const container = document.querySelector('.container');
        if (!container) return console.error('No se encontró el contenedor .container');

        const paginationControls = container.querySelector('.pagination-controls');
        container.innerHTML = '';
        if (paginationControls) container.appendChild(paginationControls);

        for (const producto of paginatedData) {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

            let vendor = [];
            try {
                vendor = JSON.parse(producto.az_offers.replace(/'/g, '´')) || [];
            } catch { vendor = []; }

            const imgSrc = await imagenExiste(producto.img) ? producto.img : 'Imagesoon.jpg';
            const azImgSrc = await imagenExiste(producto.az_img) ? producto.az_img : 'Imagesoon.jpg';

            function recortarTitulo(titulo) { return titulo.length > 25 ? titulo.slice(0, 25) + "..." : titulo; }
            function recortarTitulo2(titulo) { return titulo.length > 65 ? titulo.slice(0, 65) : titulo; }
            function recortarNombreTienda(nombre) { return window.innerWidth <= 600 && nombre.length > 11 ? nombre.slice(0, 9) + "..." : nombre; }

            producto.profit = producto.price * producto.roi * producto.qty;

            productCard.innerHTML = `
                <div class="product-select">
                    <input type="checkbox" class="select-product" data-asin="${producto.asin}">
                </div>
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
                        <div title="Ganancia Neta">NETO: $${(producto.price * producto.roi).toFixed(2)}</div>
                        <div title="Ganancia Neta x MaxOQ">PROFIT: $${producto.profit.toFixed(2)}</div>
                    </div>
                    <div class="right">
                        <a href="${producto.asin}" target="_blank">
                            <img src="${azImgSrc}" alt="Imagen derecha" title="Ir a AMAZON">
                        </a>
                        <div>AMAZON:</div>
                        <a href="https://www.profitguru.com/calculator/sales?asin=${producto.asin.slice(-10)}" target="_blank" title="ver Historial Ventas">
                            <div>${producto.asin.slice(-10)}</div>
                        </a>
                        <div>Precio: $${producto.az_price.toFixed(2)}</div>
                        <a href="https://www.sellersprite.com/v2/tools/sales-estimator?market=US&asin=${producto.asin.slice(-10)}" target="_blank" title="Estadisticas">
                            <div>BSR: #${producto.sales_rank}</div>
                        </a>
                        <div class="vendor-count" style="cursor: pointer;" data-vendors='${encodeURIComponent(JSON.stringify(vendor))}' data-indice='${producto.indiceOriginal}'>
                            Vendedores: ${vendor.length}
                        </div>
                        <div class="categoria">Categoría: ${producto.categoria || 'No disponible'}</div>
                    </div>
                </div>
                <a class="gshop-ico" href="https://www.google.com/search?tbm=shop&amp;psb=1&amp;q=${recortarTitulo2(producto.title)}" target="_blank" title="Buscar en Google Shopping"><img src="GShop-16.ico" alt="Google Shopping"></a>
                <a class="gshop-ico" href="https://lens.google.com/uploadbyurl?url=${encodeURIComponent(producto.az_img.replace(/'/g, ''))}" target="_blank" title="Buscar con Google Lens"><img src="Google_Lens16.png" alt="Google Lens"></a>
                <a class="gshop-ico" href="https://www.bing.com/images/search?view=detailv2&iss=sbi&form=SBIIDP&sbisrc=UrlPaste&q=imgurl:${encodeURIComponent(producto.az_img.replace(/'/g, ''))}" target="_blank" title="Buscar imagen en Bing"><img src="Bing-16.png" alt="Bing"></a>
                <a class="gshop-ico" href="https://shopping.yahoo.com/search?p=${encodeURIComponent(recortarTitulo2(producto.title))}" target="_blank" title="Buscar en Yahoo Shopping"><img src="Yahoo-16.png" alt="Yahoo Shopping"></a>
                <div class="roi">ROI: ${Math.round(producto.roi*100)}% 🔰</div>
            `;

            container.appendChild(productCard);
        }
    }

    window.verHistorialVentas = function (asin) {
        const nuevaVentana = window.open(`${asin}`, '_blank');
        nuevaVentana.onload = function () {
            const interval = setInterval(() => {
                const salesButton = nuevaVentana.document.querySelector('.amz-history-widget');
                if (salesButton) {
                    salesButton.click();
                    clearInterval(interval);
                }
            }, 500);
            setTimeout(() => clearInterval(interval), 5000);
        };
    }

    function aplicarFiltros() {
        let filtrados = [...productosOriginales];
        const roiMin = parseFloat(document.getElementById('roiMin').value) || 0;
        const roiMax = parseFloat(document.getElementById('roiMax').value) || Infinity;
        const priceMin = parseFloat(document.getElementById('priceMin').value) || 0;
        const priceMax = parseFloat(document.getElementById('priceMax').value) || Infinity;
        const salesRankMin = parseFloat(document.getElementById('salesRankMin').value) || 0;
        const salesRankMax = parseFloat(document.getElementById('salesRankMax').value) || Infinity;
        const tienda = document.getElementById('storeFilter')?.value || '';
        const ordenar = document.getElementById('sortBy')?.value || '';

        filtrados = filtrados.filter((producto) => {
            if (!producto.roi || !producto.price || !producto.sales_rank) return false;
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

        switch (ordenar) {
            case 'salesRankAsc': filtrados.sort((a, b) => a.sales_rank - b.sales_rank); break;
            case 'salesRankDesc': filtrados.sort((a, b) => b.sales_rank - a.sales_rank); break;
            case 'roiDesc': filtrados.sort((a, b) => b.roi - a.roi); break;
            case 'roiAsc': filtrados.sort((a, b) => a.roi - b.roi); break;
            case 'priceAsc': filtrados.sort((a, b) => a.price - b.price); break;
            case 'priceDesc': filtrados.sort((a, b) => b.price - a.price); break;
            case 'profitDesc': filtrados.sort((a, b) => b.profit - a.profit); break;
            case 'profitAsc': filtrados.sort((a, b) => a.profit - b.profit); break;
            case 'vendedoresDesc': filtrados.sort((a, b) => JSON.parse(b.az_offers).length - JSON.parse(a.az_offers).length); break;
            case 'vendedoresAsc': filtrados.sort((a, b) => JSON.parse(a.az_offers).length - JSON.parse(b.az_offers).length); break;
            case 'fechaDesc': filtrados.sort((a, b) => ordenarPorFecha(a, b, true)); break;
            case 'fechaAsc': filtrados.sort((a, b) => ordenarPorFecha(a, b, false)); break;
        }

        mostrarProductos(filtrados);
        document.querySelector('.contador-productos').textContent = filtrados.length;
    }

    function reset() {
        document.getElementById('roiMin').value = '';
        document.getElementById('roiMax').value = '';
        document.getElementById('priceMin').value = '';
        document.getElementById('priceMax').value = '';
        document.getElementById('salesRankMin').value = '';
        document.getElementById('salesRankMax').value = '';
        document.getElementById('storeFilter').value = '';
        document.getElementById('sortBy').value = 'index';
        currentPage = 1;
        mostrarProductos(productosOriginales);
        document.querySelector('.contador-productos').textContent = productosOriginales.length;
    }

    // ---------------------- Paginación y botones ----------------------
    const prevPageBtn = document.getElementById('prevPage');
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));

    const nextPageBtn = document.getElementById('nextPage');
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));

    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        aplicarFiltros();
    });

    const goToPageBtn = document.getElementById('goPageButton');
    if (goToPageBtn) goToPageBtn.addEventListener('click', () => {
        const pageNum = parseInt(document.getElementById('goToPage').value);
        changePage(pageNum);
    });

    const goToPageInput = document.getElementById('goToPage');
    if (goToPageInput) goToPageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') changePage(parseInt(e.target.value));
    });

    document.getElementById("applyFilters")?.addEventListener("click", aplicarFiltros);
    document.getElementById('resetFilters')?.addEventListener('click', reset);
    document.getElementById('exportJSON')?.addEventListener('click', exportarAJSON);

    // ---------------------- habilita botom Eliminar productos seleccionados ----------------------
     const deleteButton = document.getElementById('deleteSelected');
    if (!deleteButton) return;

    // Inicialmente desactivado
    deleteButton.disabled = true;

    // Event delegation: escucha cualquier checkbox dinámico con clase .select-product
    document.body.addEventListener('change', (e) => {
        if (e.target.matches('.select-product')) {
            // Si hay al menos uno marcado, habilita el botón
            const anyChecked = document.querySelectorAll('.select-product:checked').length > 0;
            deleteButton.disabled = !anyChecked;
        }
    });

    // ---------------------- Eliminar productos seleccionados ----------------------
      async function eliminarSeleccionados() {
        const checkboxes = document.querySelectorAll('.select-product:checked');
        const asinToDelete = Array.from(checkboxes).map(cb => cb.dataset.asin);

        if (checkboxes.length === 0) return; // Nada que eliminar

        // Confirmar eliminación
        if (!confirm(`¿Eliminar ${checkboxes.length} producto(s) de la vista?`)) return;

         try {
            // 🔹 Eliminar visualmente
            asinToDelete.forEach(asin => {
                document.querySelector(`.select-product[data-asin="${asin}"]`)?.closest('.product-card')?.remove();
            });

            // 🔹 Eliminar de memoria
            productosOriginales = productosOriginales.filter(p => !asinToDelete.includes(p.asin));

            // 🔹 Eliminar de IndexedDB
            await borrarProductos(asinToDelete);

            // 🔹 Desactivar botón
            const deleteButton = document.getElementById('deleteSelected');
            if (deleteButton) deleteButton.disabled = true;

            console.log(`🗑️ ${asinToDelete.length} productos eliminados de IndexedDB.`);
        } catch (error) {
            console.error("❌ Error al eliminar productos:", error);
            alert("Ocurrió un error eliminando los productos.");
        }
    }

    // Asignar la función al botón
        /*deleteButton = document.getElementById('deleteSelected');*/
    if (deleteButton) deleteButton.addEventListener('click', eliminarSeleccionados);


    // ---------------------- Funciones de fecha ----------------------
    const fechaToTimestamp = (fechaString) => {
        if (!fechaString) return 0;
        try {
            const [fechaPart, horaPart] = fechaString.split(",");
            const [dia, mes, anio] = fechaPart.trim().split("/");
            const [hora, minuto] = horaPart.trim().split(":");
            return new Date(parseInt(anio), parseInt(mes)-1, parseInt(dia), parseInt(hora), parseInt(minuto)).getTime();
        } catch { return 0; }
    };

    const ordenarPorFecha = (a, b, descendente = true) => {
        if (!a?.fechaDescarga || !b?.fechaDescarga) return 0;
        const valorA = fechaToTimestamp(a.fechaDescarga);
        const valorB = fechaToTimestamp(b.fechaDescarga);
        return descendente ? valorB - valorA : valorA - valorB;
    };
    
});
    
});
