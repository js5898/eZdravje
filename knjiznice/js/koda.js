
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";



/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
 

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */



var pacientiTab = [];               // Global spremenljivka za tabelo pacientov


// Funkcija se iz HTMLja poklice 3× - generirajo se trije default pacienti, ID ostane null, izpolni se ko pride callback iz ehrsapa
function generirajPodatke(stPacienta) {
  
  // Objekt za shranjevanje pacientov - osnovni podatki + EHR id
  var pacient = {
    firstName: null,
    lastName: null,
    birthDate: null,
    gender: null,
    ehrId: null
  };
  
  switch(stPacienta){
      case 1:
        pacient.firstName = "Ata";
        pacient.lastName = "Smrk";
        pacient.birthDate = "1970-06-12T14:37";
        pacient.gender = "MALE";
        pacientiTab[1] = pacient;
        //console.log("Pacient[0]"+ pacientiTab[1].firstName + " " + pacientiTab[1].lastName + " " + pacientiTab[1].ehrId);
        break;
          
      case 2:
        pacient.firstName = "Babica";
        pacient.lastName = "Smrk";
        pacient.birthDate = "1955-02-16T11:37";
        pacient.gender = "FEMALE";
        pacientiTab[2] = pacient;
        //console.log("Pacient[1]"+ pacientiTab[2].firstName + " " + pacientiTab[2].lastName + " " + pacientiTab[2].ehrId);
        break;
        
      case 3:
        pacient.firstName = "Sine";
        pacient.lastName = "Smrk";
        pacient.birthDate = "2000-01-01T00:01";
        pacient.gender = "MALE";
        pacientiTab[3] = pacient;  
        break;
  }
  
    // Klic funkcije za kreiranje kartoteke iz pridobitev EHRidja
    kreirajEHRauto(pacient, stPacienta, function(ehrIdcall){
        if(ehrIdcall != null){
            console.log("stPacienta: " +stPacienta);
            if(stPacienta == 1){
    	        pacientiTab[1].ehrId = ehrIdcall;
    	    } else if (stPacienta == 2) {
    	        pacientiTab[2].ehrId = ehrIdcall;
    	    } else if (stPacienta == 3) {
    	        pacientiTab[3].ehrId = ehrIdcall;
    	    }
    	    
    	    // Pri zadnjem klicu funkcije - ko imajo vsi trije pacienti ze callback z ehridjem, generiraj default podatke
    	    if(pacientiTab[1].ehrId != null && pacientiTab[2].ehrId != null && pacientiTab[3].ehrId != null){
        	    
        	    // Generiraj 3 meritve vitalnih znakov za vsakega pacienta
        	    for(var i = 1; i <= 3; i++){
                    console.log("pacient: " + i + " : " + pacientiTab[i].ehrId);
                    dodajMeritveVitalnihZnakovAuto(i);
                }
                
                // Fill dropdown liste z tremi default pacienti - klice se samo, kadar se klice generiranje podatkov
                fillMenu();
    	    }
        } else {
            $("#kreirajSporociloError").html("<span class='obvestilo label " + "label-warning fade-in'>EHR IDja ni bilo mogoce pridobiti</span>");
        }
    });
  
  //console.log("Generiraj podatke: " + stPacienta + " success");
}

// Fill dropdown liste z tremi default pacienti - klice se samo, kadar se klice generiranje podatkov
    // Sele ko je dolocen pacient selectan iz menija, se klice vnesiIdIzMenija(), ki filla podatke
function fillMenu(){
    $("#meniPacientov").html("<option value='0'></option><option value='1'>Ata Smrk</option><option value='2'>Babica Smrk</option><option value='3'>Sine Smrk</option>");
}


// Izpolni ostala polja obrazca, ko je izbran pacient iz menija - vse, razen EHRidja so konstante
function vnesiIdIzMenija(meniPacientov){
        
        switch($("#meniPacientov").val()){
            case '0':
                $("#dodajVitalnoEHR").val('');
                
                $("#kadilec_da").prop('checked', false);
                $("#kadilec_ne").prop('checked', true);
                $("#tedenskaAktivnost").val("");
                $("#enoteAlkoTeden").val("");
                $("#country2").val("Select Country");
                break;
            
            case '1':
                $("#dodajVitalnoEHR").val(pacientiTab[1].ehrId);
                $("#kadilec_da").prop('checked', true);
                $("#kadilec_ne").prop('checked', false);
                $("#tedenskaAktivnost").val("2");
                $("#enoteAlkoTeden").val("25");
                $("#country2").val("Slovenia");
                break;
                
            case '2':
                $("#dodajVitalnoEHR").val(pacientiTab[2].ehrId);
                $("#kadilec_da").prop('checked', false);
                $("#kadilec_ne").prop('checked', true);
                $("#tedenskaAktivnost").val("0");
                $("#enoteAlkoTeden").val("10");
                $("#country2").val("Japan");
                break;
                
            case '3':
                $("#dodajVitalnoEHR").val(pacientiTab[3].ehrId);
                $("#kadilec_da").prop('checked', false);
                $("#kadilec_ne").prop('checked', true);
                $("#tedenskaAktivnost").val("12");
                $("#enoteAlkoTeden").val("2");
                $("#country2").val("Zambia");
                break;
        }
}


// Dobi podatke o pacientu in stevilko pacienta, v callbacku vrne njegov EHRid, if error - null
function kreirajEHRauto(pacient, stPacienta, callback){
    ehrId = "";
    sessionId = getSessionId();
    //console.log("St pac: " + stPacienta);

	if (!pacient.firstName || !pacient.lastName || !pacient.birthDate || !pacient.gender) {
        console.log("Napaka pri kreiranju pacienta");
		$("#kreirajSporociloError").html("<span class='obvestilo label " + "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: pacient.firstName,
		            lastNames: pacient.lastName,
		            gender: pacient.gender,
		            dateOfBirth: pacient.birthDate,
		            partyAdditionalInfo: [
		                { key: "ehrId", value: ehrId }
		            ]
		            
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    
		                    switch(stPacienta){
		                        case 1: 
		                            $("#kreirajSporocilo1").html("<span class='obvestilo " + "label label-success fade-in'>Uspešno kreiran EHR za '" + pacient.firstName + " " + pacient.lastName + "'</span>");
		                            break;
		                        case 2:
		                            $("#kreirajSporocilo2").html("<span class='obvestilo " + "label label-success fade-in'>Uspešno kreiran EHR za '" + pacient.firstName + " " + pacient.lastName + "'</span>");
		                            break;
		                        case 3:
		                            $("#kreirajSporocilo3").html("<span class='obvestilo " + "label label-success fade-in'>Uspešno kreiran EHR za '" + pacient.firstName + " " + pacient.lastName +"'</span>");
		                    }
		                    
		                    $("#preberiEHRid").val(ehrId);
		                    console.log("Kreiran: " + pacient.firstName + " " + ehrId);
		                    callback(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporociloError").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
                            callback(null);
		            }
		        });
		    }
		});
	}
}


// Avtomatsko generiranje treh meritev za default paciente - napolni se objekt meritve, klice se funkcija vnesi meritve
function dodajMeritveVitalnihZnakovAuto(stPacienta){
    
    var meritve = {
        ehrId: null,
	    datumInUra: null,
	    telesnaVisina: null,
    	telesnaTeza: null,
    	telesnaTemperatura: null,
    	sistolicniKrvniTlak: null,
    	diastolicniKrvniTlak: null,
    	nasicenostKrviSKisikom: null
    };
    
    switch(stPacienta){
        case 1:
            console.log("Pride sem?");
            var meritve1_1 = meritve;
            meritve1_1.ehrId = pacientiTab[stPacienta].ehrId;
	        meritve1_1.datumInUra= "2010-03-12T12:55";
	        meritve1_1.telesnaVisina= "180";
    	    meritve1_1.telesnaTeza= "55";
    	    meritve1_1.telesnaTemperatura= "36";
    	    meritve1_1.sistolicniKrvniTlak= "145";
    	    meritve1_1.diastolicniKrvniTlak= "110";
    	    meritve1_1.nasicenostKrviSKisikom= "98";
    	    vpisiMeritve(stPacienta, meritve1_1);
    	    
            
            var meritve1_2 = meritve;
            meritve1_2.ehrId = pacientiTab[stPacienta].ehrId;
	        meritve1_2.datumInUra= "2012-03-12T12:55";
	        meritve1_2.telesnaVisina= "180";
    	    meritve1_2.telesnaTeza= "65";
    	    meritve1_2.telesnaTemperatura= "37";
    	    meritve1_2.sistolicniKrvniTlak= "125";
    	    meritve1_2.diastolicniKrvniTlak= "90";
    	    meritve1_2.nasicenostKrviSKisikom= "98";
    	    vpisiMeritve(stPacienta, meritve1_2);
    	    
            var meritve1_3 = meritve;
            meritve1_3.ehrId = pacientiTab[stPacienta].ehrId;
	        meritve1_3.datumInUra= "2016-03-12T12:55";
	        meritve1_3.telesnaVisina= "180";
    	    meritve1_3.telesnaTeza= "105";
    	    meritve1_3.telesnaTemperatura= "35";
    	    meritve1_3.sistolicniKrvniTlak= "160";
    	    meritve1_3.diastolicniKrvniTlak= "130";
    	    meritve1_3.nasicenostKrviSKisikom= "98";
    	    vpisiMeritve(stPacienta, meritve1_3);
            
            break;
            
        case 2:
            var meritve2_1 = meritve;
            console.log("Pride sem - switch");
            meritve2_1.ehrId = pacientiTab[stPacienta].ehrId;
	        meritve2_1.datumInUra= "2011-04-22T12:55";
	        meritve2_1.telesnaVisina= "155";
    	    meritve2_1.telesnaTeza= "92";
    	    meritve2_1.telesnaTemperatura= "34";
    	    meritve2_1.sistolicniKrvniTlak= "150";
    	    meritve2_1.diastolicniKrvniTlak= "90";
    	    meritve2_1.nasicenostKrviSKisikom= "97";
    	    vpisiMeritve(stPacienta, meritve2_1);
    	    
            var meritve2_2 = meritve;
            meritve2_2.ehrId = pacientiTab[stPacienta].ehrId;
	        meritve2_2.datumInUra= "2013-05-23T12:44";
	        meritve2_2.telesnaVisina= "154";
    	    meritve2_2.telesnaTeza= "75";
    	    meritve2_2.telesnaTemperatura= "36";
    	    meritve2_2.sistolicniKrvniTlak= "130";
    	    meritve2_2.diastolicniKrvniTlak= "90";
    	    meritve2_2.nasicenostKrviSKisikom= "97";
    	    vpisiMeritve(stPacienta, meritve2_2);
    	    
            var meritve2_3 = meritve;
            meritve2_3.ehrId = pacientiTab[stPacienta].ehrId;
	        meritve2_3.datumInUra= "2016-05-23T12:44";
	        meritve2_3.telesnaVisina= "152";
    	    meritve2_3.telesnaTeza= "56";
    	    meritve2_3.telesnaTemperatura= "35.5";
    	    meritve2_3.sistolicniKrvniTlak= "120";
    	    meritve2_3.diastolicniKrvniTlak= "90";
    	    meritve2_3.nasicenostKrviSKisikom= "97";
    	    vpisiMeritve(stPacienta, meritve2_3);
            
            break;
        
        case 3:
            var meritve3_1 = meritve;
            meritve3_1.ehrId = pacientiTab[stPacienta].ehrId;
	        meritve3_1.datumInUra= "2011-05-23T12:44";
	        meritve3_1.telesnaVisina= "160";
    	    meritve3_1.telesnaTeza= "50";
    	    meritve3_1.telesnaTemperatura= "37.8";
    	    meritve3_1.sistolicniKrvniTlak= "130";
    	    meritve3_1.diastolicniKrvniTlak= "90";
    	    meritve3_1.nasicenostKrviSKisikom= "100";
    	    vpisiMeritve(stPacienta, meritve3_1);
            
            var meritve3_2 = meritve;
            meritve3_2.ehrId = pacientiTab[stPacienta].ehrId;
	        meritve3_2.datumInUra= "2014-09-28T12:44";
	        meritve3_2.telesnaVisina= "175";
    	    meritve3_2.telesnaTeza= "59";
    	    meritve3_2.telesnaTemperatura= "36.4";
    	    meritve3_2.sistolicniKrvniTlak= "131";
    	    meritve3_2.diastolicniKrvniTlak= "90";
    	    meritve3_2.nasicenostKrviSKisikom= "100";
    	    vpisiMeritve(stPacienta, meritve3_2);
    	    
            var meritve3_3 = meritve;
            meritve3_3.ehrId = pacientiTab[stPacienta].ehrId;
	        meritve3_3.datumInUra= "2016-09-28T12:44";
	        meritve3_3.telesnaVisina= "180";
    	    meritve3_3.telesnaTeza= "65";
    	    meritve3_3.telesnaTemperatura= "36.3";
    	    meritve3_3.sistolicniKrvniTlak= "135";
    	    meritve3_3.diastolicniKrvniTlak= "90";
    	    meritve3_3.nasicenostKrviSKisikom= "100";
    	    vpisiMeritve(stPacienta, meritve3_3);
            
            break;
    }
}


// Funkcija, ki bere meritve iz objekta meritve in jih avtomatsko vpiše pacientom glede na njihov ID
function vpisiMeritve(stPacienta, meritve){
    sessionId = getSessionId();
    if (!meritve.ehrId || meritve.ehrId.trim().length == 0) {
		$("#kreirajSporociloError").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
      // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": meritve.datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": meritve.telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": meritve.telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": meritve.telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": meritve.sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": meritve.diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": meritve.nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    ehrId: meritve.ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT'
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		      //$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
              console.log("Uspesen vnos meritev");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		    }
		});
	}
}



// Konstante za izracun expected lifestyla

const kadilec = -10;             // Kajenje vec kot 30 let
const overweight = -1;           // ITM 25-29.9
const classIobesity = -3;        // ITM 30-34.9
const classIIobesity = -7;       // ITM 35-39.9
const classIIIobesity = -14;     // ITM 40+
const alcoholPerUnitHazardous = -6;       //
const alcoholPerUnitHarmful = -12;        //
const tlakS1 = -2.5;   
const tlakS2 = -5;
const uraSportaNaTeden = 1.5;

/*
Systolic: Stage 1 = 140-159     Stage 2 = 160+     
Diastolic: Stage 1 = 90-99      Stage 2 = 100+
*/


// Izracun lifestyla - klice funkcije za branje dolocenih podatkov glede na EHR ID
    // Kreira objekt izpis, ga poslje funkciji za GUI izpis
    // Kreira objekt vizualizacija, poslje ga funkciji za vizualizacjo
var globalEhrId = null;    
    
function analizirajZivSlog() {
    
    $("#izpisiMeritve").val($("#izpisiMeritve option:first").val());
    $('#poljeZaIzpisTabele').html('<i>Iz menija na desni izberite merive, ki jih želite izpisati</i>');
    
    var ehrId = $("#dodajVitalnoEHR").val();
    var jeKadilec = $('input[name=kadilec]:checked').val();             // Returns 0/1
    var tedenskaAktivnost = $("#tedenskaAktivnost").val();
    var alkoholTeden = $("#enoteAlkoTeden").val();
    var drzava = $("#country2").val();
    var ime;
    var priimek;
    var letoRojstva;
    var spol;
    var teza;
    var tezaZadnja;
    var visina;
    var visinaZadnja;
    var tlak;
    var tlakZadnjiSist;
    var tlakZadnjiDiast;
    var expDobaM = null;
    var expDobaZ = null;
    var d = new Date();
    var leto = d.getFullYear();
    console.log(leto);
    var toGo;
    var i;
    console.log("Select country return: " + drzava);
    globalEhrId = ehrId;
    
    
   if (!ehrId || ehrId.trim().length == 0 || !tedenskaAktivnost || tedenskaAktivnost.trim().length == 0 || drzava == "-1") {
		$("#kreirajSporociloVnos").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
      return;
	}
    
    $("#kreirajSporociloVnos").html("<span class='obvestilo " +
      "label label-warning fade-in'></span>");
    
    // Dobi EHR ID in osnovne podatke
    preberiEHRodBolnika(ehrId, function(data) {
        
        if(data != null){
            ime = data.party.firstNames;
            priimek = data.party.lastNames;
            letoRojstva = data.party.dateOfBirth.substring(0,4);
            spol = data.party.gender;
        
            // Vrne tabelo meritev teze
            preberiTezo(ehrId, function(res){
                if(res == null){
                    	$("#kreirajSporociloVnos").html("<span class='obvestilo " +
                        "label label-warning fade-in'>Za izbranega pacienta ni dostopnih podatkov meritev, zato izračun ni mogoč.</span>");
                        return;
                }
                    
                teza = res;
                var indeksZadnjeMeritve = (teza.length) - 1;
                tezaZadnja = teza[indeksZadnjeMeritve].weight;
                
                // Vrne tabelo meritev visine    
                preberiVisino(ehrId, function(res2){
                    if(res2 == null){
                    	$("#kreirajSporociloVnos").html("<span class='obvestilo " +
                        "label label-warning fade-in'>Za izbranega pacienta ni dostopnih podatkov meritev, zato izračun ni mogoč.</span>");
                        return;
                    }
                    
                    visina = res2;
                    indeksZadnjeMeritve = (visina.length) - 1;
                    visinaZadnja = visina[indeksZadnjeMeritve].height;
                    
                    // Vrne tabelo meritev tlaka        
                    preberiTlak(ehrId, function(res3){
                        if(res3 == null){
                        	$("#kreirajSporociloVnos").html("<span class='obvestilo " +
                            "label label-warning fade-in'>Za izbranega pacienta ni dostopnih podatkov meritev, zato izračun ni mogoč.</span>");
                            return;
                        }   
                        
                            tlak = res3;
                            indeksZadnjeMeritve = (tlak.length) - 1;
                            tlakZadnjiSist = tlak[indeksZadnjeMeritve].systolic;
                            tlakZadnjiDiast = tlak[indeksZadnjeMeritve].diastolic;
                            
                            
                        if(tableParsed != "err"){    
                            var match = false;
                            for(var i in tableData){
                                if(tableData[i].country == drzava){
                                    console.log("Succes - country found: " + tableData[i].country);
                                    expDobaM = tableData[i].maleLifeExpectancy;
                                    expDobaZ = tableData[i].femaleLifeExpectancy;
                                    match = true;
                                    break;
                                }
                            }
                            
                            if(match == false){
                                if(tableParsed == false){
                                    $("#kreirajSporociloVnos").html("<span class='obvestilo " +
                                    "label label-info fade-in'>Podatki iz zunanjega vira se še niso posodobili. Počakajte trenutek in ponovno izberite 'Analiziraj življenjski slog'</span>");
                                } else {
                                    $("#kreirajSporociloVnos").html("<span class='obvestilo " +
                                    "label label-info fade-in'>Za izbrano državo ni podatkov, zato izračun ni bil mogoč. Prosimo izberite drugo državo.</span>");
                                }                           
                                return;
                            }
                        } else {
                            expDobaM = 73;
                            expDobaZ = 76;
                        }
                        
                            $('#pregledPacient').html('Pregled <b>življenjskega sloga </b>za <strong><u>' + ime + " " + priimek + "</strong></u>");
                           // document.getElementById("pregledPacient").value("Pregled <b>življenjskega sloga </b>in <strong>rezultati.</strong>");
                            //document.getElementById("osveziStran").style.display = 'inline';
                                
                                //expDobaM = res4.maleLifeExpectancy;
                                //expDobaZ = res4.femaleLifeExpectancy;
                                //console.log("DobaM:" + expDobaM);    
                                // Parse iz wikipedije END
                                if(spol == "MALE" || spol == "FEMALE"){
                                   console.log("Spol izbran");
                                } else {
                                    if($('input[name=spol]:checked').val() == 0){
                                        spol = "MALE";
                                    } else if($('input[name=spol]:checked').val() == 1){
                                        spol = "FEMALE";
                                    } else {
                                        spol = "MALE";
                                        $("#kreirajSporociloVnos").html("<span class='obvestilo " +
                                        "label label-warning fade-in'>Za pacienta ni podatkov o spolu - avtomatsko je bil izbran moški spol.</span>");
                                    }
                                }
                                
                                // Izracun zivljenjske dobe
                                var ITM = tezaZadnja/((visinaZadnja/100)*(visinaZadnja/100));
                                var odbitekITM;
                                if(ITM < 25){
                                    odbitekITM = 0;
                                } else if (ITM < 30) {
                                    odbitekITM = overweight;
                                } else if (ITM < 35) {
                                    odbitekITM = classIobesity;
                                } else if (ITM < 40) {
                                    odbitekITM = classIIobesity
                                } else {
                                    odbitekITM = classIIIobesity;
                                }
                                
                                var odbitekAlkohol;
                                if(spol == "MALE"){
                                    if(alkoholTeden < 10){
                                        odbitekAlkohol = 0;
                                    } else if (alkoholTeden < 25){
                                        odbitekAlkohol = alcoholPerUnitHazardous;
                                    } else {
                                        odbitekAlkohol = alcoholPerUnitHarmful;
                                    }
                                } else {
                                    if(alkoholTeden < 6){
                                        odbitekAlkohol = 0;
                                    } else if (alkoholTeden < 12){
                                        odbitekAlkohol = alcoholPerUnitHazardous;
                                    } else {
                                        odbitekAlkohol = alcoholPerUnitHarmful;
                                    }
                                }
                                
                                var odbitekTlak = 0;
                                if(tlakZadnjiSist > 160){
                                    odbitekTlak -= 2;
                                } else if (tlakZadnjiSist > 140){
                                    odbitekTlak -= 1;
                                }
                                
                                if(tlakZadnjiDiast > 100){
                                    odbitekTlak -= 2;
                                } else if (tlakZadnjiDiast > 90){
                                    odbitekTlak -= 1;
                                }
                                
                                var pribitekSport = (tedenskaAktivnost * uraSportaNaTeden);
                                if(pribitekSport > 10){
                                    pribitekSport = 10;
                                }
                                
                                var odbitekSplosen;
                                odbitekSplosen = (jeKadilec * kadilec) + (odbitekITM) + (odbitekAlkohol) + (odbitekTlak) + (pribitekSport);
                                console.log(odbitekSplosen);
                                
                                // Ce zdravo zivi : odbitek +, sicer odbitek -
                                var starost = 0;
                                if(!isNaN(letoRojstva)){
                                    starost = leto - letoRojstva;
                                }
                                
                                var expectedStarost = 0;
                                if(spol == "MALE"){
                                    expectedStarost = expDobaM;
                                    console.log("Pricakovana ZD(Moski): " + expDobaM)
                                } else {
                                    expectedStarost = expDobaZ;
                                    console.log("Pricakovana ZD(Zenske): " + expDobaZ);
                                }
                                
                                
                                toGo = expectedStarost - starost + odbitekSplosen;          // Ce je ToGo
                                if(toGo < 1){
                                    toGo = 1;
                                }
                                
                                if(odbitekSplosen < (-10)){
                                    console.log("Critical lifestyle - list predlogov");
                                } else if (odbitekSplosen < -5){
                                    console.log("Consider changing lifestyle");
                                } else {
                                    console.log("Your lifestyle is OK");
                                }
                                console.log("Spremenjena ZD glede na lifestyle: " + odbitekSplosen + " Years to go: " + toGo);
                                console.log("Predlogi za izboljšanje življenjskega stila");
                                
                                if(jeKadilec == 1) console.log("Prenehajte kaditi");
                                if(odbitekITM < 0) console.log("Vaša telesna teža je previsoka");
                                if(odbitekAlkohol < 0) console.log("Preveč pijete");
                                if(odbitekTlak < 0) console.log("Previsok tlak - posvetujte se z zdravnikom");
                                if(pribitekSport < 3) console.log("Premalo se ukvarjate s športom");
                                
                                
                                
                                // Kreira objekt za izpis na strani
                                var izpis = {
                                    jeKadilec:jeKadilec,
                                    odbitekSplosen: odbitekSplosen,
                                    odbitekITM: odbitekITM,
                                    odbitekAlkohol: odbitekAlkohol,
                                    odbitekTlak: odbitekTlak,
                                    spol: spol,
                                    starost: starost,
                                    expDobaM: expDobaM,
                                    expDobaZ: expDobaZ,
                                    toGo: toGo
                                };
                                
                                // Izpis na strani
                                izpisRezultatov(izpis);
                                
                                // Kreira objekt za vizualizacijo
                                
                                var vizData = {
                                    prvi: starost + toGo,
                                    drugi: function(){
                                        if(odbitekSplosen < 0) return Math.abs(odbitekSplosen);
                                        else return 0;
                                    },
                                    tretji: expectedStarost
                                };
                                
                                // Vizualizacija
                                $('#fillgauge1').html('');
                                $('#fillgauge2').html('');
                                $('#fillgauge3').html('');
                                vizualizacija(vizData);
                                
                        })              // Konec preberi tlak callbacka
                    })                  // Konec preberi visino callbacka
                });                      // Konec preberi tezo callbacka
    
                        
        } else {
            
            // Izpis ce je napaka na EHRidju
            console.log("Error - ID ne obstaja");
            $("#kreirajSporociloVnos2").html("<span class='obvestilo " +
            "label label-danger fade-in'>Zahtevani EHR ID ne obstaja</span>");
        }
    });     
}


// Izris krogov
function vizualizacija(vizData) {
    // Modri krog
  	var gauge1 = loadLiquidFillGauge("fillgauge1", vizData.prvi);
	
	var config1 = liquidFillGaugeDefaultSettings();
    config1.circleColor = "#FF7777";
    config1.textColor = "#FF4444";
    config1.waveTextColor = "#FFAAAA";
    config1.waveColor = "#FFDDDD";
    config1.circleThickness = 0.2;
    config1.textVertPosition = 0.2;
    config1.waveAnimateTime = 1000;
    config1.displayPercent = false;
    // Rdeči krog
    console.log("Viz data - odb lifestyle: "+ vizData.odbitekLifestyle);
    var gauge2= loadLiquidFillGauge("fillgauge2", vizData.drugi(), config1);
    
    var config2 = liquidFillGaugeDefaultSettings();
    config2.circleColor = "#D4AB6A";
    config2.textColor = "#553300";
    config2.waveTextColor = "#805615";
    config2.waveColor = "#AA7D39";
    config2.circleThickness = 0.1;
    config2.circleFillGap = 0.2;
    config2.textVertPosition = 0.8;
    config2.waveAnimateTime = 2000;
    config2.waveHeight = 0.3;
    config2.waveCount = 1;
    
    // Zeleni krog
    var gauge3 = loadLiquidFillGauge("fillgauge3", vizData.tretji, config2);
	var config3 = liquidFillGaugeDefaultSettings();
    config3.circleColor = "#33CC59";
    config3.textColor = "#FF4444";
    config3.waveTextColor = "#FFAAAA";
    config3.waveColor = "#33CC33";
    config3.circleThickness = 0.2;
    config3.textVertPosition = 0.2;
    config3.waveAnimateTime = 1000;
}


// Izpis rezultatov
function izpisRezultatov(rezultati){
    $("#rezulati").slideDown();
                        
    if(rezultati.jeKadilec == 1) $("#kajenje").html("Kajenje je izredno škodljivo. Čim prej prenehajte kaditi.<br>");
                
    if(rezultati.odbitekSplosen < (-10)){
        $("#splosnaOcena").html("je <strong><u>izjemno škodljiv</u> za vaše zdravje.</strong>");
    } else if (rezultati.odbitekSplosen < -5){
        $("#splosnaOcena").html("je <strong>mogoče še izboljšati.</strong>");
    } else {
        $("#splosnaOcena").html("je <strong>zdrav.</strong>");
    }
                    
    if(rezultati.odbitekAlkohol < 0) $("#alkohol").html("<strong>Zmanjšajte tedenski vnos alkohola. </strong>(<a href='http://www.nalijem.si/o-alkoholu/meje' target='_blank'>Meje za malo tvegano pitje</a>)<br>");
    if(rezultati.odbitekITM < 0) $("#ITM").html("Vaša telesna teža je <strong>previsoka.</strong> Razmislite o spremembi prehrane.<br>");
    if(rezultati.odbitekTlak < 0) $("#tlak").html("Vaš krvni tlak je <strong>previsok.</strong> Posvetujte se z zdravnikom.<br>");
    if(rezultati.pribitekSport < 3) $("#sport").html("Tedensko se <strong>premalo</strong> ukvarjate s športom.<br>");
                
    $("#starost").html("Vaša starost je <strong><u>" + rezultati.starost + "</u></strong> let.<br>S trenutnim življenjskim slogom boste dočakali <strong><u>" + (rezultati.starost + rezultati.toGo) +"</strong></u> let.<br>");
    if(rezultati.spol == "MALE") {
        $("#pricakovanaDoba").html("Pričakovana življenjska doba za moške v vaši državi je <strong><u>" + rezultati.expDobaM + "</u></strong> let.<br>");
    } else {
        $("#pricakovanaDoba").html("Pričakovana življenjska doba za ženske v vaši državi je <strong><u>" + rezultati.expDobaZ + "</u></strong> let.<br>");
    }
    $("#toGo").html("Ostalo vam je še <strong><u>" + rezultati.toGo + "</strong></u> let.<br>");
    if(rezultati.spol == "MALE" && rezultati.starost > rezultati.expDobaM){
        $("#deltaLifestyle").html("Vaša starost je <strong>višja od pričakovane življenjske dobe za moške v vaši državi.</strong><br>");
    } else if (rezultati.spol == "FEMALE" && rezultati.starost > rezultati.expDobaZ) {
        $("#deltaLifestyle").html("Vaša starost je <strong>višja od pričakovane življenjske dobe za ženske v vaši državi.</strong><br>");
    } else if(rezultati.odbitekSplosen < 0){
        $("#deltaLifestyle").html("<strong>Nezdrav življenjski slog</strong> je vašo pričakovano življenjsko dobo <strong> znižal</strong> za <strong><u>" + Math.abs(rezultati.odbitekSplosen) + "</u></strong> let.<br>");
    }
}

// Dobi EHRid, vrne osnovne podatke o bolniku
function preberiEHRodBolnika(ehrId, callback) {
	sessionId = getSessionId();
        var globalUser = new Object();
        
    	if (!ehrId || ehrId.trim().length == 0) {
    	     $("#kreirajSporociloError").html("<span class='obvestilo " +
                "label label-warning fade-in'>Vnesite EHRid</span>");
    	    return null;
    	    
    	} else {
    		$.ajax({
    			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
    			type: 'GET',
    			headers: {"Ehr-Session": sessionId},
    	    	success: function (data) {
    				callback(data);
    			},
    			error: function(err) {
    			    
                    callback(null);
    			}
    		});
     }
}

// Vrne tabelo teze - za izracune
function preberiTezo(ehrId, callback) {
	sessionId = getSessionId();

	if(!ehrId || ehrId.trim().length == 0){
	    callback(null);
	} else {
	    // Telesna teza
	    $.ajax({
			url: baseUrl + "/view/" + ehrId + "/" + "weight",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (res) {
			    if (res.length > 0) {
					callback(res);
				} else {
					callback(null); 
			    }
			},
			error: function() {
				callback(null);	    	
			}
		});
	}
}

// Vrne tabelo visin - za izracune
function preberiVisino(ehrId, callback) {
	sessionId = getSessionId();

	if(!ehrId || ehrId.trim().length == 0){
	    callback(null);
	} else {
	    // Vrni visino
	    
	    $.ajax({
			
			url: baseUrl + "/view/" + ehrId + "/" + "height",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (res) {
			    if (res.length > 0) {
			        //var output = res;
					callback(res);
				} else {
					callback(null); 
			    }
			},
			error: function() {
				callback(null);	    	
			}
		});
	}
}

// Vrne tabelo tlaka - za izracune
function preberiTlak(ehrId, callback){
    sessionId = getSessionId();

	if(!ehrId || ehrId.trim().length == 0){
	    callback(null);
	} else {
	    // Vrni sistolicni tlak
	    
	    $.ajax({
	        // ehrScape:    /view/{ehrId}/height
			
			url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (res) {
			    if (res.length > 0) {
			        var output = res;
					callback(res);
				} else {
					callback(null); 
			    }
			},
			error: function() {
				callback(null);	    	
			}
		});
	}
}

var tableData = [];
var maleTest;
var femaleTest;
var tableParsed = false;

$(document).ready(function() {
    //$('#country2').on('change', function() {
        parse();
    //});
});

// Funkcija za pridobivanje podatkov iz tabele
//function parse(drzava, callback){
function parse(){
			var htmlFrame = $("#htmlFrame")[0]; // htmlFrame zaradi CORSA!
            //var drzava = "Canada";

			var cURL = "https://en.wikipedia.org/wiki/List_of_countries_by_life_expectancy";     // Povezava na wiki page
			console.log("Calling URL:" + cURL);
			
			$.ajax({
					url: "https://crossorigin.me/" + cURL, // CORS!
					type: 'GET',
					crossDomain: true,
					dataType: 'html',
					success: function( htmlContent ) { 
						//console.log( htmlContent );
						
						var parser = new DOMParser(); // string v DOMParser da pobere podatke
						var doc = parser.parseFromString( htmlContent, "text/html");  // DOM kreiran
						if (!doc){
							alert("Napaka HTML fila");
							return;
						}
						
						var body = doc.body;
						if (!body){
							alert("Stran brez bodyja");
							return;
						}
						
						var table = body.getElementsByTagName("table")[0]; // Najdi prvo tablo na strani
						if (!table){
							alert("Na strani ni tabele");
					        return;
						}
					
						var tableLines = doc.evaluate('tbody/tr', table, null, XPathResult.ANYTYPE, null); // XPath
						if (tableLines.resultType != XPathResult.UNORDERED_NODE_ITERATOR_TYPE){
							alert("Tabela nima vrstic");
							return;
						}
						
						//var tableData = [];     // tabela za objekte 
						var tableRow;
						while ( tableRow = tableLines.iterateNext()){
							if (!tableRow) // zadnja vrstica - success!
								break; 
							
							
							if (tableRow.cells.length != 7) 
								continue;
							
							if (tableRow.cells[0].innerText == "Country")  // izpusti header tabele - ce je prvo polje Country, potem je to header...
								continue;
							
							var obj = { 												
								country : tableRow.cells[0].innerText.trim(),           // ?na zacetku vedno presledek
								overallRank : tableRow.cells[1].innerText,
								overallLifeExpectancy : tableRow.cells[2].innerText,
								femaleRank : tableRow.cells[3].innerText,
								femaleLifeExpectancy : tableRow.cells[4].innerText,
								maleRank : tableRow.cells[5].innerText,
								maleLifeExpectancy : tableRow.cells[6].innerText,
							};
							
							tableData.push(obj); // dodaj objekt v array
						}
						
						console.log(tableData);
						console.log("Success, najdenih " + tableData.length + " vrstic.");      
						$("#kreirajSporociloZunanjiVir").html("<span class='obvestilo " +
                        "label label-success fade-in'>Uspešno pridobljeni podatki iz zunanjega vira</span>");
						tableParsed = true;
						
						
						//parseError();
						//console.log("Testni izpis" + tableData[13].country);
						
						
					    //var testnaDrzava = "Canada";
					},
					
					error: function() {
					    $("#kreirajSporociloError").html("<span class='obvestilo label " +
                        "label-warning fade-in'>Napaka strežnika pri pridobivanju podatkov (Napaka 5xx). Uporabljena bo lokalna kopija podatkovnega vira.</span>");
                        tableParsed = "err";
                        parseError();
					    //alert('Loading requested page failed!'); 
					    //callback(null);
					}
			});
}


// Dodano, se ne dela
function parseError(){
    
    //var myVar = '';
    $.get('drzave.html', function(data) {					
    	var parser = new DOMParser(); // string v DOMParser da pobere podatke
    	var doc = parser.parseFromString(data, "text/html");  // DOM kreiran
    	if (!doc){
    		alert("Napaka HTML fila");
    		return;
    	}
    	
    	var body = doc.body;
    	if (!body){
    		alert("Stran brez bodyja");
    		return;
    	}
    	
    	var table = body.getElementsByTagName("table")[0]; // Najdi prvo tablo na strani
    	if (!table){
    		alert("Na strani ni tabele");
    		return;
    	}
    	var tableLines = doc.evaluate('tbody/tr', table, null, XPathResult.ANYTYPE, null); // XPath
    	if (tableLines.resultType != XPathResult.UNORDERED_NODE_ITERATOR_TYPE){
    		alert("Tabela nima vrstic");
    		return;
    	}
    	
    	//var tableData = [];     // tabela za objekte 
    	var tableRow;
    	while ( tableRow = tableLines.iterateNext()){
    		if (!tableRow) // zadnja vrstica - success!
    			break; 
    		
    		
    		if (tableRow.cells.length != 7) 
    			continue;
    		
    		if (tableRow.cells[0].innerText == "Country")  // izpusti header tabele - ce je prvo polje Country, potem je to header...
    			continue;
    		
    		var obj = { 												
    			country : tableRow.cells[0].innerText.trim(),           // ?na zacetku vedno presledek
    			overallRank : tableRow.cells[1].innerText,
    			overallLifeExpectancy : tableRow.cells[2].innerText,
    			femaleRank : tableRow.cells[3].innerText,
    			femaleLifeExpectancy : tableRow.cells[4].innerText,
    			maleRank : tableRow.cells[5].innerText,
    			maleLifeExpectancy : tableRow.cells[6].innerText,
    		};
    		
    		tableData.push(obj); // dodaj objekt v array
    	}
    	
    	//console.log(tableData);
    	console.log("Success, najdenih " + tableData.length + " vrstic.");      
    	$("#kreirajSporociloZunanjiVir").html("<span class='obvestilo " +
        "label label-success fade-in'>Uspešno pridobljeni podatki iz lokalne kopije podatkovnega vira</span>");
    	tableParsed = true;
    });
	
	//console.log("Testni izpis" + tableData[13].country);
	
	
    //var testnaDrzava = "Canada";
}


	// 1=teza, 2=visina, 3=ITM, 4 = tlak
	    // Dodatna master-detail funkcionalnost
function izpisiTabeloMeritev(){
    
    
    var value = $("#izpisiMeritve").val().trim();
    console.log("Value iz tabele meritev: " + value);
    var tabelaTez;
    var tabelaVisin;
    
    
    if(value == 1 && globalEhrId != null){
        preberiTezo(globalEhrId, function(res){
            console.log("Res.length= " + res.length);
            
            if (res.length > 0) {
			    var results = "<table class='table table-striped " + "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna teža</th></tr>";
				for (var i in res) {
					results += "<tr><td>" + res[i].time +
                      "</td><td class='text-right'>" + res[i].weight + " " 	+
                      res[i].unit + "</td>";
				}
				results += "</table>";
				$("#poljeZaIzpisTabele").val("");
			    $("#poljeZaIzpisTabele").html("").append(results);
            }
            
        });
    } else if (value == 2 && globalEhrId != null) {
        preberiVisino(globalEhrId, function(res){
            console.log("Visina.length: " + res.length);
        
        if (res.length > 0) {
			    var results = "<table class='table table-striped " + "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna višina</th></tr>";
				for (var i in res) {
					results += "<tr><td>" + res[i].time +
                      "</td><td class='text-right'>" + res[i].height + " " 	+
                      res[i].unit + "</td>";
				}
				results += "</table>";
				
			    $("#poljeZaIzpisTabele").html("").append(results);
            }    
        });
    } else if (value == 3 && globalEhrId != null) {
        preberiTezo(globalEhrId, function(res){
            tabelaTez = res;
            
            preberiVisino(globalEhrId, function(res1){
                tabelaVisin = res1;
                
                
                var tabelaITM = [];
                for(var i in tabelaVisin){
                    tabelaITM[i] = ((tabelaTez[i].weight)/((tabelaVisin[i].height/100)*(tabelaVisin[i].height/100))).toFixed(1);
                }
                
                if (tabelaITM.length > 0) {
			    var results = "<table class='table table-striped " + "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-center'>ITM</th>" + "<th class='text-right'>Opis</th></tr>";
                    
				for (var i in tabelaITM) {
				    var itm = tabelaITM[i];
				    var izpis;
				    if(itm < 18.5){
				        izpis = "<b><u>Podhranjenost</b></u>";
				    } else if (itm < 24.9){
				        izpis = "Normalna teža";
				    } else if (itm < 29.9){
				        izpis = "<b><u>Prekomerna telesna teža</b></u>";
				    } else if (itm < 34.9){
				        izpis = "<b><u>Debelost I. stopnje</b></u>";
				    } else if (itm < 39.9){
				        izpis = "<b><u>Debelost II. stopnje</b></u>";
				    } else {
				        izpis = "<b><u>Debelost III. stopnje</b></u>";
				    }
				    
				    
					results += "<tr><td>" + tabelaTez[i].time +
                      "</td><td class='text-center'>" + tabelaITM[i] + "</td><td class='text-right'><i>" + izpis + "</i></td>";
				}
				
				results += "</table>";
			    $("#poljeZaIzpisTabele").html("").append(results);
            }    
                
            })
        });
    } else if (value == 4 && globalEhrId != null){
        preberiTlak(globalEhrId, function(res4){
            if (res4.length > 0) {
                var izpis;
                
			    var results = "<table class='table table-striped " + "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Diastolični/sistolični</th></tr>";
				for (var i in res4) {
				    var sis = res4[i].systolic;
				    var dia = res4[i].diastolic;
				    
				    if(dia < 95 && sis < 140){
				        izpis = dia + "/" + sis;
				    } else {
				        izpis = "<b><u>" + dia + "/" + sis + "</b></u>";
				    }
				    
					results += "<tr><td>" + res4[i].time +
                      "</td><td class='text-right'>" + izpis + "</td>";
				}
				results += "</table>";
				
			    $("#poljeZaIzpisTabele").html("").append(results);
            }    
        });
    } else if (globalEhrId == null){
        $("#poljeZaIzpisTabele").html("").val("Napaka EHR IDja. Osvežite stran in poskusite znova.");
    }
}


