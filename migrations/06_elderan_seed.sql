-- Elderan: seed publico del modulo Mundo.
-- No incluye secretos de la mision, condiciones ocultas, sabotajes ni consecuencias aun no ocurridas.
-- IDs reservados: settlement 2; NPC 20-39; buildings 20-49; projects 30-39.

-- -----------------------------------------------------------------------------
-- FACCIONES / CIUDADES DE LAS LIGAS
-- -----------------------------------------------------------------------------
INSERT OR IGNORE INTO factions(id,name,status,relationship,image,description,first_contact,notes) VALUES
(20,'Arianos','Conocida','Neutral','','Ciudad de las Ligas de Elaria de tradición militar y marcial, enfocada en la guerra abierta, disciplina y preparación de fuerzas terrestres.',NULL,'Delegación permanente en Elderan.'),
(21,'Santiago','Conocida','Neutral','','Ciudad marítima situada en una isla fría al norte. Su economía depende de la pesca, recolección marítima y una importante armada de barcos.',NULL,'Delegación permanente en Elderan.'),
(22,'Coeris','Conocida','Neutral','','Ciudad agrícola de las Ligas especializada en cosechas, abastecimiento y comercio de alimentos.',NULL,'Delegación permanente en Elderan.'),
(23,'Gran Celere','Conocida','Neutral','','La mayor metrópoli de Elaria y corazón de las Ligas. Surgió de la unión progresiva de varias ciudades y está dividida en grandes distritos especializados y fortificados.',NULL,'Sus distritos Negro, Amarillo y Azul poseen gran autonomía.'),
(24,'Distrito Negro','Conocida','Neutral','','Distrito de Gran Celere dedicado principalmente a manufactura, producción, herramientas e infraestructura. Funciona prácticamente como una ciudad por sí mismo.',NULL,'Forma parte de Gran Celere.'),
(25,'Distrito Amarillo','Conocida','Neutral','','Distrito de Gran Celere dedicado al comercio, finanzas, distribución de mercancías y redes mercantiles. Funciona prácticamente como una ciudad por sí mismo.',NULL,'Forma parte de Gran Celere.'),
(26,'Distrito Azul','Conocida','Neutral','','Distrito de Gran Celere dedicado a la magia, investigación arcana, educación y producción de componentes especializados. Funciona prácticamente como una ciudad por sí mismo.',NULL,'Forma parte de Gran Celere.'),
(27,'Consejo Colonial de Elderan','Conocida','Neutral','','Órgano administrativo que coordina la colonia de Elderan y representa los intereses de las principales ciudades y distritos de las Ligas de Elaria.',NULL,'Presidido por Alina Verdan.');

-- -----------------------------------------------------------------------------
-- ASENTAMIENTOS
-- -----------------------------------------------------------------------------
INSERT OR REPLACE INTO settlements
(id,name,type,status,population,military_population,faction_id,location_id,governor_name,founded,description,image,visibility,security_level,defenses)
VALUES
(2,'Elderan','Colonia de las Ligas','Expansión acelerada',1000,180,NULL,NULL,'Alina Verdan','759 DF',
'Joven colonia de las Ligas de Elaria situada tres días al norte de Nueva Pyra. En pocos meses ha crecido hasta rozar los mil habitantes gracias al fuerte apoyo de varias ciudades de las Ligas. Posee una economía activa, numerosos talleres, mayor fuerza militar que Nueva Pyra y una administración federada, pero su crecimiento ha superado su capacidad defensiva.','', 'public','Vulnerable','Zanjas, barricadas, torres provisionales, puestos de guardia y patrullas. La muralla permanente continúa en construcción'),
(3,'Puerto de Aguas Grises','Puerto dependiente','Activo',120,35,21,NULL,'Administración portuaria de Elderan','759 DF',
'Pequeño puerto costero dependiente de Elderan, situado aproximadamente a un día de viaje de la colonia. Recibe barcos, mercancías, pescado y suministros que después viajan por carretera hacia Elderan.','', 'public','Limitado','Puestos de guardia, almacenes, empalizadas parciales y pequeña guarnición');

-- -----------------------------------------------------------------------------
-- NPC CANONICOS Y CONSEJO COLONIAL
-- -----------------------------------------------------------------------------
INSERT OR REPLACE INTO npcs
(id,name,alias,title,race,occupation,status,settlement_id,faction_id,description,notes,image,first_seen,visibility,age,origin,personality,public_quote)
VALUES
(20,'Alina Verdan',NULL,'Coordinadora Colonial',NULL,'Administración y presidencia del Consejo Colonial','Activo',2,27,'Principal autoridad civil de Elderan. Coordina los intereses de las ciudades de las Ligas y busca mantener la colonia estable, abastecida y fuera de una guerra innecesaria.','Preside el Consejo Colonial.','',NULL,'public',NULL,NULL,'Calmada, política y difícil de presionar.','Elderan no necesita otra guerra. Necesita tiempo.'),
(21,'Daria Kel',NULL,'Consejera Militar',NULL,'Capitana y responsable de patrullas','Activo',2,20,'Responsable militar de Elderan y representante de Arianos dentro del Consejo Colonial. Supervisa patrullas, defensas y protocolos de cooperación militar.','','',NULL,'public',NULL,'Arianos','Directa, disciplinada y desconfiada de compromisos militares ambiguos.','Ayuda militar mutua suena bien hasta que alguien cruza la frontera diciendo que viene a ayudar.'),
(22,'Cassel Vorr',NULL,'Consejero Comercial',NULL,'Representante comercial','Activo',2,25,'Representa intereses mercantiles y gremiales, especialmente vinculados al Distrito Amarillo. Considera que una ruta comercial estable puede evitar conflictos mejor que muchas amenazas políticas.','','',NULL,'public',NULL,'Distrito Amarillo','Persuasivo, pragmático y siempre atento al beneficio mutuo.','La política es costosa. El comercio suele ser más barato.'),
(23,'Maelis Tern',NULL,'Consejero Arcano','Elfo','Erudito y asesor académico','Activo',2,26,'Erudito responsable de buena parte de los estudios académicos y arcanos de Elderan. Representa los intereses del Distrito Azul en el Consejo Colonial.','','',NULL,'public',NULL,'Distrito Azul','Paciente, académico y cauteloso con el conocimiento peligroso.','Este continente es demasiado antiguo para que dos bibliotecas jóvenes finjan que pueden comprenderlo solas.'),
(24,'Eron Vale',NULL,'Cartógrafo Fronterizo','Humano','Cartógrafo y explorador','Activo',2,NULL,'Cartógrafo responsable de registrar rutas, fronteras provisionales y descubrimientos. Defiende reglas claras para evitar disputas territoriales entre colonias.','','',NULL,'public',NULL,NULL,'Práctico, curioso y poco impresionado por reclamos territoriales sin fundamento.','Si encuentro un río primero, no significa que el agua me pertenezca.'),
(25,'Mara Elsen',NULL,'Comandante de la Puerta',NULL,'Seguridad y control de acceso','Activo',2,20,'Responsable del acceso principal de Elderan, registro de visitantes y coordinación inmediata de la seguridad de la colonia.','','',NULL,'public',NULL,'Arianos','Seca, eficiente y acostumbrada a resolver problemas con rapidez.',NULL),
(26,'Salven Mire',NULL,'Médico de Elderan','Humano','Médico','Activo',2,NULL,'Médico práctico de Elderan encargado de heridas, enfermedades, venenos y tratamiento general de colonos y viajeros.','','',NULL,'public',NULL,NULL,'Directo, profesional y poco impresionado por títulos o apellidos.',NULL),
(27,'Celene Varro',NULL,'Propietaria del Palacio del Viajero','Humana','Posadera y empresaria','Activo',2,25,'Propietaria del Palacio del Viajero, uno de los mejores alojamientos de Elderan para comerciantes, diplomáticos y oficiales.','','',NULL,'public',NULL,NULL,'Elegante, observadora y excelente para recordar nombres y deudas.',NULL),
(28,'Nilo Fen',NULL,'Encargado Nocturno','Mediano','Encargado de posada','Activo',2,NULL,'Encargado nocturno del Palacio del Viajero. Conoce gran cantidad de rumores debido a la constante circulación de viajeros.','','',NULL,'public',NULL,NULL,'Curioso, sociable y excesivamente informado sobre asuntos ajenos.',NULL),
(29,'Brakka Tor',NULL,'Cocinera del Palacio del Viajero','Semi-orca','Cocinera','Activo',2,NULL,'Cocinera del Palacio del Viajero conocida por servir porciones grandes a viajeros y expedicionarios.','','',NULL,'public',NULL,NULL,'Práctica y de pocas palabras.','Diplomacia con hambre es solo gente enojada usando palabras largas.'),
(30,'Teren Vos',NULL,'Maestro Herrero','Humano','Herrero','Activo',2,24,'Herrero veterano que dirige Forja Vos junto con seis aprendices. Elderan posee hierro y demanda suficiente como para mantener el taller permanentemente ocupado.','','',NULL,'public',NULL,NULL,'Trabajador, directo y preocupado por la capacidad de producción.',NULL),
(31,'Lysa Merel',NULL,'Administradora Agrícola','Humana','Administración de campos','Activo',2,22,'Administra parte importante de los campos al norte de Elderan y supervisa producción alimentaria para una población que crece rápidamente.','','',NULL,'public',NULL,'Coeris','Realista y consciente de que una colonia grande necesita comer todos los días.',NULL),
(32,'Oren Tamm',NULL,'Soldado de Patrulla','Humano','Patrullero','Activo',2,20,'Soldado de las patrullas exteriores de Elderan. Ha enfrentado animales salvajes, no muertos y otras amenazas alrededor del perímetro.','','',NULL,'public',NULL,'Arianos','Experimentado para su edad y muy consciente de lo difícil que resulta vigilar una colonia sin muralla.',NULL),
(33,'Selka Iven',NULL,'Investigadora Arcana','Humana','Estudiante e investigadora','Activo',2,26,'Joven investigadora que estudia ruinas, símbolos, lenguas antiguas y fenómenos mágicos encontrados en el nuevo continente.','','',NULL,'public',NULL,'Distrito Azul','Entusiasta, estudiosa y convencida de que compartir traducciones evitaría duplicar años de trabajo.',NULL),
(34,'Ivar Soren',NULL,'Consejero Marítimo',NULL,'Representante naval y portuario','Activo',2,21,'Representante de Santiago dentro del Consejo Colonial. Supervisa intereses marítimos, comunicaciones con el Puerto de Aguas Grises y seguridad de las rutas navales.','','',NULL,'public',NULL,'Santiago','Pragmático, acostumbrado a pensar en rutas, clima y suministro.',NULL),
(35,'Elena Coeris',NULL,'Consejera Agrícola',NULL,'Representante agrícola','Activo',2,22,'Representante de Coeris dentro del Consejo Colonial. Supervisa asuntos agrícolas, reservas alimentarias y expansión de los campos de Elderan.','','',NULL,'public',NULL,'Coeris','Paciente, metódica y poco tolerante con decisiones que ignoran abastecimiento.',NULL),
(36,'Dorek Vann',NULL,'Consejero Industrial',NULL,'Representante de manufactura','Activo',2,24,'Representante del Distrito Negro dentro del Consejo Colonial. Defiende inversiones en talleres, infraestructura y producción local.','','',NULL,'public',NULL,'Distrito Negro','Práctico, productivista y convencido de que una colonia que no fabrica lo que necesita será siempre dependiente.',NULL);

-- -----------------------------------------------------------------------------
-- EDIFICIOS Y ZONAS
-- -----------------------------------------------------------------------------
INSERT OR REPLACE INTO buildings(id,settlement_id,name,type,status,owner_npc_id,description,image,visibility,area) VALUES
(20,2,'Plaza de las Ligas','Plaza y administración','Abierto',20,'Centro político y administrativo de Elderan. Aquí se ubican edificios del Consejo Colonial, registros y tablones públicos.','','public','Centro de Elderan'),
(21,2,'Casa del Consejo','Gobierno','Abierto',20,'Sede del Consejo Colonial de Elderan y principal espacio para reuniones entre representantes de las ciudades de las Ligas.','','public','Plaza de las Ligas'),
(22,2,'Registro Mercantil','Administración comercial','Abierto',22,'Oficina encargada de permisos comerciales, registros de mercancías, contratos y asuntos de gremios.','','public','Plaza de las Ligas'),
(23,2,'Casa de Cartografía','Exploración','Abierto',24,'Oficina de cartógrafos y exploradores donde se actualizan rutas, fronteras provisionales y mapas.','','public','Plaza de las Ligas'),
(24,2,'Mercado de las Ligas','Mercado','Abierto',22,'Gran mercado de Elderan con alimentos, manufacturas, herramientas, textiles, cristalería, medicinas y equipo de expedición.','','public','Plaza de las Ligas'),
(25,2,'Delegación de Arianos','Residencia diplomática','Restringido',21,'Residencia y oficina permanente de la delegación militar de Arianos.','','public','Las Banderas'),
(26,2,'Delegación de Santiago','Residencia diplomática','Restringido',34,'Residencia y oficina de los representantes marítimos de Santiago.','','public','Las Banderas'),
(27,2,'Delegación de Coeris','Residencia diplomática','Restringido',35,'Residencia y oficina de los representantes agrícolas de Coeris.','','public','Las Banderas'),
(28,2,'Delegación del Distrito Negro','Residencia diplomática','Restringido',36,'Residencia y oficina de los representantes industriales del Distrito Negro.','','public','Las Banderas'),
(29,2,'Delegación del Distrito Amarillo','Residencia diplomática','Restringido',22,'Residencia y oficina de los representantes comerciales del Distrito Amarillo.','','public','Las Banderas'),
(30,2,'Delegación del Distrito Azul','Residencia diplomática','Restringido',23,'Residencia y oficina de los representantes arcanos del Distrito Azul.','','public','Las Banderas'),
(31,2,'Residencia de Gran Celere','Residencia diplomática','Restringido',NULL,'Residencia ceremonial reservada para enviados del gobierno central de Gran Celere.','','public','Las Banderas'),
(32,2,'Comandancia del Bastión','Militar','Restringido',21,'Centro de mando de las patrullas y defensas de Elderan.','','public','Campamento del Bastión'),
(33,2,'Barracones de Elderan','Militar','Restringido',21,'Barracones principales de la guarnición de Elderan.','','public','Campamento del Bastión'),
(34,2,'Armería del Bastión','Armería militar','Restringido',21,'Depósito de armas, armaduras y equipo reservado para las fuerzas de Elderan.','','public','Campamento del Bastión'),
(35,2,'Campo de Entrenamiento','Militar','Vigilado',21,'Área dedicada al entrenamiento de soldados, patrulleros y reclutas.','','public','Campamento del Bastión'),
(36,2,'Clínica Mire','Medicina','Abierto',26,'Clínica de Elderan dedicada al tratamiento de heridas, enfermedades, venenos y atención médica general.','','public','Campamento del Bastión'),
(37,2,'Forja Vos','Herrería','Abierto',30,'Taller metalúrgico de Teren Vos y sus aprendices. Produce armas, armaduras, herramientas y piezas metálicas.','','public','Distrito de los Talleres'),
(38,2,'Cristalería Celeste','Cristalería','Abierto',NULL,'Taller especializado en viales, lentes, material de laboratorio y cristalería para uso alquímico y arcano.','','public','Distrito de los Talleres'),
(39,2,'Taller Hierro Negro','Manufactura','Abierto',36,'Taller asociado a intereses del Distrito Negro, centrado en herramientas, componentes de construcción y piezas mecánicas.','','public','Distrito de los Talleres'),
(40,2,'Telar Coeris','Textiles','Abierto',35,'Taller de textiles, mantas, tiendas, sacos y ropa para colonos y expedicionarios.','','public','Distrito de los Talleres'),
(41,2,'Arsenal de Arianos','Comercio militar','Restringido',21,'Taller y depósito de equipo marcial. Parte del inventario solo está disponible para militares o compradores autorizados.','','public','Distrito de los Talleres'),
(42,2,'Archivo Colonial','Archivo','Abierto',23,'Archivo dedicado a documentos, traducciones y registros académicos del nuevo continente.','','public','Archivo Nuevo'),
(43,2,'Laboratorio Arcano','Investigación','Restringido',23,'Espacio de investigación para fenómenos mágicos, objetos recuperados y materiales arcanos.','','public','Archivo Nuevo'),
(44,2,'Sala Cartográfica','Cartografía','Abierto',24,'Sala para mapas, rutas, registros de expediciones y discusión de fronteras.','','public','Archivo Nuevo'),
(45,2,'Palacio del Viajero','Posada de calidad','Abierto',27,'Posada de dos plantas orientada a diplomáticos, oficiales, comerciantes y viajeros que buscan mayor comodidad.','','public','Barrio de los Fundadores'),
(46,2,'Campos del Norte','Zona agrícola','Activo',31,'Campos y granjas que sostienen buena parte de la alimentación de Elderan.','','public','Norte de Elderan'),
(47,3,'Muelles de Aguas Grises','Puerto','Abierto',34,'Muelles del puerto costero que conecta Elderan con rutas marítimas de las Ligas.','','public','Costa'),
(48,3,'Aduana de Aguas Grises','Aduana','Abierto',34,'Oficina de registro de mercancías, viajeros y suministros antes de iniciar el viaje terrestre hacia Elderan.','','public','Puerto de Aguas Grises'),
(49,3,'Almacenes de Aguas Grises','Almacén','Vigilado',34,'Almacenes para mercancía marítima pendiente de transporte hacia Elderan.','','public','Puerto de Aguas Grises');

-- -----------------------------------------------------------------------------
-- NPC - EDIFICIOS
-- -----------------------------------------------------------------------------
INSERT OR IGNORE INTO npc_buildings(npc_id,building_id,relationship) VALUES
(20,21,'Coordinadora Colonial'),(21,25,'Delegada'),(21,32,'Comandante'),(21,33,'Supervisión'),(21,34,'Supervisión'),(21,35,'Supervisión'),
(22,22,'Consejero comercial'),(22,24,'Supervisor político'),(22,29,'Delegado'),
(23,30,'Delegado'),(23,42,'Asesor'),(23,43,'Responsable académico'),
(24,23,'Cartógrafo'),(24,44,'Responsable'),
(25,32,'Seguridad'),(26,36,'Médico'),
(27,45,'Propietaria'),(28,45,'Encargado nocturno'),(29,45,'Cocinera'),
(30,37,'Propietario'),(31,46,'Administradora'),(32,33,'Soldado'),
(33,43,'Investigadora'),(34,26,'Delegado'),(34,47,'Supervisor'),(34,48,'Supervisor'),(34,49,'Supervisor'),
(35,27,'Delegada'),(35,40,'Asesora'),(35,46,'Consejera agrícola'),
(36,28,'Delegado'),(36,39,'Consejero industrial');

-- -----------------------------------------------------------------------------
-- SERVICIOS
-- -----------------------------------------------------------------------------
INSERT INTO services(building_id,name,description,price,currency,status) VALUES
(23,'Consulta cartográfica','Consulta de mapas y rutas conocidas.',NULL,NULL,'Disponible'),
(23,'Registro de nueva ruta','Incorporación de información cartográfica verificada.',NULL,NULL,'Disponible'),
(24,'Registro mercantil','Gestión administrativa de ventas y contratos.',NULL,NULL,'Disponible'),
(36,'Tratamiento de heridas','Atención médica para lesiones comunes.',NULL,'po','Disponible'),
(36,'Tratamiento de venenos','Evaluación y tratamiento de intoxicaciones.',NULL,'po','Disponible'),
(36,'Tratamiento de enfermedades','Diagnóstico y recuperación supervisada.',NULL,'po','Disponible'),
(36,'Cirugía','Intervenciones médicas según gravedad y recursos.',NULL,'po','Por evaluación'),
(37,'Reparación de armas','Mantenimiento y reparación de armas.',NULL,'po','Disponible'),
(37,'Reparación de armaduras','Mantenimiento y reparación de armaduras.',NULL,'po','Disponible'),
(37,'Fabricación de herramientas','Fabricación de herramientas y componentes.',NULL,'po','Disponible'),
(38,'Trabajo de cristalería','Fabricación de frascos, lentes y recipientes especializados.',NULL,'po','Disponible'),
(39,'Manufactura especializada','Fabricación de componentes de construcción y piezas mecánicas.',NULL,'po','Disponible'),
(40,'Confección','Fabricación y reparación de ropa, mantas, sacos y tiendas.',NULL,'po','Disponible'),
(42,'Consulta documental','Acceso supervisado a documentos públicos del archivo.',NULL,NULL,'Disponible'),
(44,'Información de rutas','Consulta de caminos, fuentes de agua y zonas conocidas.',NULL,NULL,'Disponible'),
(45,'Habitación individual','Hospedaje individual de buena calidad.',NULL,'po','Disponible'),
(45,'Suite diplomática','Habitación preparada para representantes y visitantes oficiales.',NULL,'po','Disponible'),
(45,'Comedor privado','Servicio de comedor privado para reuniones.',NULL,'po','Disponible'),
(45,'Baño caliente','Acceso a baño caliente.',NULL,'pp','Disponible'),
(45,'Sala de reunión','Espacio reservado para reuniones.',NULL,'po','Disponible'),
(45,'Custodia de equipaje','Almacenamiento seguro de pertenencias.',NULL,'po','Disponible'),
(45,'Mensajería local','Entrega de mensajes dentro de Elderan.',NULL,'pp','Disponible'),
(47,'Amarre de embarcaciones','Uso de muelle según espacio disponible.',NULL,'po','Disponible'),
(48,'Registro de mercancías','Inspección y registro aduanero.',NULL,NULL,'Disponible'),
(49,'Almacenamiento portuario','Custodia temporal de cargamentos.',NULL,'po','Disponible');

-- -----------------------------------------------------------------------------
-- CATALOGO INICIAL
-- -----------------------------------------------------------------------------
INSERT INTO shop_items(building_id,name,category,description,price,currency,quantity,status) VALUES
-- Forja Vos
(37,'Espada larga','Arma marcial','Espada versátil de fabricación local.',15,'po',NULL,'Disponible'),
(37,'Espada corta','Arma marcial','Espada ligera de combate.',10,'po',NULL,'Disponible'),
(37,'Hacha de batalla','Arma marcial','Hacha versátil de combate.',10,'po',NULL,'Disponible'),
(37,'Martillo de guerra','Arma marcial','Martillo militar versátil.',15,'po',NULL,'Disponible'),
(37,'Escudo','Armadura','Escudo de uso común.',10,'po',NULL,'Disponible'),
(37,'Cota de malla','Armadura pesada','Armadura de anillas metálicas.',75,'po',NULL,'Disponible'),
-- Cristalería
(38,'Vial de vidrio','Cristalería','Recipiente pequeño para reactivos y muestras.',1,'po',NULL,'Disponible'),
(38,'Frasco de vidrio','Cristalería','Recipiente de vidrio para líquidos.',2,'po',NULL,'Disponible'),
(38,'Lente de aumento','Instrumento','Lente para inspección detallada.',100,'po',NULL,'Por encargo'),
-- Telar
(40,'Manta','Textiles','Manta gruesa para viaje.',5,'pp',NULL,'Disponible'),
(40,'Ropa común','Textiles','Conjunto de ropa sencilla.',5,'pp',NULL,'Disponible'),
(40,'Ropa de viajero','Textiles','Ropa resistente para expediciones.',2,'po',NULL,'Disponible'),
(40,'Tienda de campaña','Equipo de viaje','Tienda para dos personas.',2,'po',NULL,'Disponible'),
-- Mercado
(24,'Raciones (1 día)','Alimentos','Raciones secas de viaje.',5,'pp',NULL,'Disponible'),
(24,'Mochila','Equipo de viaje','Mochila de aventurero.',2,'po',NULL,'Disponible'),
(24,'Cuerda de cáñamo (50 pies)','Equipo de viaje','Cuerda común.',1,'po',NULL,'Disponible'),
(24,'Kit de sanador','Medicina','Material para estabilizar y atender heridas.',5,'po',NULL,'Disponible'),
(24,'Antitoxina','Medicina','Preparado contra venenos comunes.',50,'po',NULL,'Limitado');

-- -----------------------------------------------------------------------------
-- PROYECTOS
-- -----------------------------------------------------------------------------
INSERT OR REPLACE INTO projects(id,settlement_id,name,status,progress,description,started_session,completed_session,visibility) VALUES
(30,2,'Muralla de Elderan','Activo',15,'Construcción de una defensa permanente alrededor del creciente perímetro de Elderan.',NULL,NULL,'public'),
(31,2,'Torres del Perímetro','Activo',20,'Construcción de torres permanentes para mejorar observación y respuesta frente a amenazas.',NULL,NULL,'public'),
(32,2,'Expansión Agrícola Norte','Activo',30,'Ampliación de campos y capacidad de producción de alimentos al norte de la colonia.',NULL,NULL,'public'),
(33,2,'Archivo Arcano Colonial','Activo',25,'Ampliación de instalaciones para investigación, traducción y preservación de conocimientos del continente.',NULL,NULL,'public'),
(34,3,'Ampliación del Puerto de Aguas Grises','Propuesto',0,'Expansión de capacidad de muelles, almacenes y manejo de suministros marítimos.',NULL,NULL,'public'),
(35,2,'Camino Elderan - Aguas Grises','Activo',40,'Mejora de la ruta de un día que conecta Elderan con su puerto costero.',NULL,NULL,'public'),
(36,2,'Camino Elderan - Nueva Pyra','Propuesto',0,'Proyecto de una ruta terrestre más segura y estable entre las dos colonias.',NULL,NULL,'public'),
(37,2,'Puesto Fronterizo Conjunto','Propuesto',0,'Propuesta de puesto coordinado para vigilar amenazas en la región entre ambas colonias.',NULL,NULL,'public'),
(38,2,'Casa Diplomática Imperial','Propuesto',0,'Residencia propuesta para una futura representación permanente de Nueva Pyra en Elderan.',NULL,NULL,'public'),
(39,2,'Hospital Permanente de Elderan','Propuesto',0,'Construcción de una instalación médica mayor que sustituya las capacidades temporales actuales.',NULL,NULL,'public');

INSERT INTO project_resources(project_id,resource,required,current,unit) VALUES
(30,'Piedra',1200,150,'unidades'),(30,'Madera',800,350,'unidades'),(30,'Hierro',250,60,'unidades'),(30,'Fondos',2500,500,'po'),
(31,'Madera',500,180,'unidades'),(31,'Hierro',100,30,'unidades'),(31,'Fondos',800,200,'po'),
(32,'Madera',300,120,'unidades'),(32,'Herramientas',100,30,'unidades'),(32,'Fondos',600,250,'po'),
(33,'Piedra',250,80,'unidades'),(33,'Cristal',100,20,'unidades'),(33,'Reactivos',80,15,'unidades'),(33,'Fondos',1000,250,'po'),
(34,'Madera',700,0,'unidades'),(34,'Piedra',300,0,'unidades'),(34,'Hierro',150,0,'unidades'),(34,'Fondos',1600,0,'po'),
(35,'Madera',500,250,'unidades'),(35,'Piedra',500,180,'unidades'),(35,'Fondos',1000,400,'po'),
(36,'Madera',800,0,'unidades'),(36,'Piedra',400,0,'unidades'),(36,'Fondos',1400,0,'po'),
(37,'Madera',300,0,'unidades'),(37,'Piedra',180,0,'unidades'),(37,'Hierro',60,0,'unidades'),(37,'Fondos',500,0,'po'),
(38,'Madera',250,0,'unidades'),(38,'Piedra',200,0,'unidades'),(38,'Fondos',700,0,'po'),
(39,'Piedra',400,0,'unidades'),(39,'Madera',250,0,'unidades'),(39,'Reactivos',100,0,'unidades'),(39,'Fondos',1400,0,'po');
