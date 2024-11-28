import random
from datetime import datetime, timedelta

# Obtener la hora actual en UTC y restar 3 horas para GMT-3
hora_actual = (datetime.utcnow() - timedelta(hours=3)).strftime("%H:%M:%S")

# Generar un número aleatorio entre 1 y 100
numero = random.randint(1, 100)

# Crear la línea que se añadirá al archivo
linea = f"{hora_actual} - Número aleatorio: {numero}\n"

# Abrir el archivo en modo de añadir y escribir la línea
with open("numeros_aleatorios.txt", "a") as archivo:
    archivo.write(linea)

print(f"Se añadió al archivo: {linea.strip()}")


