const puppeteer = require('puppeteer');

const MY_EMAIL = process.env.MY_EMAIL;
const MY_PASSWORD = process.env.MY_PASSWORD;
const PARKING_SPOT_NUMBER = '237';

async function automateParkingReservation() {
    console.log('Iniciando automatización de reserva de cochera...');

    const browser = await puppeteer.launch({
        headless: true,
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

    page.on('console', msg => {
        for (let i = 0; i < msg.args().length; ++i) {
            msg.args()[i].jsonValue().then(value => {
                if (typeof value === 'string' && value.startsWith('[Evaluate DEBUG]')) {
                    console.log(`[BROWSER CONSOLE]: ${value}`);
                } else if (typeof value === 'string' && value.includes('Error:')) {
                    console.error(`[BROWSER CONSOLE ERROR]: ${value}`);
                }
            }).catch(e => console.error(`Error al procesar log de consola: ${e.message}`));
        }
    });

    try {
        console.log('Navegando a la página de login...');
        await page.goto('https://app.parkalot.io/#/login', { waitUntil: 'domcontentloaded' });

        // Espera mínima para los campos de login
        await page.waitForSelector('input[type="email"]', { visible: true, timeout: 15000 });
        await page.waitForSelector('input[type="password"]', { visible: true, timeout: 15000 });

        console.log('Ingresando credenciales...');
        await page.type('input[type="email"]', MY_EMAIL, { delay: 10 });
        await page.type('input[type="password"]', MY_PASSWORD, { delay: 10 });

        // Login inmediato al estar el botón disponible
        const loginButtonSelector = 'button[type="button"].md-btn';
        await page.waitForSelector(loginButtonSelector, { visible: true, timeout: 15000 });
        await page.click(loginButtonSelector);

        // Esperar sólo hasta que la URL cambie al dashboard
        await page.waitForFunction(() => window.location.hash.startsWith('#/client'), { timeout: 15000 });

        // Esperar el botón "DETAILS" lo antes posible
        const detailsBtn = 'button[type="button"].md-btn.md-flat';
        await page.waitForSelector(detailsBtn, { visible: true, timeout: 15000 });
        await page.click(detailsBtn);

        // Esperar a que cargue el contenedor de cocheras
        const scrollableContainerSelector = 'div[data-test-id="virtuoso-scroller"]';
        await page.waitForSelector(scrollableContainerSelector, { visible: true, timeout: 15000 });

        // Scroll dinámico rápido
        let cocheraEncontrada = false;
        const maxScrolls = 30;
        for (let i = 0; i < maxScrolls; i++) {
            const spotHandle = await page.evaluateHandle((selector, spotNumber) => {
                const container = document.querySelector(selector);
                if (!container) return null;
                const h6s = container.querySelectorAll('h6.MuiTypography-subtitle1');
                for (const h6 of h6s) {
                    if (h6.textContent.trim() === spotNumber) {
                        return h6.closest('button');
                    }
                }
                container.scrollTop += container.clientHeight * 0.8;
                return null;
            }, scrollableContainerSelector, PARKING_SPOT_NUMBER);

            const element = await spotHandle?.asElement();
            if (element) {
                await element.scrollIntoViewIfNeeded();
                await element.click({ delay: 10 });
                cocheraEncontrada = true;
                console.log(`Clic en cochera ${PARKING_SPOT_NUMBER} realizado.`);
                break;
            }

            await new Promise(r => setTimeout(r, 100)); // Pausa mínima para renderizar
        }

        if (!cocheraEncontrada) {
            console.error(`No se pudo encontrar la cochera ${PARKING_SPOT_NUMBER} tras múltiples scrolls.`);
            await page.screenshot({ path: 'error_no_spot_found.png' });
            throw new Error('Cochera no encontrada.');
        }

        // Clic en "Reserve" apenas aparezca
        console.log('Buscando y clickeando botón "Reserve" lo antes posible...');
        let reserveButton = null;
        for (let intentos = 0; intentos < 20; intentos++) {
            const buttons = await page.$$('button');
            for (const button of buttons) {
                const buttonText = await page.evaluate(el => el.innerText, button);
                if (buttonText && buttonText.trim().toLowerCase().includes('reserve')) {
                    reserveButton = button;
                    break;
                }
            }
            if (reserveButton) break;
            await new Promise(r => setTimeout(r, 100)); // Pausa mínima para dar tiempo al DOM
        }

        if (reserveButton) {
            await reserveButton.click();
            console.log('Clic en "Reserve" realizado.');
            await new Promise(r => setTimeout(r, 1000));
            await page.screenshot({ path: '7_reserve_clicked.png' });
        } else {
            console.warn('No se encontró el botón "Reserve". Puede estar reservado o el botón cambió.');
            await page.screenshot({ path: '7_no_reserve_button.png' });
        }

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
