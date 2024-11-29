import random
from datetime import datetime, timedelta

# Obtener la hora actual en GMT-3
hora_actual = datetime.utcnow() - timedelta(hours=3)

# Verificar si estamos en un minuto válido (10, 20, 30, 40, 50, 0)
# minutos_validos = {0, 10, 20, 30, 40, 50}
# if hora_actual.minute not in minutos_validos:
#    print(f"No es un minuto válido para ejecutar la tarea. Hora actual: {hora_actual.strftime('%H:%M:%S')}")
#    exit(0)

# Generar un número aleatorio entre 1 y 100
numero = random.randint(1, 100)

# Crear la línea que se añadirá al archivo
linea = f"{hora_actual.strftime('%H:%M:%S')} - Número aleatorio: {numero}\n"

# Abrir el archivo en modo de añadir y escribir la línea
with open("numeros_aleatorios.txt", "a") as archivo:
    archivo.write(linea)

print(f"Se añadió al archivo: {linea.strip()}")
