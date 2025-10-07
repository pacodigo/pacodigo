let escuchandoSilbido = true;
let escuchandoVoz = false;

document.addEventListener("DOMContentLoaded", function () {

    /*
    *   Initializations
    */
    // Add a scrollindicator as a loader via nanobar.js
    const nanobar = new Nanobar({ id: "progress-bar"});

    const config = {
        sampleThreshold: 2
    };
    
	
	
	const floater = document.querySelector('#wroll-floater');
    const scrollRelativity = document.querySelectorAll('#scrollRelativity input[name=scrollRelativity]');
    const scrollBehavior = document.querySelectorAll('#scrollBehavior input[name=scrollBehavior]');
    const scrollInversion = document.querySelectorAll('#scrollInversion input[name=scrollInversion]');
    let lastPeakBand = 0;
    let relScrollHeight = window.scrollY;
    let absScrollHeight = window.scrollY;
    let scrollRelativityValue = "relative";
    let scrollBehaviorValue = "smooth";
    let scrollInversionValue = "regular";
    let scrollLength = document.querySelector('#scrollLength');
    let scrollLengthValue = scrollLength.value;
    let whistleScrollAmount = scrollLengthValue !== null ? Number(scrollLengthValue) : 300;
    let whistleRoof = 1950; // Maximum HZ to use as an absolute roof
    let whistleFloor = 600; // Minimum HZ to use as an absolute floor
    let inversionVal = 1;

    const progressBar = document.querySelector('#progress-bar');

    
    //   Event listeners
    
    for(let i = 0; i < scrollRelativity.length; i++){
        scrollRelativity[i].addEventListener('change', function () {
            console.log((this.parentElement.parentElement.getAttribute('data-label') !== null ? this.parentElement.parentElement.getAttribute('data-label') : 'Changed to' ) + ": " + this.value);
            scrollRelativityValue = this.value;
            for( let j = 0; j < this.parentElement.parentElement.children.length; j++){
                this.parentElement.parentElement.children[j].classList.remove('active');
            }
            this.parentElement.classList.add('active');
        }, false);
    }

    for(let i = 0; i < scrollBehavior.length; i++){
        scrollBehavior[i].addEventListener('change', function () {
            console.log((this.parentElement.parentElement.getAttribute('data-label') !== null ? this.parentElement.parentElement.getAttribute('data-label') : 'Changed to') + ": " + this.value);
            scrollBehaviorValue = this.value;
            for (let j = 0; j < this.parentElement.parentElement.children.length; j++) {
                this.parentElement.parentElement.children[j].classList.remove('active');
            }
            this.parentElement.classList.add('active');
        }, false);
    }

    for(let i = 0; i < scrollInversion.length; i++){
        scrollInversion[i].addEventListener('change', function () {
            console.log((this.parentElement.parentElement.getAttribute('data-label') !== null ? this.parentElement.parentElement.getAttribute('data-label') : 'Changed to') + ": " + this.value);
            if (this.value === "inverted") {
                inversionVal = -1;
            }else {
                inversionVal = 1;
            }
            for (let j = 0; j < this.parentElement.parentElement.children.length; j++) {
                this.parentElement.parentElement.children[j].classList.remove('active');
            }
            this.parentElement.classList.add('active');
        }, false);
    }

    scrollLength.addEventListener('input', function (event) {
        event.preventDefault();
        console.log((event.target.getAttribute('data-label') !== null ? event.target.getAttribute('data-label') : 'Changed to') + ": " + event.target.value);
        whistleScrollAmount = Number(event.target.value);
    }, false);

    //document.body.addEventListener("scroll", updateprogressBar);
    document.addEventListener('scroll', function () {
        let scroll = (document.documentElement['scrollTop'] || document.body['scrollTop']) / ((document.documentElement['scrollHeight'] || document.body['scrollHeight']) - document.documentElement.clientHeight) * 100;
        progressBar.style.setProperty('--scroll', scroll + '%');
        nanobar.go(scroll);
    });


    /*
    *   Functions
    */
    // function updateNanobar() {
    //     let absoluteHeight = document.documentElement.scrollTop || document.body.scrollTop;
    //     let windowHeight = document.body.scrollHeight;
    //     nanobar.go( (absoluteHeight / windowHeight) * 100 );
    // }

    // What to return on a relative scroll
    const getRelativeScroll = (peakBand) => {
        let direction = 0;

        // TODO: Take out the difference between lastPeakBand and peakBand and return a percentage of how much to scroll in either direction.
        if (Math.round(peakBand) === 43){
            console.log('⤃\tbackground noise detected.');
        }else if (peakBand > lastPeakBand) {
            console.log('↑\tup\t' + peakBand +'\t>\t'+lastPeakBand);
            direction = 1 * inversionVal;
            lastPeakBand = peakBand;
        }else if (peakBand < lastPeakBand){
            console.log('↓\tdown\t' + peakBand + '\t<\t' + lastPeakBand);
            direction = -1 * inversionVal;
            lastPeakBand = peakBand;
        }else{
            console.log('↔︎\tsame\t' + peakBand +'\t==\t'+lastPeakBand);
            // TODO: Keep the latest direction going on a match.
        }

        return direction;
    };

    // What to return on a absolute scroll
    const getAbsoluteScroll = (peakBand) => {
        //let absoluteHeight = document.documentElement.scrollTop || document.body.scrollTop;
        let whistleFrequency = Math.round( peakBand );
        let whistlePercentage = ( inversionVal === 1 ? (((whistleFrequency - whistleFloor) / (whistleRoof - whistleFloor)) - 1) * -1 : (((whistleFrequency - whistleFloor) / (whistleRoof - whistleFloor))) );
        let windowHeight = document.body.scrollHeight;

        if (whistleFloor < whistleFrequency && whistleFrequency < whistleRoof){
            console.log(`${whistleFloor} HZ < ${whistleFrequency} HZ < ${whistleRoof} HZ`);
            console.log(`\tAbsolute scroll at:\t${Math.round(whistlePercentage * 100)}%`);
            return whistlePercentage * windowHeight;
        }
        return null;
    };

    /*
    *   Main
    */
	


	
	function startRecoSilvido(){
		if (!escuchandoSilbido){
			document.querySelector("#activateAudioContext").click();
			escuchandoSilbido = true;
		}
	}
	
	function stopRecoSilvido(){
		console.log ("stopRecosilvido");
		if (escuchandoSilbido){
			console.log ("aqui");
			escuchandoSilbido = false;
			document.querySelector("#disableAudioContext").click();
			
		/*	
			setTimeout(function(){
				startRecoSilvido();
				console.log ("despues...");
				
				},5*1000);
				
				*/
		}
	}
	
	
	
    whistlerr( (result) => {
		if (escuchandoSilbido){
			console.log ("silbido detectado");
			//escuchandoSilbido= false;
			stopRecoSilvido();
			startRecoVoz();
			
		}
	   //alert("Hola");
		
		//document.querySelector("#disableAudioContext").click();
		//startRecoVoz();
		
		//setTimeout (function(){document.querySelector("#activateAudioContext").click();}, 5*1000);
		
    }, config);
	
	
	
	
	
	//_____ PARTE RECOVOZ ____
	
	
	
	let recognition;
	// Comprobar compatibilidad
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta la API de reconocimiento de voz.");
    } else {
		console.log ("Iniciando SpeechRecognition...");
      recognition = new SpeechRecognition();
      recognition.lang = "es-ES"; 			// idioma español
      recognition.continuous = false; 		// sigue escuchando
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        console.log ("onresult");
		const results = event.results;
        const frase = results[results.length - 1][0].transcript.trim().toLowerCase();
      //  document.getElementById("texto").innerText = "Has dicho: " + frase;
		console.log (frase);
		vozReconocida (frase);
      };

      recognition.onerror = (event) => {
        console.error("Error de reconocimiento: ", event.error);
      };

      recognition.onend = () => {
		console.log ("onend");
		document.body.style.background = "#000000";
		//iniciarEscucharSilbido();
		//document.querySelector("#activateAudioContext").click();
		escuchandoVoz = false;
		startRecoSilvido();
      };	
    }
	
	  function startRecoVoz(){
			if (!escuchandoVoz){
				document.body.style.background = "#ff0000";
				escuchandoVoz = true;
				recognition.start();
			}	
		}
	
	
	// __ PARTE COMANDOS__
	
	function vozReconocida (comando){			// Palabras clave y acciones
        if (comando.includes("uno") || comando.includes("salón")) {
			envioDatos ('EnviaPorRF,24,1000102#');			  
        }
		if (comando.includes("6") || comando.includes("seis") || comando.includes("ambiente")) {	//
			envioDatos   ('EnviaPorRF,24,3342336#');		// Conmuta 6 (rf3off)	
		}
        if (comando.includes("audio") && comando.includes("bluetooth")) {	//if ((comando.includes("6") || comando.includes("seis")) && comando.includes("enciende")){							
			envioDatos   ('rf4on');
			setTimeout (function(){envioDatos('EnviaPorRF,24,1000070#');}, 2*1000);
		}
		if (comando.includes("audio") && comando.includes("ordenador")) {		
			envioDatos('rf4on');
			setTimeout (function(){envioDatos('EnviaPorRF,24,1000050#');}, 2*1000);
		}
		if (comando.includes("audio") && comando.includes("televisión")) {		
			envioDatos('rf4on');
			setTimeout (function(){envioDatos('EnviaPorRF,24,1000060#');}, 2*1000);
		}
		if (comando.includes("audio") && comando.includes("apaga")) {		
			envioDatos('EnviaPorRF,24,1000090#');
			setTimeout (function(){envioDatos('rf4off');}, 5*1000);
		}
		if ((comando.includes("4") || comando.includes("cuatro")) && comando.includes("apaga")){								
			envioDatos('rf4off');
		}
		if ((comando.includes("2") || comando.includes("dos")) && comando.includes("apaga")){								
			envioDatos('rf2off');
		}
		if ((comando.includes("2") || comando.includes("dos")) && comando.includes("enciende")){								
			envioDatos('rf2on');
		}
		if (comando.includes("habitación") || (comando.includes("2") || comando.includes("dos")) && comando.includes("canal")){								
			envioDatos('rf2on');
			setTimeout (function(){envioDatos('rf2off');}, 10*1000);
		}
		
		if (comando.includes("rojo")) {
          document.body.style.background = "red";
        }
        if (comando.includes("negro")) {
          document.body.style.background = "black";
        }
	}
	
	
	function envioDatos (datos){
		let ruta = "http://" + "192.168.1.100" + "/" + datos;
		console.log (ruta);
		fetch(ruta, {
			signal: AbortSignal.timeout(2500),
			method: "GET",
			headers: {"Content-type": "text/html"}
		})
		.then(response => response.text()) 	
		.then(respuesta => {console.log("Resp http: " + respuesta);	})
		.catch(err => {console.log("ERROR: " + err); });
	}
	
	




	
	
	
	
	
	
	
	
	
	
		
});
