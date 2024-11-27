import random

# Nombre del archivo donde se guardarán los números
archivo = "numeros_aleatorios.txt"

# Genera un número entero aleatorio entre 1 y 100
numero = random.randint(1, 100)

# Abre el archivo en modo de adición y guarda el número
with open(archivo, "a") as f:
    f.write(f"{numero}\n")

print(f"Número generado y guardado: {numero}")
