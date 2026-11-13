-- Nueva Pyra: seed publico del modulo Mundo.
-- No incluye Notas del director, secretos, rumores falsos ni hechos pendientes.

INSERT OR REPLACE INTO settlements
(id,name,type,status,population,military_population,faction_id,location_id,governor_name,founded,description,image,visibility,security_level,defenses)
VALUES
(1,'Nueva Pyra','Colonia imperial','Activa y en crecimiento',450,100,NULL,1,'Gregorio Pyra','753 DF',
'Joven colonia del Imperio Ignis y principal punto de partida para exploradores, mercenarios, comerciantes y gremios que se internan en el nuevo continente. Construida cerca de la desembocadura de un gran río, combina tierras fértiles, acceso al mar, bosque y colinas.','', 'public','Limitado','Empalizada de madera, torres improvisadas y guardia permanente');

-- NPC PUBLICOS
INSERT OR REPLACE INTO npcs(id,name,title,race,occupation,status,settlement_id,faction_id,description,notes,image,first_seen,visibility) VALUES
(1,'Gregorio Pyra','Gobernador colonial','Humano','Gobernador y autoridad militar','Activo',1,NULL,'Representante del Imperio en Nueva Pyra. Preside el gobierno colonial, coordina la expansión y conserva la autoridad general sobre las fuerzas militares.','Casa Pyra.','',NULL,'public'),
(2,'Demetrio Ignitus','Comandante de la guarnición','Humano','Comandante militar','Activo',1,NULL,'Dirige las operaciones cotidianas de la guarnición, organiza patrullas, vigila las defensas y mantiene la disciplina.','Casa Ignitus.','',NULL,'public'),
(3,'Simón Arellanis','Administrador y tesorero','Humano','Administrador imperial','Activo',1,NULL,'Administra fondos, impuestos, gastos, compras públicas, propiedades y suministros imperiales.','Casa Arellanis.','',NULL,'public'),
(4,'Relan Arellanis','Maestro de obras y proyectos','Humano','Maestro de obras','Activo',1,NULL,'Supervisa construcciones, reparaciones, calles, torres y proyectos comunitarios de la colonia.','Casa Arellanis.','',NULL,'public'),
(5,'Mariano Ignitus','Alguacil mayor','Humano','Alguacil','Activo',1,NULL,'Responsable del orden, investigaciones, arrestos, cárcel y cumplimiento de las sentencias del gobernador.','Casa Ignitus.','',NULL,'public'),
(6,'Torak DaVinci','Supervisor del mercado','Humano','Administrador comercial','Activo',1,NULL,'Autoriza comerciantes, asigna puestos, inspecciona mercancías y supervisa tasas y bienes recuperados.','Casa DaVinci.','',NULL,'public'),
(7,'Dominico Alma de fuego','Herrero','Enano','Herrero','Activo',1,NULL,'Herrero enano que administra Herrería Spyro junto con su familia.','Especialista en trabajo de metales y reparaciones.','',NULL,'public'),
(8,'Veren Delgan','Curtidor','Humano','Artesano del cuero','Activo',1,NULL,'Artesano humano que administra Curtiduría Delgan junto con sus hermanos.','', '',NULL,'public'),
(9,'Demetria La anciana','Boticaria','Elfa','Botánica y sanadora','Activo',1,NULL,'Elfa de aproximadamente 700 años que administra Naturalis. Ha vivido distintas etapas del Imperio Ignis y continúa siendo una fiel seguidora del Imperio.','Las pociones mágicas son poco comunes y costosas en el nuevo continente.','',NULL,'public'),
(10,'Justino','Posadero','Mediano','Antiguo marinero y posadero','Activo',1,NULL,'Viejo marinero mediano y uno de los primeros colonos. Administra La Cueva de Justino.','', '',NULL,'public'),
(11,'Valeria DaVinci','Posadera','Humana','Administradora de hospedaje','Activo',1,NULL,'Administra La Casa del Fénix en nombre de Casa DaVinci, con especial atención a expedicionarios.','Casa DaVinci.','',NULL,'public'),
(12,'Gulp Cara de perro','Tabernero','Enano','Tabernero','Activo',1,NULL,'Enano de pocas palabras que administra la popular taberna Jarra Infinita.','', '',NULL,'public'),
(13,'Miria Veret','Cuidadora del Santuario','Humana','Guía religiosa','Activo',1,NULL,'Fiel seguidora del Fénix que cuida el santuario actual y desea levantar un templo permanente.','', '',NULL,'public'),
(14,'Brok','Jefe de exploradores',NULL,'Coordinador de expediciones','Activo',1,NULL,'Responsable de coordinar encargos, expediciones e informes del Centro de Exploradores.','', '',NULL,'public');

-- EDIFICIOS Y PUNTOS DE INTERES
INSERT OR REPLACE INTO buildings(id,settlement_id,name,type,status,owner_npc_id,description,image,visibility,area) VALUES
(1,1,'Plaza de Leonel','Plaza','Abierto',NULL,'Centro político, comercial y social de Nueva Pyra. Alberga la estatua de Leonel el Gran Estratega y sirve para mercados, decretos, ceremonias, formación de soldados, caravanas y contratación de exploradores.','','public','Núcleo imperial'),
(2,1,'Ayuntamiento de Nueva Pyra','Gobierno','Abierto',1,'Edificio de piedra que alberga gobierno, consejo, archivos, tesorería, tribunal y oficina del gobernador. Puede funcionar como bastión defensivo durante emergencias.','','public','Norte de la Plaza de Leonel'),
(3,1,'Armería de Nueva Pyra','Armería','Restringido',2,'Edificio vigilado destinado al almacenamiento de armas, armaduras, municiones, equipo confiscado y preparación de la guarnición.','','public','Este de la Plaza de Leonel'),
(4,1,'Centro de Exploradores','Exploración','Abierto',14,'Centro donde se publican encargos, registran expediciones, reciben informes, pagan recompensas, actualizan mapas y coordinan rescates.','','public','Oeste de la Plaza de Leonel'),
(5,1,'Mercado General de Nueva Pyra','Mercado','Abierto',6,'Puestos callejeros y comerciantes cuyos productos cambian según suministros, barcos y objetos recuperados por expediciones.','','public','Sur de la Plaza de Leonel'),
(6,1,'Almacén Imperial de Nueva Pyra','Almacén','Restringido',3,'Almacena y distribuye suministros enviados por el Imperio para sostener la colonia.','','public','Núcleo imperial'),
(7,1,'Herrería Spyro','Herrería','Abierto',7,'Herrería familiar especializada en herramientas, armas, armaduras, herrajes y encargos de trabajo metálico.','','public','Periferia colonial'),
(8,1,'Curtiduría Delgan','Taller de cuero','Abierto',8,'Taller familiar especializado en cuero, botas, mochilas, cinturones, armaduras, fundas y arneses.','','public','Periferia colonial'),
(9,1,'Naturalis','Botica','Abierto',9,'Botica de Demetria dedicada a remedios medicinales, plantas, vendajes, ungüentos, antídotos sencillos y repelentes.','','public','Periferia colonial'),
(10,1,'La Cueva de Justino','Posada económica','Abierto',10,'Una de las posadas más antiguas y grandes de la colonia, construida con madera recuperada de los primeros barcos.','','public','Periferia colonial'),
(11,1,'La Casa del Fénix','Posada de calidad','Abierto',11,'Posada de mayor calidad orientada a expedicionarios, con habitaciones privadas y servicios de preparación de viajes.','','public','Cerca del Centro de Exploradores'),
(12,1,'Jarra Infinita','Taberna','Abierto',12,'Taberna popular conocida por sus jarras encantadas capaces de rellenarse automáticamente mediante magia.','','public','Periferia colonial'),
(13,1,'Santuario del Fénix de Nueva Pyra','Santuario','Abierto',13,'Estatua del Fénix adornada con regalos y ofrendas. Actualmente funciona como principal punto de atención espiritual de la colonia.','','public','Núcleo imperial'),
(14,1,'Puerta principal de Nueva Pyra','Defensa','Vigilado',2,'Única entrada y salida oficial del asentamiento, con registro de visitantes, inspección de mercancías y restricciones nocturnas.','','public','Empalizada');

-- RELACION NPC - EDIFICIO
INSERT OR IGNORE INTO npc_buildings(npc_id,building_id,relationship) VALUES
(1,2,'Gobernador'),(2,3,'Responsable militar'),(2,14,'Supervisión militar'),(3,6,'Supervisor'),(6,5,'Supervisor'),
(7,7,'Propietario'),(8,8,'Propietario'),(9,9,'Propietaria'),(10,10,'Propietario'),(11,11,'Administradora'),
(12,12,'Propietario'),(13,13,'Cuidadora'),(14,4,'Jefe de exploradores');

-- SERVICIOS: ALMACEN IMPERIAL
INSERT INTO services(building_id,name,description,price,currency,status) VALUES
(6,'Distribución de raciones','Raciones para trabajos y necesidades autorizadas.',NULL,NULL,'Disponible'),
(6,'Préstamo de herramientas','Préstamo de herramientas cuando la petición está justificada.',NULL,NULL,'Disponible'),
(6,'Entrega de materiales','Materiales para trabajos autorizados.',NULL,NULL,'Disponible'),
(6,'Preparación de suministros','Preparación logística para trabajos y expediciones autorizadas.',NULL,NULL,'Disponible'),
(6,'Almacenamiento de cargamentos','Custodia de cargamentos imperiales.',NULL,NULL,'Disponible');

-- SERVICIOS: CENTRO DE EXPLORADORES
INSERT INTO services(building_id,name,description,price,currency,status) VALUES
(4,'Publicación de encargos','Consulta de trabajos y misiones disponibles.',NULL,NULL,'Disponible'),
(4,'Registro de expediciones','Registro oficial de participantes y objetivos.',NULL,NULL,'Disponible'),
(4,'Recepción de informes','Entrega de reportes después de una expedición.',NULL,NULL,'Disponible'),
(4,'Actualización de mapas','Incorporación de rutas y descubrimientos al atlas colonial.',NULL,NULL,'Disponible'),
(4,'Pago de recompensas','Entrega de recompensas autorizadas por trabajos completados.',NULL,NULL,'Disponible'),
(4,'Coordinación de rescates','Organización de acciones para expediciones desaparecidas.',NULL,NULL,'Disponible');

-- SERVICIOS: HERRERIA SPYRO
INSERT INTO services(building_id,name,description,price,currency,status) VALUES
(7,'Fabricación de herramientas','Fabricación de herramientas y piezas utilitarias.',NULL,'po','Disponible'),
(7,'Reparación de armas','Reparación y mantenimiento de armas.',NULL,'po','Disponible'),
(7,'Reparación de armaduras','Reparaciones de armaduras y piezas metálicas.',NULL,'po','Disponible'),
(7,'Trabajo de metales','Trabajos generales de metal, herrajes y clavos.',NULL,'po','Disponible'),
(7,'Piezas para carretas','Fabricación y reparación de componentes metálicos de carretas.',NULL,'po','Disponible'),
(7,'Encargos especiales','Trabajos personalizados sujetos a materiales y tiempo.',NULL,'po','Por encargo');

-- SERVICIOS: CURTIDURIA
INSERT INTO services(building_id,name,description,price,currency,status) VALUES
(8,'Trabajo de cuero','Tratamiento y trabajo general de cuero.',NULL,'po','Disponible'),
(8,'Reparación de botas','Reparación de calzado de viaje.',NULL,'po','Disponible'),
(8,'Mochilas y cinturones','Fabricación de mochilas, cinturones y correas.',NULL,'po','Disponible'),
(8,'Armaduras de cuero','Fabricación y reparación de armaduras de cuero.',NULL,'po','Disponible'),
(8,'Fundas y arneses','Fabricación de fundas para armas y arneses.',NULL,'po','Disponible');

-- SERVICIOS: NATURALIS
INSERT INTO services(building_id,name,description,price,currency,status) VALUES
(9,'Remedios medicinales','Preparados para dolencias comunes.',NULL,'po','Disponible'),
(9,'Tratamiento con plantas','Tratamientos botánicos según disponibilidad.',NULL,'po','Disponible'),
(9,'Vendajes y ungüentos','Material básico para heridas y recuperación.',NULL,'po','Disponible'),
(9,'Antídotos sencillos','Antídotos para toxinas comunes cuando existen ingredientes.',NULL,'po','Limitado'),
(9,'Tratamiento contra fiebre','Tratamiento de fiebres y enfermedades comunes.',NULL,'po','Disponible'),
(9,'Identificación de plantas','Identificación de flora recuperada durante expediciones.',NULL,'po','Disponible'),
(9,'Preparación de repelentes','Repelentes de insectos y animales menores.',NULL,'po','Disponible');

-- SERVICIOS: POSADAS Y TABERNA
INSERT INTO services(building_id,name,description,price,currency,status) VALUES
(10,'Hospedaje económico','Dormitorio o espacio compartido para viajeros.',NULL,'pp','Disponible'),
(10,'Comidas sencillas','Comida básica para viajeros y trabajadores.',NULL,'pp','Disponible'),
(10,'Almacenamiento','Espacio sencillo para pertenencias.',NULL,'pp','Disponible'),
(10,'Información de marineros','Contacto informal con marineros y primeros colonos.',NULL,NULL,'Disponible'),
(11,'Habitación privada','Hospedaje privado de mayor calidad.',NULL,'po','Disponible'),
(11,'Baño','Acceso a instalaciones de baño.',NULL,'pp','Disponible'),
(11,'Sala de reunión','Espacio privado para reuniones de expedicionarios.',NULL,'po','Disponible'),
(11,'Almacenamiento seguro','Custodia más segura de pertenencias.',NULL,'po','Disponible'),
(11,'Preparación de viajes','Apoyo para organizar suministros y necesidades previas a expediciones.',NULL,'po','Disponible'),
(12,'Bebidas','Servicio de bebidas de la taberna.',NULL,'pc','Disponible'),
(12,'Alimentos','Comida de taberna.',NULL,'pc','Disponible'),
(12,'Rumores y contactos','Punto informal para rumores, reuniones y contrataciones.',NULL,NULL,'Disponible'),
(12,'Celebraciones de expedición','Espacio habitual para festejar regresos.',NULL,NULL,'Disponible');

-- SERVICIOS: SANTUARIO
INSERT INTO services(building_id,name,description,price,currency,status) VALUES
(13,'Oraciones y ofrendas','Espacio dedicado al culto del Sagrado Fénix.',NULL,NULL,'Disponible'),
(13,'Bendiciones','Bendiciones y ceremonias sencillas.',NULL,NULL,'Disponible'),
(13,'Atención espiritual','Consejo y acompañamiento religioso.',NULL,NULL,'Disponible'),
(13,'Vigilias y funerales','Ceremonias para fallecidos y vigilias.',NULL,NULL,'Disponible'),
(13,'Registro informal de fallecidos','Registro comunitario mantenido alrededor del santuario.',NULL,NULL,'Disponible');

-- MERCADO: categorias publicas sin precios canonicos
INSERT INTO shop_items(building_id,name,category,description,price,currency,quantity,status) VALUES
(5,'Armas comunes','Armas','Disponibilidad variable según barcos, artesanos y expediciones.',NULL,'po',NULL,'Variable'),
(5,'Armaduras comunes','Armaduras','Disponibilidad y calidad sujetas a suministros.',NULL,'po',NULL,'Variable'),
(5,'Herramientas','Equipo','Herramientas de trabajo y expedición.',NULL,'po',NULL,'Variable'),
(5,'Equipo de viaje','Equipo','Cuerdas, antorchas, utensilios y material de viaje.',NULL,'po',NULL,'Variable'),
(5,'Alimentos','Suministros','Productos locales y cargamentos recién llegados.',NULL,'pc',NULL,'Disponible'),
(5,'Ropa','Equipo','Ropa de trabajo y viaje.',NULL,'po',NULL,'Variable'),
(5,'Bienes recuperados','Recuperados','Objetos recuperados por expediciones y revendidos de forma legal.',NULL,'po',NULL,'Variable');

-- PROYECTOS COMPLETADOS
INSERT INTO projects(id,settlement_id,name,status,progress,description,started_session,completed_session,visibility) VALUES
(1,1,'Plaza central','Completado',100,'Construcción y organización de la plaza central de Nueva Pyra.',NULL,NULL,'public'),
(2,1,'Estatua de Leonel','Completado',100,'Instalación de la estatua de Leonel el Gran Estratega en el centro de la plaza.',NULL,NULL,'public'),
(3,1,'Ayuntamiento','Completado',100,'Construcción del principal edificio administrativo de la colonia.',NULL,NULL,'public'),
(4,1,'Armería','Completado',100,'Construcción y habilitación de la Armería de Nueva Pyra.',NULL,NULL,'public'),
(5,1,'Centro de Exploradores','Completado',100,'Creación del centro encargado de organizar la actividad expedicionaria.',NULL,NULL,'public'),
(6,1,'Empalizada','Completado',100,'Levantamiento de una gran empalizada de madera alrededor de la mayor parte del asentamiento.',NULL,NULL,'public'),
(7,1,'Torres de vigilancia provisionales','Completado',100,'Construcción de torres improvisadas sobre la empalizada.',NULL,NULL,'public');

-- PROYECTOS PROPUESTOS
INSERT INTO projects(id,settlement_id,name,status,progress,description,started_session,completed_session,visibility) VALUES
(8,1,'Templo permanente del Fénix','Propuesto',0,'Construir un templo formal que sustituya al santuario provisional.',NULL,NULL,'public'),
(9,1,'Reforzar la puerta principal','Propuesto',0,'Mejorar la resistencia y seguridad de la única entrada oficial de la colonia.',NULL,NULL,'public'),
(10,1,'Muralla parcial de piedra','Propuesto',0,'Sustituir gradualmente sectores de la empalizada por defensas de piedra.',NULL,NULL,'public'),
(11,1,'Nuevas torres de vigilancia','Propuesto',0,'Ampliar la cobertura de observación alrededor del perímetro.',NULL,NULL,'public'),
(12,1,'Ampliación del Centro de Exploradores','Propuesto',0,'Aumentar la capacidad del centro para grupos, mapas, encargos y rescates.',NULL,NULL,'public'),
(13,1,'Mejorar el puerto','Propuesto',0,'Mejorar infraestructura para barcos, suministros y comercio marítimo.',NULL,NULL,'public'),
(14,1,'Hospital de Nueva Pyra','Propuesto',0,'Construir instalaciones permanentes para atención médica.',NULL,NULL,'public'),
(15,1,'Camino hacia el interior','Propuesto',0,'Abrir y asegurar una ruta terrestre más estable hacia regiones interiores.',NULL,NULL,'public'),
(16,1,'Primer puesto avanzado','Propuesto',0,'Establecer un puesto permanente fuera de las defensas de Nueva Pyra.',NULL,NULL,'public'),
(17,1,'Segunda salida de emergencia','Propuesto',0,'Crear una ruta adicional para evacuaciones y emergencias.',NULL,NULL,'public');
