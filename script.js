document.getElementById("cargar-datos").addEventListener("click", () => { 
    document.getElementById("patente").innerText = "AB 123 CD";
    document.getElementById("conductor").innerText = "Martinet, Agustina Maria Andrea";
    document.getElementById("empresa").innerText = "Transportes XYZ";
    document.getElementById("legajo").innerText = "94674";
    document.getElementById("demas-datos").innerText = "Ingreso autorizado";
    document.getElementById("foto-conductor").innerText = "Foto cargada";
});

document.getElementById("compartir-pantalla").addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoOrigen = document.getElementById("video-origen");
        videoOrigen.srcObject = stream;

        videoOrigen.addEventListener("loadedmetadata", () => {
            console.log("Resolución capturada:", videoOrigen.videoWidth, videoOrigen.videoHeight);
            iniciarRecorte();
        });
    } catch (err) {
        console.error("Error al compartir pantalla:", err);
    }
});

function iniciarRecorte() {
    const video = document.getElementById("video-origen");

    const canvasPatente = document.getElementById("camara-patente");
    const canvasConductor = document.getElementById("camara-conductor");
    const canvasAcompanante = document.getElementById("camara-acompanante");

    const ctxPatente = canvasPatente.getContext("2d");
    const ctxConductor = canvasConductor.getContext("2d");
    const ctxAcompanante = canvasAcompanante.getContext("2d");

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Usa la mitad del ancho y la mitad del alto para recortar en 2x2
    const recorte1 = { x: 0, y: 0, w: videoWidth / 2, h: videoHeight / 2 };
    const recorte2 = { x: videoWidth / 2, y: 0, w: videoWidth / 2, h: videoHeight / 2 };
    const recorte3 = { x: 0, y: videoHeight / 2, w: videoWidth / 2, h: videoHeight / 2 };

    function dibujar() {
        ctxPatente.clearRect(0, 0, canvasPatente.width, canvasPatente.height);
        ctxConductor.clearRect(0, 0, canvasConductor.width, canvasConductor.height);
        ctxAcompanante.clearRect(0, 0, canvasAcompanante.width, canvasAcompanante.height);

        ctxPatente.drawImage(video,
            recorte1.x, recorte1.y, recorte1.w, recorte1.h,
            0, 0, canvasPatente.width, canvasPatente.height
        );

        ctxConductor.drawImage(video,
            recorte2.x, recorte2.y, recorte2.w, recorte2.h,
            0, 0, canvasConductor.width, canvasConductor.height
        );

        ctxAcompanante.drawImage(video,
            recorte3.x, recorte3.y, recorte3.w, recorte3.h,
            0, 0, canvasAcompanante.width, canvasAcompanante.height
        );

        requestAnimationFrame(dibujar);
    }

    dibujar();
}