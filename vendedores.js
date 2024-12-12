document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('vendor-count')) {
        try {
            const vendorsData = decodeURIComponent(e.target.dataset.vendors);
            const indice = e.target.dataset.indice;
            
            // Obtener el título del producto desde la tarjeta
            const productCard = e.target.closest('.product-card');
            const productTitle = productCard.querySelector('h2').getAttribute('title');
            
            // Sanitizar los datos antes de parsear el JSON
            const sanitizedData = vendorsData
                .replace(/\\'/g, "'")  // Reemplazar \' con '
                .replace(/'/g, "'")    // Reemplazar ' con '
                .replace(/\\"/g, '"'); // Reemplazar \" con "
            
            const vendedores = JSON.parse(sanitizedData);
            
            // Ya no necesitamos obtener nombres porque ya están en datos.json
            const vendedoresProcesados = vendedores.map((v, index) => ({
                ...v,
                indice: index + 1,
                marca: v.seller_name || 'Amazon.com'
            }));

            // Mostrar popup con título del producto
            mostrarPopup(vendedoresProcesados, productTitle);
        } catch (error) {
            console.error('Error procesando vendedores:', error);
            console.log('Datos que causaron el error:', e.target.dataset.vendors);
        }
    }
});

function mostrarPopup(vendedores, productTitle) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup draggable';
    
    // Posición inicial del popup
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    
    // Crear barra de título
    const titleBar = document.createElement('div');
    titleBar.className = 'popup-titlebar';
    titleBar.innerHTML = `
        <h3>Lista de Vendedores: ${productTitle}</h3>
        <button class="popup-close" onclick="this.closest('.popup-overlay').remove()">×</button>
    `;

    // Hacer arrastrable desde la barra de título
    titleBar.onmousedown = function(e) {
        e.preventDefault();
        
        // Calcular posición inicial real antes de empezar a arrastrar
        const rect = popup.getBoundingClientRect();
        popup.style.top = rect.top + 'px';
        popup.style.left = rect.left + 'px';
        popup.style.transform = 'none'; // Remover transform para permitir arrastre

        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;

        function onMouseMove(e) {
            popup.style.left = `${e.clientX - startX}px`;
            popup.style.top = `${e.clientY - startY}px`;
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Agregar barra de título
    popup.appendChild(titleBar);

    // Crear tabla con headers ordenables
    const table = document.createElement('div');
    table.innerHTML = `
        <table class="vendor-table">
            <thead>
                <tr>
                    <th class="index-column">#</th>
                    <th>Vendedor</th>
                    <th>Marca</th>
                    <th class="center-align sortable" data-sort="price">Precio ↕</th>
                    <th class="center-align sortable" data-sort="feedback">Feedback ↕</th>
                    <th class="center-align sortable" data-sort="rating">Rating ↕</th>
                    <th class="center-align">Buy Box</th>
                    <th class="center-align">FBA</th>
                </tr>
            </thead>
            <tbody>
                ${renderRows(vendedores)}
            </tbody>
        </table>
    `;

    // Función para renderizar filas
    function renderRows(vendors) {
        return vendors.map((vendor) => `
            <tr>
                <td class="index-column">${vendor.indice}</td>
                <td><a href="https://www.amazon.com/s?me=${vendor.seller}" target="_blank">${vendor.seller}</a></td>
                <td>${vendor.marca || 'N/A'}</td>
                <td class="center-align">$${vendor.price?.toFixed(2) || 'N/A'}</td>
                <td class="center-align">${vendor.seller_feedback_count?.toLocaleString() || 'N/A'}</td>
                <td class="center-align">${vendor.seller_positive_feedback_rating ? vendor.seller_positive_feedback_rating + '%' : 'N/A'}</td>
                <td class="center-align">${vendor.is_buy_box_winner ? '✅' : '❌'}</td>
                <td class="center-align">${vendor.is_fba ? '✅' : '❌'}</td>
            </tr>
        `).join('');
    }

    // Agregar tabla al popup
    popup.appendChild(table);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Agregar event listeners para ordenamiento
    table.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const sortBy = th.dataset.sort;
            const sortedVendors = [...vendedores].sort((a, b) => {
                if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
                if (sortBy === 'feedback') return (b.seller_feedback_count || 0) - (a.seller_feedback_count || 0);
                if (sortBy === 'rating') return (b.seller_positive_feedback_rating || 0) - (a.seller_positive_feedback_rating || 0);
            });
            
            // Invertir orden si se hace clic de nuevo
            if (th.classList.contains('sorted')) {
                sortedVendors.reverse();
            }
            
            // Actualizar clases de ordenamiento
            table.querySelectorAll('.sortable').forEach(h => h.classList.remove('sorted'));
            th.classList.add('sorted');
            
            // Actualizar tabla
            table.querySelector('tbody').innerHTML = renderRows(sortedVendors);
        });
    });
} 