
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
 
/*
function generirajPodatke(stPacienta) {
  //ehrId = "";

  // TODO: Potrebno implementirati
  
  switch(stPacienta){
      case 1:
        
        
          
        break;
          
      case 2:
          
        break;
        
      case 3:
          
        break;
  }
  console.log("Generiraj podatke: " + stPacienta);

  //return ehrId;
}
*/

// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija

function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();
	var spol = $('input[name=spol]:checked').val();                 // 1 = moski; 2 = zenska
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
    // za tezo res[i].time, res[i].weight, res[i].unit
    
    preberiEHRodBolnika(ehrId, function(data) {
        //console.log(data.party.firstNames + " " + data.party.lastNames);
        ime = data.party.firstNames;
        priimek = data.party.lastNames;
        letoRojstva = data.party.dateOfBirth.substring(0,4);
        spol = data.party.gender;
        
        
        console.log("shranjeno v js: " + priimek + " " + ime + " Datum: " + letoRojstva + " Spol: " + spol);
        
        preberiTezo(ehrId, function(res){
            teza = res;
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
                        var ITM = tezaZadnja/(visinaZadnja/100)*(visinaZadnja/100);
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
                        vizualizacija();
                    })
                })
        })
    });
}

function vizualizacija() {
    // Modri krog
  	var gauge1 = loadLiquidFillGauge("fillgauge1", 55);
	var config1 = liquidFillGaugeDefaultSettings();
    config1.circleColor = "#FF7777";
    config1.textColor = "#FF4444";
    config1.waveTextColor = "#FFAAAA";
    config1.waveColor = "#FFDDDD";
    config1.circleThickness = 0.2;
    config1.textVertPosition = 0.2;
    config1.waveAnimateTime = 1000;
    
    
    // Rdeči krog
     var gauge2= loadLiquidFillGauge("fillgauge2", 28, config1);
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
    var gauge3 = loadLiquidFillGauge("fillgauge3", 55);
	var config3 = liquidFillGaugeDefaultSettings();
    config3.circleColor = "#FF7777";
    config3.textColor = "#FF4444";
    config3.waveTextColor = "#FFAAAA";
    config3.waveColor = "#FFDDDD";
    config3.circleThickness = 0.2;
    config3.textVertPosition = 0.2;
    config3.waveAnimateTime = 1000;
}

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
                
    $("#starost").html("Vaša starost je <strong><u>" + rezultati.starost + "</u></strong> let.<br>");
    if(spol == "MALE") {
        $("#pricakovanaDoba").html("Pričakovana življenjska doba za moške v vaši državi je <strong><u>" + rezultati.expDobaM + "</u></strong> let.<br>");
    } else {
        $("#pricakovanaDoba").html("Pričakovana življenjska doba za ženske v vaši državi je <strong><u>" + rezultati.expDobaZ + "</u></strong> let.<br>");
    }
    $("#toGo").html("Ostalo vam je še <strong><u>" + rezultati.toGo + "</strong></u> let.<br>");
    $("#deltaLifestyle").html("S <strong>spremembo življenjskega sloga</strong> lahko svojo življenjsko dobo podaljšate za <strong><u>" + (rezultati.odbitekSplosen * (-1)) + "</u></strong> let.<br>");

}

function preberiEHRodBolnika(ehrId, callback) {
	sessionId = getSessionId();
        var globalUser = new Object();
        
    	if (!ehrId || ehrId.trim().length == 0) {
    	    return null;
    	} else {
    		$.ajax({
    			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
    			type: 'GET',
    			headers: {"Ehr-Session": sessionId},
    	    	success: function (data) {
    	    	    
    				//var party = data.party;
    				callback(data);
    			},
    			error: function(err) {
    			    callback(null);
    			}
    		});
     }
}


function preberiTezo(ehrId, callback) {
	sessionId = getSessionId();

	//var ehrId = $("#dodajVitalnoEHRtretjiKorak").val();
	
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


