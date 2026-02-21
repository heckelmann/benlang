/**
 * BenLang Game Engine Runtime
 * Eine kindgerechte Spiel-Engine für BenLang
 */

(function (global) {
  'use strict';

  // BenLang Runtime Object
  const _benlang = {
    spielName: 'Mein Spiel',
    canvas: null,
    ctx: null,
    breite: 800,
    hoehe: 600,
    figuren: [],
    bilder: {},
    toene: {},
    tasten: {},
    tastenFrame: {}, // Keys pressed in the current frame
    maus: { x: 0, y: 0, gedrueckt: false },

    // Text input state
    eingabeAktiv: false,
    eingabeText: '',
    eingabeFrage: '',
    eingabeCallback: null,
    eingabeCursorSichtbar: true,
    eingabeCursorTimer: 0,
    eingabeGeradeBeendet: false,  // Flag to prevent key handlers firing after input ends
    eingabeQueue: [],  // Queue for pending FRAGE calls

    // Event handlers
    startHandlers: [],
    immerHandlers: [],
    tasteHandlers: {},
    kollisionHandlers: [],
    startHandlerRunning: false,  // Flag to prevent taste handlers during WENN_START

    // Game loop
    running: false,
    lastTime: 0,

    // Stored event handlers for cleanup
    _keydownHandler: null,
    _keyupHandler: null,
    _mousemoveHandler: null,
    _mousedownHandler: null,
    _mouseupHandler: null,

    /**
     * Initialize the game engine
     */
    init: function (canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) {
        console.error('Canvas nicht gefunden:', canvasId);
        return;
      }

      this.ctx = this.canvas.getContext('2d');
      this.breite = this.canvas.width;
      this.hoehe = this.canvas.height;

      // Setup input handlers
      this.setupInput();
    },

    /**
     * Setup keyboard and mouse input
     */
    setupInput: function () {
      // Remove old handlers if they exist (prevents duplicate listeners)
      if (this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler);
      }
      if (this._keyupHandler) {
        document.removeEventListener('keyup', this._keyupHandler);
      }
      if (this._mousemoveHandler && this.canvas) {
        this.canvas.removeEventListener('mousemove', this._mousemoveHandler);
      }
      if (this._mousedownHandler && this.canvas) {
        this.canvas.removeEventListener('mousedown', this._mousedownHandler);
      }
      if (this._mouseupHandler && this.canvas) {
        this.canvas.removeEventListener('mouseup', this._mouseupHandler);
      }

      // Create and store new handlers
      this._keydownHandler = (e) => {
        // Handle text input mode first
        if (this.eingabeAktiv) {
          this.handleEingabeKey(e);
          return;
        }

        if (e.repeat) return; // Ignore browser's auto-repeat events

        // Skip if input just ended (prevents Enter/Space from triggering handlers)
        if (this.eingabeGeradeBeendet) {
          this.eingabeGeradeBeendet = false;
          return;
        }

        const taste = this.mapKey(e.key);
        this.tasten[taste] = true;
        this.tastenFrame[taste] = true; // Mark as just pressed this frame
        this.letzteGedrueckteTaste = taste;

        // Prevent browser default behavior only for specific game keys 
        // to avoid scrolling or other browser shortcuts while playing.
        if (this.running) {
          // All keys that should not trigger browser shortcuts
          const gameKeys = [
            'links', 'rechts', 'hoch', 'runter', 'leertaste',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
            'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
          ];
          if (gameKeys.includes(taste)) {
            e.preventDefault();
          }
        }

        // Don't trigger taste handlers while WENN_START is still running
        if (this.startHandlerRunning) {
          return;
        }

        // Trigger taste handlers
        if (this.tasteHandlers[taste]) {
          this.tasteHandlers[taste].forEach(handler => handler());
        }
      };

      this._keyupHandler = (e) => {
        const taste = this.mapKey(e.key);
        this.tasten[taste] = false;
      };

      this._mousemoveHandler = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        // Berechne Skalierungsfaktor (Canvas kann durch CSS skaliert sein)
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        // Skalierte Mausposition
        this.maus.x = (e.clientX - rect.left) * scaleX;
        this.maus.y = (e.clientY - rect.top) * scaleY;
      };

      this._mousedownHandler = () => {
        this.maus.gedrueckt = true;
      };

      this._mouseupHandler = () => {
        this.maus.gedrueckt = false;
      };

      // Keyboard events
      document.addEventListener('keydown', this._keydownHandler);
      document.addEventListener('keyup', this._keyupHandler);

      // Mouse events
      this.canvas.addEventListener('mousemove', this._mousemoveHandler);
      this.canvas.addEventListener('mousedown', this._mousedownHandler);
      this.canvas.addEventListener('mouseup', this._mouseupHandler);
    },

    /**
     * Map key names to German names
     */
    mapKey: function (key) {
      const keyMap = {
        'ArrowLeft': 'links',
        'ArrowRight': 'rechts',
        'ArrowUp': 'hoch',
        'ArrowDown': 'runter',
        ' ': 'leertaste',
        'Enter': 'eingabe',
        'Escape': 'escape'
      };
      return keyMap[key] || key.toLowerCase();
    },

    /**
     * Start the game
     */
    starten: function () {
      if (this.running) return;
      this.running = true;

      // Call all start handlers (async - we need to track when they are all done)
      if (this.startHandlers.length > 0) {
        this.startHandlerRunning = true;
        const promises = this.startHandlers.map(handler => Promise.resolve(handler()));
        Promise.all(promises).then(() => {
          this.startHandlerRunning = false;
        }).catch((err) => {
          this.startHandlerRunning = false;
          console.error('Fehler in WENN_START:', err);
        });
      }

      // Start game loop
      this.lastTime = performance.now();
      this.gameLoop();
    },

    /**
     * Stop the game
     */
    stoppen: function () {
      this.running = false;
      this.eingabeAktiv = false;
    },

    /**
     * Reset the game
     */
    zuruecksetzen: function () {
      this.stoppen();
      this.figuren = [];
      this.immerHandlers = [];
      this.tasteHandlers = {};
      this.kollisionHandlers = [];
      this.startHandlers = [];
      this.startHandlerRunning = false;
      this.tasten = {};
      this.letzteGedrueckteTaste = "";
      this.maus = { x: 0, y: 0, gedrueckt: false };
      // Reset text input state
      this.eingabeAktiv = false;
      this.eingabeText = '';
      this.eingabeFrage = '';
      this.eingabeCallback = null;
      this.eingabeGeradeBeendet = false;
      this.eingabeQueue = [];
    },

    /**
     * Main game loop
     */
    gameLoop: function () {
      if (!this.running) return;

      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Only clear canvas and run game loop logic when WENN_START is done
      // This allows ZEIGE_TEXT + WARTE in WENN_START to work properly
      if (this.startHandlerRunning) {
        // Always clear and redraw canvas during WENN_START so game content is visible
        this.ctx.fillStyle = '#0d1117';
        this.ctx.fillRect(0, 0, this.breite, this.hoehe);

        // If text input is active during WENN_START, we must draw it
        if (this.eingabeAktiv) {
          this.zeichneEingabefeld();
        }

        // Keep the loop running
        requestAnimationFrame(() => this.gameLoop());
        return;
      }

      // Clear canvas
      this.ctx.fillStyle = '#0d1117';
      this.ctx.fillRect(0, 0, this.breite, this.hoehe);

      // If text input is active, only draw the input overlay
      if (this.eingabeAktiv) {
        // Still draw sprites so the game is visible behind overlay
        this.figuren.forEach(figur => {
          if (figur.sichtbar && figur.bild) {
            this.ctx.save();
            this.ctx.translate(figur.x + figur.breite / 2, figur.y + figur.hoehe / 2);
            this.ctx.rotate(figur.drehung * Math.PI / 180);
            this.ctx.scale(figur.skalaX, figur.skalaY);
            this.ctx.drawImage(
              figur.bild,
              -figur.breite / 2,
              -figur.hoehe / 2,
              figur.breite,
              figur.hoehe
            );
            this.ctx.restore();
          }
        });

        // Draw the input overlay
        this.zeichneEingabefeld();

        requestAnimationFrame(() => this.gameLoop());
        return;
      }

      // Call immer handlers (update)
      this.immerHandlers.forEach(handler => handler(deltaTime));

      // Clear just-pressed state after all handlers run
      this.tastenFrame = {};

      // Check collisions
      this.checkCollisions();

      // Draw all sprites
      this.figuren.forEach(figur => {
        if (figur.sichtbar && figur.bild) {
          this.ctx.save();

          // Apply transformations
          this.ctx.translate(figur.x + figur.breite / 2, figur.y + figur.hoehe / 2);
          this.ctx.rotate(figur.drehung * Math.PI / 180);
          this.ctx.scale(figur.skalaX, figur.skalaY);

          // Draw image
          this.ctx.drawImage(
            figur.bild,
            -figur.breite / 2,
            -figur.hoehe / 2,
            figur.breite,
            figur.hoehe
          );

          this.ctx.restore();
        }
      });

      requestAnimationFrame(() => this.gameLoop());
    },

    /**
     * Check for collisions between sprites
     */
    checkCollisions: function () {
      this.kollisionHandlers.forEach(({ a, b, handler }) => {
        if (this.pruefeKollision(a, b)) {
          handler();
        }
      });
    },

    /**
     * AABB collision detection
     */
    pruefeKollision: function (a, b) {
      if (!a || !b) return false;
      return (
        a.x < b.x + b.breite &&
        a.x + a.breite > b.x &&
        a.y < b.y + b.hoehe &&
        a.y + a.hoehe > b.y
      );
    },

    // ========== Event Registration ==========

    wennStart: function (handler) {
      this.startHandlers.push(handler);
    },

    wennImmer: function (handler) {
      this.immerHandlers.push(handler);
    },

    wennTaste: function (taste, handler) {
      taste = taste.toLowerCase();
      if (!this.tasteHandlers[taste]) {
        this.tasteHandlers[taste] = [];
      }
      this.tasteHandlers[taste].push(handler);
    },

    wennKollision: function (a, b, handler) {
      this.kollisionHandlers.push({ a, b, handler });
    },

    // ========== Sprite Functions ==========

    ladeBild: function (pfad) {
      const figur = {
        x: 0,
        y: 0,
        _breite: 50,
        _hoehe: 50,
        _groesseGeaendert: false,
        drehung: 0,
        skalaX: 1,
        skalaY: 1,
        sichtbar: true,
        geschwindigkeitX: 0,
        geschwindigkeitY: 0,
        bild: null
      };

      // Add getters and setters for breite and hoehe to track if the user changed them
      Object.defineProperty(figur, 'breite', {
        get: function () { return this._breite; },
        set: function (v) { this._breite = v; this._groesseGeaendert = true; },
        configurable: true,
        enumerable: true
      });
      Object.defineProperty(figur, 'hoehe', {
        get: function () { return this._hoehe; },
        set: function (v) { this._hoehe = v; this._groesseGeaendert = true; },
        configurable: true,
        enumerable: true
      });

      // Load image
      const img = new Image();
      img.onload = () => {
        figur.bild = img;
        // Only auto-set size if the user hasn't manually changed it yet
        if (!figur._groesseGeaendert) {
          figur._breite = img.width;
          figur._hoehe = img.height;
        }
      };
      img.onerror = () => {
        console.warn('Bild konnte nicht geladen werden:', pfad);
        // Create a colored rectangle as fallback
        figur.bild = this.createFallbackImage(figur.breite, figur.hoehe, '#ff6b6b');
      };
      img.src = '/projekt/' + pfad;

      this.figuren.push(figur);

      // Add methods to the figure itself
      figur.loeschen = () => this.loescheFigur(figur);
      figur.gehe_zu = (x, y) => { figur.x = x; figur.y = y; };
      figur.drehe = (winkel) => { figur.drehung += winkel; };
      figur.skaliere = (faktor) => { figur.skalaX = faktor; figur.skalaY = faktor; };

      return figur;
    },

    /**
     * Move a figure to a specific position
     */
    geheZu: function (figur, x, y) {
      if (!figur) return;
      figur.x = x;
      figur.y = y;
    },

    /**
     * Rotate a figure by a certain angle
     */
    drehe: function (figur, winkel) {
      if (!figur) return;
      figur.drehung = (figur.drehung || 0) + winkel;
    },

    /**
     * Scale a figure by a factor
     */
    skaliere: function (figur, faktor) {
      if (!figur) return;
      figur.skalaX = faktor;
      figur.skalaY = faktor;
    },

    /**
     * Remove a figure from the game
     * @param {object} figur - The sprite to remove
     */
    loescheFigur: function (figur) {
      if (!figur) return;

      // Remove from figuren array
      const index = this.figuren.indexOf(figur);
      if (index !== -1) {
        this.figuren.splice(index, 1);
      }

      // Remove collision handlers involving this figure
      this.kollisionHandlers = this.kollisionHandlers.filter(h => h.a !== figur && h.b !== figur);
    },

    createFallbackImage: function (breite, hoehe, farbe) {
      const canvas = document.createElement('canvas');
      canvas.width = breite;
      canvas.height = hoehe;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = farbe;
      ctx.fillRect(0, 0, breite, hoehe);
      return canvas;
    },

    // ========== Drawing Functions ==========

    zeichneRechteck: function (x, y, breite, hoehe, farbe) {
      this.ctx.fillStyle = farbe || '#ffffff';
      this.ctx.fillRect(x, y, breite, hoehe);
    },

    zeichneKreis: function (x, y, radius, farbe) {
      this.ctx.fillStyle = farbe || '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    },

    zeichneLinie: function (x1, y1, x2, y2, farbe) {
      this.ctx.strokeStyle = farbe || '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    },

    zeigeText: function (text, x, y, farbe, groesse) {
      this.ctx.fillStyle = farbe || '#ffffff';
      this.ctx.font = (groesse || 20) + 'px Arial';
      this.ctx.fillText(text, x || 10, y || 30);
    },

    // ========== Input Functions ==========

    tasteGedrueckt: function (taste) {
      return this.tasten[taste.toLowerCase()] || false;
    },

    tasteGetippt: function (taste) {
      return this.tastenFrame[taste.toLowerCase()] || false;
    },

    gedrueckteTaste: function () {
      return this.letzteGedrueckteTaste || "";
    },

    mausX: function () {
      return this.maus.x;
    },

    mausY: function () {
      return this.maus.y;
    },

    mausGedrueckt: function () {
      return this.maus.gedrueckt;
    },

    // ========== Sound Functions ==========

    spieleTon: function (pfad) {
      if (!this.toene[pfad]) {
        this.toene[pfad] = new Audio('/projekt/' + pfad);
      }
      this.toene[pfad].currentTime = 0;
      this.toene[pfad].play().catch(e => {
        console.warn('Ton konnte nicht abgespielt werden:', pfad);
      });
    },

    /**
     * Change the image of an existing sprite
     * @param {object} figur - The sprite to change
     * @param {string} pfad - Path to the new image
     * @returns {Promise} - Resolves when image is loaded
     */
    bildWechseln: function (figur, pfad) {
      return new Promise((resolve, reject) => {
        if (!figur) {
          console.warn('BILD_WECHSELN: Keine Figur angegeben');
          reject(new Error('Keine Figur angegeben'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          figur.bild = img;
          if (!figur._groesseGeaendert) {
            figur._breite = img.width;
            figur._hoehe = img.height;
          }
          resolve();
        };
        img.onerror = () => {
          console.warn('Bild konnte nicht geladen werden:', pfad);
          reject(new Error('Bild konnte nicht geladen werden: ' + pfad));
        };
        img.src = '/projekt/' + pfad;
      });
    },

    // ========== Utility Functions ==========

    zufall: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Wait for a specified number of milliseconds
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} - Resolves after the delay
     */
    warte: function (ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    // ========== String Functions ==========

    laenge: function (text) {
      if (typeof text !== 'string') return 0;
      return text.length;
    },

    zeichen: function (text, index) {
      if (typeof text !== 'string') return '';
      if (index < 0 || index >= text.length) return '';
      return text[index];
    },

    grossbuchstaben: function (text) {
      if (typeof text !== 'string') return '';
      return text.toUpperCase();
    },

    // ========== Text Input Functions ==========

    /**
     * Show a text input dialog and wait for user input
     * @param {string} frageText - The question to display
     * @returns {Promise<string>} - The user's input
     */
    frage: function (frageText) {
      return new Promise((resolve) => {
        // If another input is active, queue this one
        if (this.eingabeAktiv) {
          this.eingabeQueue.push({ frage: frageText, callback: resolve });
          return;
        }

        this.eingabeAktiv = true;
        this.eingabeText = '';
        this.eingabeFrage = frageText || 'Eingabe:';
        this.eingabeCallback = resolve;
        this.eingabeCursorSichtbar = true;
        this.eingabeCursorTimer = 0;
      });
    },

    /**
     * Process next item in the input queue
     */
    processEingabeQueue: function () {
      if (this.eingabeQueue.length > 0 && !this.eingabeAktiv) {
        const next = this.eingabeQueue.shift();
        this.eingabeAktiv = true;
        this.eingabeText = '';
        this.eingabeFrage = next.frage || 'Eingabe:';
        this.eingabeCallback = next.callback;
        this.eingabeCursorSichtbar = true;
        this.eingabeCursorTimer = 0;
      } else if (this.eingabeQueue.length === 0 && !this.eingabeAktiv) {
        // All inputs processed - remove focus from any buttons to prevent Enter key issues
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
          document.activeElement.blur();
        }
      }
    },

    /**
     * Handle text input key events
     */
    handleEingabeKey: function (e) {
      if (!this.eingabeAktiv) return false;

      // Always stop propagation while input is active to prevent editor shortcuts
      e.stopPropagation();
      e.preventDefault();

      if (e.key === 'Enter') {
        // Submit the input
        this.eingabeAktiv = false;
        this.eingabeGeradeBeendet = true;  // Prevent this Enter from triggering handlers
        if (this.eingabeCallback) {
          const callback = this.eingabeCallback;
          const text = this.eingabeText;
          this.eingabeCallback = null;
          this.eingabeText = '';

          // Process callback after a micro-delay to ensure state is clean
          setTimeout(() => {
            callback(text);
            // Process next queued input if any
            this.processEingabeQueue();
          }, 0);
        }
        return true;
      } else if (e.key === 'Backspace') {
        // Delete last character
        this.eingabeText = this.eingabeText.slice(0, -1);
        return true;
      } else if (e.key.length === 1) {
        // Add character (only printable characters)
        this.eingabeText += e.key;
        return true;
      }

      return true;
    },

    /**
     * Draw the text input overlay
     */
    zeichneEingabefeld: function () {
      if (!this.eingabeAktiv) return;

      const ctx = this.ctx;
      const breite = this.breite;
      const hoehe = this.hoehe;

      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, breite, hoehe);

      // Input box dimensions
      const boxBreite = 500;
      const boxHoehe = 140;
      const boxX = (breite - boxBreite) / 2;
      const boxY = (hoehe - boxHoehe) / 2;

      // Box background
      ctx.fillStyle = '#12171f';
      ctx.fillRect(boxX, boxY, boxBreite, boxHoehe);

      // Box border with glow effect
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxBreite, boxHoehe);

      // Question text
      ctx.fillStyle = '#e0e6ed';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.eingabeFrage, breite / 2, boxY + 35);

      // Input field background
      const inputX = boxX + 30;
      const inputY = boxY + 55;
      const inputBreite = boxBreite - 60;
      const inputHoehe = 40;

      ctx.fillStyle = '#0d1117';
      ctx.fillRect(inputX, inputY, inputBreite, inputHoehe);

      // Input field border
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(inputX, inputY, inputBreite, inputHoehe);

      // Input text
      ctx.fillStyle = '#e0e6ed';
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';

      // Calculate visible text (with cursor)
      const maxTextWidth = inputBreite - 20;
      let displayText = this.eingabeText;

      // Truncate from left if too long
      while (ctx.measureText(displayText).width > maxTextWidth - 10) {
        displayText = displayText.substring(1);
      }

      ctx.fillText(displayText, inputX + 10, inputY + 27);

      // Blinking cursor
      this.eingabeCursorTimer += 1;
      if (this.eingabeCursorTimer > 30) {
        this.eingabeCursorSichtbar = !this.eingabeCursorSichtbar;
        this.eingabeCursorTimer = 0;
      }

      if (this.eingabeCursorSichtbar) {
        const textWidth = ctx.measureText(displayText).width;
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(inputX + 10 + textWidth + 2, inputY + 8, 2, 24);
      }

      // Hint text
      ctx.fillStyle = '#6b7a8a';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Drücke Enter zum Bestätigen', breite / 2, boxY + boxHoehe + 25);

      // Reset text align
      ctx.textAlign = 'left';
    }
  };

  // Export to global scope
  global._benlang = _benlang;

})(typeof window !== 'undefined' ? window : this);
