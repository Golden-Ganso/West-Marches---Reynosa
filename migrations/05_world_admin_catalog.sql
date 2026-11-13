-- Ampliacion del modulo Mundo y catalogo inicial de Nueva Pyra.
-- Precios base 5e 2014/Legacy. Jose Miguel puede ajustarlos desde Admin.

ALTER TABLE npcs ADD COLUMN alias TEXT;
ALTER TABLE npcs ADD COLUMN age TEXT;
ALTER TABLE npcs ADD COLUMN origin TEXT;
ALTER TABLE npcs ADD COLUMN personality TEXT;
ALTER TABLE npcs ADD COLUMN public_quote TEXT;

-- Recursos iniciales de proyectos. Solo se cargan para proyectos que tiene sentido medir.
INSERT INTO project_resources(project_id,resource,required,current,unit) VALUES
(8,'Piedra',300,0,'unidades'),(8,'Madera',200,0,'unidades'),(8,'Fondos',800,0,'po'),
(9,'Madera',250,0,'unidades'),(9,'Hierro',80,0,'unidades'),(9,'Fondos',400,0,'po'),
(10,'Piedra',1000,0,'unidades'),(10,'Madera',300,0,'unidades'),(10,'Hierro',150,0,'unidades'),(10,'Fondos',1800,0,'po'),
(11,'Madera',350,0,'unidades'),(11,'Hierro',80,0,'unidades'),(11,'Fondos',500,0,'po'),
(12,'Madera',300,0,'unidades'),(12,'Piedra',150,0,'unidades'),(12,'Fondos',650,0,'po'),
(13,'Madera',500,0,'unidades'),(13,'Piedra',250,0,'unidades'),(13,'Hierro',100,0,'unidades'),(13,'Fondos',1000,0,'po'),
(14,'Piedra',350,0,'unidades'),(14,'Madera',200,0,'unidades'),(14,'Fondos',1200,0,'po'),
(15,'Madera',400,0,'unidades'),(15,'Piedra',200,0,'unidades'),(15,'Fondos',700,0,'po'),
(16,'Madera',300,0,'unidades'),(16,'Piedra',150,0,'unidades'),(16,'Hierro',50,0,'unidades'),(16,'Fondos',600,0,'po'),
(17,'Madera',200,0,'unidades'),(17,'Hierro',50,0,'unidades'),(17,'Fondos',350,0,'po');

-- Catalogo PHB 5e 2014 inicial: Herreria Spyro.
INSERT INTO shop_items(building_id,name,category,description,price,currency,quantity,status) VALUES
(7,'Daga','Arma simple','Arma ligera y arrojadiza.',2,'po',NULL,'Disponible'),
(7,'Hacha de mano','Arma simple','Hacha ligera y arrojadiza.',5,'po',NULL,'Disponible'),
(7,'Jabalina','Arma simple','Arma arrojadiza.',5,'pp',NULL,'Disponible'),
(7,'Martillo ligero','Arma simple','Martillo ligero arrojadizo.',2,'po',NULL,'Disponible'),
(7,'Maza','Arma simple','Maza de combate.',5,'po',NULL,'Disponible'),
(7,'Lanza','Arma simple','Lanza arrojadiza y versatil.',1,'po',NULL,'Disponible'),
(7,'Espada corta','Arma marcial','Espada ligera y de esgrima.',10,'po',NULL,'Disponible'),
(7,'Espada larga','Arma marcial','Espada versatil de uso militar.',15,'po',NULL,'Disponible'),
(7,'Hacha de batalla','Arma marcial','Hacha versatil de combate.',10,'po',NULL,'Disponible'),
(7,'Martillo de guerra','Arma marcial','Martillo versatil de guerra.',15,'po',NULL,'Disponible'),
(7,'Escudo','Armadura','Escudo de uso comun.',10,'po',NULL,'Disponible'),
(7,'Armadura de cuero','Armadura ligera','Armadura ligera de cuero.',10,'po',NULL,'Disponible'),
(7,'Cuero tachonado','Armadura ligera','Armadura ligera reforzada.',45,'po',NULL,'Disponible'),
(7,'Cota de escamas','Armadura media','Armadura media de placas superpuestas.',50,'po',NULL,'Por encargo'),
(7,'Cota de malla','Armadura pesada','Armadura pesada de anillas.',75,'po',NULL,'Por encargo');

-- Mercado General: equipo comun 5e 2014.
INSERT INTO shop_items(building_id,name,category,description,price,currency,quantity,status) VALUES
(5,'Mochila','Equipo de viaje','Mochila de aventurero.',2,'po',NULL,'Disponible'),
(5,'Saco de dormir','Equipo de viaje','Equipo basico para descansar durante viajes.',1,'po',NULL,'Disponible'),
(5,'Cuerda de canamo (50 pies)','Equipo de viaje','Cuerda comun de canamo.',1,'po',NULL,'Disponible'),
(5,'Antorcha','Equipo de viaje','Fuente de iluminacion portatil.',1,'pc',NULL,'Disponible'),
(5,'Raciones (1 dia)','Suministros','Alimento seco para una jornada.',5,'pp',NULL,'Disponible'),
(5,'Odre','Equipo de viaje','Recipiente para agua.',2,'pp',NULL,'Disponible'),
(5,'Yesquero','Equipo de viaje','Pedernal, acero y material para encender fuego.',5,'pp',NULL,'Disponible'),
(5,'Palanca','Herramienta','Barra metalica para hacer palanca.',2,'po',NULL,'Disponible'),
(5,'Martillo','Herramienta','Martillo de trabajo.',1,'po',NULL,'Disponible'),
(5,'Piton','Equipo de escalada','Piton metalico.',5,'pc',NULL,'Disponible'),
(5,'Lampara','Iluminacion','Lampara de aceite.',5,'pp',NULL,'Disponible'),
(5,'Aceite (frasco)','Suministros','Frasco de aceite para lamparas y otros usos.',1,'pp',NULL,'Disponible'),
(5,'Pergamino (hoja)','Escritura','Hoja de pergamino.',1,'pp',NULL,'Disponible'),
(5,'Tinta (1 onza)','Escritura','Frasco de tinta.',10,'po',NULL,'Limitado');

-- Naturalis: articulos comunes oficiales, manteniendo las pociones magicas fuera del catalogo habitual.
INSERT INTO shop_items(building_id,name,category,description,price,currency,quantity,status) VALUES
(9,'Kit de sanador','Medicina','Material para estabilizar y atender heridas.',5,'po',NULL,'Disponible'),
(9,'Antitoxina','Medicina','Preparado contra venenos.',50,'po',NULL,'Limitado');

-- Mercancia futura de ejemplo que puede editarse o eliminarse desde Admin.
INSERT INTO incoming_items(building_id,name,expected_date,source,status,notes) VALUES
(7,'Lote de acero procesado',NULL,'Comercio exterior','Pendiente','Ingreso sujeto a nuevas rutas comerciales.'),
(9,'Reactivos medicinales',NULL,'Próximo cargamento imperial','En tránsito','Material destinado a ampliar la variedad de tratamientos.');
