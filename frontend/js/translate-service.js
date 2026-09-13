const SPASHTA_API_URL = window.SPASHTA_API_URL || 'http://localhost:8000';

const STATIC_TRANSLATIONS = {
  hi: {
    'CREDIT APPROVED': 'ऋण स्वीकृत (Approved)',
    'CREDIT REJECTED': 'ऋण अस्वीकृत (Rejected)',
    'CLAIM APPROVED': 'बीमा दावा स्वीकृत (Approved)',
    'CLAIM REJECTED': 'बीमा दावा अस्वीकृत (Rejected)',
    'SUITABLE': 'निवेश हेतु उपयुक्त (Suitable)',
    'NOT SUITABLE': 'निवेश हेतु अनुपयुक्त (Not Suitable)',
    'PENSION APPROVED': 'पेंशन आवंटन स्वीकृत (Approved)',
    'PENSION REJECTED': 'पेंशन पुनर्मूल्यांकन आवश्यक',
    'RESOLUTION APPROVED': 'समाधान योजना स्वीकृत (Approved)',
    'LIQUIDATION RISK': 'परिसमापन जोखिम चेतावनी (Liquidation Risk)',
    'KCC APPROVED': 'किसान क्रेडिट कार्ड स्वीकृत (Approved)',
    'KCC REJECTED': 'किसान क्रेडिट कार्ड अस्वीकृत (Rejected)',
    'Compute Explanations': 'स्पष्टीकरण निकालें',
    'Generate Audit Certificate': 'ऑडिट प्रमाणपत्र बनाएं',
    'Reset Defaults': 'डिफ़ॉल्ट रीसेट करें',
    'Voice Dictate': 'वॉइस डिक्टेट',
    'CIBIL / Credit Score': 'सिबिल / क्रेडिट स्कोर',
    'Requested Loan Amount (₹)': 'अनुरोधित ऋण राशि (₹)',
    'Monthly Income (₹)': 'मासिक आय (₹)',
    'Existing Obligation (FOIR %)': 'वर्तमान देनदारी (FOIR %)',
    'Past 90-Day DPD (Delinquency)': 'पिछले 90 दिनों की देरी (Delinquency)',
    'Employment Type': 'रोजगार का प्रकार',
    'Policy Vintage (Years)': 'पॉलिसी विंटेज (वर्ष)',
    'Claim Amount (₹)': 'दावा राशि (₹)',
    'Network Hospital / Garage': 'नेटवर्क अस्पताल / गैरेज',
    'Pre-existing Disease Declared': 'पूर्व-विद्यमान बीमारी घोषित',
    'Anomaly / Risk Index (%)': 'विसंगति / जोखिम सूचकांक (%)',
    'Investor Risk Tolerance (1-100)': 'निवेशक जोखिम सहनशीलता (1-100)',
    'Annual Net Worth / Income (₹)': 'वार्षिक कुल संपत्ति / आय (₹)',
    'Portfolio Concentration (%)': 'पोर्टफोलियो एकाग्रता (%)',
    'Investment Horizon (Years)': 'निवेश अवधि (वर्ष)',
    'Product Risk Meter Level': 'उत्पाद जोखिम स्तर',
    'Current Investor Age (Years)': 'वर्तमान निवेशक आयु (वर्ष)',
    'Monthly NPS Contribution (₹)': 'मासिक एनपीएस अंशदान (₹)',
    'Active Equity Allocation (E-Class %)': 'इक्विटी आवंटन (ई-क्लास %)',
    'Desired Monthly Pension Target (₹)': 'वांछित मासिक पेंशन लक्ष्य (₹)',
    'Retirement Corpus Adequacy Score': 'सेवानिवृत्ति निधि पर्याप्तता स्कोर',
    'Resolution Enterprise Value (₹ Cr)': 'समाधान उद्यम मूल्य (₹ करोड़)',
    'Liquidation Value Coverage (%)': 'परिसमापन मूल्य कवरेज (%)',
    'Implementation Horizon (Months)': 'कार्यान्वयन अवधि (महीने)',
    'Operational Creditor Recovery (%)': 'परिचालन लेनदार वसूली (%)',
    'Applicant Governance / Track Record': 'आवेदक ट्रैक रिकॉर्ड व शासन',
    'Cultivable Land Holding (Acres)': 'कृषि योग्य भूमि (एकड़)',
    'Annual Harvest Market Value (₹)': 'वार्षिक फसल बाजार मूल्य (₹)',
    'Informal Moneylender Debt Share (%)': 'अनौपचारिक साहूकार ऋण हिस्सा (%)',
    'Perennial Irrigation Source Access': 'बारहमासी सिंचाई स्रोत सुविधा',
    'PM-Fasal Bima Yojana (PMFBY) Insured': 'प्रधानमंत्री फसल बीमा योजना बीमित',
    'Official XAI Compliance Audit Certificate': 'आधिकारिक एक्सएआई अनुपालन ऑडिट प्रमाणपत्र',
    'Every AI Decision, Explained Visually & Spoken in 22 Indian Languages.': 'प्रत्येक एआई निर्णय, 22 भारतीय भाषाओं में दृश्य रूप से समझाया और बोला गया।'
  },
  mr: {
    'CREDIT APPROVED': 'कर्ज मंजूर (Approved)',
    'CREDIT REJECTED': 'कर्ज नाकारले (Rejected)',
    'CLAIM APPROVED': 'दावा मंजूर (Approved)',
    'CLAIM REJECTED': 'दावा नाकारला (Rejected)',
    'SUITABLE': 'गुंतवणुकीसाठी योग्य (Suitable)',
    'NOT SUITABLE': 'गुंतवणुकीसाठी अयोग्य (Not Suitable)',
    'PENSION APPROVED': 'पेन्शन वाटप मंजूर (Approved)',
    'PENSION REJECTED': 'पेन्शन पुनर्मूल्यांकन आवश्यक',
    'RESOLUTION APPROVED': 'ठराव योजना मंजूर (Approved)',
    'LIQUIDATION RISK': 'परिसमापन जोखीम (Liquidation Risk)',
    'KCC APPROVED': 'किसान क्रेडिट कार्ड मंजूर (Approved)',
    'KCC REJECTED': 'किसान क्रेडिट कार्ड नाकारले (Rejected)',
    'Compute Explanations': 'स्पष्टीकरणे काढा',
    'Generate Audit Certificate': 'ऑडिट प्रमाणपत्र तयार करा',
    'Reset Defaults': 'डीफॉल्ट रीसेट करा',
    'Voice Dictate': 'व्हॉइस डिक्टेट',
    'CIBIL / Credit Score': 'सिबिल / क्रेडिट स्कोअर',
    'Requested Loan Amount (₹)': 'मागणी केलेली कर्जाची रक्कम (₹)',
    'Monthly Income (₹)': 'मासिक उत्पन्न (₹)',
    'Existing Obligation (FOIR %)': 'सध्याची देणी (FOIR %)',
    'Past 90-Day DPD (Delinquency)': 'मागील 90 दिवसांचा थकीत इतिहास',
    'Employment Type': 'रोजगाराचा प्रकार',
    'Policy Vintage (Years)': 'पॉलिसी विंटेज (वर्षे)',
    'Claim Amount (₹)': 'दाव्याची रक्कम (₹)',
    'Network Hospital / Garage': 'नेटवर्क रुग्णालय / गॅरेज',
    'Pre-existing Disease Declared': 'पूर्वीचा आजार जाहीर केला आहे का',
    'Anomaly / Risk Index (%)': 'अनियमितता / जोखीम निर्देशांक (%)',
    'Investor Risk Tolerance (1-100)': 'गुंतवणूकदार जोखीम क्षमता (1-100)',
    'Annual Net Worth / Income (₹)': 'वार्षिक निव्वळ संपत्ती / उत्पन्न (₹)',
    'Portfolio Concentration (%)': 'पोर्टफोलिओ एकाग्रता (%)',
    'Investment Horizon (Years)': 'गुंतवणूक कालावधी (वर्षे)',
    'Product Risk Meter Level': 'उत्पादन जोखीम पातळी',
    'Current Investor Age (Years)': 'गुंतवणूकदाराचे सध्याचे वय (वर्षे)',
    'Monthly NPS Contribution (₹)': 'मासिक एनपीएस योगदान (₹)',
    'Active Equity Allocation (E-Class %)': 'इक्विटी वाटप (ई-वर्ग %)',
    'Desired Monthly Pension Target (₹)': 'अपेक्षित मासिक पेन्शन ध्येय (₹)',
    'Retirement Corpus Adequacy Score': 'निवृत्ती निधी पर्याप्तता स्कोअर',
    'Resolution Enterprise Value (₹ Cr)': 'संकल्प एंटरप्राइझ मूल्य (₹ कोटी)',
    'Liquidation Value Coverage (%)': 'परिसमापन मूल्य कव्हरेज (%)',
    'Implementation Horizon (Months)': 'अंमलबजावणी कालावधी (महिने)',
    'Operational Creditor Recovery (%)': 'ऑपरेशनल सावकार वसुली (%)',
    'Applicant Governance / Track Record': 'अर्जदार ट्रॅक रेकॉर्ड आणि प्रशासन',
    'Cultivable Land Holding (Acres)': 'लागवडीयोग्य शेतजमीन (एकर)',
    'Annual Harvest Market Value (₹)': 'वार्षिक पीक बाजार मूल्य (₹)',
    'Informal Moneylender Debt Share (%)': 'सावकारी कर्जाचा वाटा (%)',
    'Perennial Irrigation Source Access': 'बारमाही जलसिंचन सुविधा',
    'PM-Fasal Bima Yojana (PMFBY) Insured': 'पंतप्रधान पीक विमा योजना संरक्षित',
    'Official XAI Compliance Audit Certificate': 'अधिकृत एक्सएआय अनुपालन ऑडिट प्रमाणपत्र',
    'Every AI Decision, Explained Visually & Spoken in 22 Indian Languages.': 'प्रत्येक एआय निर्णय, 22 भारतीय भाषांमध्ये दृश्य स्वरूपात आणि आवाजात स्पष्ट केला जातो.'
  },
  bn: {
    'CREDIT APPROVED': 'ঋণ অনুমোদিত (Approved)',
    'CREDIT REJECTED': 'ঋণ প্রত্যাখ্যাত (Rejected)',
    'CLAIM APPROVED': 'দাবি অনুমোদিত (Approved)',
    'CLAIM REJECTED': 'দাবি প্রত্যাখ্যাত (Rejected)',
    'SUITABLE': 'বিনিয়োগের জন্য উপযুক্ত (Suitable)',
    'NOT SUITABLE': 'অনুপযুক্ত (Not Suitable)',
    'PENSION APPROVED': 'পেনশন অনুমোদিত (Approved)',
    'PENSION REJECTED': 'পেনশন প্রত্যাখ্যান',
    'RESOLUTION APPROVED': 'সমাধান অনুমোদিত (Approved)',
    'LIQUIDATION RISK': 'অবসায়ন ঝুঁকি (Liquidation Risk)',
    'KCC APPROVED': 'কিষাণ ক্রেডিট অনুমোদিত (Approved)',
    'KCC REJECTED': 'কিষাণ ক্রেডিট প্রত্যাখ্যাত (Rejected)',
    'Compute Explanations': 'ব্যাখ্যা গণনা করুন',
    'Generate Audit Certificate': 'অডিট সার্টিফিকেট তৈরি করুন',
    'Reset Defaults': 'রিসেট করুন',
    'Voice Dictate': 'ভয়েস ডিক্টেট',
    'CIBIL / Credit Score': 'সিিবল / ক্রেডিট স্কোর',
    'Requested Loan Amount (₹)': 'অনুরোধ করা ঋণের পরিমাণ (₹)',
    'Monthly Income (₹)': 'মাসিক আয় (₹)',
    'Policy Vintage (Years)': 'পলিসি ভিন্টেজ (বছর)',
    'Claim Amount (₹)': 'দাবির পরিমাণ (₹)',
    'Cultivable Land Holding (Acres)': 'চাষযোগ্য জমির পরিমাণ (একর)'
  },
  ta: {
    'CREDIT APPROVED': 'கடன் அங்கீகரிக்கப்பட்டது (Approved)',
    'CREDIT REJECTED': 'கடன் நிராகரிக்கப்பட்டது (Rejected)',
    'CLAIM APPROVED': 'கோரிக்கை ஏற்கப்பட்டது (Approved)',
    'CLAIM REJECTED': 'கோரிக்கை நிராகரிக்கப்பட்டது (Rejected)',
    'SUITABLE': 'முதலீட்டிற்கு பொருத்தமானது (Suitable)',
    'NOT SUITABLE': 'பொருத்தமற்றது (Not Suitable)',
    'PENSION APPROVED': 'ஓய்வூதியம் அங்கீகரிக்கப்பட்டது (Approved)',
    'PENSION REJECTED': 'ஓய்வூதியம் நிராகரிக்கப்பட்டது',
    'RESOLUTION APPROVED': 'தீர்வு அங்கீகரிக்கப்பட்டது (Approved)',
    'LIQUIDATION RISK': 'கலைப்பு ஆபத்து (Liquidation Risk)',
    'KCC APPROVED': 'கிசான் கிரெடிட் அங்கீகரிக்கப்பட்டது (Approved)',
    'KCC REJECTED': 'கிசான் கிரெடிட் நிராகரிக்கப்பட்டது',
    'Compute Explanations': 'விளக்கங்களைக் கணக்கிடு',
    'Generate Audit Certificate': 'தணிக்கை சான்றிதழ் உருவாக்கு',
    'Reset Defaults': 'மீட்டமைக்க',
    'Voice Dictate': 'குரல் உள்ளீடு',
    'CIBIL / Credit Score': 'சிபில் / கிரெடிட் ஸ்கோர்',
    'Requested Loan Amount (₹)': 'கோரப்பட்ட கடன் தொகை (₹)',
    'Monthly Income (₹)': 'மாத வருமானம் (₹)',
    'Policy Vintage (Years)': 'பாலிசி காலம் (ஆண்டுகள்)',
    'Claim Amount (₹)': 'கோரிக்கை தொகை (₹)',
    'Cultivable Land Holding (Acres)': 'சாகுபடி நிலம் (ஏக்கர்)'
  },
  te: {
    'CREDIT APPROVED': 'రుణం ఆమోదించబడింది (Approved)',
    'CREDIT REJECTED': 'రుణం తిరస్కరించబడింది (Rejected)',
    'CLAIM APPROVED': 'క్లెయిమ్ ఆమోదించబడింది (Approved)',
    'CLAIM REJECTED': 'క్లెయిమ్ తిరస్కరించబడింది (Rejected)',
    'SUITABLE': 'పెట్టుబడికి అనుకూలమైనది (Suitable)',
    'NOT SUITABLE': 'అనుకూలం కాదు (Not Suitable)',
    'PENSION APPROVED': 'పెన్షన్ ఆమోదించబడింది (Approved)',
    'PENSION REJECTED': 'పెన్షన్ తిరస్కరించబడింది',
    'RESOLUTION APPROVED': 'పరిష్కారం ఆమోదించబడింది (Approved)',
    'LIQUIDATION RISK': 'లిక్విడేషన్ ప్రమాదం (Liquidation Risk)',
    'KCC APPROVED': 'కిసాన్ క్రెడిట్ ఆమోదించబడింది (Approved)',
    'KCC REJECTED': 'కిసాన్ క్రెడిట్ తిరస్కరించబడింది',
    'Compute Explanations': 'వివరణలను లెక్కించండి',
    'Generate Audit Certificate': 'ఆడిట్ సర్టిఫికెట్ రూపొందించండి',
    'Reset Defaults': 'రీసెట్ చేయండి',
    'Voice Dictate': 'వాయిస్ డిక్టేట్',
    'CIBIL / Credit Score': 'సిబిల్ / క్రెడిట్ స్కోరు',
    'Requested Loan Amount (₹)': 'కోరిన రుణం మొత్తం (₹)',
    'Monthly Income (₹)': 'నెలవారీ ఆదాయం (₹)',
    'Policy Vintage (Years)': 'పాలసీ కాలపరిమితి (సంవత్సరాలు)',
    'Claim Amount (₹)': 'క్లెయిమ్ మొత్తం (₹)',
    'Cultivable Land Holding (Acres)': 'సాగు భూమి (ఎకరాలు)'
  },
  gu: {
    'CREDIT APPROVED': 'લોન મંજૂર (Approved)',
    'CREDIT REJECTED': 'લોન અસ્વીકાર (Rejected)',
    'CLAIM APPROVED': 'દાવો મંજૂર (Approved)',
    'CLAIM REJECTED': 'દાવો અસ્વીકાર (Rejected)',
    'SUITABLE': 'યોગ્ય છે (Suitable)',
    'NOT SUITABLE': 'યોગ્ય નથી (Not Suitable)',
    'PENSION APPROVED': 'પેન્શન મંજૂર (Approved)',
    'PENSION REJECTED': 'પેન્શન અસ્વીકાર',
    'RESOLUTION APPROVED': 'ઠરાવ મંજૂર (Approved)',
    'LIQUIDATION RISK': 'લિક્વિડેશન જોખમ (Liquidation Risk)',
    'KCC APPROVED': 'કિસાન ક્રેડિટ મંજૂર (Approved)',
    'KCC REJECTED': 'કિસાન ક્રેડિટ અસ્વીકાર',
    'Compute Explanations': 'સમજૂતી ગણો',
    'Generate Audit Certificate': 'ઓડિટ પ્રમાણપત્ર બનાવો',
    'Reset Defaults': 'રીસેટ કરો',
    'Voice Dictate': 'વોઇસ ડિક્ટેટ',
    'CIBIL / Credit Score': 'સિબિલ / ક્રેડિટ સ્કોર',
    'Requested Loan Amount (₹)': 'માંગેલ લોન રકમ (₹)',
    'Monthly Income (₹)': 'માસિક આવક (₹)',
    'Policy Vintage (Years)': 'પોલિસી વિન્ટેજ (વર્ષ)',
    'Claim Amount (₹)': 'દાવાની રકમ (₹)'
  }
};

class InstantTranslateService {
  constructor() {
    this.cache = new Map();
    this.audioElement = new Audio();
    this.audioElement.setAttribute('referrerpolicy', 'no-referrer');
    this.isPlayingAudio = false;
    this.isPausedAudio = false;
    this.onAudioStateChange = null;
    this.currentAudioChunks = [];
    this.currentChunkIndex = 0;
    this.currentTextToSpeak = '';
    this.currentAudioLang = 'en';

    this.audioElement.onended = () => {
      this.playNextChunk();
    };

    this.audioElement.onerror = (e) => {
      console.warn('Audio stream playback error, trying Web Speech fallback:', e);
      this.fallbackWebSpeech(this.currentTextToSpeak, this.currentAudioLang);
    };
  }

  async translateText(text, sourceLang = 'en', targetLang = 'hi') {
    if (!text || sourceLang === targetLang) return text;

    const cacheKey = `${sourceLang}_${targetLang}_${text}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
    if (!cleanText) return text;

    // Check pre-compiled instant dictionary first (0ms latency)
    if (STATIC_TRANSLATIONS && STATIC_TRANSLATIONS[targetLang] && STATIC_TRANSLATIONS[targetLang][cleanText]) {
      const instantMatch = STATIC_TRANSLATIONS[targetLang][cleanText];
      this.cache.set(cacheKey, instantMatch);
      return instantMatch;
    }

    if (cleanText.length > 250) {
      const paragraphs = cleanText.split(/\n\n+/);
      const translatedParagraphs = [];

      for (const p of paragraphs) {
        if (!p.trim()) continue;
        const sentences = p.split(/(?<=[.!?।])\s+/).filter(s => s.trim());
        // Execute all sentence translations in parallel for maximum speed
        const transArr = await Promise.all(
          sentences.map(s => this.fetchSingleTranslation(s, sourceLang, targetLang))
        );
        translatedParagraphs.push(transArr.join(' '));
      }

      const result = translatedParagraphs.join('\n\n');
      this.cache.set(cacheKey, result);
      return result;
    }

    const result = await this.fetchSingleTranslation(cleanText, sourceLang, targetLang);
    this.cache.set(cacheKey, result);
    return result;
  }

  async translateBatch(textsMap, sourceLang = 'en', targetLang = 'hi') {
    if (!textsMap || Object.keys(textsMap).length === 0) return {};
    if (sourceLang === targetLang) return { ...textsMap };

    const results = {};
    const uncached = {};

    for (const [key, text] of Object.entries(textsMap)) {
      if (!text || typeof text !== 'string') {
        results[key] = text;
        continue;
      }
      const clean = text.replace(/<[^>]*>?/gm, '').trim();
      if (!clean) {
        results[key] = text;
        continue;
      }

      const cacheKey = `${sourceLang}_${targetLang}_${clean}`;
      if (this.cache.has(cacheKey)) {
        results[key] = this.cache.get(cacheKey);
      } else if (STATIC_TRANSLATIONS && STATIC_TRANSLATIONS[targetLang] && STATIC_TRANSLATIONS[targetLang][clean]) {
        const match = STATIC_TRANSLATIONS[targetLang][clean];
        this.cache.set(cacheKey, match);
        results[key] = match;
      } else {
        uncached[key] = clean;
      }
    }

    if (Object.keys(uncached).length === 0) {
      return results;
    }

    // Call FastAPI backend POST /translate/batch (Gemini 1.5 Flash batch translation)
    try {
      const resp = await fetch(`${SPASHTA_API_URL}/translate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: uncached,
          source_lang: sourceLang,
          target_lang: targetLang
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.translations) {
          for (const [key, translatedVal] of Object.entries(data.translations)) {
            results[key] = translatedVal;
            const originalClean = uncached[key];
            if (originalClean && translatedVal) {
              this.cache.set(`${sourceLang}_${targetLang}_${originalClean}`, translatedVal);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Backend batch translation failed, executing parallel browser fallback:', e);
    }

    // Any keys still missing: run fetchSingleTranslation in parallel
    const missingKeys = Object.keys(uncached).filter(k => !results[k]);
    if (missingKeys.length > 0) {
      await Promise.all(
        missingKeys.map(async (k) => {
          const trans = await this.fetchSingleTranslation(uncached[k], sourceLang, targetLang);
          results[k] = trans;
          this.cache.set(`${sourceLang}_${targetLang}_${uncached[k]}`, trans);
        })
      );
    }

    return results;
  }

  async fetchSingleTranslation(textChunk, sourceLang, targetLang) {
    const clean = textChunk.trim();
    if (!clean) return textChunk;

    // 1. Direct Pre-compiled Instant Dictionary (0ms latency, zero network)
    if (STATIC_TRANSLATIONS && STATIC_TRANSLATIONS[targetLang] && STATIC_TRANSLATIONS[targetLang][clean]) {
      return STATIC_TRANSLATIONS[targetLang][clean];
    }

    // 2. Direct browser Google GTX fetch (fast, client residential IP, no datacenter 429)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(clean)}`;
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        if (text.startsWith('[')) {
          const data = JSON.parse(text);
          if (data && data[0]) {
            const translated = data[0].map(item => item[0]).filter(Boolean).join('').trim();
            if (translated && (sourceLang === targetLang || translated !== clean)) {
              return translated;
            }
          }
        }
      }
    } catch (e) {
      // Browser GTX fallback
    }

    // 3. MyMemory API with verified email parameter
    try {
      const url2 = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${sourceLang}|${targetLang}&de=spashta.audit.ai@gmail.com`;
      const response2 = await fetch(url2);
      if (response2.ok) {
        const data2 = await response2.json();
        const translated2 = data2?.responseData?.translatedText?.trim();
        if (translated2 && !translated2.toUpperCase().startsWith('MYMEMORY WARNING') && translated2 !== clean) {
          return translated2;
        }
      }
    } catch (e2) {
      // MyMemory fallback
    }

    // 4. Server-side FastAPI Translation Proxy
    try {
      const resp = await fetch(`${SPASHTA_API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clean,
          source_lang: sourceLang,
          target_lang: targetLang
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.translated_text) {
          const res = data.translated_text.trim();
          if (res && (sourceLang === targetLang || res !== clean)) {
            return res;
          }
        }
      }
    } catch (apiErr) {
      // Proxy unreachable
    }

    return textChunk;
  }

  speakText(text, lang = 'en') {
    this.stopAudio();
    if (!text) return;

    this.currentTextToSpeak = text;
    this.currentAudioLang = lang || 'en';

    const cleanText = text
      .replace(/<[^>]*>?/gm, '')
      .replace(/[•\t\r]/g, '')
      .replace(/\n+/g, '. ');

    const rawSentences = cleanText.split(/(?<=[.!?।])\s+/);
    this.currentAudioChunks = [];

    rawSentences.forEach(s => {
      let str = s.trim();
      while (str.length > 140) {
        let cut = str.lastIndexOf(' ', 140);
        if (cut === -1) cut = 140;
        this.currentAudioChunks.push(str.slice(0, cut));
        str = str.slice(cut).trim();
      }
      if (str.length > 0) {
        this.currentAudioChunks.push(str);
      }
    });

    if (this.currentAudioChunks.length === 0) return;

    this.currentChunkIndex = 0;
    this.isPlayingAudio = true;
    this.isPausedAudio = false;

    if (this.onAudioStateChange) this.onAudioStateChange({ state: 'playing' });

    this.playChunk(this.currentChunkIndex);
  }

  playChunk(index) {
    if (index >= this.currentAudioChunks.length) {
      this.isPlayingAudio = false;
      this.isPausedAudio = false;
      if (this.onAudioStateChange) this.onAudioStateChange({ state: 'stopped' });
      return;
    }

    const chunk = this.currentAudioChunks[index];
    const tlParam = this.currentAudioLang || 'en';
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${tlParam}&client=gtx`;

    this.audioElement.src = audioUrl;
    this.audioElement.play().catch(err => {
      console.warn('Audio stream play blocked or failed, trying Web Speech fallback:', err);
      this.fallbackWebSpeech(this.currentTextToSpeak, this.currentAudioLang);
    });
  }

  playNextChunk() {
    if (!this.isPlayingAudio) return;
    this.currentChunkIndex++;
    this.playChunk(this.currentChunkIndex);
  }

  pauseAudio() {
    if (this.audioElement && this.isPlayingAudio) {
      this.audioElement.pause();
      this.isPausedAudio = true;
      if (this.onAudioStateChange) this.onAudioStateChange({ state: 'paused' });
    } else if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.isPausedAudio = true;
      if (this.onAudioStateChange) this.onAudioStateChange({ state: 'paused' });
    }
  }

  resumeAudio() {
    if (this.audioElement && this.isPausedAudio) {
      this.audioElement.play();
      this.isPausedAudio = false;
      if (this.onAudioStateChange) this.onAudioStateChange({ state: 'playing' });
    } else if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.isPausedAudio = false;
      if (this.onAudioStateChange) this.onAudioStateChange({ state: 'playing' });
    }
  }

  stopAudio() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentAudioChunks = [];
    this.currentChunkIndex = 0;
    this.isPlayingAudio = false;
    this.isPausedAudio = false;
    if (this.onAudioStateChange) this.onAudioStateChange({ state: 'stopped' });
  }

  fallbackWebSpeech(cleanText, targetLang = 'en') {
    if (!('speechSynthesis' in window)) {
      this.isPlayingAudio = false;
      this.isPausedAudio = false;
      if (this.onAudioStateChange) this.onAudioStateChange({ state: 'stopped' });
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Map language code to standard locale
    const langMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      ur: 'ur-IN'
    };
    utterance.lang = langMap[targetLang] || `${targetLang}-IN`;
    utterance.rate = 0.95;

    // Pick matching voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(targetLang) || v.lang.includes(targetLang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      this.isPlayingAudio = false;
      this.isPausedAudio = false;
      if (this.onAudioStateChange) this.onAudioStateChange({ state: 'stopped' });
    };

    utterance.onerror = () => {
      this.isPlayingAudio = false;
      this.isPausedAudio = false;
      if (this.onAudioStateChange) this.onAudioStateChange({ state: 'stopped' });
    };

    this.isPlayingAudio = true;
    this.isPausedAudio = false;
    if (this.onAudioStateChange) this.onAudioStateChange({ state: 'playing' });
    window.speechSynthesis.speak(utterance);
  }
}

const translateService = new InstantTranslateService();
