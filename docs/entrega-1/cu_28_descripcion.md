| **Nombre del Caso de uso:** Registrar recepción de bolsín | **Nro. de orden:** 28 |
| :--- | :--- |
| **Prioridad:** Alta | |
| **Complejidad:** Mediano | |
| **Actor Principal:** Encargado de Bolsines (EB) | **Actor Secundario:** no aplica |
| **Tipo de Caso de uso:** Concreto | |
| **Objetivo:** Registrar la recepción de un bolsín actualizando el estado de los remitos y la documentación que contiene según la situación que corresponda. | |

## Flujo Descripto:
1. EB: selecciona la opción para registrar la recepción de un bolsín.
2. Sistema: busca y muestra la CM del usuario logueado.
3. Sistema: busca los bolsines en estado enviado para la CM del usuario logueado, y encuentra al menos uno.
4. Sistema: muestra de cada bolsín su CM origen y número de precinto, permitiendo filtrar por alguno de estos
datos o seleccionar del listado.
5. EB: selecciona un bolsín del listado.
6. Sistema: para cada remito asociado al bolsín, muestra su número y tipo de documentación asociada.
7. Sistema: muestra las opciones de recepción del bolsín, y solicita que se seleccione la opción correspondiente:
    1. El contenido del bolsín es igual al registrado
    2. No se recibe toda la documentación asociada a los remitos que contiene el bolsín
    3. Existe documentación que no corresponde al destino (CM del usuario logueado)
    4. La documentación se debe redirigir a otra área.
8. EB: selecciona la primera opción: El contenido del bolsín es igual al registrado.
9. Sistema: pide confirmación de la selección para el registro correspondiente.
10. EB: confirma la selección.
11. Sistema: actualiza el bolsín al estado Recibido en CM destino y el empleado responsable, los remitos al estado
Recibido y Aceptado y la documentación asociada al estado Recibida y Aceptada y el empleado responsable.
12. Sistema: para enviar notificación a cada CM de origen que envió documentación, sobre la recepción del bolsín
y la situación de la documentación recibida (leer Obs. 2), se incluye al caso de uso 29. Notificar recepción de
bolsín. Fin del caso de uso.