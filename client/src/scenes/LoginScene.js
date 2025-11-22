import Phaser from 'phaser';
import { auth } from '../config/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { socketManager } from '../utils/SocketManager.js';

/**
 * LoginScene - Firebase Authentication interface
 */
export class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
    this.email = '';
    this.password = '';
    this.activeInput = 'email'; // 'email' or 'password'
    this.mode = 'login'; // 'login' or 'register'
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Check if already authenticated
    onAuthStateChanged(auth, (user) => {
      if (user && !this.scene.isActive('GameScene')) {
        console.log('User already logged in:', user.email);
        this.connectAndStartGame();
      }
    });

    // Title
    const title = this.add.text(width / 2, 100, 'MMO RPG GAME', {
      font: 'bold 48px Arial',
      fill: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    });
    title.setOrigin(0.5);

    // Subtitle
    this.subtitleText = this.add.text(width / 2, 170, 'Login to Play', {
      font: '24px Arial',
      fill: '#ffffff'
    });
    this.subtitleText.setOrigin(0.5);

    // Email input
    this.createInputBox(width / 2, 260, 350, 50, 'EMAIL');
    this.emailText = this.add.text(width / 2, 260, '', {
      font: '18px Arial',
      fill: '#ffffff'
    });
    this.emailText.setOrigin(0.5);
    this.emailPlaceholder = this.add.text(width / 2, 260, 'Enter your email...', {
      font: '18px Arial',
      fill: '#666666'
    });
    this.emailPlaceholder.setOrigin(0.5);

    // Email input zone (clickable)
    const emailZone = this.add.zone(width / 2, 260, 350, 50)
      .setInteractive({ useHandCursor: true });
    emailZone.on('pointerdown', () => {
      this.activeInput = 'email';
      this.updateInputStyles();
    });

    // Password input
    this.createInputBox(width / 2, 340, 350, 50, 'PASSWORD');
    this.passwordText = this.add.text(width / 2, 340, '', {
      font: '18px Arial',
      fill: '#ffffff'
    });
    this.passwordText.setOrigin(0.5);
    this.passwordPlaceholder = this.add.text(width / 2, 340, 'Enter your password...', {
      font: '18px Arial',
      fill: '#666666'
    });
    this.passwordPlaceholder.setOrigin(0.5);

    // Password input zone (clickable)
    const passwordZone = this.add.zone(width / 2, 340, 350, 50)
      .setInteractive({ useHandCursor: true });
    passwordZone.on('pointerdown', () => {
      this.activeInput = 'password';
      this.updateInputStyles();
    });

    // Store input box graphics for highlighting
    this.emailBox = { x: width / 2 - 175, y: 260 - 25, width: 350, height: 50 };
    this.passwordBox = { x: width / 2 - 175, y: 340 - 25, width: 350, height: 50 };

    // Login button
    this.loginButton = this.createButton(width / 2 - 90, 420, 160, 50, 'LOGIN', () => {
      this.handleLogin();
    });

    // Register button
    this.registerButton = this.createButton(width / 2 + 90, 420, 160, 50, 'REGISTER', () => {
      this.handleRegister();
    });

    // Status message
    this.statusText = this.add.text(width / 2, 500, '', {
      font: '16px Arial',
      fill: '#888888',
      align: 'center',
      wordWrap: { width: 400 }
    });
    this.statusText.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(width / 2, height - 60,
      'TAB to switch fields • ENTER to login', {
      font: '14px Arial',
      fill: '#666666'
    });
    instructions.setOrigin(0.5);

    // Keyboard input
    this.input.keyboard.on('keydown', (event) => {
      this.handleKeyboard(event);
    });

    // Initial style update
    this.updateInputStyles();
    this.updateDisplay();
  }

  createInputBox(x, y, width, height, label) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(x - width / 2, y - height / 2, width, height);
    graphics.lineStyle(2, 0x444444, 1);
    graphics.strokeRect(x - width / 2, y - height / 2, width, height);

    // Label
    const labelText = this.add.text(x - width / 2 + 10, y - height / 2 - 25, label, {
      font: 'bold 12px Arial',
      fill: '#aaaaaa'
    });

    return { graphics, labelText };
  }

  createButton(x, y, width, height, text, callback) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x4a4a4a, 1);
    graphics.fillRect(x - width / 2, y - height / 2, width, height);
    graphics.lineStyle(2, 0x888888, 1);
    graphics.strokeRect(x - width / 2, y - height / 2, width, height);

    const buttonText = this.add.text(x, y, text, {
      font: 'bold 16px Arial',
      fill: '#ffffff'
    });
    buttonText.setOrigin(0.5);

    const zone = this.add.zone(x, y, width, height)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      graphics.clear();
      graphics.fillStyle(0x6a6a6a, 1);
      graphics.fillRect(x - width / 2, y - height / 2, width, height);
      graphics.lineStyle(2, 0xffd700, 1);
      graphics.strokeRect(x - width / 2, y - height / 2, width, height);
    });

    zone.on('pointerout', () => {
      graphics.clear();
      graphics.fillStyle(0x4a4a4a, 1);
      graphics.fillRect(x - width / 2, y - height / 2, width, height);
      graphics.lineStyle(2, 0x888888, 1);
      graphics.strokeRect(x - width / 2, y - height / 2, width, height);
    });

    zone.on('pointerdown', callback);

    return { graphics, text: buttonText, zone };
  }

  updateInputStyles() {
    // Redraw input boxes with active highlight
    const activeColor = 0xffd700;
    const inactiveColor = 0x444444;

    // Clear and redraw email box
    const emailGraphics = this.add.graphics();
    emailGraphics.fillStyle(0x222222, 1);
    emailGraphics.fillRect(this.emailBox.x, this.emailBox.y, this.emailBox.width, this.emailBox.height);
    emailGraphics.lineStyle(2, this.activeInput === 'email' ? activeColor : inactiveColor, 1);
    emailGraphics.strokeRect(this.emailBox.x, this.emailBox.y, this.emailBox.width, this.emailBox.height);

    // Clear and redraw password box
    const passwordGraphics = this.add.graphics();
    passwordGraphics.fillStyle(0x222222, 1);
    passwordGraphics.fillRect(this.passwordBox.x, this.passwordBox.y, this.passwordBox.width, this.passwordBox.height);
    passwordGraphics.lineStyle(2, this.activeInput === 'password' ? activeColor : inactiveColor, 1);
    passwordGraphics.strokeRect(this.passwordBox.x, this.passwordBox.y, this.passwordBox.width, this.passwordBox.height);
  }

  handleKeyboard(event) {
    if (event.key === 'Enter') {
      this.handleLogin();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.activeInput = this.activeInput === 'email' ? 'password' : 'email';
      this.updateInputStyles();
    } else if (event.key === 'Backspace') {
      if (this.activeInput === 'email') {
        this.email = this.email.slice(0, -1);
      } else {
        this.password = this.password.slice(0, -1);
      }
      this.updateDisplay();
    } else if (event.key.length === 1) {
      // Add character to active input
      if (this.activeInput === 'email' && this.email.length < 50) {
        this.email += event.key;
      } else if (this.activeInput === 'password' && this.password.length < 50) {
        this.password += event.key;
      }
      this.updateDisplay();
    }
  }

  updateDisplay() {
    // Update email
    this.emailText.setText(this.email);
    this.emailPlaceholder.setVisible(this.email.length === 0);

    // Update password (masked)
    this.passwordText.setText('•'.repeat(this.password.length));
    this.passwordPlaceholder.setVisible(this.password.length === 0);
  }

  showStatus(message, color = '#888888') {
    this.statusText.setText(message);
    this.statusText.setFill(color);
  }

  async handleLogin() {
    const email = this.email.trim();
    const password = this.password;

    if (!email || !password) {
      this.showStatus('Please enter email and password', '#ff4444');
      return;
    }

    this.showStatus('Logging in...', '#ffff00');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user.email);
      this.showStatus('Login successful! Connecting to server...', '#00ff00');

      // Connect to game server
      await this.connectAndStartGame();
    } catch (error) {
      console.error('Login error:', error);
      this.showStatus(`Login failed: ${error.message}`, '#ff4444');
    }
  }

  async handleRegister() {
    const email = this.email.trim();
    const password = this.password;

    if (!email || !password) {
      this.showStatus('Please enter email and password', '#ff4444');
      return;
    }

    if (password.length < 6) {
      this.showStatus('Password must be at least 6 characters', '#ff4444');
      return;
    }

    this.showStatus('Creating account...', '#ffff00');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registration successful:', userCredential.user.email);
      this.showStatus('Account created! Connecting to server...', '#00ff00');

      // Connect to game server
      await this.connectAndStartGame();
    } catch (error) {
      console.error('Registration error:', error);
      this.showStatus(`Registration failed: ${error.message}`, '#ff4444');
    }
  }

  async connectAndStartGame() {
    try {
      this.showStatus('Connecting to game server...', '#ffff00');

      // Connect to server
      socketManager.connect();

      // Wait for connection
      await new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (socketManager.connected) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          if (!socketManager.connected) {
            throw new Error('Connection timeout');
          }
        }, 10000);
      });

      // Authenticate with server
      this.showStatus('Authenticating...', '#ffff00');
      const authData = await socketManager.authenticate();

      console.log('Authenticated with server, starting game...');
      this.showStatus('Success! Starting game...', '#00ff00');

      // Store character data for GameScene
      this.registry.set('characterData', authData.character);
      this.registry.set('userId', authData.userId);

      // Start game after short delay
      this.time.delayedCall(1000, () => {
        this.scene.start('GameScene');
      });

    } catch (error) {
      console.error('Connection error:', error);
      this.showStatus(`Connection failed: ${error.message}`, '#ff4444');
    }
  }
}
