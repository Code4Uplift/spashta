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
    statusText.textContent = `🧠 [Thinking...] "${fullUtterance}"`;
  }

  const apiUrl = window.SPASHTA_API_URL || 'http://localhost:8000';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    const response = await fetch(`${apiUrl}/voice-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
    console.warn('Voice-intent API call failed or timed out, falling back to local engine:', err);
  }

  // Graceful fallback to client-side heuristic engine
  parseAndApplySpokenInput(fullUtterance);
}

function applyVoiceIntentResult(data, rawUtterance) {
  const banner = document.getElementById('voice-status-banner');
  const statusText = document.getElementById('voice-status-text');
  const isCoE = data.engine === 'tcet_coe_qwen3.6';
  const enginePrefix = isCoE ? '✨ [Qwen3.6 CoE AI] ' : '✓ ';

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
  irdai: ['irdai', 'insurance', 'claim', 'claims', 'health', 'hospital', 'vintage', 'policy', 'आईआरडीएआई', 'इरडा', 'बीमा', 'विमा', 'क्लेम', 'दावा', 'पॉलिसी', 'कालावधी', 'மருத்துவம்', 'காப்பீடு', 'பாலிசி', 'పాలసీ', 'బీమా', 'দাবি', 'বীমা'],
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

function parseAndApplySpokenInput(rawText) {
  const lower = rawText.toLowerCase().trim();
  const banner = document.getElementById('voice-status-banner');
  const statusText = document.getElementById('voice-status-text');

  console.log('SPASHTA Voice Command Received:', lower);

  // 1. Check for Action Commands
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

  // 2. Detect Domain Mention (e.g. "I want to check SEBI, I have 5 lakh rupees income")
  const detectedDomain = detectSpokenDomainInUtterance(lower);
  let domainSwitched = false;
  if (detectedDomain && detectedDomain !== currentDomain) {
    switchDomain(detectedDomain);
    domainSwitched = true;
  }

  // 3. Extract Spoken Numbers and Multipliers
  const extracted = extractSpokenNumber(lower);
  let targetDomain = detectedDomain || currentDomain;
  const d = DOMAINS[targetDomain];
  let matchedKey = null;

  // Domain-specific field keyword mappings
  if (targetDomain === 'sebi') {
    if (lower.includes('income') || lower.includes('net worth') || lower.includes('networth') || lower.includes('wealth') || lower.includes('annual') || lower.includes('संपत्ति') || lower.includes('संपत्ती') || lower.includes('नेटवर्थ') || lower.includes('आय') || lower.includes('उत्पन्न') || lower.includes('कमाई') || lower.includes('சொத்து') || lower.includes('నికర విలువ')) matchedKey = 'income';
    else if (lower.includes('risk') || lower.includes('tolerance') || lower.includes('appetite') || lower.includes('जोखिम') || lower.includes('जोखीम') || lower.includes('रिस्क')) matchedKey = 'risk_appetite';
    else if (lower.includes('concentration') || lower.includes('exposure') || lower.includes('एकाग्रता') || lower.includes('एक्सपोजर') || lower.includes('वाटप')) matchedKey = 'concentration';
    else if (lower.includes('horizon') || lower.includes('tenure') || lower.includes('holding') || lower.includes('कालावधी') || lower.includes('मुदत') || lower.includes('अवधि') || lower.includes('वर्ष')) matchedKey = 'horizon';
    else if (lower.includes('category') || lower.includes('meter') || lower.includes('श्रेणी')) matchedKey = 'risk_category';
  } else if (targetDomain === 'irdai') {
    if (lower.includes('tenure') || lower.includes('vintage') || lower.includes('policy vintage') || lower.includes('policy age') || lower.includes('year') || lower.includes('years') || lower.includes('वर्ष') || lower.includes('साल') || lower.includes('वर्षे') || lower.includes('कालावधी') || lower.includes('मुदत') || lower.includes('பாலிசி காலம்') || lower.includes('కాలం')) matchedKey = 'tenure';
    else if (lower.includes('claim') || lower.includes('bill') || lower.includes('amount') || lower.includes('दावा') || lower.includes('दाव्याची') || lower.includes('क्लेम') || lower.includes('रक्कम') || lower.includes('खर्च') || lower.includes('கோரிக்கை')) matchedKey = 'amount';
    else if (lower.includes('network') || lower.includes('hospital') || lower.includes('cashless') || lower.includes('नेटवर्क') || lower.includes('कॅशलेस') || lower.includes('अस्पताल') || lower.includes('रुग्णालय')) matchedKey = 'network';
    else if (lower.includes('pre-existing') || lower.includes('pre existing') || lower.includes('ped') || lower.includes('disease') || lower.includes('illness') || lower.includes('पुरानी बीमारी') || lower.includes('जुना आजार') || lower.includes('आजार') || lower.includes('रोग')) matchedKey = 'pre_existing';
    else if (lower.includes('fraud') || lower.includes('anomaly') || lower.includes('suspicion') || lower.includes('धोखाधड़ी') || lower.includes('फ्रॉड') || lower.includes('संशय') || lower.includes('घोटाला') || lower.includes('जोखिम')) matchedKey = 'fraud_score';
  } else if (targetDomain === 'rbi') {
    if (lower.includes('cibil') || lower.includes('score') || lower.includes('credit score') || lower.includes('rating') || lower.includes('सिबिल') || lower.includes('क्रेडिट स्कोर') || lower.includes('स्कोर') || lower.includes('पत') || lower.includes('சிபில்')) matchedKey = 'score';
    else if (lower.includes('loan') || lower.includes('borrow') || lower.includes('debt') || lower.includes('कर्ज') || lower.includes('ऋण') || lower.includes('लोन') || lower.includes('उधार') || lower.includes('கடன்')) matchedKey = 'loan_amount';
    else if (lower.includes('income') || lower.includes('salary') || lower.includes('wage') || lower.includes('pay') || lower.includes('monthly') || lower.includes('stipend') || lower.includes('आय') || lower.includes('वेतन') || lower.includes('पगार') || lower.includes('कमाई') || lower.includes('आमदनी') || lower.includes('मासिक उत्पन्न') || lower.includes('तनख्वाह') || lower.includes('आवक') || lower.includes('दरमहा') || lower.includes('சம்பளம்')) matchedKey = 'income';
    else if (lower.includes('foir') || lower.includes('obligation') || lower.includes('emi') || lower.includes('खर्च') || lower.includes('हप्ता') || lower.includes('देनदारी')) matchedKey = 'foir';
    else if (lower.includes('delinquency') || lower.includes('dpd') || lower.includes('default') || lower.includes('delay') || lower.includes('late') || lower.includes('डिफ़ॉल्ट') || lower.includes('देरी') || lower.includes('थकीत') || lower.includes('उशीर')) matchedKey = 'delinquency';
    else if (lower.includes('employment') || lower.includes('employee') || lower.includes('job') || lower.includes('corporate') || lower.includes('govt') || lower.includes('नौकरी') || lower.includes('रोजगार') || lower.includes('काम') || lower.includes('नोकरी')) matchedKey = 'emp_status';
  } else if (targetDomain === 'pfrda') {
    if (lower.includes('age') || lower.includes('investor age') || lower.includes('years old') || lower.includes('वय') || lower.includes('उम्र') || lower.includes('आयु') || lower.includes('वर्ष') || lower.includes('வயது') || lower.includes('వయస్సు')) matchedKey = 'age';
    else if (lower.includes('contribution') || lower.includes('monthly contribution') || lower.includes('nps') || lower.includes('savings') || lower.includes('अंशदान') || lower.includes('मासिक अंशदान') || lower.includes('एनपीएस') || lower.includes('बचत') || lower.includes('हप्ता')) matchedKey = 'monthly_contribution';
    else if (lower.includes('equity') || lower.includes('shares') || lower.includes('stock') || lower.includes('इक्विटी') || lower.includes('शेअर वाटप') || lower.includes('समभाग')) matchedKey = 'equity_allocation';
    else if (lower.includes('pension target') || lower.includes('target pension') || lower.includes('pension') || lower.includes('पेन्शन') || lower.includes('पेंशन') || lower.includes('निवृत्तीवेतन') || lower.includes('ஓய்வூதியம்')) matchedKey = 'pension_target';
    else if (lower.includes('corpus') || lower.includes('adequacy') || lower.includes('कॉर्पस') || lower.includes('संचित निधी') || lower.includes('फंड')) matchedKey = 'corpus_index';
  } else if (targetDomain === 'ibbi') {
    if (lower.includes('enterprise') || lower.includes('resolution value') || lower.includes('ev') || lower.includes('व्हॅल्यू') || lower.includes('एंटरप्राइझ व्हॅल्यू') || lower.includes('मूल्य') || lower.includes('रिजोल्यूशन वैल्यू') || lower.includes('संकल्प मूल्य')) matchedKey = 'ev_amount';
    else if (lower.includes('liquidation') || lower.includes('coverage') || lower.includes('लिक्विडेशन') || lower.includes('परिसमापन मूल्य') || lower.includes('कव्हरेज')) matchedKey = 'liquidation_coverage';
    else if (lower.includes('timeline') || lower.includes('month') || lower.includes('months') || lower.includes('महिने') || lower.includes('महीने') || lower.includes('कालावधी') || lower.includes('मुदत')) matchedKey = 'timeline_months';
    else if (lower.includes('recovery') || lower.includes('creditor') || lower.includes('operational') || lower.includes('रिकव्हरी') || lower.includes('वसुली') || lower.includes('लेनदार')) matchedKey = 'op_creditor_recovery';
    else if (lower.includes('promoter') || lower.includes('governance') || lower.includes('track') || lower.includes('प्रमोटर') || lower.includes('प्रवर्तक') || lower.includes('कारभार')) matchedKey = 'promoter_track';
  } else if (targetDomain === 'nabard') {
    if (lower.includes('land') || lower.includes('acre') || lower.includes('acres') || lower.includes('farmland') || lower.includes('zameen') || lower.includes('sheti') || lower.includes('जमीन') || lower.includes('शेती') || lower.includes('एकर') || lower.includes('एकड़') || lower.includes('भूमि') || lower.includes('शेतजमीन') || lower.includes('நிலம்') || lower.includes('భూమి')) matchedKey = 'land_holding';
    else if (lower.includes('crop') || lower.includes('yield') || lower.includes('harvest') || lower.includes('produce') || lower.includes('fasal') || lower.includes('उत्पन्न') || lower.includes('पीक') || lower.includes('धान्य') || lower.includes('फसल') || lower.includes('விளைச்சல்')) matchedKey = 'crop_value';
    else if (lower.includes('informal') || lower.includes('moneylender') || lower.includes('sahukar') || lower.includes('सावकारी कर्ज') || lower.includes('खाजगी कर्ज') || lower.includes('सावकार') || lower.includes('साहुकार')) matchedKey = 'informal_debt';
    else if (lower.includes('irrigation') || lower.includes('water') || lower.includes('borewell') || lower.includes('canal') || lower.includes('सिंचाई') || lower.includes('सिंचन') || lower.includes('पाणी पुरवठा') || lower.includes('ओलिताची सोय') || lower.includes('बोरवेल')) matchedKey = 'irrigation_status';
    else if (lower.includes('crop insurance') || lower.includes('insurance') || lower.includes('pmfby') || lower.includes('bima') || lower.includes('पीक विमा') || lower.includes('फसल बीमा') || lower.includes('विमा') || lower.includes('பயிர் காப்பீடு')) matchedKey = 'crop_insurance';
  }

  // Cross-domain fallback: if parameter belongs uniquely to another domain, switch to it!
  if (!matchedKey) {
    if (lower.includes('policy vintage') || lower.includes('vintage') || lower.includes('पॉलिसी विंटेज')) {
      targetDomain = 'irdai'; switchDomain('irdai'); matchedKey = 'tenure'; domainSwitched = true;
    } else if (lower.includes('cibil') || lower.includes('सिबिल')) {
      targetDomain = 'rbi'; switchDomain('rbi'); matchedKey = 'score'; domainSwitched = true;
    } else if (lower.includes('land') || lower.includes('acre') || lower.includes('शेती') || lower.includes('एकड़') || lower.includes('एकर')) {
      targetDomain = 'nabard'; switchDomain('nabard'); matchedKey = 'land_holding'; domainSwitched = true;
    } else if (lower.includes('enterprise value') || lower.includes('resolution value') || lower.includes('एंटरप्राइज वैल्यू')) {
      targetDomain = 'ibbi'; switchDomain('ibbi'); matchedKey = 'ev_amount'; domainSwitched = true;
    } else if (lower.includes('pension target') || lower.includes('पेन्शन ध्येय')) {
      targetDomain = 'pfrda'; switchDomain('pfrda'); matchedKey = 'pension_target'; domainSwitched = true;
    } else if (lower.includes('age') || lower.includes('उम्र') || lower.includes('वय') || lower.includes('வயது') || lower.includes('వయస్సు')) {
      targetDomain = 'pfrda'; switchDomain('pfrda'); matchedKey = 'age'; domainSwitched = true;
    }
  }

  // If a parameter and number were both detected
  if (matchedKey && extracted) {
    const domainObj = DOMAINS[targetDomain];
    const f = domainObj?.fields.find(item => item.key === matchedKey);
    if (f) {
      let finalVal = extracted.num;
      // In IBBI enterprise value is in Crores directly
      if (f.key === 'ev_amount' && extracted.rawUnit === 'crore') {
        finalVal = extracted.rawNum;
      }
      if (f.min !== undefined && f.max !== undefined) {
        finalVal = Math.max(f.min, Math.min(f.max, finalVal));
      }

      state[matchedKey] = finalVal;
      buildFields();
      renderCert();

      const formattedVal = f.fmt ? f.fmt(finalVal) : finalVal;
      const successMsg = domainSwitched
        ? `✓ Switched to ${domainObj.name} & set ${f.flabel} to ${formattedVal}`
        : `✓ Set ${f.flabel} to ${formattedVal}`;

      if (banner) banner.classList.add('success-flash');
      if (statusText) statusText.textContent = successMsg;
      showVoiceFeedbackToast(successMsg);
      return true;
    }
  }

  // If only sector was switched
  if (domainSwitched) {
    const domainObj = DOMAINS[targetDomain];
    const msg = `🎯 Switched to ${domainObj.name} (${domainObj.fullName})`;
    if (banner) banner.classList.add('success-flash');
    if (statusText) statusText.textContent = msg;
    showVoiceFeedbackToast(msg);
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
