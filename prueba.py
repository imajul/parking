import random
from datetime import datetime

# Generar un número aleatorio entre 1 y 100
numero = random.randint(1, 100)

# Obtener la hora actual (HH:MM:SS)
hora_actual = datetime.now().strftime("%H:%M:%S")

# Crear la línea que se añadirá al archivo
linea = f"{hora_actual} - Número aleatorio: {numero}\n"

# Abrir el archivo en modo de añadir y escribir la línea
with open("numeros_aleatorios.txt", "a") as archivo:
    archivo.write(linea)

print(f"Se añadió al archivo: {linea.strip()}")

