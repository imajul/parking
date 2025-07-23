const puppeteer = require('puppeteer');

const MY_EMAIL = 'ignacio.majul@genneia.com.ar';
const MY_PASSWORD = 'Genneia.12345$';
const PARKING_SPOT_NUMBER = '237';

function getTomorrowWeekday() {
    const dias = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 0);
    return dias[mañana.getDay()];
}

async function automateParkingReservation() {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    await new Promise(r => setTimeout(r, 1000));

    try {
        console.log('Iniciando automatización de reserva de cochera...');
        await page.goto('https://app.parkalot.io/#/login', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        await page.waitForSelector('input[type="email"]', { visible: true, timeout: 30000 });
        await page.type('input[type="email"]', MY_EMAIL, { delay: 50 });
        await page.type('input[type="password"]', MY_PASSWORD, { delay: 50 });
        await new Promise(r => setTimeout(r, 1000));

        await page.waitForSelector('button[type="button"].md-btn', { visible: true, timeout: 20000 });
        await page.click('button[type="button"].md-btn');
        await new Promise(r => setTimeout(r, 1000));
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 1000));

        // ----------- SELECCIONAR BLOQUE DE MAÑANA O EL PRIMERO DISPONIBLE -------------
        const tomorrowName = getTomorrowWeekday();
        console.log(`Buscando el bloque de reservas para: ${tomorrowName}`);
        await page.waitForSelector('div.box-color.m-t-md.sharp-shadow.dark.r.m-l.m-r', { visible: true, timeout: 30000 });
        await new Promise(r => setTimeout(r, 1000));

        const dayBlocks = await page.$$('div.box-color.m-t-md.sharp-shadow.dark.r.m-l.m-r');

        let tomorrowBlock = null;
        for (const block of dayBlocks) {
            const text = await block.evaluate(el => el.innerText);
            if (text.includes(tomorrowName)) {
                tomorrowBlock = block;
                break;
            }
        }
        if (!tomorrowBlock) {
            console.log('No se encontró el bloque del día siguiente. Usando el primer bloque disponible para pruebas.');
            tomorrowBlock = dayBlocks[0];
            if (!tomorrowBlock) throw new Error('No hay bloques de reservas visibles.');
        }
        await tomorrowBlock.evaluate(el => el.scrollIntoView({behavior: "smooth", block: "center"}));
        await new Promise(r => setTimeout(r, 1000));

        // Buscar botón DETAILS dentro de ese bloque
        const detailsBtns = await tomorrowBlock.$$('button');
        let detailsButton = null;
        for (const btn of detailsBtns) {
            const text = await btn.evaluate(el => el.innerText);
            if (text && text.toLowerCase().includes('details')) {
                detailsButton = btn;
                break;
            }
        }
        if (!detailsButton) throw new Error('No se encontró el botón DETAILS en el bloque de mañana.');
        await detailsButton.hover();
        await detailsButton.click();
        console.log('Clic en DETAILS del bloque realizado.');
        await new Promise(r => setTimeout(r, 1000));

        // ----------- Scroll y click robusto por h6 (como antes) -------------
        const scrollableContainerSelector = 'div[data-test-id="virtuoso-scroller"]';
        await page.waitForSelector(scrollableContainerSelector, { visible: true, timeout: 20000 });
        await new Promise(r => setTimeout(r, 1000));

        let cocheraEncontrada = false;
        let lastScrollTop = -1;

        for (let i = 0; i < 100; i++) {
            const spotHandle = await page.evaluateHandle((selector, spotNumber) => {
                const container = document.querySelector(selector);
                if (!container) return null;
                const h6s = container.querySelectorAll('h6');
                for (const h6 of h6s) {
                    if (h6.textContent.trim() === spotNumber) {
                        let el = h6;
                        while (el && el.tagName !== 'BUTTON') el = el.parentElement;
                        return el;
                    }
                }
                container.scrollTop += Math.floor(container.clientHeight * 0.9);
                return null;
            }, scrollableContainerSelector, PARKING_SPOT_NUMBER);

            const element = await spotHandle.asElement();
            if (element) {
                await element.evaluate(el => el.scrollIntoView({behavior: "smooth", block: "center"}));
                await element.focus();
                await element.click();
                cocheraEncontrada = true;
                console.log(`Clic en cochera ${PARKING_SPOT_NUMBER} realizado.`);
                break;
            }
            const scrollTopNow = await page.evaluate(selector => {
                const container = document.querySelector(selector);
                return container ? container.scrollTop : -1;
            }, scrollableContainerSelector);
            if (scrollTopNow === lastScrollTop) {
                break;
            }
            lastScrollTop = scrollTopNow;
            await new Promise(r => setTimeout(r, 200));
        }

        if (!cocheraEncontrada) {
            throw new Error(`No se pudo encontrar y expandir la cochera ${PARKING_SPOT_NUMBER} tras múltiples intentos.`);
        }
        await new Promise(r => setTimeout(r, 1000));

        // ----------- Esperar botón RESERVE debajo de la cochera -----------
        console.log('Esperando el botón RESERVE debajo de la cochera expandida...');
        await page.waitForFunction((spotNumber) => {
            const blocks = Array.from(document.querySelectorAll('div'))
                .filter(div =>
                    div.innerText && div.innerText.includes(spotNumber) && div.innerText.includes('Olivos II - Segundo Subsuelo')
                );
            if (!blocks.length) return false;
            return blocks.some(block =>
                Array.from(block.querySelectorAll('button')).some(btn =>
                    btn.innerText && btn.innerText.toLowerCase().includes('reserve') &&
                    !btn.disabled && btn.offsetParent !== null
                )
            );
        }, { timeout: 25000 }, PARKING_SPOT_NUMBER);
        await new Promise(r => setTimeout(r, 1000));

        console.log('Botón RESERVE visible y habilitado.');
        await page.screenshot({ path: '6_antes_de_reserve.png' });
        await new Promise(r => setTimeout(r, 1000));

        // ----------- CLICK REFORZADO -----------
        const clicked = await page.evaluate((spotNumber) => {
            const blocks = Array.from(document.querySelectorAll('div'))
                .filter(div =>
                    div.innerText && div.innerText.includes(spotNumber) && div.innerText.includes('Olivos II - Segundo Subsuelo')
                );
            for (const block of blocks) {
                const btn = Array.from(block.querySelectorAll('button')).find(b =>
                    b.innerText && b.innerText.toLowerCase().includes('reserve') &&
                    !b.disabled && b.offsetParent !== null
                );
                if (btn) {
                    btn.focus();
                    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    btn.click();
                    return true;
                }
            }
            return false;
        }, PARKING_SPOT_NUMBER);

        if (clicked) {
            console.log('Clic reforzado en "Reserve" realizado.');
            await new Promise(r => setTimeout(r, 1000));
            await page.screenshot({ path: '7_reserve_clicked.png' });
        } else {
            throw new Error('No se pudo clickear el botón "Reserve".');
        }
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: '8_despues_de_reserve.png' });

    } catch (error) {
        console.error('Ocurrió un error durante la automatización:', error);
        await page.screenshot({ path: '99_error_screenshot.png' });
    } finally {
        console.log('Cerrando navegador...');
        await browser.close();
        console.log('Automatización finalizada.');
    }
}

automateParkingReservation();
