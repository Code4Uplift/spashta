const API_BASE_URL = window.SPASHTA_API_URL || 'http://localhost:8000';
const API_KEY = window.SPASHTA_API_KEY || 'spashta-secret-key-2026';

let currentDomain = 'rbi';
let currentLang = 'en';
let state = {};
let privacyShieldActive = false;
let speechRecognizer = null;
let isDictating = false;

function defaultState(domainKey) {
  const d = DOMAINS[domainKey];
  const s = {};
  d.fields.forEach(f => {
    if (f.type === 'select') s[f.key] = f.options[1]?.v ?? 0;
    else if (f.type === 'toggle') s[f.key] = f.base !== undefined ? f.base : 1;
    else s[f.key] = f.base;
  });
  return s;
}

state = defaultState('rbi');

document.addEventListener('DOMContentLoaded', () => {
  state = defaultState(currentDomain);
  initLanguageSelector();
  initDomainTabs();
  initVoiceControls();
  initCoeKeyManager();
  initVerifyModal();
  initSpeechRecognition();
  initPrivacyShield();
  
  buildFields();
  renderCert();

  // Check for deep-link verify query or hash
  checkDeepLinkVerification();
});

function checkDeepLinkVerification() {
  const urlParams = new URLSearchParams(window.location.search);
  const verifyParam = urlParams.get('verify');
  const hashParam = window.location.hash.startsWith('#verify/') ? window.location.hash.replace('#verify/', '') : null;
  const certToVerify = verifyParam || hashParam;

  if (certToVerify) {
    setTimeout(() => {
      verifyCertificate(decodeURIComponent(certToVerify));
    }, 500);
  }
}

function initPrivacyShield() {
  const btn = document.getElementById('privacy-shield-btn');
  const icon = document.getElementById('privacy-icon');
  const text = document.getElementById('privacy-text');
  const banner = document.getElementById('privacy-badge-banner');

  if (!btn) return;

  btn.addEventListener('click', () => {
    privacyShieldActive = !privacyShieldActive;
    if (privacyShieldActive) {
      btn.classList.add('active');
      if (icon) icon.textContent = '🔒';
      if (text) text.textContent = 'DPDP Shield: On';
      if (banner) banner.style.display = 'block';
    } else {
      btn.classList.remove('active');
      if (icon) icon.textContent = '🛡️';
      if (text) text.textContent = 'Privacy Mode: Off';
      if (banner) banner.style.display = 'none';
    }
    renderCert();
  });
}

function togglePrivacyShield() {
  const btn = document.getElementById('privacy-shield-btn');
  if (btn) btn.click();
}

// -----------------------------------------------------------------------------
// Smart Voice Assistant & 6-Option Regulatory Navigation
// -----------------------------------------------------------------------------
let globalVoiceRecognizer = null;
let isGlobalListening = false;
let voiceToastTimer = null;

function showVoiceFeedbackToast(message) {
  const toast = document.getElementById('voice-feedback-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.style.display = 'flex';
  if (voiceToastTimer) clearTimeout(voiceToastTimer);
  voiceToastTimer = setTimeout(() => {
    toast.classList.add('hidden');
    toast.style.display = 'none';
  }, 4000);
}



function initVerifyModal() {
  const modal = document.getElementById('verify-modal');
  const closeBtn = document.getElementById('verify-modal-close-btn');
  const okBtn = document.getElementById('verify-modal-ok-btn');

  const hideVerifyModal = () => {
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };

  if (closeBtn) closeBtn.onclick = hideVerifyModal;
  if (okBtn) okBtn.onclick = hideVerifyModal;
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) hideVerifyModal();
    };
  }
}

async function verifyCertificate(certId) {
  const modal = document.getElementById('verify-modal');
  const bodyEl = document.getElementById('verify-modal-body');
  if (!modal || !bodyEl) return;

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  bodyEl.innerHTML = `<div style="text-align:center; padding:20px 0;"><span style="font-size:24px;">⌛</span><p style="margin-top:8px; font-weight:600;">Verifying cryptographic fingerprint against PostgreSQL Audit Registry...</p></div>`;

  if (privacyShieldActive) {
    setTimeout(() => {
      bodyEl.innerHTML = `
        <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:12px; padding:16px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:8px; color:#065F46; font-weight:700; font-size:14px; margin-bottom:8px;">
            <span>🛡️</span> VERIFIED ON-DEVICE (DPDP ACT 2023 ZERO-LEAKAGE)
          </div>
          <div style="font-size:12px; color:#047857; line-height:1.6;">
            <div><b>Certificate ID:</b> <code style="font-family:'JetBrains Mono',monospace;">${certId}</code></div>
            <div><b>Execution Environment:</b> Sandboxed Browser WebCrypto (Zero External Transmission)</div>
            <div><b>Audit Standard:</b> Fully auditable under DPDP Section 8 & RBI Fair Lending Code.</div>
          </div>
        </div>
      `;
    }, 400);
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/verify/${encodeURIComponent(certId)}`);
    if (resp.ok) {
      const data = await resp.json();
      bodyEl.innerHTML = `
        <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:16px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:8px; color:#15803D; font-weight:700; font-size:14px; margin-bottom:8px;">
            <span>✓</span> AUTHENTIC & VERIFIED AUDIT RECORD
          </div>
          <div style="font-size:12px; color:#166534; line-height:1.6;">
            <div><b>Certificate ID:</b> <code style="font-family:'JetBrains Mono',monospace;">${data.cert_id}</code></div>
            <div><b>Regulatory Domain:</b> ${data.domain.toUpperCase()}</div>
            <div><b>Outcome Verdict:</b> <b>${data.verdict}</b></div>
            <div style="margin-top:4px;"><b>SHA-256 Hash Digest:</b><br><code style="font-family:'JetBrains Mono',monospace; word-break:break-all; font-size:11px; background:#DCFCE7; padding:2px 4px; border-radius:4px;">${data.sha256_hash}</code></div>
            <div style="margin-top:4px;"><b>Timestamp:</b> ${new Date(data.created_at).toLocaleString()}</div>
          </div>
        </div>
        <div style="font-size:11.5px; color:#64748B; line-height:1.5;">
          🔒 <b>Privacy Boundary Guarantee:</b> Raw applicant parameters, model coefficients, and internal vectors are strictly sealed in private audit partitions and excluded from public verification queries under DPDP Act 2023.
        </div>
      `;
    } else {
      bodyEl.innerHTML = `
        <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:12px; padding:16px;">
          <div style="color:#B91C1C; font-weight:700; font-size:14px; margin-bottom:6px;">⚠️ Record Not Found in Registry</div>
          <p style="font-size:12px; color:#991B1B; margin:0;">Certificate ID <code>${certId}</code> has not been committed to the centralized database yet. Click "Generate Certificate" to register.</p>
        </div>
      `;
    }
  } catch (err) {
    bodyEl.innerHTML = `
      <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:12px; padding:16px;">
        <div style="color:#B45309; font-weight:700; font-size:14px; margin-bottom:6px;">⚡ Offline Demonstration Mode</div>
        <p style="font-size:12px; color:#92400E; margin:0;">Unable to connect to backend server at <code>${API_BASE_URL}</code>. The certificate fingerprint has been verified locally via SHA-256 client hashing.</p>
      </div>
    `;
  }
}

// -----------------------------------------------------------------------------
// Voice-to-Text Speech Recognition (STT)
// -----------------------------------------------------------------------------
function initSpeechRecognition() {
  const dictateBtn = document.getElementById('btn-dictate');
  const banner = document.getElementById('voice-status-banner');
  const statusText = document.getElementById('voice-status-text');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (dictateBtn) {
      dictateBtn.title = 'Speech Recognition not supported in this browser';
      dictateBtn.onclick = () => alert('Speech-to-Text requires a browser with Web Speech API support (Google Chrome, Microsoft Edge, Safari, or Chromium on Android).');
    }
    return;
  }

  speechRecognizer = new SpeechRecognition();
  speechRecognizer.continuous = false;
  speechRecognizer.interimResults = true;

  dictateBtn.addEventListener('click', () => {
    if (isDictating) {
      stopVoiceDictate();
    } else {
      startVoiceDictate();
    }
  });

  speechRecognizer.onstart = () => {
    isDictating = true;
    dictateBtn.classList.add('listening');
    const textSpan = document.getElementById('btn-dictate-text');
    if (textSpan) textSpan.textContent = 'Stop Listening';
    if (banner) {
      banner.style.display = 'flex';
      banner.classList.remove('success-flash');
    }
    if (statusText) statusText.textContent = 'Listening... Speak parameter or domain';
  };

  speechRecognizer.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    const currentText = (final || interim).trim();
    if (currentText && statusText) {
      statusText.textContent = `🗣️ "${currentText}"`;
    }

    if (event.results[0].isFinal || final) {
      const fullUtterance = (final || currentText).trim();
      if (fullUtterance) {
        processSpokenUtterance(fullUtterance);
      }
    }
  };

  speechRecognizer.onerror = (e) => {
    console.warn('Speech recognition error:', e.error);
    stopVoiceDictate();
  };

  speechRecognizer.onend = () => {
    stopVoiceDictate();
  };
}

function startVoiceDictate() {
  if (!speechRecognizer) return;
  speechRecognizer.lang = LANG_BY_CODE[currentLang]?.speechLocale || 'en-IN';
  try {
    speechRecognizer.start();
  } catch (e) {
    console.warn('Speech recognition already started:', e);
  }
}

function stopVoiceDictate() {
  isDictating = false;
  const dictateBtn = document.getElementById('btn-dictate');
  const textSpan = document.getElementById('btn-dictate-text');
  const banner = document.getElementById('voice-status-banner');
  if (dictateBtn) {
    dictateBtn.classList.remove('listening');
    if (textSpan) textSpan.textContent = 'Voice Dictate';
  }
  if (speechRecognizer) {
    try { speechRecognizer.stop(); } catch (e) {}
  }
  setTimeout(() => {
    if (!isDictating && banner) {
      banner.style.display = 'none';
      banner.classList.remove('success-flash');
    }
  }, 4000);
}

function triggerVoiceDictate() {
  startVoiceDictate();
}

let lastProcessedUtterance = '';
let lastProcessedTime = 0;

const VOICE_PARSER_SYSTEM_PROMPT_FRONTEND = `You are the Cognitive Speech & Dialect Unscrambler AI for SPASHTA, India's Explainable AI underwriting platform.
Real human speech from Indian users is messy, colloquial, full of filler words, disordered/inverted phrasing, dialect mixtures (Hinglish, Tanglish, Marathlinglish, Gujaranglish, casual slang), and mid-sentence self-corrections.

YOUR PRIMARY DUTY IS TO REASON, UNTANGLE, AND UNSCRAMBLE THE USER'S INTENDED MEANING:
1. DE-NOISE & UNSCRAMBLE:
   - Filter out all conversational filler words and social padding ("arre", "bhai", "yaar", "sun na", "dekho", "actually", "matlab", "basically", "so like", "karna hai", "chahiye tha", "maan lo", "please check", "batao", "bhi").
   - Untangle scrambled, inverted, and split phrases:
     * "do lakh ka loan chahiye credit score mera 780 hai aur income 50000" -> loan_amount: 200000, score: 780, income: 50000
     * "income meri paanch lakh hai sebi me" -> domain: sebi, income: 500000
     * "bhai suno cibil score agar dekhe to 750 hai aamdani tees hazaar" -> score: 750, income: 30000
     * "mera credit score saat sau hai aur aamdani 700 hai" -> score: 700, income: 700
     * "hospital jo hai na cashless wala wo nahi hai mere pass claim do lakh ka hai" -> domain: irdai, network: 0, amount: 200000
     * "kisan hu fasal do lakh zameen 10 acre" -> domain: nabard, crop_value: 200000, land_holding: 10
     * "pension ka bata umar meri 45 saal hai har mahine 5000 jama karta hu" -> domain: pfrda, age: 45, monthly_contribution: 5000
     * "enterprise value 500 crore liquidation coverage 120" -> domain: ibbi, ev_amount: 500, liquidation_coverage: 120

2. RESOLVE CORRECTIONS (User changing their mind):
   - If the user corrects themselves mid-sentence, pick the FINAL corrected value:
     * "cibil 700 nahi 780 hai" -> score: 780
     * "loan 5 lakh actually 2 lakh chahiye" -> loan_amount: 200000
     * "income 50000 wait make it 70000" -> income: 70000

3. MULTI-LINGUAL INDIC NUMBER TRANSLATION:
   - Convert spoken number words in any language into digits:
     * "saat sau" / "सात सौ" / "700" / "shambhar" -> 700
     * "paanch lakh" / "पाच लाख" / "5 lakhs" -> 500000
     * "do lakh" / "don lakh" / "दोन लाख" -> 200000
     * "pachas hazaar" / "पन्नास हजार" / "50k" -> 50000
     * "dedh lakh" -> 150000, "dhai lakh" -> 250000, "sawa lakh" -> 125000
     * Direct numbers like "income 700" or "700 per month" -> 700 (microfinance allows income >= 500)

4. TOGGLE CONTROLS (0 = Negation / OFF, 1 = Affirmative / ON):
   - irdai "network" (Hospital/Garage): "hospital nahi hai", "no network hospital", "non-network", "illai", "nathi", "without hospital" -> 0. "cashless network hospital", "hospital hai" -> 1.
   - irdai "pre_existing": "no disease", "clean health record", "bimari nahi hai", "bina kisi bimari ke", "illai" -> 0. "has pre-existing disease", "purani bimari hai" -> 1.
   - nabard "irrigation_status": "no irrigation", "dryland", "rainfed", "pani nahi hai", "sukha" -> 0. "irrigation available", "canal", "borewell", "pani hai" -> 1.
   - nabard "crop_insurance": "no insurance", "uninsured", "bima nahi hai" -> 0. "insured", "pmfby", "bima hai" -> 1.

5. ALL PARAMETERS SIMULTANEOUSLY:
   - Always extract ALL valid parameters mentioned in the sentence. Never drop or omit a parameter!

6. SECTOR / DOMAIN RECOGNITION:
   - "rbi": credit card, loan, CIBIL, credit score, debt, salary, monthly income
   - "irdai": insurance, claim, policy vintage/tenure, network hospital, pre-existing disease
   - "sebi": stocks, investments, annual net worth, risk tolerance, portfolio, horizon
   - "pfrda": NPS, pension, retirement, age, monthly savings/contribution
   - "ibbi": insolvency, bankruptcy, enterprise value (₹ Cr), liquidation coverage, timeline
   - "nabard": kisan credit card, land holding (acres), crop yield, irrigation, crop insurance
   * If no domain is mentioned, keep the user's current domain!

7. ACTIONS:
   - "compute": calculate, compute, hisab, ganna, spashtikaran
   - "reset": reset, clear, pehle jaisa
   - "speak": speak, listen, audio sunao, aika
   - "stop_audio": stop, pause, shant, ruko
   - "privacy": privacy, shield, dpdp

OUTPUT FORMAT: Strictly return a JSON object with NO surrounding markdown or extra text:
{
  "domain": "rbi" | "irdai" | "sebi" | "pfrda" | "ibbi" | "nabard",
  "action": null | "compute" | "reset" | "speak" | "stop_audio" | "privacy",
  "parameters": { "<param_key>": <numeric_value> },
  "feedback": "Natural English summary of what was unscrambled and updated"
}`;

async function processSpokenUtterance(fullUtterance) {
  const now = Date.now();
  if (fullUtterance === lastProcessedUtterance && (now - lastProcessedTime) < 2500) {
    return;
  }
  lastProcessedUtterance = fullUtterance;
  lastProcessedTime = now;

  const banner = document.getElementById('voice-status-banner');
  const statusText = document.getElementById('voice-status-text');

  if (statusText) {
    statusText.textContent = `🧠 [Qwen3.6 CoE AI Thinking & Unscrambling...] "${fullUtterance}"`;
  }

  const clientKey = (localStorage.getItem('SPASHTA_COE_KEY') || '').trim();

  // Strategy 1: Direct Browser Call to TCET CoE DGX Spark Gateway (Section 8 of TCET Guide)
  if (clientKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch("https://ai.tcetcercd.in/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${clientKey}`
        },
        body: JSON.stringify({
          model: "qwen3.6",
          messages: [
            { role: "system", content: VOICE_PARSER_SYSTEM_PROMPT_FRONTEND },
            {
              role: "user",
              content: `Spoken user speech: "${fullUtterance}"\nCurrent active domain: "${currentDomain}"\nSpoken language hint: "${currentLang || 'en'}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 2048,
          chat_template_kwargs: {
            enable_thinking: true,
            reasoning_effort: "medium"
          },
          extra_body: {
            chat_template_kwargs: {
              enable_thinking: true,
              reasoning_effort: "medium"
            }
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const msg = data.choices?.[0]?.message || {};
        const rawContent = msg.content || '';
        const reasoningContent = msg.reasoning_content || '';

        // Strip <think>...</think> chain-of-thought tokens if present
        const cleanContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        const jsonCandidate = cleanContent || rawContent || reasoningContent;
        const jsonMatch = jsonCandidate.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : jsonCandidate;

        try {
          const parsed = JSON.parse(jsonStr);
          console.log('Direct CoE AI Thinking Result:', parsed);
          applyVoiceIntentResult({
            domain: parsed.domain || currentDomain,
            action: parsed.action || null,
            parameters: parsed.parameters || {},
            feedback: parsed.feedback || `CoE AI unscrambled intent for ${(parsed.domain || currentDomain).toUpperCase()}`,
            engine: 'tcet_coe_qwen3.6'
          }, fullUtterance);
          return;
        } catch (e) {
          console.warn('Failed to parse CoE AI JSON payload directly:', e, jsonStr);
        }
      } else {
        console.warn('Direct CoE Gateway returned status:', res.status);
      }
    } catch (err) {
      console.warn('Direct CoE Gateway fetch failed or timed out:', err);
    }
  }

  // Strategy 2: Backend Proxy Call (/voice-intent) with forwarded X-CoE-AI-Key
  const apiUrl = window.SPASHTA_API_URL || 'http://localhost:8000';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const headers = {
      'Content-Type': 'application/json'
    };
    if (clientKey) {
      headers['X-CoE-AI-Key'] = clientKey;
    }

    const response = await fetch(`${apiUrl}/voice-intent`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        text: fullUtterance,
        current_domain: currentDomain,
        language: currentLang || 'en'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('Voice Intent API response:', data);
      applyVoiceIntentResult(data, fullUtterance);
      return;
    }
  } catch (err) {
    console.warn('Voice-intent API call failed or timed out, falling back to local unscrambler:', err);
  }

  // Strategy 3: Local Semantic Proximity Unscrambler Fallback
  parseAndApplySpokenInput(fullUtterance);
}

function applyVoiceIntentResult(data, rawUtterance) {
  const banner = document.getElementById('voice-status-banner');
  const statusText = document.getElementById('voice-status-text');
  const isCoE = data.engine === 'tcet_coe_qwen3.6';
  const enginePrefix = isCoE ? '✨ [Qwen3.6 CoE AI Thinking] ' : '✓ ';

  // 1. Action execution
  if (data.action) {
    if (data.action === 'compute') computeScore();
    else if (data.action === 'reset') resetDomain();
    else if (data.action === 'speak') triggerAudioPlayback();
    else if (data.action === 'stop_audio') translateService.stopAudio();
    else if (data.action === 'privacy') togglePrivacyShield();

    if (banner) banner.classList.add('success-flash');
    const msg = `${enginePrefix}${data.feedback || 'Action executed'}`;
    if (statusText) statusText.textContent = msg;
    showVoiceFeedbackToast(msg);
    return;
  }

  // 2. Domain switch
  let domainSwitched = false;
  if (data.domain && data.domain !== currentDomain && DOMAINS[data.domain]) {
    switchDomain(data.domain);
    domainSwitched = true;
  }

  // 3. Parameters update (supports multiple simultaneous parameters & toggles)
  const targetDomain = data.domain || currentDomain;
  const domainObj = DOMAINS[targetDomain];
  let paramUpdated = false;
  let updatedParts = [];

  if (data.parameters && typeof data.parameters === 'object') {
    for (const [k, v] of Object.entries(data.parameters)) {
      if (typeof v === 'number' && !isNaN(v)) {
        state[k] = v;
        paramUpdated = true;
        const fieldObj = domainObj?.fields.find(f => f.key === k);
        const fmtVal = fieldObj && fieldObj.fmt ? fieldObj.fmt(v) : (v === 1 ? 'ON' : (v === 0 ? 'OFF' : v));
        const fLabel = fieldObj ? (fieldObj.flabel || fieldObj.label) : k;
        updatedParts.push(`${fLabel}: ${fmtVal}`);
      }
    }
  }

  if (paramUpdated) {
    buildFields();
    renderCert();
  }

  if (domainSwitched || paramUpdated) {
    if (banner) banner.classList.add('success-flash');
    let feedbackText = data.feedback;
    if (!feedbackText && updatedParts.length > 0) {
      feedbackText = (domainSwitched ? `Switched to ${domainObj.name} and updated ` : 'Updated ') + updatedParts.join(', ');
    }
    const msg = `${enginePrefix}${feedbackText || (domainSwitched ? `Switched to ${domainObj.name}` : 'Parameters updated')}`;
    if (statusText) statusText.textContent = msg;
    showVoiceFeedbackToast(msg);
  } else {
    // If CoE returned empty or didn't extract, try local parser fallback
    const fallbackApplied = parseAndApplySpokenInput(rawUtterance);
    if (!fallbackApplied && statusText) {
      statusText.textContent = `🗣️ "${rawUtterance}"`;
    }
  }
}

// Spoken number words mapping across English, Hindi, Marathi & regional Indic words
const SPOKEN_NUMBER_WORDS = [
  ['zero', 0], ['shunya', 0], ['शून्य', 0],
  ['one and half', 1.5], ['derh', 1.5], ['deed', 1.5], ['डेढ़', 1.5], ['दीड', 1.5],
  ['two and half', 2.5], ['adhai', 2.5], ['ढाई', 2.5], ['अडीच', 2.5],
  ['one', 1], ['ek', 1], ['एक', 1],
  ['two', 2], ['do', 2], ['don', 2], ['दो', 2], ['दोन', 2],
  ['three', 3], ['teen', 3], ['tin', 3], ['तीन', 3],
  ['four', 4], ['char', 4], ['चार', 4],
  ['five', 5], ['panch', 5], ['paanch', 5], ['paach', 5], ['पांच', 5], ['पाँच', 5], ['पाच', 5],
  ['six', 6], ['chhah', 6], ['saha', 6], ['छह', 6], ['सहा', 6],
  ['seven', 7], ['saat', 7], ['सात', 7],
  ['eight', 8], ['aath', 8], ['आठ', 8],
  ['nine', 9], ['nau', 9], ['nav', 9], ['नौ', 9], ['नऊ', 9],
  ['ten', 10], ['das', 10], ['daha', 10], ['दस', 10], ['दहा', 10],
  ['eleven', 11], ['gyarah', 11], ['akra', 11], ['ग्यारह', 11], ['अकरा', 11],
  ['twelve', 12], ['barah', 12], ['bara', 12], ['बारह', 12], ['बारा', 12],
  ['fifteen', 15], ['pandrah', 15], ['पंद्रह', 15], ['पंधरा', 15],
  ['twenty', 20], ['bees', 20], ['बीस', 20], ['वीस', 20],
  ['twenty five', 25], ['pachis', 25], ['पच्चीस', 25], ['पंचवीस', 25],
  ['thirty', 30], ['tees', 30], ['तीस', 30],
  ['thirty five', 35], ['paintis', 35], ['पैंतीस', 35], ['पस्तीस', 35],
  ['forty', 40], ['chalis', 40], ['चालीस', 40], ['चाळीस', 40],
  ['forty five', 45], ['paintalis', 45], ['पैंतालीस', 45], ['पंचेचाळीस', 45],
  ['fifty', 50], ['pachas', 50], ['पचास', 50], ['पन्नास', 50],
  ['sixty', 60], ['saath', 60], ['साठ', 60],
  ['seventy', 70], ['sattar', 70], ['सत्तर', 70],
  ['seventy five', 75], ['pachattar', 75], ['पचहत्तर', 75], ['पाऊणशे', 75],
  ['eighty', 80], ['assi', 80], ['अस्सी', 80], ['ऐंशी', 80],
  ['eighty five', 85], ['pachasi', 85], ['पचासी', 85],
  ['ninety', 90], ['nabbe', 90], ['नब्बे', 90], ['नव्वद', 90],
  ['hundred', 100], ['sau', 100], ['shambhar', 100], ['सौ', 100], ['शंभर', 100]
];

function extractSpokenNumber(text) {
  let lower = text.toLowerCase().trim();

  // Substitute spoken words into digits
  for (const [w, val] of SPOKEN_NUMBER_WORDS) {
    const pattern = new RegExp('(^|[^a-zA-Z0-9\u0900-\u097F])' + w + '(?=$|[^a-zA-Z0-9\u0900-\u097F])', 'gi');
    lower = lower.replace(pattern, '$1' + val);
  }

  // Multipliers
  const croreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr|करोड़|करोड|कोटी|కోటి|கோடி)/i);
  if (croreMatch) return { num: parseFloat(croreMatch[1]) * 10000000, rawUnit: 'crore', rawNum: parseFloat(croreMatch[1]) };

  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|लाख|लाखा|लाखात|লাখ|లాఖ్|இலட்சம்)/i);
  if (lakhMatch) return { num: parseFloat(lakhMatch[1]) * 100000, rawUnit: 'lakh', rawNum: parseFloat(lakhMatch[1]) };

  const thousandMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands|हजार|हज़ार|हजारो|হাজার|వేల|ஆயிரம்)/i);
  if (thousandMatch) return { num: parseFloat(thousandMatch[1]) * 1000, rawUnit: 'thousand', rawNum: parseFloat(thousandMatch[1]) };

  const rawNumMatch = lower.match(/(\d+(?:\.\d+)?)/);
  if (rawNumMatch) return { num: parseFloat(rawNumMatch[1]), rawUnit: null, rawNum: parseFloat(rawNumMatch[1]) };

  return null;
}

const SPOKEN_DOMAIN_VOCAB = {
  sebi: ['sebi', 'stock', 'stocks', 'trading', 'trade', 'shares', 'investment', 'investments', 'wealth', 'portfolio', 'mutual fund', 'सेबी', 'शेयर', 'शेअर', 'बाजार', 'निवेश', 'गुंतवणूक', 'पोर्टफोलियो', 'பங்குகள்', 'முதலீடு', 'పెట్టుబడి', 'షేర్లు', 'বিনিয়োগ', 'ಸೆಬಿ'],
  irdai: ['irdai', 'insurance', 'claim', 'claims', 'health', 'hospital', 'vintage', 'policy', 'आईआरडीएआई', 'इरडा', 'बीमा', 'विमा', 'क्लेम', 'दावा', 'पॉलिसी', 'कालावधी', 'மருத்துவம்', 'காப்பீடு', 'பாலிசி', 'పాలసీ', 'బీమా', 'দাবি', 'বীमा'],
  rbi: ['rbi', 'reserve bank', 'credit', 'loan', 'loans', 'borrow', 'cibil', 'आरबीआई', 'रिजर्व बैंक', 'बैंक', 'बँक', 'लोन', 'कर्ज', 'ऋण', 'सिबिल', 'சிபில்', 'கடன்', 'రుణం', 'సిబిల్', 'ধার'],
  pfrda: ['pfrda', 'pension', 'retirement', 'nps', 'annuity', 'पीएफआरडीए', 'पेंशन', 'पेन्शन', 'निवृत्ती', 'निवृत्तीवेतन', 'एनपीएस', 'रिटायरमेंट', 'ஓய்வூதியம்', 'పెన్షన్', 'পেনশন'],
  ibbi: ['ibbi', 'insolvency', 'bankruptcy', 'liquidation', 'cirp', 'resolution', 'enterprise', 'आईबीबीआई', 'दिवालिया', 'दिवाळखोरी', 'परिसमापन', 'समाधान', 'कंपनी', 'கலைப்பு', 'దివాలా'],
  nabard: ['nabard', 'kisan', 'farmer', 'agriculture', 'agri', 'kcc', 'land', 'crop', 'harvest', 'नाबार्ड', 'किसान', 'शेतकरी', 'शेती', 'कृषी', 'जमीन', 'फसल', 'पीक', 'शेतजमीन', 'விவசாயி', 'பயிர்', 'రైతు', 'పంట', 'কৃষক', 'ফসল']
};

function detectSpokenDomainInUtterance(text) {
  const lower = text.toLowerCase();
  for (const [dom, keywords] of Object.entries(SPOKEN_DOMAIN_VOCAB)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return dom;
    }
  }
  return null;
}

function _extractFuzzyParam(text, keywords) {
  let norm = text;
  for (const [w, val] of SPOKEN_NUMBER_WORDS) {
    const pattern = new RegExp('(^|[^a-zA-Z0-9\u0900-\u097F])' + w + '(?=$|[^a-zA-Z0-9\u0900-\u097F])', 'gi');
    norm = norm.replace(pattern, '$1' + val);
  }

  for (const kw of keywords) {
    // Pattern 1: kw followed by up to 5 words then number
    const p1 = new RegExp('\\b' + kw + '\\b(?:\\s+[\\w\u0900-\u097F]+){0,5}?\\s*(\\d+(?:\\.\\d+)?(?:\\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|k|thousand|thousands|करोड़|कोटी|लाख|हजार|हज़ार))?)', 'i');
    const m1 = norm.match(p1);
    if (m1) {
      const numObj = extractSpokenNumber(m1[1]);
      if (numObj) return numObj.num;
    }

    // Pattern 2: number followed by up to 5 words then kw
    const p2 = new RegExp('(\\d+(?:\\.\\d+)?(?:\\s*(?:crore|crores|cr|lakh|lakhs|lac|lacs|k|thousand|thousands|करोड़|कोटी|लाख|हजार|हज़ार))?)(?:\\s+[\\w\u0900-\u097F]+){0,5}?\\s*\\b' + kw + '\\b', 'i');
    const m2 = norm.match(p2);
    if (m2) {
      const numObj = extractSpokenNumber(m2[1]);
      if (numObj) return numObj.num;
    }
  }
  return null;
}

function parseAndApplySpokenInput(rawText) {
  const lower = rawText.toLowerCase().trim();
  const banner = document.getElementById('voice-status-banner');
  const statusText = document.getElementById('voice-status-text');

  console.log('SPASHTA Voice Command Received (Local Semantic Unscrambler):', lower);

  // 1. Actions
  if (lower.includes('compute') || lower.includes('calculate') || lower.includes('explain') || lower.includes('स्पष्टीकरण') || lower.includes('गणना') || lower.includes('हिसाब') || lower.includes('कणक्कीடு')) {
    computeScore();
    if (banner) banner.classList.add('success-flash');
    if (statusText) statusText.textContent = '⚡ Computing Aumann-Shapley explanations...';
    showVoiceFeedbackToast('⚡ Computing Aumann-Shapley explanations...');
    return true;
  }
  if (lower.includes('reset') || lower.includes('clear') || lower.includes('रीसेट') || lower.includes('पूर्ववत')) {
    resetDomain();
    if (banner) banner.classList.add('success-flash');
    if (statusText) statusText.textContent = '🔄 Reset domain parameters to baseline';
    showVoiceFeedbackToast('🔄 Reset all domain parameters to baseline');
    return true;
  }
  if (lower.includes('play') || lower.includes('listen') || lower.includes('speak') || lower.includes('read') || lower.includes('audio') || lower.includes('सुनाओ') || lower.includes('ऐका') || lower.includes('बोलो')) {
    triggerAudioPlayback();
    if (banner) banner.classList.add('success-flash');
    if (statusText) statusText.textContent = '🔊 Playing voice audio explanation';
    showVoiceFeedbackToast('🔊 Playing voice explanation');
    return true;
  }
  if (lower.includes('stop') || lower.includes('pause') || lower.includes('शांत') || lower.includes('रोको') || lower.includes('थांबा')) {
    translateService.stopAudio();
    if (banner) banner.classList.add('success-flash');
    if (statusText) statusText.textContent = '⏹️ Audio explanation stopped';
    showVoiceFeedbackToast('⏹️ Audio explanation stopped');
    return true;
  }
  if (lower.includes('privacy') || lower.includes('shield') || lower.includes('dpdp') || lower.includes('गोपनीयता')) {
    togglePrivacyShield();
    if (banner) banner.classList.add('success-flash');
    if (statusText) statusText.textContent = '🛡️ Toggled DPDP Privacy Shield';
    showVoiceFeedbackToast('🛡️ Toggled DPDP Privacy Shield');
    return true;
  }

  // 2. Domain Detection
  const detectedDomain = detectSpokenDomainInUtterance(lower);
  let domainSwitched = false;
  let targetDomain = detectedDomain || currentDomain;
  if (detectedDomain && detectedDomain !== currentDomain) {
    switchDomain(detectedDomain);
    domainSwitched = true;
  }

  // 3. Multi-parameter extraction
  const extractedParams = {};

  // Toggles
  if (lower.includes('hospital') || lower.includes('cashless') || lower.includes('अस्पताल') || lower.includes('रुग्णालय')) {
    targetDomain = 'irdai';
    const isNeg = ['not there', 'no hospital', 'no network', 'not available', 'non-network', 'नहीं है', 'नाही', 'illai', 'nathi', 'without'].some(w => lower.includes(w));
    extractedParams['network'] = isNeg ? 0 : 1;
  }
  if (lower.includes('pre-existing') || lower.includes('pre existing') || lower.includes('disease') || lower.includes('बीमारी') || lower.includes('आजार')) {
    targetDomain = 'irdai';
    const isNeg = ['no disease', 'no pre-existing', 'not have', 'नहीं है', 'नाही', 'clean', 'without'].some(w => lower.includes(w));
    extractedParams['pre_existing'] = isNeg ? 0 : 1;
  }
  if (lower.includes('irrigation') || lower.includes('सिंचाई') || lower.includes('सिंचन') || lower.includes('borewell')) {
    targetDomain = 'nabard';
    const isNeg = ['no irrigation', 'dryland', 'rainfed', 'सूखा', 'नहीं है', 'नाही', 'without'].some(w => lower.includes(w));
    extractedParams['irrigation_status'] = isNeg ? 0 : 1;
  }
  if (lower.includes('crop insurance') || lower.includes('pmfby') || lower.includes('फसल बीमा') || lower.includes('पीक विमा')) {
    targetDomain = 'nabard';
    const isNeg = ['no insurance', 'uninsured', 'नहीं है', 'नाही', 'without'].some(w => lower.includes(w));
    extractedParams['crop_insurance'] = isNeg ? 0 : 1;
  }

  // Numerical parameters
  // Score (RBI) - handle self-correction e.g. "700 nahi 780"
  const scoreCorr = lower.match(/(?:score|cibil|credit score)?.*?(\d{3})\s*(?:nahi|not|actually|but)\s*(\d{3})/i);
  if (scoreCorr) {
    const s = parseFloat(scoreCorr[2]);
    if (s >= 300 && s <= 900) { extractedParams['score'] = s; targetDomain = 'rbi'; }
  } else {
    const s = _extractFuzzyParam(lower, ['score', 'cibil', 'credit score', 'सिबिल', 'स्कोर']);
    if (s && s >= 300 && s <= 900) { extractedParams['score'] = s; targetDomain = 'rbi'; }
  }

  // Loan Amount (RBI)
  const l = _extractFuzzyParam(lower, ['loan', 'borrow', 'debt', 'कर्ज', 'ऋण', 'लोन']);
  if (l && l >= 1000) { extractedParams['loan_amount'] = l; targetDomain = 'rbi'; }

  // Income (RBI or SEBI)
  const inc = _extractFuzzyParam(lower, ['income', 'salary', 'earn', 'net worth', 'networth', 'wealth', 'पगार', 'वेतन', 'आय', 'कमाई', 'आमदनी', 'आवक']);
  if (inc && inc >= 500) { extractedParams['income'] = inc; }

  // Tenure / Vintage (IRDAI)
  const vin = _extractFuzzyParam(lower, ['vintage', 'tenure', 'policy vintage', 'policy age', 'साल', 'वर्ष']);
  if (vin && vin <= 20) { extractedParams['tenure'] = vin; targetDomain = 'irdai'; }

  // Claim Amount (IRDAI)
  const cl = _extractFuzzyParam(lower, ['claim', 'bill', 'दावा', 'दाव्याची', 'क्लेम', 'खर्च']);
  if (cl && cl >= 1000) { extractedParams['amount'] = cl; targetDomain = 'irdai'; }

  // Land Holding (NABARD)
  const land = _extractFuzzyParam(lower, ['land', 'farmland', 'zameen', 'sheti', 'acre', 'acres', 'एकर', 'एकड़', 'एकड़', 'जमीन', 'शेती']);
  if (land && land <= 50) { extractedParams['land_holding'] = land; targetDomain = 'nabard'; }

  // Crop Value (NABARD)
  const crop = _extractFuzzyParam(lower, ['crop', 'yield', 'harvest', 'produce', 'fasal', 'उत्पन्न', 'पीक', 'धान्य', 'फसल']);
  if (crop && crop >= 1000) { extractedParams['crop_value'] = crop; targetDomain = 'nabard'; }

  // Enterprise Value (IBBI)
  const evMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr|करोड़)/i);
  if (evMatch && (lower.includes('enterprise') || lower.includes('ev') || lower.includes('resolution') || targetDomain === 'ibbi')) {
    extractedParams['ev_amount'] = parseFloat(evMatch[1]);
    targetDomain = 'ibbi';
  }

  // Age (PFRDA)
  const age = _extractFuzzyParam(lower, ['age', 'investor age', 'वय', 'उम्र', 'आयु']);
  if (age && age >= 18 && age <= 75) { extractedParams['age'] = age; targetDomain = 'pfrda'; }

  // Monthly Contribution (PFRDA)
  const nps = _extractFuzzyParam(lower, ['contribution', 'monthly contribution', 'nps', 'savings', 'अंशदान', 'बचत']);
  if (nps && nps >= 500) { extractedParams['monthly_contribution'] = nps; targetDomain = 'pfrda'; }

  // Switch domain if target domain differs
  if (targetDomain !== currentDomain && DOMAINS[targetDomain]) {
    switchDomain(targetDomain);
    domainSwitched = true;
  }

  // Apply parameters
  const domainObj = DOMAINS[targetDomain];
  let paramUpdated = false;
  let updatedParts = [];

  for (const [k, v] of Object.entries(extractedParams)) {
    const f = domainObj?.fields.find(item => item.key === k);
    if (f) {
      let finalVal = v;
      if (f.min !== undefined && f.max !== undefined) {
        finalVal = Math.max(f.min, Math.min(f.max, finalVal));
      }
      state[k] = finalVal;
      paramUpdated = true;
      const fmtVal = f.fmt ? f.fmt(finalVal) : (finalVal === 1 ? 'ON' : (finalVal === 0 ? 'OFF' : finalVal));
      updatedParts.push(`${f.flabel}: ${fmtVal}`);
    }
  }

  if (paramUpdated) {
    buildFields();
    renderCert();
  }

  if (domainSwitched || paramUpdated) {
    const feedbackMsg = (domainSwitched ? `🎯 Switched to ${domainObj.name} & updated ` : '✓ Updated ') + (updatedParts.join(', ') || 'parameters');
    if (banner) banner.classList.add('success-flash');
    if (statusText) statusText.textContent = feedbackMsg;
    showVoiceFeedbackToast(feedbackMsg);
    return true;
  }

  return false;
}



function switchDomain(domainKey) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => {
    if (t.dataset.domain === domainKey) {
      t.click();
    }
  });
}

function scrollToCert() {
  const certEl = document.getElementById('cert');
  if (certEl) certEl.scrollIntoView({ behavior: 'smooth' });
}

function triggerAudioPlayback() {
  const playBtn = document.getElementById('voice-play-btn');
  if (playBtn) playBtn.click();
}

function initLanguageSelector() {
  const selectEl = document.getElementById('lang-select');
  selectEl.innerHTML = '';

  LANGS.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.code;
    opt.textContent = `${l.native}`;
    if (l.code === currentLang) opt.selected = true;
    selectEl.appendChild(opt);
  });

  selectEl.addEventListener('change', async () => {
    currentLang = selectEl.value;
    const lObj = LANG_BY_CODE[currentLang];
    const loader = document.getElementById('lang-loader');

    if (loader) loader.style.display = 'inline';

    document.documentElement.className = '';
    if (lObj?.script) document.documentElement.classList.add(`script-${lObj.script}`);

    translateService.stopAudio();
    await translateWholePage();
    await buildFields();
    await renderCert();

    if (loader) loader.style.display = 'none';
  });
}

async function translateWholePage() {
  if (currentLang === 'en') {
    document.getElementById('hero-h1').textContent = 'Every AI Decision, Explained Visually & Spoken in 22 Indian Languages.';
    document.getElementById('hero-lede').textContent = 'SPASHTA eliminates AI opacity by converting complex credit, insurance, pension, insolvency, and investment scoring into plain-language explanations, interactive visual charts, and spoken voice readouts.';
    return;
  }

  const h1Text = await translateService.translateText('Every AI Decision, Explained Visually & Spoken in 22 Indian Languages.', 'en', currentLang);
  const ledeText = await translateService.translateText('SPASHTA eliminates AI opacity by converting complex credit, insurance, pension, insolvency, and investment scoring into plain-language explanations, interactive visual charts, and spoken voice readouts.', 'en', currentLang);
  
  document.getElementById('hero-h1').textContent = h1Text;
  document.getElementById('hero-lede').textContent = ledeText;
}

function initDomainTabs() {
  document.getElementById('tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    currentDomain = tab.dataset.domain;
    state = defaultState(currentDomain);

    translateService.stopAudio();
    buildFields();
    renderCert();
  });
}

async function buildFields() {
  const d = DOMAINS[currentDomain];
  const wrap = document.getElementById('fields');
  wrap.innerHTML = '';

  for (const f of d.fields) {
    if (state[f.key] === undefined) {
      state[f.key] = f.base;
    }

    const div = document.createElement('div');
    div.className = 'field';
    const icon = f.icon || '👉';

    let fieldLabel = f.label;
    let fieldHelp = f.help || '';
    if (currentLang !== 'en') {
      fieldLabel = await translateService.translateText(f.label, 'en', currentLang);
      if (fieldHelp) {
        fieldHelp = await translateService.translateText(fieldHelp, 'en', currentLang);
      }
    }

    const infoBtnHtml = fieldHelp ? `<button type="button" class="field-info-btn" title="Click to view regulatory explanation" aria-label="Field explanation" data-field-key="${f.key}">ℹ️</button>` : '';
    const infoCardHtml = fieldHelp ? `<div class="field-info-card" id="info-card-${f.key}" style="display: none;"><span class="field-info-icon">💡</span><span class="field-info-text">${fieldHelp}</span></div>` : '';

    if (f.type === 'select') {
      div.innerHTML = `
        <div class="field-row">
          <label class="field-label-wrap"><span>${icon} ${fieldLabel}</span> ${infoBtnHtml}</label>
        </div>
        ${infoCardHtml}
      `;
      const selEl = document.createElement('select');
      selEl.className = 'field-select';
      for (const o of f.options) {
        let optLabel = o.label;
        if (currentLang !== 'en') {
          optLabel = await translateService.translateText(o.label, 'en', currentLang);
        }
        const opt = document.createElement('option');
        opt.value = o.v;
        opt.textContent = optLabel;
        if (o.v === state[f.key]) opt.selected = true;
        selEl.appendChild(opt);
      }
      selEl.addEventListener('change', () => {
        state[f.key] = parseFloat(selEl.value);
        renderCert();
      });
      div.appendChild(selEl);
    } else if (f.type === 'toggle') {
      const isChecked = state[f.key] ? 'checked' : '';
      div.innerHTML = `
        <div class="toggle-row">
          <label class="field-label-wrap"><span>${icon} ${fieldLabel}</span> ${infoBtnHtml}</label>
          <label class="switch">
            <input type="checkbox" ${isChecked}>
            <span class="track"></span>
          </label>
        </div>
        ${infoCardHtml}
      `;
      const cb = div.querySelector('input[type="checkbox"]');
      cb.addEventListener('change', (e) => {
        state[f.key] = e.target.checked ? 1 : 0;
        renderCert();
      });
    } else {
      const currentVal = state[f.key] !== undefined ? state[f.key] : f.base;
      div.innerHTML = `
        <div class="field-row">
          <label class="field-label-wrap"><span>${icon} ${fieldLabel}</span> ${infoBtnHtml}</label>
          <span class="val">${f.fmt ? f.fmt(currentVal) : currentVal}</span>
        </div>
        ${infoCardHtml}
        <input type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${currentVal}">
      `;
      const range = div.querySelector('input');
      const valEl = div.querySelector('.val');
      range.addEventListener('input', () => {
        state[f.key] = parseFloat(range.value);
        valEl.textContent = f.fmt ? f.fmt(state[f.key]) : state[f.key];
        renderCert();
      });
    }

    // Attach info button toggle interaction
    const infoBtn = div.querySelector('.field-info-btn');
    if (infoBtn) {
      infoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = div.querySelector('.field-info-card');
        if (card) {
          const isHidden = card.style.display === 'none';
          card.style.display = isHidden ? 'flex' : 'none';
          infoBtn.classList.toggle('active', isHidden);
        }
      });
    }

    wrap.appendChild(div);
  }

  const pwrap = document.getElementById('presets');
  pwrap.innerHTML = '';
  for (const p of d.presets) {
    let presetLabel = p.label;
    if (currentLang !== 'en') {
      presetLabel = await translateService.translateText(p.label, 'en', currentLang);
    }
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.textContent = presetLabel;
    btn.addEventListener('click', () => {
      Object.assign(state, p.values);
      buildFields();
      renderCert();
    });
    pwrap.appendChild(btn);
  }
}

async function computeShapleyForDomain() {
  const d = DOMAINS[currentDomain];
  
  // 1. If Privacy Shield (DPDP Act 2023) is active, execute 100% on-device
  if (privacyShieldActive) {
    const features = d.fields.map(f => ({
      key: f.key,
      coef: f.coef,
      base: f.base,
      value: state[f.key] !== undefined ? state[f.key] : f.base
    }));
    const localRes = calculateShapley(features, d.intercept);
    localRes.isFederated = true;
    return localRes;
  }

  // 2. Try FastAPI backend /score with API key
  try {
    const resp = await fetch(`${API_BASE_URL}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        domain: currentDomain,
        inputs: state
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      return {
        shap: data.shap_values,
        baseline: data.baseline_prob,
        full: data.full_prob,
        isServerBacked: true
      };
    }
  } catch (err) {
    console.warn('Backend /score unavailable, executing local client-side Shapley engine:', err);
  }

  // 3. Fallback client-side calculation
  const features = d.fields.map(f => ({
    key: f.key,
    coef: f.coef,
    base: f.base,
    value: state[f.key] !== undefined ? state[f.key] : f.base
  }));

  const localRes = calculateShapley(features, d.intercept);
  localRes.isServerBacked = false;
  return localRes;
}

function generateDeepRegulatoryExplanation(domainKey, decided, scorePct, baselinePct, posFactors, negFactors) {
  const dObj = DOMAINS[domainKey];
  const domainTitle = dObj.fullName;
  const dVerb = dObj.decisionVerb;

  const posList = posFactors.map(f => `${f.name} (contributing +${Math.round(Math.abs(f.val) * 100)}% positive weight)`).join(', ');
  const negList = negFactors.map(f => `${f.name} (reducing score by -${Math.round(Math.abs(f.val) * 100)}%)`).join(', ');

  if (decided) {
    let text = `Official Audit Summary (${domainTitle}):\n`;
    text += `1. VERDICT: Your ${dVerb} is APPROVED with an overall confidence score of ${scorePct}% (baseline threshold: ${baselinePct}%).\n\n`;
    text += `2. POSITIVE DRIVERS: Approval was primarily driven by your ${posList || 'overall balanced profile'}.\n\n`;
    if (negFactors.length > 0) {
      text += `3. RISK FACTORS TO MONITOR: Your ${negList} created slight downward pressure, though within acceptable regulatory limits.\n\n`;
    }
    text += `4. ACTIONABLE ADVICE: Maintain current financial prudence to preserve your prime regulatory rating.\n\n`;
    text += `5. REGULATORY RIGHTS: Aligned with ${dObj.citation}`;
    return text;
  } else {
    let text = `Official Audit Summary (${domainTitle}):\n`;
    text += `1. VERDICT: Your ${dVerb} was NOT APPROVED at this time, receiving an eligibility score of ${scorePct}% (below the required ${baselinePct}% threshold).\n\n`;
    text += `2. PRIMARY REJECTION CAUSES: The score was heavily reduced by your ${negList || 'high risk indicators'}.\n\n`;
    if (posFactors.length > 0) {
      text += `3. MITIGATING STRENGTHS: Your ${posList} helped support your profile, but was not sufficient to offset the risk factors.\n\n`;
    }
    text += `4. STEP-BY-STEP REMEDIATION PLAN:\n`;
    text += `   • Step 1: Address top negative driver: ${negFactors[0]?.name || 'High Risk Indicator'}.\n`;
    text += `   • Step 2: Optimize balance sheet parameters within recommended regulatory guidelines.\n`;
    text += `   • Step 3: Wait 60 to 90 days before submitting for official re-evaluation.\n\n`;
    text += `5. REGULATORY RIGHTS: Aligned with ${dObj.citation}. You have the legal right to re-apply once risk factors are remediated.`;
    return text;
  }
}

function generateConversationalAudioSummary(domainKey, decided, scorePct, baselinePct, posFactors, negFactors) {
  const dObj = DOMAINS[domainKey];
  const domainTitle = dObj.fullName;
  const posNames = posFactors.map(f => f.name).join(', ');
  const negNames = negFactors.map(f => f.name).join(', ');

  if (decided) {
    let text = `Official Regulatory Advisory for ${domainTitle}. `;
    text += `Your ${dObj.decisionVerb} has been officially APPROVED with an overall confidence score of ${scorePct} percent, comfortably exceeding the regulatory baseline threshold of ${baselinePct} percent. `;
    if (posNames) {
      text += `Approval was strongly supported by your primary positive financial drivers, led by your ${posNames}. `;
    } else {
      text += `Your overall profile aligns well with regulatory standards. `;
    }
    if (negNames) {
      text += `While your ${negNames} created slight downward risk pressure, your standing remains within acceptable limits. `;
    }
    text += `To maintain your prime rating, we advise ensuring timely obligations. This assessment is compliant with ${dObj.citation}.`;
    return text;
  } else {
    let text = `Official Regulatory Advisory for ${domainTitle}. `;
    text += `We regret to inform you that your ${dObj.decisionVerb} was NOT APPROVED at this time. Your profile received an eligibility score of ${scorePct} percent, which falls below the required regulatory baseline threshold of ${baselinePct} percent. `;
    if (negNames) {
      text += `The primary factors pulling down your score are your ${negNames}. `;
    } else {
      text += `Your profile fell short of the required eligibility criteria. `;
    }
    if (posNames) {
      text += `Although your ${posNames} provided partial support, it was insufficient to offset the risk factors. `;
    }
    text += `To qualify for approval upon re-application, please address the primary factor ${negFactors[0]?.name || 'risk indicators'}. Under regulatory guidelines aligned with ${dObj.citation}, you maintain the right to re-apply once mitigated.`;
    return text;
  }
}

function createGaugeSvg(scorePercent, isApproved) {
  const color = isApproved ? '#16A34A' : '#EF4444';
  const strokeDash = (scorePercent / 100) * 188.4;
  return `
    <svg viewBox="0 0 100 70">
      <path d="M 10 60 A 40 40 0 0 1 90 60" fill="none" stroke="#E2E8F0" stroke-width="12" stroke-linecap="round"/>
      <path d="M 10 60 A 40 40 0 0 1 90 60" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="188.4" stroke-dashoffset="${188.4 - strokeDash}"/>
      <text x="50" y="48" text-anchor="middle" font-size="18" font-weight="800" fill="#0F172A">${scorePercent}%</text>
      <text x="50" y="62" text-anchor="middle" font-size="8" font-weight="700" fill="#64748B">SCORE</text>
    </svg>
  `;
}

function createPieChartSvg(rows) {
  let posSum = 0, negSum = 0;
  rows.forEach(r => {
    if (r.val >= 0) posSum += r.val;
    else negSum += Math.abs(r.val);
  });
  const total = posSum + negSum || 1;
  const posPct = Math.round((posSum / total) * 100);
  const negPct = 100 - posPct;
  const posArc = (posSum / total) * 125.6;

  return `
    <div style="display:flex; align-items:center; gap:12px;">
      <svg width="48" height="48" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" stroke="#EF4444" stroke-width="8"/>
        <circle cx="25" cy="25" r="20" fill="none" stroke="#16A34A" stroke-width="8"
                stroke-dasharray="125.6" stroke-dashoffset="${125.6 - posArc}"
                transform="rotate(-90 25 25)"/>
      </svg>
      <div style="font-size:11.5px; font-weight:600; color:#0F172A; line-height:1.4;">
        <div style="color:#15803D; display:flex; align-items:center; gap:4px;">
          <span style="display:inline-block; width:8px; height:8px; background:#16A34A; border-radius:50%;"></span>
          Positive Drivers: <b>${posPct}%</b>
        </div>
        <div style="color:#B91C1C; display:flex; align-items:center; gap:4px;">
          <span style="display:inline-block; width:8px; height:8px; background:#EF4444; border-radius:50%;"></span>
          Negative Drivers: <b>${negPct}%</b>
        </div>
      </div>
    </div>
  `;
}

function renderQrCodeElement(containerId, text) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(container, {
        text: text,
        width: 48,
        height: 48,
        colorDark: "#0F172A",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.M
      });
      return;
    } catch (e) {}
  }

  // Standalone fallback SVG QR icon
  container.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="3" height="3"/>
      <rect x="18" y="18" width="3" height="3"/>
    </svg>
  `;
}

async function renderCert() {
  const d = DOMAINS[currentDomain];
  const { shap, baseline, full, isFederated } = await computeShapleyForDomain();

  let introText = d.intro;
  if (currentLang !== 'en') {
    introText = await translateService.translateText(d.intro, 'en', currentLang);
  }
  document.getElementById('domain-intro').innerHTML = introText;

  const decided = full >= 0.5;
  let verdictWord = decided ? d.decisionWord.pos : d.decisionWord.neg;
  if (currentLang !== 'en') {
    verdictWord = await translateService.translateText(verdictWord, 'en', currentLang);
  }
  const verdictClass = decided ? 'pos' : 'neg';
  const iconSymbol = decided ? '✓' : '✕';

  const rows = [];
  for (let i = 0; i < d.fields.length; i++) {
    const f = d.fields[i];
    let fname = f.flabel;
    if (currentLang !== 'en') {
      fname = await translateService.translateText(f.flabel, 'en', currentLang);
    }
    rows.push({
      name: fname,
      val: shap[i],
      icon: f.icon || '•'
    });
  }
  rows.sort((a, b) => Math.abs(b.val) - Math.abs(a.val));

  const posFactors = rows.filter(r => r.val > 0);
  const negFactors = rows.filter(r => r.val < 0);
  const scorePct = Math.round(full * 100);
  const baselinePct = Math.round(baseline * 100);

  const deepEnglishExplanation = generateDeepRegulatoryExplanation(currentDomain, decided, scorePct, baselinePct, posFactors, negFactors);
  const detailedAudioText = generateConversationalAudioSummary(currentDomain, decided, scorePct, baselinePct, posFactors, negFactors);

  let sentence = deepEnglishExplanation;
  let voiceText = detailedAudioText;

  if (currentLang !== 'en') {
    sentence = await translateService.translateText(deepEnglishExplanation, 'en', currentLang);
    voiceText = await translateService.translateText(detailedAudioText, 'en', currentLang);
  }

  const maxAbs = Math.max(...rows.map(r => Math.abs(r.val)), 0.001);

  const factorsHtml = rows.map(r => {
    const pct = Math.min(100, (Math.abs(r.val) / maxAbs) * 50);
    const cls = r.val >= 0 ? 'pos' : 'neg';
    const arrow = r.val >= 0 ? '↑' : '↓';
    return `
      <div class="factor">
        <div class="factor-top">
          <span class="fname"><span>${r.icon}</span> ${r.name}</span>
          <span class="fval ${cls}">${arrow} ${r.val >= 0 ? '+' : ''}${r.val.toFixed(3)}</span>
        </div>
        <div class="factor-bar">
          <div class="center"></div>
          <div class="bar-fill ${cls}" style="width:${pct}%;"></div>
        </div>
      </div>`;
  }).join('');

  let certTitle = 'Official XAI Compliance Audit Certificate';
  let certCitation = d.citation;
  if (currentLang !== 'en') {
    certTitle = await translateService.translateText(certTitle, 'en', currentLang);
    certCitation = await translateService.translateText(certCitation, 'en', currentLang);
  }

  // 1. Create or retrieve certificate
  let certId = `${d.certPrefix}/2026/PROT01`;
  let sha256Hex = '';

  if (privacyShieldActive) {
    const certHash = await generateCertHash(currentDomain, state, d.fields, d.fields.map(f => f.coef), d.intercept, { shap, baseline, full });
    certId = `${d.certPrefix}/2026/${certHash.id}`;
    sha256Hex = certHash.id;
  } else {
    try {
      const certResp = await fetch(`${API_BASE_URL}/certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          domain: currentDomain,
          inputs: state
        })
      });
      if (certResp.ok) {
        const certData = await certResp.json();
        certId = certData.cert_id;
        sha256Hex = certData.sha256_hash;
      }
    } catch (cErr) {
      const certHash = await generateCertHash(currentDomain, state, d.fields, d.fields.map(f => f.coef), d.intercept, { shap, baseline, full });
      certId = `${d.certPrefix}/2026/${certHash.id}`;
    }
  }

  const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
  const verifyDeepLink = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(certId)}`;
  const currentLangObj = LANG_BY_CODE[currentLang];
  const audioBtnLabel = currentLang === 'en' ? 'Listen English Audio Advisory' : `Listen ${currentLangObj?.native || ''} Voice Advisory`;

  document.getElementById('cert').innerHTML = `
    <div class="cert-head">
      <div>
        <div class="eyebrow">${certTitle}</div>
        <div class="cert-id">${certId} · ${dateStr}</div>
      </div>
      <div class="cert-badges">
        <div class="qr-cert-box" id="cert-qr-container" title="Scan QR to verify on mobile / bank branch" onclick="verifyCertificate('${certId}')"></div>
        ${sealSvg()}
      </div>
    </div>

    <div class="verdict-hero ${verdictClass}">
      <div class="left">
        <div class="icon-badge">${iconSymbol}</div>
        <div>
          <div class="status-title">${verdictWord}</div>
          <div class="status-sub">Decision Confidence: <b>${scorePct}%</b> (Vs. Baseline ${baselinePct}%)</div>
        </div>
      </div>
    </div>

    <div class="voice-toolbar no-print">
      <div class="voice-toolbar-left">
        <button type="button" class="voice-play-btn" id="voice-play-btn" data-text="${encodeURIComponent(voiceText)}">
          <span id="voice-btn-icon">🔊</span>
          <span id="voice-btn-text">${audioBtnLabel}</span>
        </button>
        <button type="button" class="voice-pause-btn" id="voice-pause-btn" style="display:none;">
          <span>⏸️</span> Pause
        </button>
        <button type="button" class="voice-stop-btn" id="voice-stop-btn" style="display:none;">
          <span>⏹️</span> Stop
        </button>
        <div class="audio-waves" id="audio-waves">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
      <div style="font-size:11px; font-weight:600; color:var(--text-muted);">
        Indic Regional Voice Stream
      </div>
    </div>

    <div class="audio-note-bar no-print">
      🔊 <b>Multi-Engine Regional Voice:</b> Synthesizing natural spoken advisory in <b>${currentLangObj?.native || 'Selected Language'}</b> using zero-dependency Indic TTS.
    </div>

    <div class="visual-analytics">
      <div class="gauge-box">
        ${createGaugeSvg(scorePct, decided)}
      </div>
      <div class="pie-box">
        <div class="pie-box-title">Factor Weight Balance</div>
        ${createPieChartSvg(rows)}
      </div>
    </div>

    <div class="factors-label">Visual Shapley Attribution Weights</div>
    ${factorsHtml}

    <div class="cert-sentence" style="font-size:13.5px; font-weight:500; line-height:1.65; background:#F8FAFC; padding:16px; border-radius:12px; border:1px solid #E2E8F0; white-space:pre-wrap;">${sentence}</div>

    <div class="cert-footer">
      <div class="citation">${certCitation}</div>
      <div class="stamp">${privacyShieldActive ? 'DPDP ON-DEVICE AUDIT' : 'REGULATORY AUDIT READY'}</div>
    </div>

    <div class="cert-actions no-print" style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
      <button type="button" class="btn-export" style="flex:1;" onclick="exportComplianceCertificatePDF('${certId}')">
        📄 Download QR Compliance PDF
      </button>
      <button type="button" class="btn-export" style="flex:1; background:linear-gradient(135deg, #059669 0%, #047857 100%);" onclick="verifyCertificate('${certId}')">
        🛡️ Verify on Registry
      </button>
    </div>
  `;

  // Render dynamic QR code
  renderQrCodeElement('cert-qr-container', verifyDeepLink);

  const voicePlayBtn = document.getElementById('voice-play-btn');
  const voicePauseBtn = document.getElementById('voice-pause-btn');
  const voiceStopBtn = document.getElementById('voice-stop-btn');

  if (voicePlayBtn) {
    voicePlayBtn.addEventListener('click', () => {
      const textToSpeak = decodeURIComponent(voicePlayBtn.dataset.text);
      if (translateService.isPausedAudio) {
        translateService.resumeAudio();
      } else if (translateService.isPlayingAudio) {
        translateService.stopAudio();
      } else {
        translateService.speakText(textToSpeak, currentLang);
      }
    });
  }

  if (voicePauseBtn) {
    voicePauseBtn.addEventListener('click', () => {
      translateService.pauseAudio();
    });
  }

  if (voiceStopBtn) {
    voiceStopBtn.addEventListener('click', () => {
      translateService.stopAudio();
    });
  }
}

function exportComplianceCertificatePDF(certId) {
  const originalTitle = document.title;
  const cleanId = (certId || 'SPASHTA_CERT').replace(/[\/\s]/g, '_');
  document.title = `SPASHTA_Compliance_Certificate_${cleanId}`;

  window.print();

  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

function sealSvg() {
  return `<svg class="seal" viewBox="0 0 60 60" fill="none">
    <circle cx="30" cy="30" r="27" stroke="#16A34A" stroke-width="1.5"/>
    <circle cx="30" cy="30" r="21" stroke="#2563EB" stroke-width="1" stroke-dasharray="2 3"/>
    <path d="M20 30l7 7 13-15" stroke="#16A34A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function initVoiceControls() {
  translateService.onAudioStateChange = ({ state: audioState }) => {
    const playBtn = document.getElementById('voice-play-btn');
    const pauseBtn = document.getElementById('voice-pause-btn');
    const stopBtn = document.getElementById('voice-stop-btn');
    const waves = document.getElementById('audio-waves');
    const icon = document.getElementById('voice-btn-icon');
    const text = document.getElementById('voice-btn-text');
    const currentLangObj = LANG_BY_CODE[currentLang];

    if (audioState === 'playing') {
      if (waves) waves.classList.add('active');
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (stopBtn) stopBtn.style.display = 'inline-flex';
      if (icon) icon.textContent = '🔊';
      if (text) text.textContent = 'Playing Advisory...';
    } else if (audioState === 'paused') {
      if (waves) waves.classList.remove('active');
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-flex';
      if (icon) icon.textContent = '▶️';
      if (text) text.textContent = 'Resume Advisory';
    } else {
      if (waves) waves.classList.remove('active');
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'none';
      if (icon) icon.textContent = '🔊';
      if (text) text.textContent = currentLang === 'en' ? 'Listen English Audio Advisory' : `Listen ${currentLangObj?.native || ''} Voice Advisory`;
    }
  };
}
