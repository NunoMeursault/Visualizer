const fileInput = document.getElementById('file-input');
const audio = document.getElementById('audio');
const mediaInput = document.getElementById('media-input');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const controls = document.getElementById('controls');
const carousel = document.getElementById('carousel');
const colorPicker = document.getElementById('color-picker');

// Creamos la imagen para el fondo desenfocado
const background = document.createElement('img');
background.id = 'background';
document.body.appendChild(background);

canvas.width = window.innerWidth * 0.8;
canvas.height = (canvas.width * 9) / 16;

let audioContext, analyser, source, dataArray;
let currentMediaIndex = 0;
let mediaElements = [];
let barColor = colorPicker.value;

// Manejo de audio
fileInput.addEventListener('change', (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    const file = files[0];
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.load();
    audio.play();
    setupAudioContext();
    // Oculta controles al arrancar
    controls.style.display = 'none';
  }
});

// Manejo de imágenes/videos
mediaInput.addEventListener('change', (event) => {
  const files = Array.from(event.target.files);
  carousel.innerHTML = '';
  mediaElements = [];

  files.forEach((file) => {
    const url = URL.createObjectURL(file);
    let element;
    if (file.type.startsWith('image')) {
      element = document.createElement('img');
      element.src = url;
    } else if (file.type.startsWith('video')) {
      element = document.createElement('video');
      element.src = url;
      element.loop = true;
    }
    element.classList.add('media-item');
    carousel.appendChild(element);
    mediaElements.push(element);
  });

  if (mediaElements.length > 0) {
    setCurrentMedia(0);
  }
});

// Cambia la foto/vídeo actual y el fondo
function setCurrentMedia(index) {
  if (mediaElements.length > 0) {
    // Apagamos el anterior
    const oldMedia = mediaElements[currentMediaIndex];
    if (oldMedia) {
      oldMedia.classList.remove('active');
      if (oldMedia.tagName === 'VIDEO') {
        oldMedia.pause();
      }
    }
    
    // Encendemos el nuevo
    currentMediaIndex = index;
    const newMedia = mediaElements[currentMediaIndex];
    newMedia.classList.add('active');
    if (newMedia.tagName === 'VIDEO') {
      newMedia.play();
    }
    
    // Efecto de fade en el fondo: primero lo bajamos a 0 para simular
    // un desvanecimiento, y luego cambiamos la src cuando está “oscuro”.
    background.style.opacity = 0;
    setTimeout(() => {
      background.src = newMedia.src;
      background.style.opacity = 0.9;
    }, 700); 
  }
}

// Visualización de audio
function setupAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }
  draw();
}

function draw() {
  requestAnimationFrame(draw);
  if (!analyser) return;

  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = (canvas.width / dataArray.length) * 0.5;
  let barHeight;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2.2;

  ctx.fillStyle = barColor;
  for (let i = 0; i < dataArray.length; i++) {
    barHeight = (dataArray[i] / 2) * 0.8;
    // Barra izquierda
    ctx.fillRect(
      centerX - i * (barWidth + 1),
      centerY - barHeight / 2,
      barWidth,
      barHeight
    );
    // Barra derecha
    ctx.fillRect(
      centerX + i * (barWidth + 1),
      centerY - barHeight / 2,
      barWidth,
      barHeight
    );
  }
}

// Cambio de color del espectro
colorPicker.addEventListener('input', (event) => {
  barColor = event.target.value;
});

// Carrusel automático
setInterval(() => {
  if (mediaElements.length > 1) {
    const nextIndex = (currentMediaIndex + 1) % mediaElements.length;
    setCurrentMedia(nextIndex);
  }
}, 5000);

// Mostrar/ocultar controles con Esc
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    controls.style.display = controls.style.display === 'none' ? 'flex' : 'none';
  }
});
