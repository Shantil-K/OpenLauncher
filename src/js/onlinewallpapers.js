//SPDX-License-Identifier: WTFNMFPL
// Made by scripts/make-online-wallpapers.py: online photo albums for My wallpapers (background.js). The photos are
// Wikimedia Commons featured pictures, each under its own free license, with its author and page; the launcher shows
// those in the Now playing card. u: the 3840 px copy, t: a small preview, n: title, by: author, lic: license.
const ONLINE_ALBUMS=[
 {
  "id": "landscapes",
  "name": "Landscapes",
  "photos": [
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/AB_BDe_4-4_Jakobsbad_-_Urn%C3%A4sch.jpg/3840px-AB_BDe_4-4_Jakobsbad_-_Urn%C3%A4sch.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/AB_BDe_4-4_Jakobsbad_-_Urn%C3%A4sch.jpg/330px-AB_BDe_4-4_Jakobsbad_-_Urn%C3%A4sch.jpg",
    "n": "AB BDe 4-4 Jakobsbad - Urnäsch",
    "by": "Kabelleger / David Gubler ( http://www.bahnbilder.ch )",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:AB_BDe_4-4_Jakobsbad_-_Urn%C3%A4sch.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Amanhecer_no_Hercules_--.jpg/3840px-Amanhecer_no_Hercules_--.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Amanhecer_no_Hercules_--.jpg/330px-Amanhecer_no_Hercules_--.jpg",
    "n": "Amanhecer no Hercules --",
    "by": "Carlos Perez Couto",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Amanhecer_no_Hercules_--.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/2014_Track_on_Fremington_Edge.jpg/3840px-2014_Track_on_Fremington_Edge.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/2014_Track_on_Fremington_Edge.jpg/330px-2014_Track_on_Fremington_Edge.jpg",
    "n": "2014 Track on Fremington Edge",
    "by": "Kreuzschnabel",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:2014_Track_on_Fremington_Edge.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Barranco_Valle_de_la_Fuente_-_Fuerteventura.jpg/3840px-Barranco_Valle_de_la_Fuente_-_Fuerteventura.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Barranco_Valle_de_la_Fuente_-_Fuerteventura.jpg/330px-Barranco_Valle_de_la_Fuente_-_Fuerteventura.jpg",
    "n": "Barranco Valle de la Fuente - Fuerteventura",
    "by": "H. Zell",
    "lic": "CC BY 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Barranco_Valle_de_la_Fuente_-_Fuerteventura.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Aguarales_de_Valpalmas%2C_Zaragoza%2C_Espa%C3%B1a%2C_2015-01-06%2C_DD_26.JPG/3840px-Aguarales_de_Valpalmas%2C_Zaragoza%2C_Espa%C3%B1a%2C_2015-01-06%2C_DD_26.JPG",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Aguarales_de_Valpalmas%2C_Zaragoza%2C_Espa%C3%B1a%2C_2015-01-06%2C_DD_26.JPG/330px-Aguarales_de_Valpalmas%2C_Zaragoza%2C_Espa%C3%B1a%2C_2015-01-06%2C_DD_26.JPG",
    "n": "Aguarales de Valpalmas, Zaragoza, España, 2015-01-06, DD 26",
    "by": "Diego Delso",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Aguarales_de_Valpalmas,_Zaragoza,_Espa%C3%B1a,_2015-01-06,_DD_26.JPG"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Arauc%C3%A1rias_ao_fundo_Parque_Nacional_da_Serra_da_Bocaina_-_denoise.jpg/3840px-Arauc%C3%A1rias_ao_fundo_Parque_Nacional_da_Serra_da_Bocaina_-_denoise.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Arauc%C3%A1rias_ao_fundo_Parque_Nacional_da_Serra_da_Bocaina_-_denoise.jpg/330px-Arauc%C3%A1rias_ao_fundo_Parque_Nacional_da_Serra_da_Bocaina_-_denoise.jpg",
    "n": "Araucárias ao fundo Parque Nacional da Serra da Bocaina - denoise",
    "by": "Heris Luiz Cordeiro Rocha",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Arauc%C3%A1rias_ao_fundo_Parque_Nacional_da_Serra_da_Bocaina_-_denoise.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Albeck_Benesirnitz_Leonhard-Kapelle_06052015_3266.jpg/3840px-Albeck_Benesirnitz_Leonhard-Kapelle_06052015_3266.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Albeck_Benesirnitz_Leonhard-Kapelle_06052015_3266.jpg/330px-Albeck_Benesirnitz_Leonhard-Kapelle_06052015_3266.jpg",
    "n": "Albeck Benesirnitz Leonhard-Kapelle 06052015 3266",
    "by": "Johann Jaritz",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Albeck_Benesirnitz_Leonhard-Kapelle_06052015_3266.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/2015_Ribblehead_Viaduct_1.jpg/3840px-2015_Ribblehead_Viaduct_1.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/2015_Ribblehead_Viaduct_1.jpg/330px-2015_Ribblehead_Viaduct_1.jpg",
    "n": "2015 Ribblehead Viaduct 1",
    "by": "Kreuzschnabel",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:2015_Ribblehead_Viaduct_1.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/2015_Swaledale_from_Kisdon_Hill.jpg/3840px-2015_Swaledale_from_Kisdon_Hill.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/2015_Swaledale_from_Kisdon_Hill.jpg/330px-2015_Swaledale_from_Kisdon_Hill.jpg",
    "n": "2015 Swaledale from Kisdon Hill",
    "by": "Kreuzschnabel",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:2015_Swaledale_from_Kisdon_Hill.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/ARG-2016-Aerial-Tierra_del_Fuego_%28Ushuaia%29%E2%80%93Valle_Carbajal_01.jpg/3840px-ARG-2016-Aerial-Tierra_del_Fuego_%28Ushuaia%29%E2%80%93Valle_Carbajal_01.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/ARG-2016-Aerial-Tierra_del_Fuego_%28Ushuaia%29%E2%80%93Valle_Carbajal_01.jpg/330px-ARG-2016-Aerial-Tierra_del_Fuego_%28Ushuaia%29%E2%80%93Valle_Carbajal_01.jpg",
    "n": "ARG-2016-Aerial-Tierra del Fuego (Ushuaia)–Valle Carbajal 01",
    "by": "Godot13",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:ARG-2016-Aerial-Tierra_del_Fuego_(Ushuaia)%E2%80%93Valle_Carbajal_01.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Anfiteatro%2C_Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-01%2C_DD_149.JPG/3840px-Anfiteatro%2C_Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-01%2C_DD_149.JPG",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Anfiteatro%2C_Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-01%2C_DD_149.JPG/330px-Anfiteatro%2C_Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-01%2C_DD_149.JPG",
    "n": "Anfiteatro, Valle de la Luna, San Pedro de Atacama, Chile, 2016-02-01, DD 149",
    "by": "Diego Delso",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Anfiteatro,_Valle_de_la_Luna,_San_Pedro_de_Atacama,_Chile,_2016-02-01,_DD_149.JPG"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/2013_Cogden_Bridge.jpg/3840px-2013_Cogden_Bridge.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/2013_Cogden_Bridge.jpg/330px-2013_Cogden_Bridge.jpg",
    "n": "2013 Cogden Bridge",
    "by": "Kreuzschnabel",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:2013_Cogden_Bridge.jpg"
   }
  ]
 },
 {
  "id": "mountains",
  "name": "Mountains",
  "photos": [
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Gentau_Pic_du_Midi_Ossau.jpg/3840px-Gentau_Pic_du_Midi_Ossau.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Gentau_Pic_du_Midi_Ossau.jpg/330px-Gentau_Pic_du_Midi_Ossau.jpg",
    "n": "Gentau Pic du Midi Ossau",
    "by": "Myrabella",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Gentau_Pic_du_Midi_Ossau.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/20090719_Crkva_Gospa_od_Zdravlja_Kotor_Bay_Montenegro.jpg/3840px-20090719_Crkva_Gospa_od_Zdravlja_Kotor_Bay_Montenegro.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/20090719_Crkva_Gospa_od_Zdravlja_Kotor_Bay_Montenegro.jpg/330px-20090719_Crkva_Gospa_od_Zdravlja_Kotor_Bay_Montenegro.jpg",
    "n": "20090719 Crkva Gospa od Zdravlja Kotor Bay Montenegro",
    "by": "User:Ggia",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:20090719_Crkva_Gospa_od_Zdravlja_Kotor_Bay_Montenegro.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/1_zhangjiajie_huangshizhai_wulingyuan_panorama_2012.jpg/3840px-1_zhangjiajie_huangshizhai_wulingyuan_panorama_2012.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/1_zhangjiajie_huangshizhai_wulingyuan_panorama_2012.jpg/330px-1_zhangjiajie_huangshizhai_wulingyuan_panorama_2012.jpg",
    "n": "1 zhangjiajie huangshizhai wulingyuan panorama 2012",
    "by": "chensiyuan",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:1_zhangjiajie_huangshizhai_wulingyuan_panorama_2012.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Bali_Khila_Rajgad_Maharashtra.jpg/3840px-Bali_Khila_Rajgad_Maharashtra.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Bali_Khila_Rajgad_Maharashtra.jpg/330px-Bali_Khila_Rajgad_Maharashtra.jpg",
    "n": "Bali Khila Rajgad Maharashtra",
    "by": "Cj.samson",
    "lic": "CC BY 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Bali_Khila_Rajgad_Maharashtra.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/01_Gorges_du_Tarn_Roc_des_Hourtous.jpg/3840px-01_Gorges_du_Tarn_Roc_des_Hourtous.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/01_Gorges_du_Tarn_Roc_des_Hourtous.jpg/330px-01_Gorges_du_Tarn_Roc_des_Hourtous.jpg",
    "n": "01 Gorges du Tarn Roc des Hourtous",
    "by": "Myrabella",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:01_Gorges_du_Tarn_Roc_des_Hourtous.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/01_Calanche_Piana.jpg/3840px-01_Calanche_Piana.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/01_Calanche_Piana.jpg/330px-01_Calanche_Piana.jpg",
    "n": "01 Calanche Piana",
    "by": "Myrabella",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:01_Calanche_Piana.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/205kei_train_in_JR_Nikko_line_02.JPG/3840px-205kei_train_in_JR_Nikko_line_02.JPG",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/205kei_train_in_JR_Nikko_line_02.JPG/330px-205kei_train_in_JR_Nikko_line_02.JPG",
    "n": "205kei train in JR Nikko line 02",
    "by": "Fortew F",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:205kei_train_in_JR_Nikko_line_02.JPG"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Flatirons_Sunrise.jpg/3840px-Flatirons_Sunrise.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Flatirons_Sunrise.jpg/330px-Flatirons_Sunrise.jpg",
    "n": "Flatirons Sunrise",
    "by": "Tyler Cipriani",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Flatirons_Sunrise.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/Beskid_S%C4%85decki_in_winter_2016_05.jpg/3840px-Beskid_S%C4%85decki_in_winter_2016_05.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/Beskid_S%C4%85decki_in_winter_2016_05.jpg/330px-Beskid_S%C4%85decki_in_winter_2016_05.jpg",
    "n": "Beskid Sądecki in winter 2016 05",
    "by": "Pudelek",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Beskid_S%C4%85decki_in_winter_2016_05.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Blue_Lake_in_Mount_Cook_National_Park.jpg/3840px-Blue_Lake_in_Mount_Cook_National_Park.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Blue_Lake_in_Mount_Cook_National_Park.jpg/330px-Blue_Lake_in_Mount_Cook_National_Park.jpg",
    "n": "Blue Lake in Mount Cook National Park",
    "by": "Krzysztof Golik",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Blue_Lake_in_Mount_Cook_National_Park.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/21-224-5054_NNP_Synevyr_RB_18.jpg/3840px-21-224-5054_NNP_Synevyr_RB_18.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/21-224-5054_NNP_Synevyr_RB_18.jpg/330px-21-224-5054_NNP_Synevyr_RB_18.jpg",
    "n": "21-224-5054 NNP Synevyr RB 18",
    "by": "Rbrechko",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:21-224-5054_NNP_Synevyr_RB_18.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Almsee_Nordbucht-4224.jpg/3840px-Almsee_Nordbucht-4224.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Almsee_Nordbucht-4224.jpg/330px-Almsee_Nordbucht-4224.jpg",
    "n": "Almsee Nordbucht-4224",
    "by": "Isiwal",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Almsee_Nordbucht-4224.jpg"
   }
  ]
 },
 {
  "id": "water",
  "name": "Seas and lakes",
  "photos": [
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/M%C3%A4nnikj%C3%A4rve_raba_tornist.jpg/3840px-M%C3%A4nnikj%C3%A4rve_raba_tornist.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/M%C3%A4nnikj%C3%A4rve_raba_tornist.jpg/330px-M%C3%A4nnikj%C3%A4rve_raba_tornist.jpg",
    "n": "Männikjärve raba tornist",
    "by": "Abrget47j",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:M%C3%A4nnikj%C3%A4rve_raba_tornist.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/L%C3%BC%C3%BCbnitsa.JPG/3840px-L%C3%BC%C3%BCbnitsa.JPG",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/L%C3%BC%C3%BCbnitsa.JPG/330px-L%C3%BC%C3%BCbnitsa.JPG",
    "n": "Lüübnitsa",
    "by": "Ivo Kruusamägi",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:L%C3%BC%C3%BCbnitsa.JPG"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/D%C3%BClmen%2C_Wildpark_--_2015_--_8871-7.jpg/3840px-D%C3%BClmen%2C_Wildpark_--_2015_--_8871-7.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/D%C3%BClmen%2C_Wildpark_--_2015_--_8871-7.jpg/330px-D%C3%BClmen%2C_Wildpark_--_2015_--_8871-7.jpg",
    "n": "Dülmen, Wildpark -- 2015 -- 8871-7",
    "by": "Dietmar Rabich",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Wildpark_--_2015_--_8871-7.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/L%C3%BCdinghausen%2C_Berenbrock%2C_Dortmund-Ems-Kanal_%28an_der_Kreisstra%C3%9Fe_23%29_--_2015_--_4655.jpg/3840px-L%C3%BCdinghausen%2C_Berenbrock%2C_Dortmund-Ems-Kanal_%28an_der_Kreisstra%C3%9Fe_23%29_--_2015_--_4655.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/L%C3%BCdinghausen%2C_Berenbrock%2C_Dortmund-Ems-Kanal_%28an_der_Kreisstra%C3%9Fe_23%29_--_2015_--_4655.jpg/330px-L%C3%BCdinghausen%2C_Berenbrock%2C_Dortmund-Ems-Kanal_%28an_der_Kreisstra%C3%9Fe_23%29_--_2015_--_4655.jpg",
    "n": "Lüdinghausen, Berenbrock, Dortmund-Ems-Kanal (an der Kreisstraße 23) -- 2015 -- ",
    "by": "Dietmar Rabich",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:L%C3%BCdinghausen,_Berenbrock,_Dortmund-Ems-Kanal_(an_der_Kreisstra%C3%9Fe_23)_--_2015_--_4655.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/L%C3%BCdinghausen%2C_Berenbrock%2C_Dortmund-Ems-Kanal_%28an_der_Kreisstra%C3%9Fe_23%29_--_2015_--_4668-70.jpg/3840px-L%C3%BCdinghausen%2C_Berenbrock%2C_Dortmund-Ems-Kanal_%28an_der_Kreisstra%C3%9Fe_23%29_--_2015_--_4668-70.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/L%C3%BCdinghausen%2C_Berenbrock%2C_Dortmund-Ems-Kanal_%28an_der_Kreisstra%C3%9Fe_23%29_--_2015_--_4668-70.jpg/330px-L%C3%BCdinghausen%2C_Berenbrock%2C_Dortmund-Ems-Kanal_%28an_der_Kreisstra%C3%9Fe_23%29_--_2015_--_4668-70.jpg",
    "n": "Lüdinghausen, Berenbrock, Dortmund-Ems-Kanal (an der Kreisstraße 23) -- 2015 -- ",
    "by": "Dietmar Rabich",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:L%C3%BCdinghausen,_Berenbrock,_Dortmund-Ems-Kanal_(an_der_Kreisstra%C3%9Fe_23)_--_2015_--_4668-70.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/La_Roque%2C_Salagou_Lake_02.jpg/3840px-La_Roque%2C_Salagou_Lake_02.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/La_Roque%2C_Salagou_Lake_02.jpg/330px-La_Roque%2C_Salagou_Lake_02.jpg",
    "n": "La Roque, Salagou Lake 02",
    "by": "Christian Ferrer",
    "lic": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:La_Roque,_Salagou_Lake_02.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Igarap%C3%A9_do_Rego.jpg/3840px-Igarap%C3%A9_do_Rego.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Igarap%C3%A9_do_Rego.jpg/330px-Igarap%C3%A9_do_Rego.jpg",
    "n": "Igarapé do Rego",
    "by": "Joao lara mesquita",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Igarap%C3%A9_do_Rego.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Cascading_waves_at_Kallbadhuset_Lysekil.jpg/3840px-Cascading_waves_at_Kallbadhuset_Lysekil.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Cascading_waves_at_Kallbadhuset_Lysekil.jpg/330px-Cascading_waves_at_Kallbadhuset_Lysekil.jpg",
    "n": "Cascading waves at Kallbadhuset Lysekil",
    "by": "W.carter",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Cascading_waves_at_Kallbadhuset_Lysekil.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Baggerdepot_Broek_bij_Joure_11.jpg/3840px-Baggerdepot_Broek_bij_Joure_11.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Baggerdepot_Broek_bij_Joure_11.jpg/330px-Baggerdepot_Broek_bij_Joure_11.jpg",
    "n": "Baggerdepot Broek bij Joure 11",
    "by": "Dominicus Johannes Bergsma",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Baggerdepot_Broek_bij_Joure_11.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Fisherman_at_Gullmarsvik_mudflats.jpg/3840px-Fisherman_at_Gullmarsvik_mudflats.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Fisherman_at_Gullmarsvik_mudflats.jpg/330px-Fisherman_at_Gullmarsvik_mudflats.jpg",
    "n": "Fisherman at Gullmarsvik mudflats",
    "by": "W.carter",
    "lic": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Fisherman_at_Gullmarsvik_mudflats.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Eriksberg_shipyard_crane.jpg/3840px-Eriksberg_shipyard_crane.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Eriksberg_shipyard_crane.jpg/330px-Eriksberg_shipyard_crane.jpg",
    "n": "Eriksberg shipyard crane",
    "by": "W.carter",
    "lic": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Eriksberg_shipyard_crane.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Jetty_in_fog_at_Holl%C3%A4ndar%C3%B6d_1.jpg/3840px-Jetty_in_fog_at_Holl%C3%A4ndar%C3%B6d_1.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Jetty_in_fog_at_Holl%C3%A4ndar%C3%B6d_1.jpg/330px-Jetty_in_fog_at_Holl%C3%A4ndar%C3%B6d_1.jpg",
    "n": "Jetty in fog at Holländaröd 1",
    "by": "W.carter",
    "lic": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Jetty_in_fog_at_Holl%C3%A4ndar%C3%B6d_1.jpg"
   }
  ]
 },
 {
  "id": "forests",
  "name": "Forests",
  "photos": [
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Birchwood_Slavnoe_2012_G1.jpg/3840px-Birchwood_Slavnoe_2012_G1.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Birchwood_Slavnoe_2012_G1.jpg/330px-Birchwood_Slavnoe_2012_G1.jpg",
    "n": "Birchwood Slavnoe 2012 G1",
    "by": "George Chernilevsky",
    "lic": "Public domain",
    "page": "https://commons.wikimedia.org/wiki/File:Birchwood_Slavnoe_2012_G1.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/D%C3%BClmen%2C_Umland_--_2014_--_7056.jpg/3840px-D%C3%BClmen%2C_Umland_--_2014_--_7056.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/D%C3%BClmen%2C_Umland_--_2014_--_7056.jpg/330px-D%C3%BClmen%2C_Umland_--_2014_--_7056.jpg",
    "n": "Dülmen, Umland -- 2014 -- 7056",
    "by": "Dietmar Rabich",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Umland_--_2014_--_7056.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/D%C3%BClmen%2C_Naturschutzgebiet_-Am_Enteborn-_--_2014_--_0202.jpg/3840px-D%C3%BClmen%2C_Naturschutzgebiet_-Am_Enteborn-_--_2014_--_0202.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/D%C3%BClmen%2C_Naturschutzgebiet_-Am_Enteborn-_--_2014_--_0202.jpg/330px-D%C3%BClmen%2C_Naturschutzgebiet_-Am_Enteborn-_--_2014_--_0202.jpg",
    "n": "Dülmen, Naturschutzgebiet -Am Enteborn- -- 2014 -- 0202",
    "by": "Dietmar Rabich",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Naturschutzgebiet_-Am_Enteborn-_--_2014_--_0202.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/2014_Park_w_K%C5%82odzku.jpg/3840px-2014_Park_w_K%C5%82odzku.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/2014_Park_w_K%C5%82odzku.jpg/330px-2014_Park_w_K%C5%82odzku.jpg",
    "n": "2014 Park w Kłodzku",
    "by": "Jacek Halicki",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:2014_Park_w_K%C5%82odzku.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Bergtocht_van_Gimillan_%281805m.%29_naar_Colle_Tsa_S%C3%A8tse_in_Cogne_Valley_%28Itali%C3%AB%29._Zicht_op_de_omringende_alpen_01.jpg/3840px-Bergtocht_van_Gimillan_%281805m.%29_naar_Colle_Tsa_S%C3%A8tse_in_Cogne_Valley_%28Itali%C3%AB%29._Zicht_op_de_omringende_alpen_01.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Bergtocht_van_Gimillan_%281805m.%29_naar_Colle_Tsa_S%C3%A8tse_in_Cogne_Valley_%28Itali%C3%AB%29._Zicht_op_de_omringende_alpen_01.jpg/330px-Bergtocht_van_Gimillan_%281805m.%29_naar_Colle_Tsa_S%C3%A8tse_in_Cogne_Valley_%28Itali%C3%AB%29._Zicht_op_de_omringende_alpen_01.jpg",
    "n": "Bergtocht van Gimillan (1805m.) naar Colle Tsa Sètse in Cogne Valley (Italië). Z",
    "by": "Dominicus Johannes Bergsma",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Bergtocht_van_Gimillan_(1805m.)_naar_Colle_Tsa_S%C3%A8tse_in_Cogne_Valley_(Itali%C3%AB)._Zicht_op_de_omringende_alpen_01.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/D%C3%BClmen%2C_B%C3%B6rnste%2C_Waldweg_--_2015_--_4649.jpg/3840px-D%C3%BClmen%2C_B%C3%B6rnste%2C_Waldweg_--_2015_--_4649.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/D%C3%BClmen%2C_B%C3%B6rnste%2C_Waldweg_--_2015_--_4649.jpg/330px-D%C3%BClmen%2C_B%C3%B6rnste%2C_Waldweg_--_2015_--_4649.jpg",
    "n": "Dülmen, Börnste, Waldweg -- 2015 -- 4649",
    "by": "Dietmar Rabich",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_B%C3%B6rnste,_Waldweg_--_2015_--_4649.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/D%C3%BClmen%2C_Kirchspiel%2C_Bauerschaft_B%C3%B6rnste_--_2017_--_6919.jpg/3840px-D%C3%BClmen%2C_Kirchspiel%2C_Bauerschaft_B%C3%B6rnste_--_2017_--_6919.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/D%C3%BClmen%2C_Kirchspiel%2C_Bauerschaft_B%C3%B6rnste_--_2017_--_6919.jpg/330px-D%C3%BClmen%2C_Kirchspiel%2C_Bauerschaft_B%C3%B6rnste_--_2017_--_6919.jpg",
    "n": "Dülmen, Kirchspiel, Bauerschaft Börnste -- 2017 -- 6919",
    "by": "Dietmar Rabich",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Kirchspiel,_Bauerschaft_B%C3%B6rnste_--_2017_--_6919.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Beech_and_ferns_in_Gullmarsskogen.jpg/3840px-Beech_and_ferns_in_Gullmarsskogen.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Beech_and_ferns_in_Gullmarsskogen.jpg/330px-Beech_and_ferns_in_Gullmarsskogen.jpg",
    "n": "Beech and ferns in Gullmarsskogen",
    "by": "W.carter",
    "lic": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Beech_and_ferns_in_Gullmarsskogen.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Overgrown_dead_tree_stumps_15.jpg/3840px-Overgrown_dead_tree_stumps_15.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Overgrown_dead_tree_stumps_15.jpg/330px-Overgrown_dead_tree_stumps_15.jpg",
    "n": "Overgrown dead tree stumps 15",
    "by": "Dominicus Johannes Bergsma",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Overgrown_dead_tree_stumps_15.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Bothe-Napa_Valley_State_Park_%2801811%29.jpg/3840px-Bothe-Napa_Valley_State_Park_%2801811%29.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Bothe-Napa_Valley_State_Park_%2801811%29.jpg/330px-Bothe-Napa_Valley_State_Park_%2801811%29.jpg",
    "n": "Bothe-Napa Valley State Park (01811)",
    "by": "Rhododendrites",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Bothe-Napa_Valley_State_Park_(01811).jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Bilberry_bush_and_moss_in_Gullmarsskogen_ravine.jpg/3840px-Bilberry_bush_and_moss_in_Gullmarsskogen_ravine.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Bilberry_bush_and_moss_in_Gullmarsskogen_ravine.jpg/330px-Bilberry_bush_and_moss_in_Gullmarsskogen_ravine.jpg",
    "n": "Bilberry bush and moss in Gullmarsskogen ravine",
    "by": "W.carter",
    "lic": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Bilberry_bush_and_moss_in_Gullmarsskogen_ravine.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Forest_road_Slavne_2017_G8.jpg/3840px-Forest_road_Slavne_2017_G8.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Forest_road_Slavne_2017_G8.jpg/330px-Forest_road_Slavne_2017_G8.jpg",
    "n": "Forest road Slavne 2017 G8",
    "by": "George Chernilevsky",
    "lic": "Public domain",
    "page": "https://commons.wikimedia.org/wiki/File:Forest_road_Slavne_2017_G8.jpg"
   }
  ]
 },
 {
  "id": "night",
  "name": "Night skies",
  "photos": [
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/ESO_-_The_Carina_Nebula_%28by%29.jpg/3840px-ESO_-_The_Carina_Nebula_%28by%29.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/ESO_-_The_Carina_Nebula_%28by%29.jpg/330px-ESO_-_The_Carina_Nebula_%28by%29.jpg",
    "n": "ESO - The Carina Nebula (by)",
    "by": "ESO /IDA/Danish 1.5 m/R.Gendler, J-E. Ovaldsen, C. Thöne, an",
    "lic": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:ESO_-_The_Carina_Nebula_(by).jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Lagoon_Nebula_%28ESO%29.jpg/3840px-Lagoon_Nebula_%28ESO%29.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Lagoon_Nebula_%28ESO%29.jpg/330px-Lagoon_Nebula_%28ESO%29.jpg",
    "n": "Lagoon Nebula (ESO)",
    "by": "ESO/S. Guisard",
    "lic": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Lagoon_Nebula_(ESO).jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Heart_and_Soul_nebulae.jpg/3840px-Heart_and_Soul_nebulae.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Heart_and_Soul_nebulae.jpg/330px-Heart_and_Soul_nebulae.jpg",
    "n": "Heart and Soul nebulae",
    "by": "NASA/JPL-Caltech/UCLA",
    "lic": "Public domain",
    "page": "https://commons.wikimedia.org/wiki/File:Heart_and_Soul_nebulae.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/2012-03-14_21-42-55-file-etoiles-14f-2min-3d.jpg/3840px-2012-03-14_21-42-55-file-etoiles-14f-2min-3d.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/2012-03-14_21-42-55-file-etoiles-14f-2min-3d.jpg/330px-2012-03-14_21-42-55-file-etoiles-14f-2min-3d.jpg",
    "n": "2012-03-14 21-42-55-file-etoiles-14f-2min-3d",
    "by": "Thomas Bresson",
    "lic": "CC BY 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:2012-03-14_21-42-55-file-etoiles-14f-2min-3d.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Carina_Nebula.jpg/3840px-Carina_Nebula.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Carina_Nebula.jpg/330px-Carina_Nebula.jpg",
    "n": "Carina Nebula",
    "by": "ESO/T. Preibisch",
    "lic": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Carina_Nebula.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/In_the_photo_there_is_one_Perseid%2C_Milky_Way_and_Andromega_galaxy_and_light_pollution_on_the_horizon_-_Luhasoo_bog_in_Estonia.jpg/3840px-In_the_photo_there_is_one_Perseid%2C_Milky_Way_and_Andromega_galaxy_and_light_pollution_on_the_horizon_-_Luhasoo_bog_in_Estonia.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/In_the_photo_there_is_one_Perseid%2C_Milky_Way_and_Andromega_galaxy_and_light_pollution_on_the_horizon_-_Luhasoo_bog_in_Estonia.jpg/330px-In_the_photo_there_is_one_Perseid%2C_Milky_Way_and_Andromega_galaxy_and_light_pollution_on_the_horizon_-_Luhasoo_bog_in_Estonia.jpg",
    "n": "In the photo there is one Perseid, Milky Way and Andromega galaxy and light poll",
    "by": "Martin Mark",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:In_the_photo_there_is_one_Perseid,_Milky_Way_and_Andromega_galaxy_and_light_pollution_on_the_horizon_-_Luhasoo_bog_in_Estonia.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/2017-04_Circumpolar_trails_sunset_at_La_Hague_lighthouse.jpg/3840px-2017-04_Circumpolar_trails_sunset_at_La_Hague_lighthouse.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/2017-04_Circumpolar_trails_sunset_at_La_Hague_lighthouse.jpg/330px-2017-04_Circumpolar_trails_sunset_at_La_Hague_lighthouse.jpg",
    "n": "2017-04 Circumpolar trails sunset at La Hague lighthouse",
    "by": "Antoine Lamielle",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:2017-04_Circumpolar_trails_sunset_at_La_Hague_lighthouse.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Ic443_nf_c_shorgb_2218m%2B823m%2B666m%2B729m_2218m_37h.jpg/3840px-Ic443_nf_c_shorgb_2218m%2B823m%2B666m%2B729m_2218m_37h.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Ic443_nf_c_shorgb_2218m%2B823m%2B666m%2B729m_2218m_37h.jpg/330px-Ic443_nf_c_shorgb_2218m%2B823m%2B666m%2B729m_2218m_37h.jpg",
    "n": "Ic443 nf c shorgb 2218m+823m+666m+729m 2218m 37h",
    "by": "Ram samudrala",
    "lic": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Ic443_nf_c_shorgb_2218m%2B823m%2B666m%2B729m_2218m_37h.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/California_nebula_NGC1499.jpg/3840px-California_nebula_NGC1499.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/California_nebula_NGC1499.jpg/330px-California_nebula_NGC1499.jpg",
    "n": "California nebula NGC1499",
    "by": "Ram samudrala",
    "lic": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:California_nebula_NGC1499.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Comet_Tsuchinshan%E2%80%93ATLAS%2C_in_the_night_sky_over_Tuntorp_3.jpg/3840px-Comet_Tsuchinshan%E2%80%93ATLAS%2C_in_the_night_sky_over_Tuntorp_3.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Comet_Tsuchinshan%E2%80%93ATLAS%2C_in_the_night_sky_over_Tuntorp_3.jpg/330px-Comet_Tsuchinshan%E2%80%93ATLAS%2C_in_the_night_sky_over_Tuntorp_3.jpg",
    "n": "Comet Tsuchinshan–ATLAS, in the night sky over Tuntorp 3",
    "by": "W.carter",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Comet_Tsuchinshan%E2%80%93ATLAS,_in_the_night_sky_over_Tuntorp_3.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Emission_nebulae_in_Cepheus_and_Cassiopeia.jpg/3840px-Emission_nebulae_in_Cepheus_and_Cassiopeia.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Emission_nebulae_in_Cepheus_and_Cassiopeia.jpg/330px-Emission_nebulae_in_Cepheus_and_Cassiopeia.jpg",
    "n": "Emission nebulae in Cepheus and Cassiopeia",
    "by": "Tk833",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Emission_nebulae_in_Cepheus_and_Cassiopeia.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/California_nebula_from_Estonia.jpg/3840px-California_nebula_from_Estonia.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/California_nebula_from_Estonia.jpg/330px-California_nebula_from_Estonia.jpg",
    "n": "California nebula from Estonia",
    "by": "Taavi Niittee/Tõrva Astronoomiaklubi/Tõrva Astronomy Club",
    "lic": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:California_nebula_from_Estonia.jpg"
   }
  ]
 },
 {
  "id": "cities",
  "name": "Cities",
  "photos": [
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Amsterdam_Canals_-_July_2006.jpg/3840px-Amsterdam_Canals_-_July_2006.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Amsterdam_Canals_-_July_2006.jpg/330px-Amsterdam_Canals_-_July_2006.jpg",
    "n": "Amsterdam Canals - July 2006",
    "by": "Diliff",
    "lic": "CC BY 2.5",
    "page": "https://commons.wikimedia.org/wiki/File:Amsterdam_Canals_-_July_2006.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/20110102_Kharanaq_old_city_Iran.jpg/3840px-20110102_Kharanaq_old_city_Iran.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/20110102_Kharanaq_old_city_Iran.jpg/330px-20110102_Kharanaq_old_city_Iran.jpg",
    "n": "20110102 Kharanaq old city Iran",
    "by": "User:Ggia",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:20110102_Kharanaq_old_city_Iran.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/1_singapore_national_day_parade_2011_fireworks.jpg/3840px-1_singapore_national_day_parade_2011_fireworks.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/1_singapore_national_day_parade_2011_fireworks.jpg/330px-1_singapore_national_day_parade_2011_fireworks.jpg",
    "n": "1 singapore national day parade 2011 fireworks",
    "by": "chensiyuan",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:1_singapore_national_day_parade_2011_fireworks.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Atrani_%28Costiera_Amalfitana%2C_23-8-2011%29.jpg/3840px-Atrani_%28Costiera_Amalfitana%2C_23-8-2011%29.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Atrani_%28Costiera_Amalfitana%2C_23-8-2011%29.jpg/330px-Atrani_%28Costiera_Amalfitana%2C_23-8-2011%29.jpg",
    "n": "Atrani (Costiera Amalfitana, 23-8-2011)",
    "by": "Paolo Costa Baldi",
    "lic": "CC BY 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Atrani_(Costiera_Amalfitana,_23-8-2011).jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/13-08-08-hongkong-by-RalfR-Panorama2.jpg/3840px-13-08-08-hongkong-by-RalfR-Panorama2.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/13-08-08-hongkong-by-RalfR-Panorama2.jpg/330px-13-08-08-hongkong-by-RalfR-Panorama2.jpg",
    "n": "13-08-08-hongkong-by-RalfR-Panorama2",
    "by": "Ralf Roletschek",
    "lic": "CC BY 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:13-08-08-hongkong-by-RalfR-Panorama2.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/13-08-09-peak-by-RalfR-01.jpg/3840px-13-08-09-peak-by-RalfR-01.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/13-08-09-peak-by-RalfR-01.jpg/330px-13-08-09-peak-by-RalfR-01.jpg",
    "n": "13-08-09-peak-by-RalfR-01",
    "by": "Ralf Roletschek",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:13-08-09-peak-by-RalfR-01.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/13-08-09-peak-by-RalfR-04.jpg/3840px-13-08-09-peak-by-RalfR-04.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/13-08-09-peak-by-RalfR-04.jpg/330px-13-08-09-peak-by-RalfR-04.jpg",
    "n": "13-08-09-peak-by-RalfR-04",
    "by": "Ralf Roletschek",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:13-08-09-peak-by-RalfR-04.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/2013-Aerial-Mount_of_Olives.jpg/3840px-2013-Aerial-Mount_of_Olives.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/2013-Aerial-Mount_of_Olives.jpg/330px-2013-Aerial-Mount_of_Olives.jpg",
    "n": "2013-Aerial-Mount of Olives",
    "by": "Godot13",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:2013-Aerial-Mount_of_Olives.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Amboy_%28California%2C_USA%29_--_2012_--_4.jpg/3840px-Amboy_%28California%2C_USA%29_--_2012_--_4.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Amboy_%28California%2C_USA%29_--_2012_--_4.jpg/330px-Amboy_%28California%2C_USA%29_--_2012_--_4.jpg",
    "n": "Amboy (California, USA) -- 2012 -- 4",
    "by": "Dietmar Rabich",
    "lic": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Amboy_(California,_USA)_--_2012_--_4.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/15th_Arrondissement_of_Paris_as_seen_from_Pont_de_Bir-Hakeim_140507_1.jpg/3840px-15th_Arrondissement_of_Paris_as_seen_from_Pont_de_Bir-Hakeim_140507_1.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/15th_Arrondissement_of_Paris_as_seen_from_Pont_de_Bir-Hakeim_140507_1.jpg/330px-15th_Arrondissement_of_Paris_as_seen_from_Pont_de_Bir-Hakeim_140507_1.jpg",
    "n": "15th Arrondissement of Paris as seen from Pont de Bir-Hakeim 140507 1",
    "by": "DXR",
    "lic": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:15th_Arrondissement_of_Paris_as_seen_from_Pont_de_Bir-Hakeim_140507_1.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Wroc%C5%82aw_-_widok_z_Wyspy_Slodowej_-_wyspa_Tamka.jpg/3840px-Wroc%C5%82aw_-_widok_z_Wyspy_Slodowej_-_wyspa_Tamka.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Wroc%C5%82aw_-_widok_z_Wyspy_Slodowej_-_wyspa_Tamka.jpg/330px-Wroc%C5%82aw_-_widok_z_Wyspy_Slodowej_-_wyspa_Tamka.jpg",
    "n": "Wrocław - widok z Wyspy Slodowej - wyspa Tamka",
    "by": "Jar.ciurus",
    "lic": "CC BY-SA 3.0 pl",
    "page": "https://commons.wikimedia.org/wiki/File:Wroc%C5%82aw_-_widok_z_Wyspy_Slodowej_-_wyspa_Tamka.jpg"
   },
   {
    "u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/2014_Bystrzyca_K%C5%82odzka%2C_stare_miasto_11.jpg/3840px-2014_Bystrzyca_K%C5%82odzka%2C_stare_miasto_11.jpg",
    "t": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/2014_Bystrzyca_K%C5%82odzka%2C_stare_miasto_11.jpg/330px-2014_Bystrzyca_K%C5%82odzka%2C_stare_miasto_11.jpg",
    "n": "2014 Bystrzyca Kłodzka, stare miasto 11",
    "by": "Jacek Halicki",
    "lic": "CC BY-SA 3.0 pl",
    "page": "https://commons.wikimedia.org/wiki/File:2014_Bystrzyca_K%C5%82odzka,_stare_miasto_11.jpg"
   }
  ]
 }
];
