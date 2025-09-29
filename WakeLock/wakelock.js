// Obtenemos una referencia al botón
const button = document.getElementById("wakelock-button");

// Declaramos una variable para guardar el objeto WakeLockSentinel
let wakelock = null;

// Definimos una función para solicitar un wakelock
async function requestWakelock() {
    try {
        // Comprobamos si el navegador soporta la Wakelock API
        if ("wakeLock" in navigator) {
            wakelock = await navigator.wakeLock.request("screen");
            console.log("Wakelock activado");
            button.textContent = "Desactivar Wakelock";
            // Añadimos un listener para el evento release, para cuando se libera el wakelock
            wakelock.addEventListener("release", () => {
                // Cambiamos el texto del botón
                button.textContent = "Activar Wakelock";
            });
        } else {
            // Mostramos un mensaje de error por consola
            console.error("El navegador no soporta la Wakelock API");
        }
    } catch (error) {
        console.error(error);
    }
}

// Definimos una función para liberar un wakelock
async function releaseWakelock() {
    // Comprobamos si hay un wakelock activo
    if (wakelock) {
        //Y si es así lo liberamos
        await wakelock.release();
        // Asignamos null a la variable wakelock
        wakelock = null;
    }
    console.log("Wakelock liberado");
}

// Añadimos un listener para el evento click del botón para activar o desactivar el wakelock
button.addEventListener("click", () => {
    // Si ya hay un wakelock activo...
    if (wakelock) {
        // ...llamamos a la función para liberar el wakelock
        releaseWakelock();
    } else {
        // Si no l ohay, llamamos a la función para solicitar el wakelock
        requestWakelock();
    }
});
