# Descripción del Dominio: Bolsines

## Glosario:

- EB: Encargado de Bolsines
- CM: Comisión médica.
- CMJ: Comisión médica jurisdiccional.
- CMC: Comisión médica central.
- C.A.B.A.: Ciudad autónoma de Buenos Aires
- Bolsín: bolsa o saco de tela utilizado para transportar documentos de un organismo a otro. Estas bolsas suelen ser
resistentes y duraderas, diseñadas específicamente para proteger los documentos que contiene durante el
transporte.
- Precinto: dispositivo físico numerado que se coloca sobre mecanismos de cierre para asegurar que éstos no se
abran sin autorización.

## Descripción del Dominio

Un organismo controlador que depende del Estado Nacional, cuya sede central se encuentra en la Ciudad Autónoma
de Buenos Aires (C.A.B.A.), necesita enviar, a través del servicio de correo y en bolsines, documentación entre las
diferentes comisiones médicas ubicadas en distintos puntos del país. Se ha solicitado el desarrollo de un producto de
software que gestione el registro, envío y seguimiento de dicha documentación en bolsines.

## Estructura del Organismo Controlador

El Organismo Contralor tiene la sede central en C.A.B.A. y tiene más de 80 comisiones médicas jurisdiccionales (CMJ)
distribuidas por todo el país, y una comisión médica central (CMC) que funciona en C.A.B.A.

Las CMJ llevan el nombre de la localidad en la que se encuentra, por ejemplo, Comisión Médica Mendoza, Comisión
Médica Paraná, Comisión Médica Córdoba, Comisión Médica Villa María, Comisión Médica Rosario.

## Documentación

La documentación se envía en bolsines, entre las distintas comisiones médicas (CM’s). Para poder enviar la
documentación física desde una CM a otra, primero debe poder registrarse en el sistema los siguientes datos referidos
a la documentación, además de un número secuencial y único que debe generar el sistema:
Tipo Documento Es el tipo de documento que se envía, como, por ejemplo: expediente, dictamen, estudio
médico, carta documento, etc.
Fecha de Pase Es la fecha a partir de la cual la documentación deberá ser enviada.
Comisión Médica Origen CM que registra la documentación.
Asunto Descripción relevante de la documentación que se envía
Archivo Se puede asociar más de un archivo a la documentación admitiendo diferentes formatos
como PDF o imágenes en formato BMP, TIFF, JPEG, PNG, GIF, entre otros.

## Remitos

En el bolsín junto con la documentación se debe enviar un remito que describe
la documentación que se enviará. Cuando desde una comisión médica se desea
enviar documentación a otra comisión médica, el trabajador de la CM debe
generar un remito que contenga el detalle de la documentación que se envía, la
que debe estar previamente registrada en el sistema para que sea incluida en el
remito. Se debe generar un remito por cada comisión médica destino. Si se desea enviar documentación a tres
comisiones médicas diferentes (por ejemplo, CM Tucumán, CM Rosario, y CM La Plata), el sistema deberá generar 3
(tres) remitos distintos con la documentación correspondiente según el destino, siempre teniendo presente que
deberán enviarse en bolsines diferentes.

## Bolsines

La documentación junto al remito generado se envía en bolsines los cuales deben registrarse en el sistema, tanto al
enviar el bolsín como al recibirlo. Esto es, el sistema debe permitir registrar envío y recepción de bolsines en cada CMJ
y en la CMC.

### Registro de bolsines salientes

El Encargado de Bolsines de cada CM debe armar el bolsín con la documentación que desea enviar y el o los remitos
correspondientes. Si decide modificar el contenido de un bolsín, debe quitar
documentación por remitos completos, esto es, se quita del bolsín un remito y
toda su documentación asociada. Si el remito es uno solo, puede optar por
cancelar dicho remito y generar uno nuevo con solo la documentación que
decide enviar.

El bolsín saliente se registra en el sistema con los datos que se muestran en la
siguiente tabla, además de un número secuencial y único que debe generar el
sistema. El bolsín se cierra con un precinto. Si por algún motivo se desea
modificar el contenido del bolsín luego de haberse cerrado con un precinto, se
rompe el precinto y luego de realizada la modificación se debe cerrar con un nuevo precinto y actualizar el nro. de
precinto con el que se cerró el bolsín en el sistema.

| Campo | Descripción |
| --- | --- |
| **Fecha** | Fecha de generación de Bolsín. |
| **Comisión Médica Origen** | CM que genera el bolsín a enviar. |
| **Comisión Médica Destino** | CM que recibirá el bolsín. |
| **Peso** | Peso expresado en gramos. |
| **Nro. precinto** | Número del precinto con el que se cierra el bolsín. |
| **Remitos que contiene** | Nro. de los Remitos que contiene el bolsín. |

Al final de la jornada laboral el Encargado de Bolsines es el responsable de separar los bolsines cerrados, debido a que
a primera hora del día siguiente pasa el correo a retirarlos.

### Recepción de bolsines
Cuando el Encargado de Bolsines (EB) de una CM recibe del correo los bolsines, debe registrar dicha recepción. Para
ello, buscará cada bolsín por el número de precinto y/o comisión médica de origen/destino. El EB debe corroborar que
el contenido físico del bolsín recibido sea igual al registrado en el sistema. Cuando el EB realiza el control, pueden
presentarse las siguientes situaciones:
- El contenido coincide con lo registrado en el sistema.
- El contenido no coincide con lo registrado en el sistema.
- Se recibe documentación que no corresponde al destino.
- Se recibe documentación para redirigir a otra área: ocurre cuando la CM destino es la CMC que recibe
documentación que debe ser enviada a un área dentro de la sede central. 

# Reglas de Negocio

| Regla de Negocio | Descripción |
| --- | --- |
| **Empleados Responsables** | Los empleados que serán usuarios del sistema deben estar asignados a una comisión médica con los permisos correspondientes para poder operar el sistema. |
| **Manejo de un Bolsín** | El bolsín se registra en el sistema al momento de su armado; en ese momento se le asigna un número secuencial y único.<br><br>Se puede modificar un bolsín eliminando uno o más de los remitos que contiene, o agregando remitos. Para agregar un remito a un bolsín, se debe crear el remito y posteriormente agregarlo al bolsín.<br><br>El bolsín se cierra cuando se le coloca un precinto y se registra en el sistema el número de precinto. Si el bolsín tenía el precinto colocado y es necesario reabrirlo, ya sea para agregar o quitar remitos y la documentación asociada a ellos, el precinto debe cambiarse por otro que tendrá un número diferente. En consecuencia, debe actualizarse en el sistema con el nuevo precinto con el que se cierra el bolsín.<br><br>Al final de la jornada laboral el Encargado de Bolsines responsable debe separar los bolsines cerrados, debido a que a primera hora del día siguiente pasa el correo a retirarlos.<br><br>Mientras un bolsín se encuentre en estado creado o cerrado puede eliminarse, actualizando su estado a De baja. |
| **Contenido de un Bolsín** | Un bolsín contiene documentación para una única CM destino. Se puede agregar al bolsín uno o más remitos que agrupan documentación.<br><br>Un bolsín puede modificarse quitando remitos con toda la documentación asociada a dicho remito, es decir, se quita el remito completo.<br><br>Mientras el bolsín está en la CM de origen, podrá eliminarse o modificarse, ya sea que esté cerrado o no. En este caso, el remito que se quita del bolsín vuelve al estado creado y la documentación asociada vuelve al estado en remito. |
| **Remito por CM** | Si se desea enviar documentación en distintos bolsines a distintas CM destino, se debe generar un remito para cada CM destino que describe la documentación dirigida.<br><br>Los distintos remitos que componen un bolsín pueden generarse en distintos momentos, lo cual puede ocasionar que en un bolsín haya uno o más remitos.<br><br>Un remito puede cancelarse mientras este en estado creado, en este caso la documentación asociada vuelve al estado Registrada. |
| **Movimiento de la Documentación** | Al registrar la documentación en el sistema, esta queda en estado registrada y luego cuando se la incluye en un remito, pasa al estado En remito.<br><br>Al cancelar un remito, la documentación vuelve al estado registrada, hasta que vuelva a incorporarse a un nuevo remito.<br><br>Al modificar un bolsín, la documentación asociada a los remitos que se quitan del bolsín pasa a estado en remito. Si los remitos se agregan al bolsín, la documentación pasa al estado En bolsín saliente.<br><br>Al eliminar un bolsín, la documentación asociada a los remitos que contiene pasa al estado en remito. |
| **Agregar documentación a un Bolsín** | Cuando la documentación incluida en un remito se agrega a un bolsín se actualiza su estado a en bolsín saliente. |
| **Retiro de un Bolsín** | Cuando el correo retira el bolsín de la CM se actualizará:<br>• El estado del bolsín de cerrado a enviado.<br>• El estado de los remitos de en bolsín saliente a en bolsín enviado.<br>• El estado de la documentación incluida en cada remito de en bolsín saliente a en bolsín enviado. |
| **Recepción de un Bolsín en una CM Destino** | Al momento de la recepción el bolsín se registra como recibido en CM destino. Pueden presentarse las siguientes situaciones:<br>• **El contenido del bolsín es igual al registrado:**<br>&nbsp;&nbsp;– Los remitos y la documentación asociada pasan al estado recibida y aceptada.<br>• **No se recibe toda la documentación asociada a los remitos que contiene el bolsín:**<br>&nbsp;&nbsp;– En este caso, la documentación que no llegó queda como no recibida.<br>&nbsp;&nbsp;– Se notifica a la CM origen para que la documentación vuelva al estado registrada, y pueda vincularse nuevamente a un remito. También puede darse de baja porque se considera que ya no es relevante su envío.<br>&nbsp;&nbsp;– En ambos casos (que la documentación vuelva al estado registrada o de baja), el remito queda como recibido y aceptado parcial.<br>• **Documentación que no corresponde a la CM destino:**<br>&nbsp;&nbsp;– En este caso, la documentación se marca como recibida y rechazada. Esta documentación debe ser enviada de vuelta al origen, para poder asociarse a un nuevo remito para enviarse a la CM correcta.<br>• **Documentación para redirigir a otra área:**<br>&nbsp;&nbsp;– Ocurre cuando la CM destino es la CMC que recibe documentación que debe ser enviada a un área dentro de la sede central. En este caso la documentación se actualiza al estado Para redirigir. |
| **Documentación para redirigir** | Cuando la CM destino es la CMC que recibe documentación que debe ser enviada a un área dentro de la sede central, el envío a las áreas correspondientes no se realiza a través de un Bolsín, sino que se realiza de manera interna. Cuando el área dentro de la CMC recibe la documentación verifica si es correcta. Si es así, la marca como recibida y aceptada. De lo contrario, si no corresponde al área, se marca como recibida y rechazada. |
| **Trazabilidad de la documentación y del Bolsín** | Dada la importancia de la documentación que se manipula se debe poder informar en cada momento su situación y, por consiguiente, como se transporta en bolsines, se debe saber en qué estado está cada bolsín en todo momento y qué empleado es el responsable de efectuar cada actualización tanto del bolsín como de la documentación. |

## Restricciones y supuestos

No aplica.