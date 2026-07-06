# PPE-DETECTION-
Tech Sangram 2026 project


***

# 🛡️ PPE.AI: Industrial Safety Intelligence Monitor

**PPE.AI** is a real-time computer vision solution designed to monitor worksites for Personal Protective Equipment (PPE) compliance. Using the **Roboflow Serverless Workflow API**, the system detects personnel and verifies if they are wearing Hard Hats, Safety Vests, and Gloves based on spatial coordinate logic.

![Dashboard Preview](https://img.shields.io/badge/UI-Industrial_Navy-00f2ff?style=for-the-badge)
![API-Roboflow](https://img.shields.io/badge/API-Roboflow_Workflows-6706ce?style=for-the-badge)
![Status-Operational](https://img.shields.io/badge/Status-Operational-00ff88?style=for-the-badge)

---

## ✨ Key Features

*   **Dual-Stream Monitoring**:
    *   **Photo Mode**: Manual capture using any keyboard key. Features a "Freeze-Frame" review where the snapshot sticks on screen during analysis.
    *   **Live Mode**: Automated scanning with a configurable interval (default: 5 seconds).
*   **Intelligent Safety Logic**: Verifies PPE by calculating the spatial intersection of equipment bounding boxes and person bounding boxes.
*   **Tri-State LED Alert System**: Instant visual feedback (Green/Yellow/Red).
*   **Audio & AI Feedback**: 
    *   **Buzzer**: High-pitched discordant alarm for critical violations.
    *   **TTS (Text-to-Speech)**: System speaks safety instructions dynamically.
    *   **AI Report**: Generates context-aware safety directives using Hugging Face GPT-2.

---

## 🛠️ Tech Stack

*   **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript (ES6).
*   **Icons**: Lucide-React.
*   **Inference**: [Roboflow Serverless Workflows](https://roboflow.com).
*   **LLM Reporting**: Hugging Face Inference API (GPT-2).
*   **Audio**: Web Audio API & Web Speech Synthesis.

---

## ⚙️ Setup & Installation

1.  **Clone or Download** the project files:
    *   `index.html`
    *   `style.css`
    *   `script.js`
    *   `env.js`

2.  **Configure API Keys**:
    Open `env.js` and enter your credentials. This file keeps your keys separate from the main logic.
    ```javascript
    window.ENV = {
        ROBOFLOW_API_KEY: 'YOUR_ROBOFLOW_KEY',
        HF_API_KEY: 'YOUR_HUGGINGFACE_TOKEN'
    };
    ```

3.  **Run Local Server**:
    Due to browser security (CORS) and webcam requirements, the project **must** be run through a local server.
    *   **VS Code**: Install the "Live Server" extension, right-click `index.html`, and select "Open with Live Server".
    *   **Python**: Run `python -m http.server 8000` in the directory.

---

## 🧠 Safety Logic Table

The system evaluates safety based on the following rules:

| Condition | Status | Action |
| :--- | :--- | :--- |
| No personnel detected in frame | 🟢 **Green** | "Site Secure" |
| Every person has a Helmet + Vest + 2 Gloves | 🟢 **Green** | "Compliance 100%" |
| Person has Helmet but missing Vest or Gloves | 🟡 **Yellow** | "Incomplete PPE" |
| Person detected without a Hard Hat | 🔴 **Red** | **Siren + High Alert** |

---

## 🚀 Deployment Guide

### Option 1: GitHub Pages (Recommended)
1.  Create a new repository on GitHub.
2.  Upload `index.html`, `style.css`, `script.js`, and `env.js`.
3.  Go to **Settings** > **Pages**.
4.  Select the `main` branch and click **Save**.
5.  Your site will be live at `https://<username>.github.io/<repo-name>/`.

### Option 2: Vercel / Netlify
1.  Drag and drop the folder into the Vercel/Netlify dashboard.
2.  The platform will automatically detect the entry point (`index.html`) and provide a secure HTTPS URL.

---

## 📝 Important Notes

*   **Class Mapping**: The model uses the class `helmet` or `head_helmet`, which the GUI automatically maps to the label **"Hard Hat"**.
*   **Glove Detection**: The logic requires **2 gloves** detected within a person's bounding box to grant "Safe" status for that specific person.
*   **CORS**: If you encounter a `CORS Error` while testing on `localhost`, please enable a CORS-extension in your browser or ensure your Roboflow workspace allows requests from your specific domain.

---

## 👨‍💻 Project Structure

```text
├── index.html   # Dashboard Layout & Overlays
├── style.css    # Custom Neon Industrial Theme & Animations
├── script.js    # Bounding Box Logic, API Fetching, TTS, & State Management
├── env.js       # Secret Key Storage (Do not commit to public repos)
└── README.md    # Documentation
```

***

### 🔗 Useful Links
*   [Roboflow Documentation](https://docs.roboflow.com)
*   [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)
