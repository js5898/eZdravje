
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
// TODO izbira radio buttona se ne deluje!!!
function vnesiIdIzMenija(meniPacientov){
        
        //console.log("MPV2: "+ $("#meniPacientov").val());
        //console.log("Se klice");
        
        switch($("#meniPacientov").val()){
            case '0':
                $("#dodajVitalnoEHRtretjiKorak").val('');
                //TODO $("#kadilec").val("1");
                $("#tedenskaAktivnost").val("");
                $("#enoteAlkoTeden").val("");
                $("#country2").val("Select Country");
                break;
            
            case '1':
                $("#dodajVitalnoEHRtretjiKorak").val(pacientiTab[1].ehrId);
                //TODO $("#kadilec").val("1");
                $("#tedenskaAktivnost").val("2");
                $("#enoteAlkoTeden").val("25");
                $("#country2").val("Slovenia");
                break;
                
            case '2':
                $("#dodajVitalnoEHRtretjiKorak").val(pacientiTab[2].ehrId);
                //TODO $("#kadilec").val("1");
                $("#tedenskaAktivnost").val("0");
                $("#enoteAlkoTeden").val("11");
                $("#country2").val("Zambia");
                break;
                
            case '3':
                $("#dodajVitalnoEHRtretjiKorak").val(pacientiTab[3].ehrId);
                //TODO $("#kadilec").val("1");
                $("#tedenskaAktivnost").val("12");
                $("#enoteAlkoTeden").val("2");
                $("#country2").val("Canada");
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
		                            $("#kreirajSporocilo1").html("<span class='obvestilo " + "label label-success fade-in'>Uspešno kreiran EHR za '" + pacient.firstName + " " + pacient.lastName + "' - " + ehrId + "</span><br>");
		                            break;
		                        case 2:
		                            $("#kreirajSporocilo2").html("<span class='obvestilo " + "label label-success fade-in'>Uspešno kreiran EHR za '" + pacient.firstName + " " + pacient.lastName + "' - " + ehrId + "</span><br>");
		                            break;
		                        case 3:
		                            $("#kreirajSporocilo3").html("<span class='obvestilo " + "label label-success fade-in'>Uspešno kreiran EHR za '" + pacient.firstName + " " + pacient.lastName + "' - " + ehrId + "</span><br>");
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
    	    meritve1_2.diastolicniKrvniTlak= "110";
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
    	    meritve2_1.telesnaTeza= "82";
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



// TODO funkcija za testni vnos meritev - za brisanje
function izpisiIdje(){
    console.log("Prvi: " + pacientiTab[1].firstName + " " + pacientiTab[1].lastName + " " + pacientiTab[1].birthDate + " " + pacientiTab[1].ehrId);
    console.log("Drugi: " + pacientiTab[2].firstName + " " + pacientiTab[2].lastName + " " + pacientiTab[2].birthDate + " " + pacientiTab[2].ehrId);
    console.log("Tretji: " + pacientiTab[3].firstName + " " + pacientiTab[3].lastName + " " + pacientiTab[3].birthDate + " " + pacientiTab[3].ehrId);
}


// TODO - To delete --> Funkcija za GUI vnos meritev
/*
function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();
	var spol = $('input[name=spol]:checked').val();                 // MALE/FEMALE so default ehrscape vrednosti
	console.log("Spol: " + spol);

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
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
		            firstNames: ime,
		            lastNames: priimek,
		            gender: spol,
		            dateOfBirth: datumRojstva,
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
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}


// TODO - To delete - funkcija za vnos meritev vitalnih znakov
function dodajMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	//var merilec = $("#dodajVitalnoMerilec").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
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
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT'
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritveVitalnihZnakovSporocilo").html(
              "<span class='obvestilo label label-success fade-in'>" +
              res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
		    }
		});
	}
}
*/
// TODO - Konec funkcij za brisanje


// Konstante za izracun expected lifestyla

const kadilec = -10;             // Kajenje vec kot 30 let
const overweight = -1;           // ITM 25-29.9
const classIobesity = -3;        // ITM 30-34.9
const classIIobesity = -7;       // ITM 35-39.9
const classIIIobesity = -14;     // ITM 40+
const alcoholPerUnitHazardous = -6;       // 21-50
const alcoholPerUnitHarmful = -12;        // 50+
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
function zdruziPodatke() {
    
    var ehrId = $("#dodajVitalnoEHRtretjiKorak").val();
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
    var expDobaM = 75;
    var expDobaZ = 80;
    var d = new Date();
    var leto = d.getFullYear();
    console.log(leto);
    
    
    console.log(drzava);
    
    preberiEHRodBolnika(ehrId, function(data) {
        
        if(data != null){
        ime = data.party.firstNames;
        priimek = data.party.lastNames;
        letoRojstva = data.party.dateOfBirth.substring(0,4);
        spol = data.party.gender;
        
        
        
        console.log("shranjeno v js: " + priimek + " " + ime + " Datum: " + letoRojstva + " Spol: " + spol);
        
        preberiTezo(ehrId, function(res){
            teza = res;
            // 
            var indeksZadnjeMeritve = (teza.length) - 1;
            tezaZadnja = teza[indeksZadnjeMeritve].weight;
                
            preberiVisino(ehrId, function(res2){
                visina = res2;
                visinaZadnja = visina[indeksZadnjeMeritve].height;
                        
                preberiTlak(ehrId, function(res3){
                        tlak = res3;
                        tlakZadnjiSist = tlak[indeksZadnjeMeritve].systolic;
                        tlakZadnjiDiast = tlak[indeksZadnjeMeritve].diastolic;
                        console.log("TezaZ: " + tezaZadnja + " VisinaZ: " + visinaZadnja + "Zadnji sist: "+tlakZadnjiSist + " Zadnji diast: " + tlakZadnjiDiast);
                        
                        
                        // Nadaljevanje kode --> Parse podatkov iz wikipedije
                            //Parse podatkov iz wikipedije MANJKA!!!
                            
                        // Parse iz wikipedije END
                        
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
                            if(alkoholTeden < 7){
                                odbitekAlkohol = 0;
                            } else if (alkoholTeden < 18){
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
                        
                        //console.log("kadilec: " + jeKadilec*kadilec + " | oITM: " + odbitekITM + " | oAlk: " + odbitekAlkohol + " | oTlak: " + odbitekTlak + " | prSport " + pribitekSport);
                        var odbitekSplosen;
                        odbitekSplosen = (jeKadilec * kadilec) + (odbitekITM) + (odbitekAlkohol) + (odbitekTlak) + (pribitekSport);
                        console.log(odbitekSplosen);
                        
                        var starost = 0;
                        if(!isNaN(letoRojstva)){
                            starost = leto - letoRojstva;
                        }
                        
                        var expectedStarost = 0;
                        if(spol == "MALE"){
                            // TODO preberi iz tabele!
                            expectedStarost = expDobaM;
                            console.log("Pricakovana ZD: " + expDobaM)
                        } else {
                            expectedStarost = expDobaZ;
                            console.log("Pricakovana ZD: " + expDobaZ);
                        }
                        
                        var toGo = expectedStarost + odbitekSplosen - starost;
                        if(toGo < 1){
                            toGo = 1;
                        }
                        
                        if(odbitekSplosen < (-10)){
                            console.log("Critical lifestyle - list predlogov");
                        } else if (odbitekSplosen < -5){
                            console.log("Consider changing lifestyle");
                        } else if (odbitekSplosen < 0){
                            console.log("Your lifestyle is OK");
                        }
                        console.log("Spremenjena ZD glede na lifestyle: " + odbitekSplosen + " Years to go: " + toGo);
                        console.log("Predlogi za izboljšanje življenskega stila");
                        
                        if(jeKadilec == 1) console.log("Prenehajte kaditi");
                        if(odbitekITM < 0) console.log("Vaša telesna teža je previsoka");
                        if(odbitekAlkohol < 0) console.log("Preveč pijete");
                        if(odbitekTlak < 0) console.log("Previsok tlak - posvetujte se z zdravnikom");
                        if(pribitekSport < 3) console.log("Premalo se ukvarjate s športom");
                        
                        
                        
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
                        
                        izpisRezultatov(izpis);
                        console.log("Odbitek splosen zgoraj: "+ odbitekSplosen);
                        
                        var vizData = {
                            seOstaloZivljenja: toGo,
                            odbitekLifestyle: Math.abs(odbitekSplosen),
                            obSpremembi: function(){
                                if(spol == "MALE"){
                                    return expDobaM;
                                } else {
                                    return expDobaZ;
                                }
                            }
                            
                        };
                        
                        vizualizacija(vizData);
                    })
                })
        })
    
    } else {
        console.log("Error - ID ne obstaja");
        $("#kreirajSporociloError").html("<span class='obvestilo " +
      "label label-danger fade-in'>Zahtevani EHR ID ne obstaja</span>");
    }
    });
}


// Izris krogov
function vizualizacija(vizData) {
    // Modri krog
  	var gauge1 = loadLiquidFillGauge("fillgauge1", (vizData.obSpremembi() - vizData.seOstaloZivljenja));
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
    var gauge2= loadLiquidFillGauge("fillgauge2", vizData.odbitekLifestyle, config1);
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
    var gauge3 = loadLiquidFillGauge("fillgauge3", vizData.obSpremembi(), config2);
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
    } else if (rezultati.odbitekSplosen > -4){
        $("#splosnaOcena").html("je <strong>zdrav.</strong>");
    }
                    
    if(rezultati.odbitekAlkohol < 0) $("#alkohol").html("<strong>Zmanjšajte tedenski vnos alkohola. </strong>(<a href='http://www.nalijem.si/o-alkoholu/meje'>Meje za malo tvegano pitje</a>)<br>");
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
    $("#deltaLifestyle").html("S <strong>spremembo življenjskega sloga</strong> lahko svojo življenjsko dobo podaljšate za <strong><u>" + (rezultati.odbitekSplosen * (-1)) + "</u></strong> let.<br>");

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

	//var ehrId = $("#dodajVitalnoEHRtretjiKorak").val();
	
	if(!ehrId || ehrId.trim().length == 0){
	    callback(null);
	} else {
	    // Vrni visino
	    
	    $.ajax({
	        // ehrScape:    /view/{ehrId}/height
			
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