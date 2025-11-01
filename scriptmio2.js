import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import puppeteer from 'puppeteer';
import schedule from 'node-schedule';

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'
];

async function obtenerCategoria(asin, intentos = 3) {
    const cleanAsin = asin.replace('https://www.amazon.com/gp/product/', '');
    console.log(`Obteniendo categoría para ${cleanAsin}`);

    for (let intento = 1; intento <= intentos; intento++) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',
                    //'--proxy-server=http://208.104.211.63:80', // Proxy gratuito
                    `--user-agent=${userAgents[Math.floor(Math.random() * userAgents.length)]}`
                ]
            });

            const page = await browser.newPage();
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0',
                'Upgrade-Insecure-Requests': '1'
            });

            await page.setViewport({
                width: 1024 + Math.floor(Math.random() * 100),
                height: 768 + Math.floor(Math.random() * 100),
                deviceScaleFactor: 1,
                hasTouch: false,
                isLandscape: false,
                isMobile: false
            });

            page.setDefaultNavigationTimeout(10000);
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

            await page.goto(`https://www.amazon.com/dp/${cleanAsin}`);
            await page.exposeFunction('logFromPage', console.log);
            
            const categoria = await page.evaluate(async () => {
                let element = document.querySelector('.a-link-normal.a-color-tertiary.a-link-normal.a-color-tertiary');
                let categoriaTexto = null;
                
                if (element && element.textContent.trim()) {
                    categoriaTexto = element.textContent.trim();
                    await window.logFromPage('Categoría encontrada en tertiary:', categoriaTexto);
                } else {
                    element = document.querySelector('#wayfinding-breadcrumbs_feature_div a');
                    if (element && element.textContent.trim()) {
                        categoriaTexto = element.textContent.trim();
                        await window.logFromPage('Categoría encontrada en breadcrumb:', categoriaTexto);
                    }
                }
                
                return categoriaTexto;
            });
            
            if (categoria) {
                console.log(`✅ Categoría encontrada: ${categoria}`);
                await browser.close();
                return categoria;
            }
        } catch (error) {
            console.log(`Intento ${intento}: Error - ${error.message}`);
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch (error) {
                    console.error('Error cerrando el navegador:', error);
                }
            }
        }
        
        if (intento < intentos) {
            console.log(`Reintentando... (${intento}/${intentos})`);
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        }
    }
    
    console.log(`❌ No se pudo obtener categoría después de ${intentos} intentos`);
    return 'No disponible';
}

async function obtenerNombreVendedor(sellerId, intentos = 3) {
    if (sellerId === "A2R2RITDJNW1Q6") {
        return { seller_name: "All Department", productos: 0 }};
    console.log(`Obteniendo nombre para vendedor: ${sellerId}`);

    for (let intento = 1; intento <= intentos; intento++) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: "new",
                /*slowMo: 600,*/
                /*waitForInitialPage: true,*/
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',
                    //'--proxy-server=http://208.104.211.63:80', // Proxy gratuito
                    `--user-agent=${userAgents[Math.floor(Math.random() * userAgents.length)]}`
                ]
            });

            const page = await browser.newPage();
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0',
                'Upgrade-Insecure-Requests': '1'
            });

            await page.setViewport({
                width: 1024 + Math.floor(Math.random() * 100),
                height: 768 + Math.floor(Math.random() * 100),
                deviceScaleFactor: 1,
                hasTouch: false,
                isLandscape: false,
                isMobile: false
            });

            page.setDefaultNavigationTimeout(10000);
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            await page.goto(`https://www.amazon.com/s?me=${sellerId}`);
            
            await page.exposeFunction('logFromPage', console.log);
            
            const { nombreVendedor, productos } = await page.evaluate(async () => {
                const selectElement = document.querySelector('#searchDropdownBox'); 
                const optionElement = selectElement.querySelector('option[selected="selected"]');
                let nombreVendedor = productos = null;
                if (optionElement && optionElement.textContent) {
                    nombreVendedor = optionElement.textContent.trim();
                } else nombreVendedor = null;
                
                if ( nombreVendedor != null || "All Departments" ){

                const element = document.querySelector('h2.a-size-base span');
                
                if (element && element.textContent) {
                    const texto = element.textContent.trim();
                    let match;

                    if (texto.includes('of over')) {
                        match = texto.match(/of\s+over\s+([\d,]+)\s+results?/);
                    } else if (texto.includes('of')) {
                        match = texto.match(/of\s+([\d,]+)\s+results?/);
                    } else {
                        match = texto.match(/(\d+)\s+results?/);
                    }
            
                    if (match && match[1]) {
                        window.logFromPage(`Productos encontrados: ${match[1]}`);
                        productos = parseInt(match[1].replace(/,/g, ''), 10);
                        /*productos = match[1];*/

                    }
                } else productos = null;
            } else productos = null;
                
                   return { nombreVendedor, productos };
            });

            if (nombreVendedor) {
                console.log(`✅ Nombre de vendedor encontrado: ${nombreVendedor}`);
                console.log(`✅ Cantidad de productos: ${productos || 'No disponible'}`);
                await browser.close();
                return { seller_name: nombreVendedor, productos: productos || 0 };
            }

        } catch (error) {
            console.log(`Intento ${intento}: Error - ${error.message}`);
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch (error) {
                    console.error('Error cerrando el navegador:', error);
                }
            }
        }
        
        if (intento < intentos) {
            console.log(`Reintentando... (${intento}/${intentos})`);
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        }
    }
    
    console.log(`❌ No se pudo obtener nombre para ${sellerId} después de ${intentos} intentos`);
    if (sellerId === "A2R2RITDJNW1Q6") {
    return { seller_name: "All Department", productos: 0 }}
}

async function actualizarDatos() {
    try {
        const response = await fetch('http://server.nepeto.com/main_page_products');
        const nuevosProductos = await response.json();
        console.log(`Productos obtenidos de nepeto.com: ${nuevosProductos.length}`);

        let datosExistentes = [];
        if (fsSync.existsSync('datos.json')) {
            try {
                const contenido = await fs.readFile('datos.json', 'utf8');
                datosExistentes = JSON.parse(contenido);
                console.log(`Productos existentes en datos.json: ${datosExistentes.length}`);
            } catch (error) {
                console.log('No hay datos previos o error al leer datos.json');
            }
        }

        for (const nuevoProducto of nuevosProductos) {
            const productosExistentes = datosExistentes.filter(p => p.asin === nuevoProducto.asin);
            
            const esProductoNuevo = !productosExistentes.some(p => 
                p.roi === nuevoProducto.roi && 
                p.az_price === nuevoProducto.az_price && 
                p.source_name === nuevoProducto.source_name
            );

            if (esProductoNuevo) {
                console.log(`\nProcesando nuevo producto: ${nuevoProducto.asin}`);
                
                try {
                    nuevoProducto.categoria = await obtenerCategoria(nuevoProducto.asin);
                    console.log(`Categoría obtenida: ${nuevoProducto.categoria}`);
                } catch (error) {
                    console.error(`Error obteniendo categoría: ${error.message}`);
                    nuevoProducto.categoria = "No disponible";
                }

                try {
                    const offers = JSON.parse(nuevoProducto.az_offers);
                    if (!offers || !Array.isArray(offers)) {
                        console.error('Error: az_offers no es un array válido');
                        nuevoProducto.az_offers = '[]';
                    } else {
                        console.log(`Procesando ${offers.length} vendedores...`);
                        
                        for (const offer of offers) {
                            try {
                                if (!offer.seller_name) {
                                    const resultado = await obtenerNombreVendedor(offer.seller);
                                    offer.seller_name = resultado.seller_name;
                                    offer.productos = resultado.productos;
                                    console.log(`Nombre de vendedor obtenido: ${offer.seller_name}`);
                                    console.log(`Cantidad de productos: ${offer.productos}`);
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                }
                            } catch (error) {
                                console.error(`Error obteniendo nombre para vendedor ${offer.seller}: ${error.message}`);
                                offer.seller_name = offer.seller;
                                offer.productos = 0;
                            }
                        }
                        
                        nuevoProducto.az_offers = JSON.stringify(offers);
                    }
                } catch (error) {
                    console.error(`Error procesando vendedores: ${error.message}`);
                    nuevoProducto.az_offers = '[]';
                }

                nuevoProducto.fechaDescarga = new Date().toLocaleString('es-ES');
                datosExistentes.push(nuevoProducto);
                await fs.writeFile('datos.json', JSON.stringify(datosExistentes, null, 2));
                console.log('Datos guardados en datos.json');
            }
        }

        console.log('\n=== Resumen Final ===');
        console.log(`Total productos en datos.json: ${datosExistentes.length}`);

    } catch (error) {
        console.error('Error en actualizarDatos:', error);
    }
}

async function actualizarCategoriasFaltantes() {
    try {
        if (!fsSync.existsSync('datos.json')) {
            console.log('No existe datos.json');
            return;
        }

        const contenido = await fs.readFile('datos.json', 'utf8');
        let productos = JSON.parse(contenido);
        console.log(`Total de productos: ${productos.length}`);

        const productosSinCategoria = productos.filter(p => !p.categoria || p.categoria === "No disponible");
        console.log(`Productos sin categoría: ${productosSinCategoria.length}`);

        for (const producto of productosSinCategoria) {
            console.log(`\nActualizando categoría para ASIN: ${producto.asin}`);
            try {
                const categoria = await obtenerCategoria(producto.asin);
                producto.categoria = categoria;
                console.log(`Categoría actualizada: ${categoria}`);
                await fs.writeFile('datos.json', JSON.stringify(productos, null, 2));
            } catch (error) {
                console.error(`Error obteniendo categoría para ${producto.asin}:`, error.message);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('\n=== Resumen Final Categorías ===');
        const productosSinCategoriaFinal = productos.filter(p => !p.categoria || p.categoria === "No disponible");
        console.log(`Productos sin categoría restantes: ${productosSinCategoriaFinal.length}`);

    } catch (error) {
        console.error('Error actualizando categorías:', error);
    }
}

async function actualizarNombresVendedoresFaltantes() {
    try {
        console.log('\n=== Iniciando actualización de nombres de vendedores y productos ===');
        
        if (!fsSync.existsSync('datos.json')) {
            console.log('No existe datos.json');
            return;
        }

        const contenido = await fs.readFile('datos.json', 'utf8');
        let productos = JSON.parse(contenido);
        console.log(`Total de productos en datos.json: ${productos.length}`);

        let totalVendedoresAProcesar = 0;
        let totalProductosAProcesar = 0;
        productos.forEach(producto => {
            try {
                const offers = JSON.parse(producto.az_offers);
                if (offers && Array.isArray(offers)) {
                    totalVendedoresAProcesar += offers.filter(offer => !offer.seller_name).length;
                    totalProductosAProcesar += offers.filter(offer => !offer.productos).length;
                }
            } catch (error) {
                console.error(`Error al parsear offers de producto ${producto.asin}`);
            }
        });
        console.log(`Total de vendedores sin nombre: ${totalVendedoresAProcesar}`);
        console.log(`Total de vendedores sin productos: ${totalProductosAProcesar}`);

        if ((totalVendedoresAProcesar === 0) && (totalProductosAProcesar === 0)) {
            console.log('✅ Todos los vendedores ya tienen nombre y #productos');
            return;
        }

        for (const producto of productos) {
            try {
                const offers = JSON.parse(producto.az_offers);
                if (!offers || !Array.isArray(offers)) {
                    console.error(`Error: az_offers no es un array válido para producto ${producto.asin}`);
                    continue;
                }

                const vendedoresSinNombre = offers.filter(offer => !offer.seller_name);
                const vendedoresSinproductos = offers.filter(offer => !offer.productos);
                const ASIN = producto.asin.slice(-10);
                if ((totalVendedoresAProcesar > 0) || (totalProductosAProcesar > 0)) {
                    (totalVendedoresAProcesar != 0) && console.log(`Hay productos del ${ASIN} que tiene vendedores sin nombre`);
                    (totalProductosAProcesar != 0) && console.log(`Al menos un vendedor del ${ASIN} tiene productos sin cantidad`);

                    for (const offer of offers) {
                        if (!offer.seller_name || !offer.productos) {
                            console.log(`\nProcesando vendedor y sus productos: ${offer.seller}`);
                            try {
                                const resultado = await obtenerNombreVendedor(offer.seller);
                                offer.seller_name = resultado.seller_name;
                                offer.productos = resultado.productos;
                                console.log(`✅ Nombre obtenido: ${offer.seller_name}`);
                                console.log(`✅ Cantidad de productos: ${offer.productos}`);
                                
                                producto.az_offers = JSON.stringify(offers);
                                await fs.writeFile('datos.json', JSON.stringify(productos, null, 2));
                                console.log('💾 Cambios guardados en datos.json');
                                
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } catch (error) {
                                console.error(`❌ Error obteniendo nombre para vendedor ${offer.seller}:`, error.message);
                                offer.seller_name = offer.seller;
                                offer.productos = 0;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error procesando vendedores del producto ${producto.asin}:`, error.message);
                continue;
            }
        }

        console.log('\n=== Resumen Final ===');
        let totalVendedoresSinNombre = 0;
        let totalVendedoresSinProductos = 0;
        productos.forEach(producto => {
            try {
                const offers = JSON.parse(producto.az_offers);
                if (offers && Array.isArray(offers)) {
                    totalVendedoresSinNombre += offers.filter(offer => !offer.seller_name).length;
                    totalVendedoresSinProductos += offers.filter(offer => !offer.productos).length;
                }
            } catch (error) {
                console.error(`Error al parsear offers de producto ${producto.asin}`);
            }
        });
        console.log(`Vendedores sin nombre restantes: ${totalVendedoresSinNombre}`);
        console.log(`Vendedores sin productos: ${totalVendedoresSinProductos}`);

    } catch (error) {
        console.error('Error actualizando nombres de vendedores:', error);
    }
}

async function main() {
    try {
        console.log('🚀 Iniciando proceso...');
        
        await actualizarDatos();
        
        console.log('\n📑 Actualizando categorías faltantes...');
        await actualizarCategoriasFaltantes();
        
        console.log('\n👥 Actualizando nombres de vendedores faltantes...');
        await actualizarNombresVendedoresFaltantes();
        
        console.log('\n✨ Proceso completado con éxito');
    } catch (error) {
        console.error('Error en el proceso principal:', error);
    }
}

const job = schedule.scheduleJob('0 */2 * * *', async () => {
    console.log(`[INFO] Ejecutando tarea programada: ${new Date().toLocaleString()}`);
    await main();
});   

console.log('🚀 Script programado para ejecutarse cada 2 horas');

main().catch(error => {
    console.error('Error fatal:', error);
});