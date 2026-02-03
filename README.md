# Parkalot Reserva (Puppeteer)

Automatización simple con **Puppeteer** para reservar cocheras en Parkalot. Incluye dos scripts:

- `index.cjs`: reserva para el día actual usando un flujo general de “Details” y búsqueda por número de cochera.
- `index_dia_manana.cjs`: intenta seleccionar el bloque del día siguiente (o el primero disponible), luego busca la cochera por número y hace clic en “Reserve”.

> ⚠️ **Seguridad**: los scripts tienen credenciales hardcodeadas. Reemplazá `MY_EMAIL`, `MY_PASSWORD` y `PARKING_SPOT_NUMBER` antes de ejecutar.

## Requisitos

- Node.js 18+ (recomendado por Puppeteer).
- Dependencias instaladas con `npm install`.

## Instalación

```bash
npm install
```

## Uso

### Reservar para el día actual

```bash
node index.cjs
```

### Reservar para el día siguiente (o primer bloque disponible)

```bash
node index_dia_manana.cjs
```

Ambos scripts abren un navegador **no headless** para que puedas ver la automatización. Se guardan capturas en el directorio raíz (por ejemplo: `1_llego_al_login.png`, `7_reserve_clicked.png`, etc.).

## Configuración rápida (opcional)

Si querés evitar editar el código, podés adaptar el `.bat` para Windows (actualmente apunta a una ruta local). Ejemplo:

```bat
@echo off
cd /d "C:\ruta\a\tu\proyecto"
set MY_EMAIL=tu@email
set MY_PASSWORD=tu_password
set PARKING_SPOT_NUMBER=1234
node index.cjs > salida_log.txt 2>&1
```

> Nota: actualmente los scripts **no leen** estas variables de entorno. Si necesitás esa funcionalidad, habría que modificar los scripts para leer `process.env`.

## Notas

- Los selectores de la UI pueden cambiar con el tiempo. Si la app actualiza su layout, probablemente haya que ajustar selectores.
- Para depuración, revisá `salida_log.txt` (si corrés con el `.bat`) y las capturas generadas.

## Archivos principales

- `index.cjs`: flujo de reserva para el día actual.
- `index_dia_manana.cjs`: flujo de reserva para el día siguiente o el primer bloque disponible.
- `ejecutar-reserva.bat`: ejemplo de ejecución en Windows (ruta hardcodeada).
