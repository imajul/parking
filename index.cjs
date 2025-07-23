const puppeteer = require('puppeteer');

const MY_EMAIL = 'ignacio.majul@genneia.com.ar';
const MY_PASSWORD = 'Genneia.12345$';
const PARKING_SPOT_NUMBER = '3117';

async function automateParkingReservation() {
    console.log('Iniciando automatización de reserva de cochera...');

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

    try {
        await page.goto('https://app.parkalot.io/#/login', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));
        await page.type('input[type="email"]', MY_EMAIL, { delay: 100 });
        await page.type('input[type="password"]', MY_PASSWORD, { delay: 100 });
        await page.waitForSelector('button[type="button"].md-btn', { visible: true, timeout: 20000 });
        await page.screenshot({ path: '1_llego_al_login.png' });

        await page.click('button[type="button"].md-btn');
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: '2_tipeo_credenciales.png' });

        // Espera a que haya al menos un botón Details visible
        await page.waitForSelector('button.md-btn.md-flat', { visible: true, timeout: 35000 });

        // Hace scroll para cargar todos los bloques posibles
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: '4_dashboard.png' });

        // Buscar y clickear el último Details
        const detailButtons = await page.$$('button.md-btn.md-flat');
        console.log('Cantidad de botones Details encontrados:', detailButtons.length);

        if (detailButtons.length === 0) {
            await page.screenshot({ path: '99_error_screenshot.png' });
            throw new Error('No se encontraron botones DETAILS');
        }

        await page.screenshot({ path: '5_details_buttons_found.png' });

        const lastDetailButton = detailButtons[detailButtons.length - 1];
        await lastDetailButton.evaluate(el => el.scrollIntoView({ behavior: "smooth", block: "center" }));
        await new Promise(r => setTimeout(r, 1000));
        await lastDetailButton.click();
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: '6_details_clicked.png' });

        // Esperar el listado de cocheras
        const scrollableContainerSelector = 'div[data-test-id="virtuoso-scroller"]';
        await page.waitForSelector(scrollableContainerSelector, { visible: true, timeout: 25000 });

        let cocheraEncontrada = false;
        const maxScrolls = 80;
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
                container.scrollTop += container.clientHeight * 0.7;
                return null;
            }, scrollableContainerSelector, PARKING_SPOT_NUMBER);

            const element = await spotHandle?.asElement();
            if (element) {
                await new Promise(r => setTimeout(r, 1800));
                await element.scrollIntoViewIfNeeded();
                await new Promise(r => setTimeout(r, 800));
                await element.click({ delay: 100 });
                cocheraEncontrada = true;
                console.log(`Clic en cochera ${PARKING_SPOT_NUMBER} realizado.`);
                break;
            }
            await new Promise(r => setTimeout(r, 1200));
        }

        if (!cocheraEncontrada) {
            await page.screenshot({ path: '99_no_spot_found.png' });
            throw new Error(`No se pudo encontrar y expandir la cochera ${PARKING_SPOT_NUMBER} tras múltiples intentos.`);
        }

        await page.screenshot({ path: '7_antes_de_reserve.png' });
        await new Promise(r => setTimeout(r, 1200));

        const buttons = await page.$$('button');
        let reserveButton = null;
        for (const button of buttons) {
            const buttonText = await page.evaluate(el => el.innerText, button);
            if (buttonText && buttonText.trim().toLowerCase().includes('reserve')) {
                reserveButton = button;
                break;
            }
        }

        if (reserveButton) {
            await reserveButton.click();
            await new Promise(r => setTimeout(r, 1200));
            await page.screenshot({ path: '8_reserve_clicked.png' });
            console.log('Clic en "Reserve" realizado.');
        } else {
            await page.screenshot({ path: '8_no_reserve_button.png' });
            throw new Error('No se encontró el botón "Reserve".');
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
