// --- Page Navigation and Theme ---

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.style.left = sidebar.style.left === "0px" ? "-250px" : "0px";
}

function showPage(pageId, element) {
  const pages = document.getElementsByClassName("page");
  for (let page of pages) {
    page.classList.remove("active");
  }
  document.getElementById(pageId).classList.add("active");

  const links = document.querySelectorAll(".sidebar a");
  links.forEach(link => link.classList.remove("active"));
  
  if (element) {
    element.classList.add("active");
  } else {
    const targetLink = document.querySelector(`.sidebar a[onclick*="'${pageId}'"]`);
    if (targetLink) {
      targetLink.classList.add("active");
    }
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const btn = document.getElementById("theme-toggle");
  btn.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// --- Slick Carousel Initialization ---
$(document).ready(function () {
  $(".slider").slick({
    autoplay: true,
    autoplaySpeed: 2500,
    dots: true,
    arrows: false,
    fade: true
  });
});


// --- Chatbot Logic (Connected to Backend) ---

function toggleChat() {
  const box = document.getElementById("chatbox");
  box.style.display = box.style.display === "flex" ? "none" : "flex";
}

function handleKeyPress(event) {
  if (event.key === "Enter") processInput();
}

async function processInput() {
  const userInput = document.getElementById("userInput");
  const query = userInput.value.trim();
  if (!query) return;

  addMessage("user", query);
  userInput.value = "";

  try {
    const response = await fetch('https://spinal-tumor-api.onrender.com/api/chatbot/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: query }),
    });

    if (!response.ok) {
      throw new Error('Server responded with an error.');
    }

    const data = await response.json();
    addMessage("bot", data.answer);

  } catch (error) {
    console.error("Chatbot API error:", error);
    addMessage("bot", "Sorry, I'm having trouble connecting right now. Please try again later.");
  }
}

function addMessage(sender, text) {
  const chat = document.getElementById("chat-content");
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "chat-user" : "chat-bot";
  msg.innerHTML = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
  return msg;
}


// --- Google Sign-In Handler ---
async function handleGoogleSignIn(response) {
  const id_token = response.credential;
  const authMessage = document.getElementById('auth-message');
  
  const showAuthMessage = (message, isError = false) => {
      authMessage.textContent = message;
      authMessage.className = 'auth-message-box';
      authMessage.classList.add(isError ? 'error' : 'success');
  };

  try {
    const res = await fetch('https://spinal-tumor-api.onrender.com/api/auth/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: id_token }),
    });
    
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.name);
      window.location.reload(); 
    } else {
      showAuthMessage(data.msg || 'Google Sign-In failed.', true);
    }
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    showAuthMessage('Could not connect to the server for Google Sign-In.', true);
  }
}

// --- Main Logic for Session and Interactive Components ---
document.addEventListener('DOMContentLoaded', () => {
    
    const loginPage = document.getElementById('login-page');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const logoutButtonTop = document.getElementById('logoutButtonTop');
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
    const authMessage = document.getElementById('auth-message');
    const authInputs = document.querySelectorAll('#signInForm input, #signUpForm input');

    const showAppView = () => {
        loginPage.style.display = 'none';
        menuToggleBtn.style.display = 'block';
        sidebar.style.display = 'block';
        logoutButtonTop.style.display = 'block';
        
        const username = localStorage.getItem('username');
        const usernameDisplay = document.getElementById('username-display');
        if (username && usernameDisplay) {
            usernameDisplay.textContent = username;
        }
        showPage('home-dashboard');
    };

    const showLoginView = () => {
        loginPage.style.display = 'block';
        menuToggleBtn.style.display = 'none';
        sidebar.style.display = 'none';
        logoutButtonTop.style.display = 'none';
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        loginPage.classList.add('active');
    };
    
    const showAuthMessage = (message, isError = false) => {
        authMessage.textContent = message;
        authMessage.className = 'auth-message-box';
        authMessage.classList.add(isError ? 'error' : 'success');
    };

    const hideAuthMessage = () => {
        authMessage.className = 'auth-message-box';
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.reload(); 
    };

    if (container) {
        signUpButton.addEventListener('click', () => {
            container.classList.add("right-panel-active");
            hideAuthMessage();
        });
        signInButton.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
            hideAuthMessage();
        });
    }

    authInputs.forEach(input => {
        input.addEventListener('focus', hideAuthMessage);
    });

    logoutButtonTop.addEventListener('click', handleLogout);

    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signUpName').value;
            const email = document.getElementById('signUpEmail').value;
            const password = document.getElementById('signUpPassword').value;

            try {
                const response = await fetch('https://spinal-tumor-api.onrender.com/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });
                const data = await response.json();

                if (response.ok) {
                    showAuthMessage('Registration successful! Please sign in.');
                    signUpForm.reset();
                    container.classList.remove("right-panel-active");
                } else {
                    showAuthMessage(data.msg || 'An error occurred.', true);
                }
            } catch (error) {
                showAuthMessage('Could not connect to the server.', true);
            }
        });
    }

    const signInForm = document.getElementById('signInForm');
    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signInEmail').value;
            const password = document.getElementById('signInPassword').value;

            try {
                const response = await fetch('https://spinal-tumor-api.onrender.com/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.user.name);
                    showAppView();
                } else {
                    showAuthMessage(data.msg || 'An error occurred.', true);
                }
            } catch (error) {
                showAuthMessage('Could not connect to the server.', true);
            }
        });
    }

    const predictButton = document.getElementById('predictButton');
    const mriFileInput = document.getElementById('mriFileInput');
    const predictionResult = document.getElementById('predictionResult');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const clearButton = document.getElementById('clear-button');
    const dropZone = document.getElementById('drop-zone');
    const loader = document.getElementById('loader');
    const sampleImages = document.querySelectorAll('.sample-image');
    let currentFile = null;

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            currentFile = file;
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block';
                dropZone.style.display = 'none';
                predictionResult.textContent = 'Image selected. Click Predict to analyze.';
                predictionResult.className = 'result';
            }
            reader.readAsDataURL(file);
        } else {
            predictionResult.textContent = 'Please select a valid image file.';
            predictionResult.className = 'result error';
        }
    };

    const resetUploader = () => {
        currentFile = null;
        mriFileInput.value = '';
        imagePreviewContainer.style.display = 'none';
        dropZone.style.display = 'block';
        predictionResult.textContent = 'Upload an image to see the prediction.';
        predictionResult.className = 'result';
    };

    if (mriFileInput) {
        dropZone.addEventListener('click', () => mriFileInput.click());
        mriFileInput.addEventListener('change', (event) => handleFile(event.target.files[0]));
    }

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            handleFile(e.dataTransfer.files[0]);
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', resetUploader);
    }
    
    if (predictButton) {
        predictButton.addEventListener('click', async () => {
            if (!currentFile) {
                predictionResult.textContent = "Please select a file first.";
                predictionResult.className = 'result error';
                return;
            }

            loader.style.display = 'block';
            predictButton.disabled = true;
            predictionResult.textContent = "Analyzing... Please wait.";
            predictionResult.className = 'result';
            const formData = new FormData();
            formData.append('mriScan', currentFile);

            try {
                const response = await fetch('https://spinal-tumor-api.onrender.com/api/predict/upload', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();

                if (response.ok) {
                    predictionResult.textContent = `Prediction: ${data.prediction.result} (Confidence: ${data.prediction.confidence})`;
                    predictionResult.classList.add(data.prediction.result === 'Tumor Detected' ? 'positive' : 'negative');
                } else {
                    predictionResult.textContent = `Error: ${data.msg || 'Prediction failed.'}`;
                    predictionResult.classList.add('error');
                }
            } catch (error) {
                predictionResult.textContent = "Error: Could not connect to the server.";
                predictionResult.className = 'result error';
            } finally {
                loader.style.display = 'none';
                predictButton.disabled = false;
            }
        });
    }
    
    sampleImages.forEach(img => {
        img.addEventListener('click', async () => {
            resetUploader();
            predictionResult.textContent = "Loading sample image...";
            try {
                const response = await fetch(img.src);
                const blob = await response.blob();
                const file = new File([blob], 'sample.jpg', { type: blob.type });
                handleFile(file);
            } catch (error) {
                predictionResult.textContent = "Could not load sample image.";
                predictionResult.className = 'result error';
            }
        });
    });

    const modal = document.getElementById('team-modal');
    const closeButton = document.querySelector('.modal .close-button');
    const cards = document.querySelectorAll('.creator-card');

    if (modal && closeButton && cards.length > 0) {
        const openModal = (card) => {
            const name = card.dataset.name;
            const imgSrc = card.dataset.img;
            const bio = card.dataset.bio;
            const skills = card.dataset.skills.split(',');
            const linkedin = card.dataset.linkedin;
            const github = card.dataset.github;

            document.getElementById('modal-name').textContent = name;
            document.getElementById('modal-img').src = imgSrc;
            document.getElementById('modal-bio').textContent = bio;

            const skillsContainer = document.getElementById('modal-skills');
            skillsContainer.innerHTML = '';
            skills.forEach(skill => {
                const skillTag = document.createElement('span');
                skillTag.textContent = skill;
                skillsContainer.appendChild(skillTag);
            });

            const socialContainer = document.getElementById('modal-social');
            socialContainer.innerHTML = '';
            if (linkedin && linkedin !== '#') {
                socialContainer.innerHTML += `<a href="${linkedin}" target="_blank" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>`;
            }
            if (github && github !== '#') {
                socialContainer.innerHTML += `<a href="${github}" target="_blank" aria-label="GitHub"><i class="fab fa-github"></i></a>`;
            }
            modal.style.display = 'block';
        };

        const closeModal = () => {
            modal.style.display = 'none';
        };

        cards.forEach(card => card.addEventListener('click', () => openModal(card)));
        closeButton.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => {
            if (event.target == modal) closeModal();
        });
    }
    
    // --- Initial Check ---
    if (localStorage.getItem('token')) {
        showAppView();
    } else {
        showLoginView();
    }
});

// --- More robust Google Sign-In Initialization ---
window.onload = function () {
  // Check if the user is on the login page before rendering the button
  if (document.getElementById('login-page').style.display !== 'none') {
    try {
      if (typeof google !== 'undefined') {
        const clientId = "556631616994-pul2e57kp0oblfsddj3uslophlrc9v5a.apps.googleusercontent.com";
        console.log("Initializing Google Sign-In with Client ID:", clientId); // Debugging line
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSignIn
        });
        google.accounts.id.renderButton(
          document.getElementById("google-btn-signin"),
          { theme: "outline", size: "large", type: "icon", shape: "circle" }
        );
        google.accounts.id.renderButton(
          document.getElementById("google-btn-signup"),
          { theme: "outline", size: "large", type: "icon", shape: "circle" }
        );
      } else {
        console.error("Google Sign-In script not loaded yet.");
      }
    } catch (error) {
      console.error("Google Sign-In initialization failed:", error);
    }
  }
};

