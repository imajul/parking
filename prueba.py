import random
from datetime import datetime
import pytz  # Biblioteca para manejo de zonas horarias

# Configurar la zona horaria GMT-3
zona_horaria = pytz.timezone("America/Sao_Paulo")  # Ejemplo para GMT-3 (puede ser Buenos Aires)

# Obtener la hora actual en GMT-3
hora_actual = datetime.now(zona_horaria).strftime("%H:%M:%S")

# Generar un número aleatorio entre 1 y 100
numero = random.randint(1, 100)

# Crear la línea que se añadirá al archivo
linea = f"{hora_actual} - Número aleatorio: {numero}\n"

# Abrir el archivo en modo de añadir y escribir la línea
with open("numeros_aleatorios.txt", "a") as archivo:
    archivo.write(linea)

print(f"Se añadió al archivo: {linea.strip()}")

