# Listado de Funcionalidades del Sistema

| Nro. | Nombre | Objetivo | Actores |
| :---: | :--- | :--- | :--- |
| 1 | Registrar usuario | Registrar los datos de una persona para que pueda acceder al sistema. | AP: Parametrizador del sistema |
| 2 | Modificar usuario | Modificar los datos permitidos de un usuario. | AP: Usuario |
| 3 | Eliminar usuario | Dar de baja un usuario. | AP: Parametrizador del sistema |
| 4 | Consultar usuario | Visualizar los datos de un usuario. | AP: Usuario |
| 5 | Iniciar sesión | Registrar el inicio de una sesión por parte de un usuario registrado en el sistema, validando su password y permisos. | AP: Usuario |
| 6 | Cerrar sesión | Cerrar la sesión actual del usuario en el sistema. | AP: Usuario |
| 7 | Registrar Documentación | Registrar los datos asociados a la documentación que desea enviar una CM a través del servicio de bolsines. | AP: Encargado de Documentación |
| 8 | Modificar Documentación | Modificar los datos permitidos de una documentación registrada. | AP: Encargado de Documentación |
| 9 | Eliminar Documentación | Dar de baja una documentación validando que no se encuentre en un remito ni incluida en un bolsín. | AP: Encargado de Documentación |
| 10 | Consultar Documentación | Visualizar los datos registrados respecto de una documentación. | AP: Encargado de Documentación |
| 11 | Registrar un Tipo de Documento | Registrar un tipo de documento para que pueda asociarse a una documentación. | AP: Parametrizador del sistema |
| 12 | Modificar un Tipo de Documento | Modificar los datos permitidos de un tipo de documento. | AP: Parametrizador del sistema |
| 13 | Eliminar un Tipo de Documento | Dar de baja un tipo de documento validando que no tenga un documento asociado. | AP: Parametrizador del sistema |
| 14 | Consultar Tipo de Documento | Visualizar los datos de uno o más tipos de documentos. | AP: Parametrizador del sistema |
| 15 | Generar Remito | Generar un remito asignando la documentación que desea enviarse a una Comisión Médica, actualizando el estado de la documentación incluida. | AP: Encargado de Documentación |
| 16 | Modificar Remito | Actualizar los datos de un remito, mientras no se encuentre asociado a un bolsín, quitando o agregando documentación. | AP: Encargado de Documentación |
| 17 | Cancelar Remito | Anular un Remito, que no se encuentre asociado a un bolsín, actualizando el estado de la documentación para que pueda asociarse a otro remito. | AP: Encargado de Bolsines |
| 18 | Consultar Remito | Visualizar los datos de uno o más remitos con los detalles de documentación que contienen. | AP: Encargado de Documentación |
| 19 | Generar Bolsín | Generar un bolsín asignando los remitos que se incluirán para una Comisión Médica destino, actualizando el estado de los remitos y de la documentación asociada. | AP: Encargado de Bolsines |
| 20 | Modificar Bolsín | Actualizar los datos de un bolsín, mientras no esté cerrado, quitando o agregando remitos y actualizando los estados de los remitos y la documentación según corresponda. | AP: Encargado de Bolsines |
| 21 | Eliminar Bolsín | Dar de baja un Bolsín, mientras no se encuentre en estado enviado, actualizando los estados de los remitos y la documentación según corresponda. | AP: Encargado de Bolsines |
| 22 | Consultar Bolsín | Visualizar los datos registrados de un bolsín. | AP: Encargado de Bolsines |
| 23 | Registrar Comisión Médica | Registrar los datos asociados a una comisión médica que permitan gestionar el intercambio de documentación. | AP: Parametrizador del sistema |
| 24 | Modificar Comisión Médica | Actualizar los datos permitidos de una comisión médica. | AP: Parametrizador del sistema |
| 25 | Eliminar Comisión Médica | Dar de baja una comisión médica validando que no se encuentre asociada a una transacción. | AP: Parametrizador del sistema |
| 26 | Consultar Comisión Médica | Visualizar los datos de una comisión médica. | AP: Parametrizador del sistema |
| 27 | Registrar el retiro de bolsines | Actualizar el estado de los bolsines que el correo retira, actualizando también el estado de los remitos y de la documentación que contienen. | AP: Encargado de Bolsines |
| 28 | Registrar recepción de bolsín | Registrar la recepción de un bolsín actualizando el estado de los remitos y la documentación que contiene según la situación que corresponda. | AP: Encargado de Bolsines |
| 29 | Notificar recepción de bolsín | Notificar por email a la comisión médica origen la recepción del bolsín y la situación de la documentación correspondiente a la misma. | AS: Servidor de Correo |
| 30 | Notificar ubicación de bolsín | Notificar por email a la comisión médica destino la ubicación de un bolsín en particular. | AS: Servidor de Correo |
| 31 | Registrar Revisión de Documentación | Registrar situación de documentación que ha sido rechazada o no recibida por una CM, para permitir su reenvío a otra CM o su baja. | AP: Encargado de Documentación |
| 36 | Consultar seguimiento de bolsines | Consultar en un mapa la ubicación de los bolsines que están en movimiento entre comisiones médicas. | AP: Encargado de Bolsines<br>AS: Servidor Google Maps<br>AS: GPS Tracker |
| 37 | Generar reporte de bolsines en tránsito | Generar y visualizar un reporte que muestre los bolsines que están en tránsito entre una comisión médica de origen y una comisión médica de destino para un periodo de tiempo. | AP: Gerente de Comisión Médica<br>AS: PowerBI |
| 38 | Generar estadística de movimiento de bolsines | Generar y visualizar una estadística de cantidad de bolsines intercambiados entre comisiones médicas en un periodo de tiempo. | AP: Gerente de Comisión Médica<br>AS: PowerBI |
| 39 | Cerrar Bolsín | Registrar el número de precinto con el que se cierra el bolsín y actualizar el estado del bolsín a cerrado. | AP: Encargado de Bolsines |
| 40 | Reabrir Bolsín | Borrar el número de precinto con el que se cerró el bolsín y actualizar el estado del bolsín a creado. | AP: Encargado de Bolsines |