<template>
  <div class="login-overlay">
    <div class="login-container">
      <!-- Title -->
      <h1 class="game-title">PIXELOZA</h1>
      <h2 class="subtitle">
        {{ isRegisterMode ? "Create account" : "Welcome back!" }}
      </h2>

      <!-- Email Input -->
      <div class="input-group">
        <label>Email</label>
        <input
          v-model="email"
          type="email"
          placeholder="Enter your email"
          @keyup.enter="handleSubmit"
          :disabled="loading"
        />
      </div>

      <!-- Password Input -->
      <div class="input-group">
        <label>Password</label>
        <input
          v-model="password"
          type="password"
          placeholder="Enter your password"
          @keyup.enter="handleSubmit"
          :disabled="loading"
        />
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Status Message -->
      <div class="status-message" :class="statusType">
        {{ statusMessage || "Login to start playing" }}
      </div>

      <!-- Buttons -->
      <div class="button-group">
        <button v-if="!isRegisterMode" @click="handleLogin" :disabled="loading" class="btn-primary">
          {{ loading ? "Logging in..." : "Login" }}
        </button>
        <button
          v-if="isRegisterMode"
          @click="handleRegister"
          :disabled="loading"
          class="btn-primary"
        >
          {{ loading ? "Creating account..." : "Register" }}
        </button>
      </div>

      <!-- Toggle Mode -->
      <div class="toggle-mode">
        <span v-if="!isRegisterMode">
          Don't have an account?
          <a @click="isRegisterMode = true">Register</a>
        </span>
        <span v-else>
          Already have an account?
          <a @click="isRegisterMode = false">Login</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { auth } from "../../config/firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { firebasePersistence } from "../../systems/FirebasePersistence.js";

const emit = defineEmits(["authenticated"]);

const email = ref("");
const password = ref("");
const isRegisterMode = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const statusMessage = ref("");
const statusType = ref("info");

const showStatus = (message, type = "info") => {
  statusMessage.value = message;
  statusType.value = type;
  errorMessage.value = "";
};

const showError = (message) => {
  errorMessage.value = message;
  statusMessage.value = "";
};

const handleSubmit = () => {
  if (isRegisterMode.value) {
    handleRegister();
  } else {
    handleLogin();
  }
};

const handleLogin = async () => {
  if (!email.value || !password.value) {
    showError("Please enter email and password");
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    showStatus("Logging in...", "info");
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);

    console.log("Login successful:", userCredential.user.email);
    showStatus("Login successful! Loading game...", "success");

    // Load character and start game
    await connectAndAuthenticate(userCredential.user);
  } catch (error) {
    console.error("Login error:", error);
    loading.value = false;

    // User-friendly error messages
    if (error.code === "auth/invalid-credential") {
      showError("Invalid email or password");
    } else if (error.code === "auth/user-not-found") {
      showError("No account found with this email");
    } else if (error.code === "auth/wrong-password") {
      showError("Incorrect password");
    } else if (error.code === "auth/too-many-requests") {
      showError("Too many failed attempts. Please try again later.");
    } else {
      showError(error.message);
    }
  }
};

const handleRegister = async () => {
  if (!email.value || !password.value) {
    showError("Please enter email and password");
    return;
  }

  if (password.value.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    showStatus("Creating account...", "info");
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);

    console.log("Registration successful:", userCredential.user.email);
    showStatus("Account created! Loading game...", "success");

    // Load character and start game
    await connectAndAuthenticate(userCredential.user);
  } catch (error) {
    console.error("Registration error:", error);
    loading.value = false;

    // User-friendly error messages
    if (error.code === "auth/email-already-in-use") {
      showError("This email is already registered. Try logging in instead.");
    } else if (error.code === "auth/invalid-email") {
      showError("Invalid email address");
    } else if (error.code === "auth/weak-password") {
      showError("Password is too weak. Use at least 6 characters.");
    } else {
      showError(error.message);
    }
  }
};

const connectAndAuthenticate = async (user) => {
  try {
    showStatus("Loading character data...", "info");

    // Load character data directly from Firestore
    const characterData = await firebasePersistence.loadCharacter(user.uid, user.email);

    if (!characterData) {
      throw new Error("Failed to load character data");
    }

    console.log("Character loaded:", characterData.name);
    showStatus("Success! Starting game...", "success");

    // Wait a moment, then emit authenticated event
    setTimeout(() => {
      emit("authenticated", {
        user,
        characterData,
        userId: user.uid,
      });
    }, 500);
  } catch (error) {
    console.error("Loading error:", error);
    loading.value = false;
    showError(`Failed to load character: ${error.message}`);
  }
};
</script>

<style scoped>
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a0f08 0%, #2a1810 50%, #1a0f08 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  pointer-events: auto;
}

.login-container {
  width: 450px;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 2px solid var(--rpg-border-gold);
  border-radius: 12px;
  padding: 40px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.game-title {
  font-family: "Cinzel", serif;
  font-size: 42px;
  font-weight: 700;
  color: var(--rpg-text-gold);
  text-align: center;
  margin: 0 0 10px 0;
  text-shadow:
    3px 3px 6px rgba(0, 0, 0, 0.9),
    0 0 20px rgba(255, 215, 0, 0.6);
  letter-spacing: 3px;
}

.subtitle {
  font-family: "Quattrocento", serif;
  font-size: 20px;
  color: var(--rpg-text-light);
  text-align: center;
  margin: 0 0 30px 0;
  font-weight: normal;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-family: "Cinzel", serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--rpg-gold-dark);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  font-family: "Quattrocento", serif;
  font-size: 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid var(--rpg-bronze);
  border-radius: 6px;
  color: var(--rpg-text-light);
  transition: all 0.3s ease;
}

.input-group input:focus {
  outline: none;
  border-color: var(--rpg-gold);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
  background: rgba(0, 0, 0, 0.6);
}

.input-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-group input::placeholder {
  color: #666666;
}

.error-message {
  padding: 12px 16px;
  background: rgba(196, 30, 58, 0.2);
  border: 2px solid var(--rpg-red);
  border-radius: 6px;
  color: #ff6b6b;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
}

.status-message {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
  border: 2px solid;
}

.status-message.info {
  background: rgba(65, 105, 225, 0.2);
  border-color: var(--rpg-bronze);
  color: var(--rpg-bronze);
}

.status-message.success {
  background: rgba(154, 205, 50, 0.2);
  border-color: var(--rpg-green);
  color: #9acd32;
}

.button-group {
  margin: 20px 0;
}

.btn-primary {
  width: 100%;
  padding: 14px 20px;
  font-family: "Cinzel", serif;
  font-size: 18px;
  font-weight: 700;
  color: black;
  background: linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%);
  border: 2px solid var(--rpg-gold);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.toggle-mode {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--rpg-text-light);
}

.toggle-mode a {
  color: var(--rpg-gold);
  cursor: pointer;
  text-decoration: underline;
  font-weight: 600;
}

.toggle-mode a:hover {
  color: #ffed4e;
}

.instructions {
  margin-top: 30px;
  text-align: center;
  font-size: 12px;
  color: #666666;
  font-family: "Quattrocento", serif;
}
</style>
