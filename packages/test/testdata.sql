BEGIN TRANSACTION;

-- Updated levels_tiers with new discount columns and removed perks_json
INSERT INTO "levels_tiers" VALUES('F','👋 Новачок',0,0,0,0,0,0,0,1,0,1762039453,1762039492);
INSERT INTO "levels_tiers" VALUES('E','🛡️ Помічник',70,0,0,0,0,0,0,0,1,1762039471,1763219665);
INSERT INTO "levels_tiers" VALUES('D','🎓 Учень',170,0,0,0,0,0,1,0,2,1762039506,1763219726);
INSERT INTO "levels_tiers" VALUES('C','✨ Підмайстер',470,5,0,50,0,0,1,0,3,1762039524,1763219743);
INSERT INTO "levels_tiers" VALUES('B','👑 Майстер',1270,5,0,50,0,0,1,0,4,1762039538,1763219752);
INSERT INTO "levels_tiers" VALUES('A','⚜️ Грандмайстер',2470,7,5,50,0,0,1,0,5,1762039563,1763219777);
INSERT INTO "levels_tiers" VALUES('S','🐦‍🔥 Легенда',5000,10,0,150,0,0,1,0,6,1762039574,1763219834);

-- New benefits table replacing perks_json
INSERT INTO "benefits" VALUES('438130bf-3ff1-47bd-b8c3-d44699bf4187','A','Безкоштовна кава до гри','',1763219777,1763219777);
INSERT INTO "benefits" VALUES('e7a4c614-f4f0-44b4-8ede-e7db697ef9bc','S','Бронювання майстра','',1763219834,1763219834);

-- Prizes for each level
INSERT INTO "prizes" VALUES('12c391d0-184f-42aa-b3ed-9bc4fbf2afa1','E','стікер','стікер з Блопом',0,1763219665,1763219665);
INSERT INTO "prizes" VALUES('81f7822c-8389-4d96-acc8-c55225a17a84','D','Стікер з маскотом гільдії (блоп)','',0,1763219726,1763219726);
INSERT INTO "prizes" VALUES('08f2e392-03b9-4cae-b3b6-730625ac1d71','D','значок гільдії','пін з гербом гільдії',0,1763219726,1763219726);
INSERT INTO "prizes" VALUES('f35e1ef8-6657-4a04-9557-59470096f86d','S','доступ до ранніх анонсів','',0,1763219834,1763219834);


-- Reduced to 20 members and added referral relationships
INSERT INTO "members" VALUES('8a0f3291-1d2d-40ba-8f4d-28582bf4d9de','Dmytro','Horban','+380734940132','437222969',1762039827,1,125,'E',NULL,1762595709);
INSERT INTO "members" VALUES('0c4e8181-e0b7-4386-9917-e048c52edeeb','Elijah',NULL,'+447467349585','445435829',1762116455,1,0,'F',NULL,1762116455);
INSERT INTO "members" VALUES('dda77e21-0fef-44fd-ba07-a5ebc768dfe0','Світлана','Долошко','+380956194572','428101869',1762527268,1,198,'D',NULL,1762528811);
INSERT INTO "members" VALUES('151a1e82-bfc8-490c-8c8c-dd0674737911','Iryna','Horban','+380732217849','379526733',1762528107,1,575,'C','dda77e21-0fef-44fd-ba07-a5ebc768dfe0',1762529045);
INSERT INTO "members" VALUES('e29f6c2b-bc63-4d4c-a3e6-16d8aa1b0dd2','Дизайнер/маркетолог',NULL,'+380996176418','370142466',1762533422,1,60,'F',NULL,1762704106);
INSERT INTO "members" VALUES('2b8a4f60-6328-4fb4-a601-e2a8911f1b2a','Валера',NULL,'+380730383226','447748493',1762533474,1,71,'E',NULL,1762704087);
INSERT INTO "members" VALUES('dbd8f5fd-9d4a-4d7d-8264-95bec33956e7','Okroshker',NULL,'+380972631863','7503469213',1762608191,1,196,'D',NULL,1764423148);
INSERT INTO "members" VALUES('092b1003-0638-49e5-96be-6b6070f7c1e5','Денис','Нижниковский','+380958825580','567790625',1762608218,1,158,'E',NULL,1769866638);
INSERT INTO "members" VALUES('88dd00f2-c59f-4d4a-b94c-128bf038185c','Андрей',NULL,'+380962126139','422215249',1762609365,1,169,'E',NULL,1769871073);
INSERT INTO "members" VALUES('d4f74b7b-e56b-4df3-82b6-74a8d68aa373','Тетяна',NULL,'+380501870393','426455394',1762609409,1,97,'E',NULL,1765037436);
INSERT INTO "members" VALUES('1f22d09f-5132-4c6d-8cf7-70bf56847a21','Andrew',NULL,'+380660306888','787427371',1762614821,1,94,'E',NULL,1764424798);
INSERT INTO "members" VALUES('be8c8e0e-ab8a-4978-ba84-55362a0f3895','Ihor','Yushchishyn','+380999266992','189458776',1762695747,1,438,'D',NULL,1769875300);
INSERT INTO "members" VALUES('7b281b3f-ff08-4c10-87f7-4a081dc634c6','Пётр',NULL,'+380988822679','710064090',1762696154,1,426,'D',NULL,1769875588);
INSERT INTO "members" VALUES('af892778-5bdc-4ae4-aa7c-e768a8d7edb7','Veronika',NULL,'+380633104670','7359406408',1763212773,1,45,'F',NULL,1763215451);
INSERT INTO "members" VALUES('4e110164-4e19-405a-88c8-72709a6e33bd','Андрей',NULL,'+380967006172','8213647715',1763213276,1,156,'E',NULL,1767965731);
INSERT INTO "members" VALUES('c2f5e0eb-8c58-4e69-bf53-655838ac2b4e','Michail',NULL,'+380684889404','326666008',1763214922,1,166,'E',NULL,1767965754);
INSERT INTO "members" VALUES('09a610cb-f972-4e63-b60d-e5b93e8073e9','Artem','Rjashin','+380661323550','592115386',1763300908,1,40,'F',NULL,1763310338);
INSERT INTO "members" VALUES('77177997-4566-4470-b20e-d2c1f5a73c2e','Overi',NULL,'+380509811314','585196246',1763818238,1,164,'E',NULL,1767965469);
INSERT INTO "members" VALUES('148ae9a8-2969-4a37-a546-42c5cd256db6','Oleh','Kosenko','+380964387991','475671969',1763819115,1,40,'F',NULL,1763819572);
INSERT INTO "members" VALUES('e4217aba-77f0-47ee-ac76-35c086806035','Владислав','Бойченко','+380956063618','788983428',1764423188,1,42,'F',NULL,1764423251);
INSERT INTO "members" VALUES('84299e29-796f-42e5-9861-949e5353ff25','Олeксандр',NULL,'+380993103941','872403713',1764424242,1,40,'F',NULL,1764424518);
INSERT INTO "members" VALUES('359d2971-1d20-4c85-bcb3-6758b002ba53','Ирина',NULL,'+380680278180','1987161191',1764510442,1,45,'F',NULL,1764523461);
INSERT INTO "members" VALUES('4027f1ea-5971-42fa-baca-044b23b17e9b','Diana',NULL,'+380665833513','586217185',1764514849,1,45,'F',NULL,1764514888);
INSERT INTO "members" VALUES('bb1feeff-9606-47ee-9291-d0c0a6e0ed5f','Amina','Omelchenko','+380506506423','361701708',1765124931,1,57,'F',NULL,1765125020);
INSERT INTO "members" VALUES('cd208ace-47cf-4010-b24e-c77f00d10e44','Богдан',NULL,'+380950752631','536786506',1765124984,1,0,'F',NULL,1765124984);
INSERT INTO "members" VALUES('aba27bf8-7d58-4498-9db2-7df282396074','Денис','Рибак','+380663300103','554014604',1766253890,1,42,'F',NULL,1766253914);
INSERT INTO "members" VALUES('e3ade01a-9060-43f4-809d-455e2c08c4a2','Дарина','Лазарєва','+380682508024','455040671',1769364474,1,162,'E',NULL,1769366463);
INSERT INTO "members" VALUES('ab3788ca-9bcf-42f5-830c-71708978d56b','Олександр',NULL,'+380955795716','685054403',1769364480,1,35,'F',NULL,1769365017);
INSERT INTO "members" VALUES('0d3c82cd-7b5f-4a0d-9ce1-df14fbfbb62e','Eugene',NULL,'+380678711450','454610089',1769364663,1,77,'E',NULL,1769365120);


-- Loyalty configs: referral program example for level_change
INSERT INTO "loyalty_configs" VALUES('6468884d-386c-486f-b3eb-7bd835d67e25','level_change',1,'Підвищення рівня до D','{"targetLevel":"D","pointsForReferrer":25,"pointsForReferred":25,"notifyReferrer":true,"notifyReferred":true}',1762039440,1762039440);


-- Added rooms table with sample data for calendar view
INSERT INTO "rooms" VALUES('7ed3c005-9ee9-4f16-b7c2-95dc22994d43','Греція','#dedede',1762039357,1765027445);
INSERT INTO "rooms" VALUES('5615b616-ef8f-4160-b27e-e3dc1cd7fa22','Таверна','#7e4007',1762039365,1762039365);
INSERT INTO "rooms" VALUES('fe577c11-50af-4185-b566-682706d676b7','Японія','#ffadd1',1766227896,1769364535);

-- 🎮 GAMES
INSERT INTO "games" VALUES('a51936b1-1109-42ce-b5a4-29dbdcf1fe32','Dungeons & Dragons',NULL,1762039375,1762039394);
INSERT INTO "games" VALUES('c23797c6-2a54-4c65-955b-f30012392731','Vampire: The Macquarade','ну шото про вампиров',1762528203,1762528224);
INSERT INTO "games" VALUES('063b5959-f100-4819-859a-e1d0d1776813','YIPPEE-KI-YAY2','бойовики 80х',1763220217,1763220292);

-- ⚙️ SYSTEMS (тільки для ігор з відомими системами)
INSERT INTO "systems" VALUES('b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','D&D 5e14',NULL,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32',1762039382,1762039382);
INSERT INTO "systems" VALUES('ae00fc10-e57a-4bd5-8cbf-4d1a539e3255','D&D 5e24',NULL,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32',1762039386,1762039386);
INSERT INTO "systems" VALUES('9499ff63-0704-4339-bd39-83187f30fff7','Vampire: The Macquarade','точно про вампиров','c23797c6-2a54-4c65-955b-f30012392731',1762528221,1762528221);
INSERT INTO "systems" VALUES('c2bccc24-cc84-45b0-8542-ba477cbafc72','yky',NULL,'063b5959-f100-4819-859a-e1d0d1776813',1763220252,1763220252);


-- 📦 CATEGORIES
INSERT INTO "categories" VALUES('28591022-bb41-45d1-be29-46854fb35cfc','ACTIVITY','Квести',1762039343,1762039343);
INSERT INTO "categories" VALUES('80494f93-35d9-45b3-8993-9fdf79d8478a','ACTIVITY','Ваншоти',1762039350,1762039350);
INSERT INTO "categories" VALUES('d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c','PRODUCT','Напої',1762527393,1762528862);
INSERT INTO "categories" VALUES('5153c126-ebf4-44f1-b63d-5cf1b4faa3dc','PRODUCT','Відмітка в сторіс',1763818472,1763818574);
INSERT INTO "categories" VALUES('4fd34e12-fa5c-43d0-8602-2bb703651275','PRODUCT','Винагорода за аукціон',1763818613,1763818613);
INSERT INTO "categories" VALUES('9e78681e-fdfa-4da1-9d68-d477d97242cb','ACTIVITY','Модуль',1768079695,1768079695);



-- 🛍️ PRODUCTS
INSERT INTO "products" VALUES('0751f3cb-3507-49af-b640-16adee53ccb7','54398762938','Капучіно XL',55,5,1,1762527499,1762595869,'КАПУЧІНО XL');
INSERT INTO "products" VALUES('155a4ff2-9af0-43ac-a3f9-741568c97240','54363456345','Капучіно L',50,5,1,1762528926,1762595912,'КАПУЧІНО L');
INSERT INTO "products" VALUES('813e1498-9953-432b-bd87-0abfdbabff3e','63548779183','Чай (чайник)',60,7,1,1762533508,1762596030,'ЧАЙ (ЧАЙНИК)');
INSERT INTO "products" VALUES('20da1dd9-bf11-437b-b984-2d5b4b3c56bc','34589762023','Чай (пакетик)',15,5,1,1762533532,1762596007,'ЧАЙ (ПАКЕТИК)');
INSERT INTO "products" VALUES('6e12a7e1-740b-4287-b3ab-e422a719c9f3','60649598356','Капучіно M',45,5,1,1762596064,1762596064,'КАПУЧІНО M');
INSERT INTO "products" VALUES('cf79d38b-843f-486c-a49c-55cdd31c292f','61007685992','Рістретто M',35,5,1,1762596100,1762596108,'РІСТРЕТТО M');
INSERT INTO "products" VALUES('10174768-b66b-433f-b04b-745b415f1e95','61234256575','Рістретто L',40,5,1,1762596123,1762596129,'РІСТРЕТТО L');
INSERT INTO "products" VALUES('63acbbe1-228f-4e37-a552-0afaf4925642','61378235012','Рістретто XL',45,5,1,1762596137,1762596137,'РІСТРЕТТО XL');
INSERT INTO "products" VALUES('27034bb1-ab39-43c0-84a6-a5f29815b825','61658549747','Еспрессо M',30,5,1,1762596165,1762596165,'ЕСПРЕССО M');
INSERT INTO "products" VALUES('b690938b-f980-4608-95d9-3ffc88c41294','61746850785','Еспрессо L',35,5,1,1762596174,1762596174,'ЕСПРЕССО L');
INSERT INTO "products" VALUES('dd3b8441-1092-4011-97cb-60869a6ff068','61867058818','Еспрессо XL',40,5,1,1762596186,1762596186,'ЕСПРЕССО XL');
INSERT INTO "products" VALUES('e6c2a399-ddb1-466a-af22-e1396786bde9','62191997327','Лонг кава M',40,5,1,1762596219,1762596219,'ЛОНГ КАВА M');
INSERT INTO "products" VALUES('7b25b9d0-144d-4369-84ca-176cc13fdf5b','62273118058','Лонг кава L',45,5,1,1762596227,1762596227,'ЛОНГ КАВА L');
INSERT INTO "products" VALUES('0e888a1c-ffa1-4a7f-a69d-c674dcde57b3','62424431863','Лонг кава XL',50,5,1,1762596242,1762596242,'ЛОНГ КАВА XL');
INSERT INTO "products" VALUES('0fa392e2-8c9c-4246-bf56-0d731027157b','62650384858','Амерікано M',40,5,1,1762596265,1762596265,'АМЕРІКАНО M');
INSERT INTO "products" VALUES('60d50388-87be-49a5-b066-8603acb7684c','62755666549','Амерікано L',45,5,1,1762596275,1762596275,'АМЕРІКАНО L');
INSERT INTO "products" VALUES('24f824b0-b907-43e0-9d90-5b46d1be72d4','62857685366','Амерікано XL',50,5,1,1762596285,1762596285,'АМЕРІКАНО XL');
INSERT INTO "products" VALUES('5d6fa069-0309-4aa3-8492-ae05c647ad79','63347204361','Латте M',45,5,1,1762596334,1762596334,'ЛАТТЕ M');
INSERT INTO "products" VALUES('df0b1f5a-0ef8-410f-a79a-6499ed5b9b20','63442473223','Латте L',50,5,1,1762596344,1762596344,'ЛАТТЕ L');
INSERT INTO "products" VALUES('ebb515ec-e190-472a-a4fb-dd6cf684e76f','63563006321','Латте XL',55,5,1,1762596356,1762596356,'ЛАТТЕ XL');
INSERT INTO "products" VALUES('84532ea4-842d-45e6-afe6-21ce0a947773','63800180214','Латте Макіято M',50,5,1,1762596380,1762596380,'ЛАТТЕ МАКІЯТО M');
INSERT INTO "products" VALUES('f1278fd7-b46a-431a-9d02-1e5f88caf24a','63877361412','Латте Макіято L',55,5,1,1762596387,1762596387,'ЛАТТЕ МАКІЯТО L');
INSERT INTO "products" VALUES('2e8325c9-6074-4147-89d5-3ab4b03f1995','63962967914','Латте Макіято XL',60,5,1,1762596396,1762596396,'ЛАТТЕ МАКІЯТО XL');
INSERT INTO "products" VALUES('e613e051-9f80-4295-9036-dc71aba97665','64144831112','Гарячий шоколад M',50,5,1,1762596414,1762596450,'ГАРЯЧИЙ ШОКОЛАД M');
INSERT INTO "products" VALUES('9b656c6c-dbf4-47d6-a95a-aa0b623a1dd3','64296356042','Гарячий шоколад L',55,5,1,1762596429,1762596429,'ГАРЯЧИЙ ШОКОЛАД L');
INSERT INTO "products" VALUES('71343739-d083-4cad-8172-fa8d86241c87','64418573324','Гарячий шоколад XL',60,5,1,1762596441,1762596441,'ГАРЯЧИЙ ШОКОЛАД XL');
INSERT INTO "products" VALUES('54b53b15-a7e8-432b-8140-ded0fc8b818c','64658073636','Гарячий шоколад (густий) M',55,5,1,1762596465,1762596465,'ГАРЯЧИЙ ШОКОЛАД (ГУСТИЙ) M');
INSERT INTO "products" VALUES('987dddc6-9f0d-43f4-b2b7-28f9f889385f','64737127420','Гарячий шоколад (густий) L',60,5,1,1762596473,1762596473,'ГАРЯЧИЙ ШОКОЛАД (ГУСТИЙ) L');
INSERT INTO "products" VALUES('e2be3b86-a454-48ab-bf85-efdf904eb663','64872866604','Гарячий шоколад (густий) XL',65,5,1,1762596487,1762596487,'ГАРЯЧИЙ ШОКОЛАД (ГУСТИЙ) XL');
INSERT INTO "products" VALUES('bf47d828-7f2a-4a33-8db5-4e872f8fb658','65162353612','Чай (розсипний чашка)',25,5,1,1762596516,1762596516,'ЧАЙ (РОЗСИПНИЙ ЧАШКА)');
INSERT INTO "products" VALUES('881482a0-16ef-4bde-9f3c-ed5c39adbbb6','85972245681','Відмітка в сторіс',0,5,1,1763818597,1763818597,'ВІДМІТКА В СТОРІС');
INSERT INTO "products" VALUES('20372505-108d-4ba2-be73-5ecf17c64eef','86279441928','Винагорода за аукціон',0,15,1,1763818627,1763818627,'ВИНАГОРОДА ЗА АУКЦІОН');

-- 🎲 ACTIVITIES
INSERT INTO "activities" VALUES('e9e0830b-bda1-4f62-912d-2758e142cc61','Ваншот_тест1','Ваншот від майстра тест 1',350,NULL,1762527780,1762527780,1762610400,1762624800,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43',NULL);
INSERT INTO "activities" VALUES('8509aa93-6bf7-49b5-8268-3e81aba1f194','Ваншот_тест2','бябябя',350,NULL,1762528347,1762528347,1762678800,1762693200,'c23797c6-2a54-4c65-955b-f30012392731','9499ff63-0704-4339-bd39-83187f30fff7','5615b616-ef8f-4160-b27e-e3dc1cd7fa22',NULL);
INSERT INTO "activities" VALUES('d5d9472b-f4ae-4546-98bd-ccef0245aaaa','Хеллоуінський квест',NULL,300,NULL,1762553133,1762553133,1762005600,1762020000,NULL,NULL,NULL,'ХЕЛЛОУІНСЬКИЙ КВЕСТ');
INSERT INTO "activities" VALUES('0cd8cbb4-6e87-4ae2-81c9-f5e3fbee3837','Слов''янський ваншот',replace('Група авантюристів блукає болотом, заплутуючись у власних слідах.\nПовітря густе, наче забутий спогад, який не пам’ятає, кому належить.\nНад трясовиною мерехтить примарне світло — хтось несе ліхтар, та постать ледь видима, мов віддзеркалення у чорній воді…','\n',char(10)),350,50,1762595646,1762595646,1762610431,1762624831,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','СЛОВ''ЯНСЬКИЙ ВАНШОТ');
INSERT INTO "activities" VALUES('c029de7b-347b-4dce-9239-f323a6325660','Ваншот "Котячий король"','Теплий вечір, знайома таверна, шум розмов і запах смаженого м’яса. Все, здається, як завжди... доки на вашому столі не з’являється загадковий гість.',350,50,1762595686,1762595686,1762696800,1762711200,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','ВАНШОТ "КОТЯЧИЙ КОРОЛЬ"');
INSERT INTO "activities" VALUES('0862ee22-a1d6-40ab-9182-79696c4f3eee','ваншот Фенрір','Ваншот Свети',350,NULL,1763212992,1763212992,1763215234,1763229634,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','ВАНШОТ ФЕНРІР');
INSERT INTO "activities" VALUES('1fcb6f99-1741-44b4-9c45-632ecc5fd795','ваншот хто тут був','ваншот Іри',350,NULL,1763220161,1763220161,1763301600,1763316000,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','ВАНШОТ ХТО ТУТ БУВ');
INSERT INTO "activities" VALUES('ceec1e18-37a3-4278-be44-3be7c924028b','Витік кривавої річки','ваншот Света',350,NULL,1763818023,1763818023,1763820057,1763834457,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','ВИТІК КРИВАВОЇ РІЧКИ');
INSERT INTO "activities" VALUES('94be3d1b-0eb3-422c-820c-803238d98c2c','Операція Мяу','Ваншот Іра',350,NULL,1764510548,1764510548,1764511218,1764525618,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','ОПЕРАЦІЯ МЯУ');
INSERT INTO "activities" VALUES('6a7b7c97-4c04-40c3-a88b-0e7db381c182','Герої мимоволі',NULL,350,NULL,1765027538,1765027538,1765029621,1765044021,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','ГЕРОЇ МИМОВОЛІ');
INSERT INTO "activities" VALUES('f573e779-f98d-457e-aeb5-b9b7c2460e8b','Перша кров',NULL,350,NULL,1765633102,1765633102,1765634442,1765645242,'063b5959-f100-4819-859a-e1d0d1776813','c2bccc24-cc84-45b0-8542-ba477cbafc72','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','ПЕРША КРОВ');
INSERT INTO "activities" VALUES('3718bb97-a7dc-46a5-a7cb-b60d8136323a','Сніг і блиск','Ваншот майстра Віверни',350,NULL,1766227871,1766227871,1766239211,1766250011,'063b5959-f100-4819-859a-e1d0d1776813','c2bccc24-cc84-45b0-8542-ba477cbafc72','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','СНІГ І БЛИСК');
INSERT INTO "activities" VALUES('6c97bc6c-b0b9-4214-b03e-98b2177cd7b7','Вовки Велтона','Ваншот майстра Телени',350,NULL,1766227948,1766227948,1766325600,1766340000,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','ВОВКИ ВЕЛТОНА');
INSERT INTO "activities" VALUES('1ea2c373-13cc-435f-a896-a3379dc9b965','Новорічний квест',NULL,300,NULL,1767965408,1767965408,1766842200,1766856600,NULL,NULL,NULL,'НОВОРІЧНИЙ КВЕСТ');
INSERT INTO "activities" VALUES('3cac43b3-605a-4045-99ec-53ac410bea74','Пацючі перегони',NULL,350,10,1768079701,1768079701,1768053610,1768068010,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','fe577c11-50af-4185-b566-682706d676b7','ПАЦЮЧІ ПЕРЕГОНИ');
INSERT INTO "activities" VALUES('008cc2dd-be8e-4853-892a-e71a037bfe3e','Ранкова варта: Похмілля в Ріделі',NULL,350,NULL,1768132747,1768132747,1768140017,1768154417,'a51936b1-1109-42ce-b5a4-29dbdcf1fe32','b70a4b5e-5e20-4ca9-b34c-fb23a1e3ccd4','7ed3c005-9ee9-4f16-b7c2-95dc22994d43','РАНКОВА ВАРТА: ПОХМІЛЛЯ В РІДЕЛІ');
INSERT INTO "activities" VALUES('db5cb395-77a4-4afc-9a60-f22bb44213c5','Вампирі',NULL,350,NULL,1769364581,1769364988,1769364558,1769378958,'c23797c6-2a54-4c65-955b-f30012392731','9499ff63-0704-4339-bd39-83187f30fff7','fe577c11-50af-4185-b566-682706d676b7','ВАМПИРІ');
INSERT INTO "activities" VALUES('8f2edf94-c390-4216-aa5a-54a1efb7be90','Вампири модуль',NULL,350,10,1769863381,1769863381,1769949660,1769964060,'c23797c6-2a54-4c65-955b-f30012392731','9499ff63-0704-4339-bd39-83187f30fff7','fe577c11-50af-4185-b566-682706d676b7','ВАМПИРИ МОДУЛЬ');


-- 🧩 ENTITY-CATEGORIES LINKS
INSERT INTO "entity_categories" VALUES('f6e5d878-167a-44ac-a400-6312348c9d34','activity','e9e0830b-bda1-4f62-912d-2758e142cc61','80494f93-35d9-45b3-8993-9fdf79d8478a',1762527780);
INSERT INTO "entity_categories" VALUES('6b8738a7-645a-4771-ad24-f4a6a52a850c','activity','8509aa93-6bf7-49b5-8268-3e81aba1f194','80494f93-35d9-45b3-8993-9fdf79d8478a',1762528347);
INSERT INTO "entity_categories" VALUES('7aff7100-2346-4d17-9a5b-bdf93c191f25','activity','d5d9472b-f4ae-4546-98bd-ccef0245aaaa','28591022-bb41-45d1-be29-46854fb35cfc',1762553133);
INSERT INTO "entity_categories" VALUES('1d6df166-aa57-444b-9de9-9032cbf64ee2','activity','0cd8cbb4-6e87-4ae2-81c9-f5e3fbee3837','80494f93-35d9-45b3-8993-9fdf79d8478a',1762595646);
INSERT INTO "entity_categories" VALUES('991ea180-7b26-43ea-890f-dee52c700ede','activity','c029de7b-347b-4dce-9239-f323a6325660','80494f93-35d9-45b3-8993-9fdf79d8478a',1762595686);
INSERT INTO "entity_categories" VALUES('9c456f06-2288-4289-b309-681042f70fed','product','0751f3cb-3507-49af-b640-16adee53ccb7','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762595869);
INSERT INTO "entity_categories" VALUES('becfb48a-ac9e-4138-986a-1e844c046ff0','product','155a4ff2-9af0-43ac-a3f9-741568c97240','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762595912);
INSERT INTO "entity_categories" VALUES('56082891-7cd7-49da-ba92-dd80ff313f62','product','20da1dd9-bf11-437b-b984-2d5b4b3c56bc','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596007);
INSERT INTO "entity_categories" VALUES('3159e39d-97e8-45a5-b388-58153b368381','product','813e1498-9953-432b-bd87-0abfdbabff3e','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596030);
INSERT INTO "entity_categories" VALUES('fb0f5eb0-5d67-410b-9df3-6f8faac00cf4','product','6e12a7e1-740b-4287-b3ab-e422a719c9f3','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596064);
INSERT INTO "entity_categories" VALUES('e942d442-fc8d-4287-be00-b7eba5410f52','product','cf79d38b-843f-486c-a49c-55cdd31c292f','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596108);
INSERT INTO "entity_categories" VALUES('b909d781-fa57-45c3-b6d5-1119d252aa12','product','10174768-b66b-433f-b04b-745b415f1e95','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596129);
INSERT INTO "entity_categories" VALUES('ea8fdd0d-c2fa-4250-81c3-54431765a18a','product','63acbbe1-228f-4e37-a552-0afaf4925642','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596137);
INSERT INTO "entity_categories" VALUES('2c52179d-d634-4920-905b-d7241bcaca53','product','27034bb1-ab39-43c0-84a6-a5f29815b825','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596165);
INSERT INTO "entity_categories" VALUES('27880105-0ed5-4461-8318-bc27ad52cd33','product','b690938b-f980-4608-95d9-3ffc88c41294','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596174);
INSERT INTO "entity_categories" VALUES('512edeaa-51ab-463f-b3a5-b0fa2a29a32d','product','dd3b8441-1092-4011-97cb-60869a6ff068','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596186);
INSERT INTO "entity_categories" VALUES('c31ae556-1334-4699-9dc4-fbb52b207bf9','product','e6c2a399-ddb1-466a-af22-e1396786bde9','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596219);
INSERT INTO "entity_categories" VALUES('f6b106ff-1a02-415e-859c-9314724ed9d7','product','7b25b9d0-144d-4369-84ca-176cc13fdf5b','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596227);
INSERT INTO "entity_categories" VALUES('da65cca6-4800-4e74-b219-d4614d039d33','product','0e888a1c-ffa1-4a7f-a69d-c674dcde57b3','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596242);
INSERT INTO "entity_categories" VALUES('5866a9a8-c515-473e-9395-75d6413b65a1','product','0fa392e2-8c9c-4246-bf56-0d731027157b','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596265);
INSERT INTO "entity_categories" VALUES('71ede8f7-4238-454f-a9f9-0f7b3b042680','product','60d50388-87be-49a5-b066-8603acb7684c','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596275);
INSERT INTO "entity_categories" VALUES('cc607ba7-2afd-4eb1-8632-efc6a5830c3f','product','24f824b0-b907-43e0-9d90-5b46d1be72d4','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596285);
INSERT INTO "entity_categories" VALUES('6985ba73-02fa-4ade-adff-4c61d2e086c6','product','5d6fa069-0309-4aa3-8492-ae05c647ad79','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596334);
INSERT INTO "entity_categories" VALUES('c94ecf0f-cee7-4107-a6a0-84f8e51e0891','product','df0b1f5a-0ef8-410f-a79a-6499ed5b9b20','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596344);
INSERT INTO "entity_categories" VALUES('e36a8541-97f8-4901-bb53-91dd1ca09551','product','ebb515ec-e190-472a-a4fb-dd6cf684e76f','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596356);
INSERT INTO "entity_categories" VALUES('c99e5529-63df-4ed0-b34f-64cd2165624b','product','84532ea4-842d-45e6-afe6-21ce0a947773','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596380);
INSERT INTO "entity_categories" VALUES('865b3d63-28ff-475f-af9b-30c1c3b747f5','product','f1278fd7-b46a-431a-9d02-1e5f88caf24a','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596387);
INSERT INTO "entity_categories" VALUES('e608f475-7b67-4666-be44-682c9bcd0ad7','product','2e8325c9-6074-4147-89d5-3ab4b03f1995','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596396);
INSERT INTO "entity_categories" VALUES('bfb1e46d-f01a-41fa-82fa-bbce808f4716','product','9b656c6c-dbf4-47d6-a95a-aa0b623a1dd3','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596429);
INSERT INTO "entity_categories" VALUES('e434cbd7-7447-4fbe-b59f-82a68e463327','product','71343739-d083-4cad-8172-fa8d86241c87','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596441);
INSERT INTO "entity_categories" VALUES('1609651e-9262-4cc9-bf86-43e12ac90a7f','product','e613e051-9f80-4295-9036-dc71aba97665','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596450);
INSERT INTO "entity_categories" VALUES('46e94cfa-8529-45d3-baef-5dcc7aad397f','product','54b53b15-a7e8-432b-8140-ded0fc8b818c','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596465);
INSERT INTO "entity_categories" VALUES('c81dbc18-75e1-49c0-9493-8d9e4e8cc81e','product','987dddc6-9f0d-43f4-b2b7-28f9f889385f','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596473);
INSERT INTO "entity_categories" VALUES('f46c8316-df81-45d8-881c-3e30938950a0','product','e2be3b86-a454-48ab-bf85-efdf904eb663','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596487);
INSERT INTO "entity_categories" VALUES('5dfeb018-ff25-445a-abae-aac6b8cf220c','product','bf47d828-7f2a-4a33-8db5-4e872f8fb658','d92c5dd7-bbdd-4b35-80ed-f6bd0b98b33c',1762596516);
INSERT INTO "entity_categories" VALUES('8f9009e2-8396-46ce-a39f-ab51df244e37','activity','0862ee22-a1d6-40ab-9182-79696c4f3eee','80494f93-35d9-45b3-8993-9fdf79d8478a',1763212992);
INSERT INTO "entity_categories" VALUES('c6a3c978-9e86-4bed-bf55-4a95955b6b69','activity','1fcb6f99-1741-44b4-9c45-632ecc5fd795','80494f93-35d9-45b3-8993-9fdf79d8478a',1763220161);
INSERT INTO "entity_categories" VALUES('85983112-ba40-4089-aee1-27d271e5b7e6','activity','ceec1e18-37a3-4278-be44-3be7c924028b','80494f93-35d9-45b3-8993-9fdf79d8478a',1763818023);
INSERT INTO "entity_categories" VALUES('188a2028-f6e2-4909-8558-3c8456a069be','product','881482a0-16ef-4bde-9f3c-ed5c39adbbb6','5153c126-ebf4-44f1-b63d-5cf1b4faa3dc',1763818597);
INSERT INTO "entity_categories" VALUES('2152c905-779d-41a7-9cf6-69a1cc62d752','product','20372505-108d-4ba2-be73-5ecf17c64eef','4fd34e12-fa5c-43d0-8602-2bb703651275',1763818627);
INSERT INTO "entity_categories" VALUES('cdc50423-de10-46ff-89dd-b6a887252a74','activity','94be3d1b-0eb3-422c-820c-803238d98c2c','80494f93-35d9-45b3-8993-9fdf79d8478a',1764510548);
INSERT INTO "entity_categories" VALUES('dc82efe1-23df-4c09-9da1-985ffbc9ab64','activity','6a7b7c97-4c04-40c3-a88b-0e7db381c182','80494f93-35d9-45b3-8993-9fdf79d8478a',1765027538);
INSERT INTO "entity_categories" VALUES('a7c71b18-9a25-48c7-a331-fcfbabb13f23','activity','f573e779-f98d-457e-aeb5-b9b7c2460e8b','80494f93-35d9-45b3-8993-9fdf79d8478a',1765633102);
INSERT INTO "entity_categories" VALUES('ab28a80c-a07e-4e7b-a5de-266db378e2bf','activity','3718bb97-a7dc-46a5-a7cb-b60d8136323a','80494f93-35d9-45b3-8993-9fdf79d8478a',1766227871);
INSERT INTO "entity_categories" VALUES('ba340b92-878b-4d70-8d1f-372a5382d5d6','activity','6c97bc6c-b0b9-4214-b03e-98b2177cd7b7','80494f93-35d9-45b3-8993-9fdf79d8478a',1766227948);
INSERT INTO "entity_categories" VALUES('a32c41a4-edc1-45ba-a99a-af0ebf26cb4a','activity','1ea2c373-13cc-435f-a896-a3379dc9b965','28591022-bb41-45d1-be29-46854fb35cfc',1767965408);
INSERT INTO "entity_categories" VALUES('467a6c40-6a54-4bd9-9e28-06ca020b1975','activity','3cac43b3-605a-4045-99ec-53ac410bea74','9e78681e-fdfa-4da1-9d68-d477d97242cb',1768079701);
INSERT INTO "entity_categories" VALUES('7cb76e39-a4d9-47e9-893c-4ef64182eeee','activity','008cc2dd-be8e-4853-892a-e71a037bfe3e','80494f93-35d9-45b3-8993-9fdf79d8478a',1768132747);
INSERT INTO "entity_categories" VALUES('21d48247-ccbe-42e6-8187-9ca91cbebb17','activity','db5cb395-77a4-4afc-9a60-f22bb44213c5','9e78681e-fdfa-4da1-9d68-d477d97242cb',1769364988);
INSERT INTO "entity_categories" VALUES('b25f20a7-bbb8-41b2-a44f-dc983196f791','activity','8f2edf94-c390-4216-aa5a-54a1efb7be90','9e78681e-fdfa-4da1-9d68-d477d97242cb',1769863381);

COMMIT;
