/*
Versión 2:		Devuelve también la frecuencia dominante del silbido. Interesante para saber si > o < de 1000Hz


*/

/**
 * Whistle Detector Library
 * Based on "Human Whistle Detection and Frequency Estimation" by M. Nilsson et al.
 * Consolidated by request
 * License: MIT
 */

/*

¿Qué incluye esta librería?
Toda la lógica de detección de silbidos basada en SMQT, FFT, filtros y Jensen Difference.

Una API pública con:

setConfig({...}) para personalizar parámetros
detect(callback) para iniciar la detección desde el micrófono
whistleFinder(analyser, callback) para usar con un AnalyserNode personalizado

Compatible con navegador y Node.js (exporta como window.whistleDetector y module.exports)

*/

/*
	<script type="text/javascript" src="./whistleDetector.js"></script>


	<button  type="button" onclick="startRecoSilbido()">Start Reco Silbido</button>
	<button  type="button" onclick="stopRecoSilbido()">Stop Reco Silbido</button>
	<br><br>
	<label> Sensibilidad: <span id="sensitivityValue">8</span> 
		<input type="range" id="sensitivityRange" min="2" max="35" value="8">
	</label>


	whistleDetector.setConfig({
			sampleThreshold : 8			//8
		})
	function startRecoSilbido(){
		whistleDetector.detect(function(){
			document.body.style.background = "#ff0000";
			setTimeout (function(){document.body.style.background = "#000000";}, 2*1000);
		});
	}
	function stopRecoSilbido(){
		whistleDetector.stop();	
	}
	const sensitivityRange = document.getElementById("sensitivityRange");
	const sensitivityValue = document.getElementById("sensitivityValue");
	sensitivityRange.addEventListener("input", () => {
		  const nuevoValor = Number(sensitivityRange.value);
		  whistleDetector.setConfig({ sampleThreshold: nuevoValor });
		  sensitivityValue.textContent = sensitivityRange.value;
	}); 
*/


// --- SMQT ---
const SMQT = {
    timeArr: [],
    smqtArr: [],
    maxLevel: 0,

    init: function (timeArr, maxLevel) {
        this.timeArr = timeArr;
        this.maxLevel = maxLevel;
        return this;
    },

    calculate: function () {
        this.smqtArr = this.SMQT(this.timeArr, 1);
        return this;
    },

    addUp: function (a, b, c) {
        const catArr = b.concat(c);
        for (let i = 0; i < catArr.length; i++) {
            a[i] += catArr[i];
        }
        return a;
    },

    SMQT: function (time_arr, currLevel) {
        if (currLevel === this.maxLevel + 1) return [];
        let U = [], one_set = [], zero_set = [], sum = 0;

        for (let i = 0; i < time_arr.length; i++) sum += time_arr[i];
        const avg = sum / time_arr.length;

        for (let i = 0; i < time_arr.length; i++) {
            if (time_arr[i] >= avg) {
                U.push(1 * Math.pow(2, this.maxLevel - currLevel));
                one_set.push(time_arr[i]);
            } else {
                U.push(0);
                zero_set.push(time_arr[i]);
            }
        }

        return this.addUp(U, this.SMQT(one_set, currLevel + 1), this.SMQT(zero_set, currLevel + 1));
    },

    normalize: function () {
        for (let i = 0; i < this.smqtArr.length; i++) {
            this.smqtArr[i] = (this.smqtArr[i] - Math.pow(2, this.maxLevel - 1)) / Math.pow(2, this.maxLevel - 1);
        }
        return this.smqtArr;
    }
};

// --- FFT ---
function FFT(bufferSize, sampleRate) {
    this.bufferSize = bufferSize;
    this.sampleRate = sampleRate;
    this.bandwidth = 2 / bufferSize * sampleRate / 2;

    this.spectrum = new Float32Array(bufferSize / 2);
    this.real = new Float32Array(bufferSize);
    this.imag = new Float32Array(bufferSize);
    this.peakBand = 0;
    this.peak = 0;

    this.reverseTable = new Uint32Array(bufferSize);
    let limit = 1, bit = bufferSize >> 1;
    while (limit < bufferSize) {
        for (let i = 0; i < limit; i++) {
            this.reverseTable[i + limit] = this.reverseTable[i] + bit;
        }
        limit <<= 1;
        bit >>= 1;
    }

    this.sinTable = new Float32Array(bufferSize);
    this.cosTable = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
        this.sinTable[i] = Math.sin(-Math.PI / i);
        this.cosTable[i] = Math.cos(-Math.PI / i);
    }
}

FFT.prototype.forward = function (buffer) {
    const bufferSize = this.bufferSize;
    const cosTable = this.cosTable;
    const sinTable = this.sinTable;
    const reverseTable = this.reverseTable;
    const real = this.real;
    const imag = this.imag;

    if (bufferSize !== buffer.length) throw "Buffer size mismatch";

    for (let i = 0; i < bufferSize; i++) {
        real[i] = buffer[reverseTable[i]];
        imag[i] = 0;
    }

    let halfSize = 1;
    while (halfSize < bufferSize) {
        const phaseShiftStepReal = cosTable[halfSize];
        const phaseShiftStepImag = sinTable[halfSize];
        let currentPhaseShiftReal = 1;
        let currentPhaseShiftImag = 0;

        for (let fftStep = 0; fftStep < halfSize; fftStep++) {
            let i = fftStep;
            while (i < bufferSize) {
                const off = i + halfSize;
                const tr = currentPhaseShiftReal * real[off] - currentPhaseShiftImag * imag[off];
                const ti = currentPhaseShiftReal * imag[off] + currentPhaseShiftImag * real[off];

                real[off] = real[i] - tr;
                imag[off] = imag[i] - ti;
                real[i] += tr;
                imag[i] += ti;

                i += halfSize << 1;
            }
            const tmpReal = currentPhaseShiftReal;
            currentPhaseShiftReal = tmpReal * phaseShiftStepReal - currentPhaseShiftImag * phaseShiftStepImag;
            currentPhaseShiftImag = tmpReal * phaseShiftStepImag + currentPhaseShiftImag * phaseShiftStepReal;
        }
        halfSize <<= 1;
    }

    for (let i = 0; i < bufferSize / 2; i++) {
        const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
        this.spectrum[i] = mag;
    }
    return this.spectrum;
};

// --- DSP Filters ---
function bandPassFilter(spectrum, config) {
    const clone = spectrum.slice();
    const freqStep = config.sampleRate / (clone.length * 2);
    for (let i = 0; i < clone.length; i++) {
        const freq = i * freqStep;
        if (freq < config.fLower || freq > config.fUpper) clone[i] = 0.15;
    }
    return clone;
}

function bandStopFilter(spectrum, config) {
    const clone = spectrum.slice();
    const freqStep = config.sampleRate / (clone.length * 2);
    for (let i = 0; i < clone.length; i++) {
        const freq = i * freqStep;
        if (freq > config.fLower && freq < config.fUpper) clone[i] = 0.15;
    }
    return clone;
}

// --- Jensen Difference ---
const Hv_ = 5.545177444479573;

function Hv(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum -= arr[i] * Math.log(arr[i]);
    }
    return sum;
}

function HvHv_(arr, freqBinCount) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        const X = (arr[i] + 2 / freqBinCount) / 2;
        sum -= X * Math.log(X);
    }
    return sum;
}

function jensenDiff(spectrum, freqBinCount) {
    return HvHv_(spectrum, freqBinCount) - (Hv(spectrum) + Hv_) / 2;
}




/**
 * Whistle Detector Library (modificada con stop())
 */

let config = {
    sampleRate: 44100,
    maxLevel: 8,
    freqBinCount: 512,
    jDiffThreshold: 0.45,
    whistleBlockThreshold: 25,
    sampleThreshold: 10
};

let totalSamples = 0, positiveSamples = 0;
const timeBuf = new Uint8Array(config.freqBinCount);

// --- Variables de control para poder detener ---
let running = false;
let animationId = null;
let audioContext = null;
let mediaStream = null;

// --- Función principal ---
function whistleFinder(analyser, whistleCallback) {
    if (!running) return; // Si se detiene, no seguir
    analyser.getByteTimeDomainData(timeBuf);
    SMQT.init(timeBuf, config.maxLevel).calculate();

    const fft = new FFT(config.freqBinCount, config.sampleRate);
    fft.forward(SMQT.normalize());

    const pbp = bandPassFilter(fft.spectrum, {
        sampleRate: config.sampleRate,
        fLower: 500,
        fUpper: 5000
    });

    const pbs = bandStopFilter(fft.spectrum, {
        sampleRate: config.sampleRate,
        fLower: 500,
        fUpper: 5000
    });

    let maxpbp = 0, minpbp = 100, sumAmplitudes = 0;
	let peakIndex = 0;			// Nuevo: Relacionado con cálculo de frecuencia.
	
    for (let i = 0; i < config.freqBinCount / 2; i++) {
        if (pbp[i] > maxpbp){ 
			maxpbp = pbp[i];
			peakIndex = i;
		}
        if (pbp[i] < minpbp) minpbp = pbp[i];
        sumAmplitudes += Math.abs(pbs[i]);
    }
    const meanpbs = sumAmplitudes / (config.freqBinCount / 2 - 1);

    sumAmplitudes = 0;
    for (let i = 0; i < config.freqBinCount / 2; i++) {
        pbp[i] = (pbp[i] - minpbp) + 2 / config.freqBinCount;
        sumAmplitudes += pbp[i];
    }
    for (let i = 0; i < config.freqBinCount / 2; i++) {
        pbp[i] /= sumAmplitudes;
    }

    const ratio = maxpbp / (meanpbs + 1);
    const jDiffVal = jensenDiff(pbp, config.freqBinCount);
	
	// Calcular frecuencia dominante
    const dominantFrequency = (peakIndex * config.sampleRate) / config.freqBinCount;

    if (ratio > config.whistleBlockThreshold && jDiffVal > config.jDiffThreshold) {
        positiveSamples++;
        if (positiveSamples > config.sampleThreshold) {
            whistleCallback({
                ratio: ratio,
                jDiff: jDiffVal,
				frequency: Math.trunc(dominantFrequency) // frecuencia en Hz (núm entero)
            });
        }
    }

    if (totalSamples === 50) {
        totalSamples = 0;
        positiveSamples = 0;
    } else {
        totalSamples += 1;
    }

    animationId = requestAnimationFrame(() => whistleFinder(analyser, whistleCallback));
}

function detect(whistleCallback) {
    running = true;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

    function getUserMedia(constraints, success, failure) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(constraints).then(success).catch(failure);
        } else if (navigator.getUserMedia) {
            navigator.getUserMedia(constraints, success, failure);
        } else {
            alert('getUserMedia is not supported in this browser.');
        }
    }

    function gotStream(stream) {
        mediaStream = stream;
        const mediaStreamSource = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = config.freqBinCount;

        mediaStreamSource.connect(analyser);
        whistleFinder(analyser, whistleCallback);
    }

    getUserMedia({ audio: true }, gotStream, () => {
        alert("Error accessing microphone. Please check your permissions.");
    });
}

function stop() {
    running = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    console.log("Detección de silbido detenida y recursos liberados.");
}

function setConfig(newConfig = {}) {
    config = { ...config, ...newConfig };
}

// --- Export API ---
const whistleDetector = {
    setConfig,
    detect,
    whistleFinder,
    stop
};


// For browser global use
if (typeof window !== 'undefined') {
    window.whistleDetector = whistleDetector;
}

// For Node.js or module bundlers
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = whistleDetector;
}