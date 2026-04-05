const CONFIG = {
    API_KEY: 'cqgYJtTKSrUPMyoV48y1',
    URL: 'https://serverless.roboflow.com/gaming-nkqzr/workflows/detect-count-and-visualize-2',
    PHOTO_INTERVAL: 5000,
    LIVE_INTERVAL: 1000 // Faster for "Live" feel
};

class SafetySystem {
    constructor() {
        this.video = document.getElementById('webcam');
        this.overlay = document.getElementById('overlay');
        this.ctx = this.overlay.getContext('2d');
        this.modeToggle = document.getElementById('mode-toggle'); // Off: Photo, On: Live
        this.annoToggle = document.getElementById('anno-toggle');
        
        this.elements = {
            leds: { green: document.getElementById('led-green'), yellow: document.getElementById('led-yellow'), red: document.getElementById('led-red') },
            counts: { person: document.getElementById('count-person'), hat: document.getElementById('count-hat'), vest: document.getElementById('count-vest'), gloves: document.getElementById('count-gloves') },
            status: document.getElementById('status-text'),
            aiText: document.getElementById('ai-text'),
            buzzerZone: document.getElementById('buzzer-zone'),
            buzzerIcon: document.querySelector('.buzzer-icon'),
            scanLine: document.getElementById('scan-line')
        };

        this.currentDetections = [];
        this.audioCtx = null;
        this.timer = null;

        this.init();
        this.setupEventListeners();
    }

    async init() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.video.srcObject = stream;
        this.video.onloadedmetadata = () => {
            this.overlay.width = this.video.videoWidth;
            this.overlay.height = this.video.videoHeight;
            this.startLoop();
        };
    }

    setupEventListeners() {
        this.modeToggle.addEventListener('change', () => {
            clearInterval(this.timer);
            this.startLoop();
        });
    }

    startLoop() {
        const interval = this.modeToggle.checked ? CONFIG.LIVE_INTERVAL : CONFIG.PHOTO_INTERVAL;
        this.timer = setInterval(() => this.capture(), interval);
    }

    async capture() {
        this.elements.scanLine.classList.add('scanning');
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.video.videoWidth;
        tempCanvas.height = this.video.videoHeight;
        tempCanvas.getContext('2d').drawImage(this.video, 0, 0);
        const base64 = tempCanvas.toDataURL('image/jpeg', 0.6).split(',')[1];

        try {
            const response = await fetch(CONFIG.URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: CONFIG.API_KEY,
                    inputs: { "image": { "type": "base64", "value": base64 } }
                })
            });
            const data = await response.json();
            this.handleData(data);
        } catch (e) {
            console.error("API Error", e);
        } finally {
            setTimeout(() => this.elements.scanLine.classList.remove('scanning'), 500);
        }
    }

    handleData(data) {
        let predictions = [];
        try {
            const out = data.outputs[0];
            for (let k in out) { if (out[k].predictions) { predictions = out[k].predictions; break; } }
        } catch(e) {}

        this.currentDetections = predictions;
        this.updateCounters(predictions);
        this.processSafetyLogic(predictions);
        this.drawAnnotations();
    }

    updateCounters(preds) {
        const c = { person: 0, hat: 0, vest: 0, gloves: 0 };
        preds.forEach(p => {
            const label = p.class.toLowerCase();
            if (label.includes('person')) c.person++;
            else if (label.includes('hat')) c.hat++;
            else if (label.includes('vest')) c.vest++;
            else if (label.includes('glove')) c.gloves++;
        });
        for (let key in c) this.elements.counts[key].innerText = c[key];
    }

    processSafetyLogic(preds) {
        const persons = preds.filter(p => p.class.toLowerCase().includes('person'));
        const items = preds.filter(p => !p.class.toLowerCase().includes('person'));

        if (persons.length === 0) {
            this.setUI('green', 'Zone Secure', 'No personnel detected in high-risk area. Monitoring active.');
            return;
        }

        let totalViolations = 0;
        let recoverableViolations = 0;

        persons.forEach(per => {
            ['hat', 'vest', 'glove'].forEach(type => {
                const isWearing = items.some(it => it.class.toLowerCase().includes(type) && this.isInside(it, per));
                if (!isWearing) {
                    const existsInFrame = items.some(it => it.class.toLowerCase().includes(type));
                    existsInFrame ? recoverableViolations++ : totalViolations++;
                }
            });
        });

        if (totalViolations > 0) {
            this.setUI('red', 'Danger: Violation', 'Critical safety breach! Personnel missing gear with no replacements found in vicinity.');
        } else if (recoverableViolations > 0) {
            this.setUI('yellow', 'Warning', 'Personnel missing gear, however spare PPE was detected in the workstation.');
        } else {
            this.setUI('green', 'All Protected', 'Site compliance 100%. All detected personnel are wearing appropriate equipment.');
        }
    }

    isInside(item, person) {
        return (item.x > person.x - person.width/2 && item.x < person.x + person.width/2 &&
                item.y > person.y - person.height/2 && item.y < person.y + person.height/2);
    }

    setUI(state, title, aiText) {
        // Reset
        Object.values(this.elements.leds).forEach(l => l.className = 'led');
        this.elements.buzzerZone.classList.remove('danger-bg');
        this.elements.buzzerIcon.classList.remove('active-buzzer');

        this.elements.leds[state].classList.add(`led-${state}-on`);
        this.elements.status.innerText = title;
        this.elements.status.className = `text-xl font-bold mt-2 text-${state === 'red' ? 'red' : (state === 'yellow' ? 'yellow' : 'emerald')}-500`;
        this.elements.aiText.innerText = aiText;

        if (state === 'red') {
            this.elements.buzzerZone.classList.add('danger-bg');
            this.elements.buzzerIcon.classList.add('active-buzzer');
            this.triggerBuzzer();
        }
    }

    triggerBuzzer() {
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.start(); osc.stop(this.audioCtx.currentTime + 1);
    }

    drawAnnotations() {
        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        if (!this.annoToggle.checked) return;

        this.currentDetections.forEach(p => {
            const x = p.x - p.width/2;
            const y = p.y - p.height/2;
            this.ctx.strokeStyle = p.class.includes('person') ? '#3b82f6' : '#10b981';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, p.width, p.height);
            this.ctx.fillStyle = this.ctx.strokeStyle;
            this.ctx.font = '10px Arial';
            this.ctx.fillText(p.class.toUpperCase(), x, y - 5);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new SafetySystem());
