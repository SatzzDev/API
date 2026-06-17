// ========== Modal & Audio ==========
//const modal = document.getElementById('welcome-modal');
const playlist = [
  'ssstik.io_1749621584342.mp3',
  'Consume (feat. Goon Des Garcons) - Chase Atlantic.mp3',
  'Swim - Chase Atlantic.mp3',
  'Renegade - Aaryan Shah.mp3',
  'Popular (with Playboi Carti & Madonna) - From The Idol Vol. 1 (Music from the HBO Original Series) - The Weeknd.mp3',
  'Die For You - The Weeknd.mp3',
  'Dangerous Woman - Ariana Grande.mp3',
  'YAD - Vanna Rainelle.mp3',
  'I Was Never There - The Weeknd.mp3',
  'Timeless (feat Playboi Carti) - The Weeknd.mp3',
  'On That Time - Playboi Carti.mp3',
  'One Of The Girls (with JENNIE, Lily Rose Depp) - The Weeknd.mp3',
  'The Hills - The Weeknd.mp3',
  'Good For You - Selena Gomez.mp3',
  'Starboy - The Weeknd.mp3',
  'Rodeo (Remix) - Lah Pat.mp3',
  'Shameless - Camila Cabello.mp3',
  'Flawlëss (feat. Lil Uzi Vert) - Yeat.mp3',
  'IDGAF (feat. Yeat) - Drake.mp3',
  'If We Being Rëal - Yeat.mp3',
  'Ransom - Lil Tecca.mp3',
  'FE!N (feat. Playboi Carti) - Travis Scott.mp3',
  'Hope - XXXTENTACION.mp3',
  'Sky - Playboi Carti.mp3',
  'Monëy so big - Yeat.mp3',
  'Lucid Dreams - Juice WRLD.mp3',
  "God's Plan - Drake.mp3",
  'Reminder - The Weeknd.mp3',
];
let currentTrack = 0;
const audio = new Audio(`/assets/audio/${playlist[currentTrack]}`);

function updateMediaSession() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: playlist[currentTrack].replace('.mp3', ''),
      artist: 'Cyber API',
      artwork: [
        { src: 'https://i.scdn.co/image/ab67616d0000b273407fc6537acad2d67abaf894', type: 'image/jpeg', sizes: '500x500' }
      ]
    });
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('stop', () => {
      audio.pause();
      audio.currentTime = 0;
    });
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
  }
}

function playNext() {
  currentTrack = (currentTrack + 1) % playlist.length;
  audio.src = `/assets/audio/${playlist[currentTrack]}`;
  audio.play();
  updateMediaSession();
}

function playPrev() {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  audio.src = `/assets/audio/${playlist[currentTrack]}`;
  audio.play();
  updateMediaSession();
}

document.addEventListener('DOMContentLoaded', () => {
  audio.load();
});

audio.addEventListener('ended', playNext);

// ========== Theme Controller ==========
const themeToggles = document.querySelectorAll('.theme-controller');
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const htmlElement = document.documentElement;

const syncThemeToggles = (isDark) => {
themeToggles.forEach(toggle => {
toggle.checked = isDark;
});
htmlElement.setAttribute('data-theme', isDark ? 'night' : 'dracula');
localStorage.setItem('theme', isDark ? 'night' : 'dracula');
};

// Load dari localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) syncThemeToggles(savedTheme === 'night');
else syncThemeToggles(isDarkMode);

// Listener buat semua toggle
themeToggles.forEach(toggle => {
toggle.addEventListener('change', () => {
syncThemeToggles(toggle.checked);
});
});

// Listener buat perubahan system theme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
syncThemeToggles(e.matches);
});

// ========== System Status & Uptime ==========
setInterval(async () => {
fetch('/uptime')
.then(res => res.json())
.then(data => {
const now = new Date();
document.querySelector('.current-time-h').style = '--value:' + String(now.getHours()).padStart(2, '0');
document.querySelector('.current-time-m').style = '--value:' + String(now.getMinutes()).padStart(2, '0');
document.querySelector('.current-time-s').style = '--value:' + String(now.getSeconds()).padStart(2, '0');
document.querySelector('.uptime-h').style = `--value:${data.uptime.split(':')[0]}`;
document.querySelector('.uptime-m').style = `--value:${data.uptime.split(':')[1]}`;
document.querySelector('.uptime-s').style = `--value:${data.uptime.split(':')[2]}`;
});

const res = await fetch('/system');
const data = await res.json();

document.getElementById('cpu').textContent = `${data.cpu}%`;
document.querySelector('.progress-primary').value = `${data.cpu}`;

document.getElementById('mem').textContent = `${data.memory}%`;
document.querySelector('.progress-secondary').value = `${data.memory}`;

document.getElementById('disk').textContent = `${data.disk}%`;
document.querySelector('.progress-success').value = `${data.disk}`;

document.getElementById('heap').textContent = `${data.heap}%`;
document.querySelector('.progress-warning').value = `${data.heap}`;
}, 1000);

// ========== Utility ==========
function formatCount(num) {
if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
return num.toString();
}
