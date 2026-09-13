const LANGS = [
  { code: 'en', native: 'English', script: 'latin', speechLocale: 'en-IN' },
  { code: 'hi', native: 'हिंदी (Hindi)', script: 'deva', speechLocale: 'hi-IN' },
  { code: 'bn', native: 'বাংলা (Bengali)', script: 'beng', speechLocale: 'bn-IN' },
  { code: 'mr', native: 'मराठी (Marathi)', script: 'deva', speechLocale: 'mr-IN' },
  { code: 'te', native: 'తెలుగు (Telugu)', script: 'telu', speechLocale: 'te-IN' },
  { code: 'ta', native: 'தமிழ் (Tamil)', script: 'taml', speechLocale: 'ta-IN' },
  { code: 'gu', native: 'ગુજરાતી (Gujarati)', script: 'gujr', speechLocale: 'gu-IN' },
  { code: 'kn', native: 'ಕನ್ನಡ (Kannada)', script: 'knda', speechLocale: 'kn-IN' },
  { code: 'ml', native: 'മലയാളം (Malayalam)', script: 'mlym', speechLocale: 'ml-IN' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ (Punjabi)', script: 'guru', speechLocale: 'pa-IN' },
  { code: 'ur', native: 'اردو (Urdu)', script: 'arab', rtl: true, speechLocale: 'ur-IN' },
  { code: 'or', native: 'ଓଡ଼ିଆ (Odia)', script: 'orya', speechLocale: 'or-IN' },
  { code: 'as', native: 'অসমীয়া (Assamese)', script: 'beng', speechLocale: 'as-IN' },
  { code: 'sa', native: 'संस्कृतम् (Sanskrit)', script: 'deva', speechLocale: 'hi-IN' },
  { code: 'mai', native: 'मैथिली (Maithili)', script: 'deva', speechLocale: 'hi-IN' },
  { code: 'doi', native: 'डोगरी (Dogri)', script: 'deva', speechLocale: 'hi-IN' },
  { code: 'gom', native: 'कोंकणी (Konkani)', script: 'deva', speechLocale: 'mr-IN' },
  { code: 'ne', native: 'नेपाली (Nepali)', script: 'deva', speechLocale: 'ne-NP' },
  { code: 'sd', native: 'سنڌي (Sindhi)', script: 'arab', rtl: true, speechLocale: 'ur-IN' },
  { code: 'ks', native: 'کٲشُر (Kashmiri)', script: 'arab', rtl: true, speechLocale: 'ur-IN' },
  { code: 'brx', native: 'बड़ो (Bodo)', script: 'deva', speechLocale: 'hi-IN' },
  { code: 'sat', native: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)', script: 'latin', speechLocale: 'hi-IN' },
  { code: 'mni', native: 'মৈতৈলোন্ (Manipuri)', script: 'beng', speechLocale: 'bn-IN' }
];

const LANG_BY_CODE = Object.fromEntries(LANGS.map(l => [l.code, l]));

const DOMAINS = {
  rbi: {
    key: 'rbi',
    name: 'RBI',
    fullName: 'Reserve Bank of India',
    certPrefix: 'RBI/XAI-CREDIT',
    intercept: -4.395,
    intro: 'Evaluates applicant creditworthiness under <b>RBI Master Direction on Credit Card and Debit Card Issuance (2022)</b> & Digital Lending Guidelines.',
    citation: 'Clause 6.2 (Explainability in Automated Underwriting) & RBI Fair Lending Practices Code 2023.',
    decisionWord: {
      pos: 'CREDIT APPROVED',
      neg: 'CREDIT REJECTED'
    },
    decisionVerb: 'credit card / personal loan application',
    fields: [
      {
        key: 'score',
        label: 'CIBIL / Credit Score',
        flabel: 'Credit Score',
        icon: '📊', min: 300, max: 900, step: 5, base: 650, coef: 0.008,
        fmt: (v) => `${v}`,
        help: 'Credit Bureau / CIBIL score (range 300 to 900). Scores above 750 reflect strong creditworthiness and provide positive attribution towards loan approval under RBI Master Directions.'
      },
      {
        key: 'loan_amount',
        label: 'Requested Loan Amount (₹)',
        flabel: 'Requested Loan Amount',
        icon: '💵', min: 10000, max: 2500000, step: 10000, base: 500000, coef: -0.0000008,
        fmt: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
        help: 'Principal loan quantum requested by the applicant. Higher loan amounts elevate lender exposure risk, requiring stronger income and credit backing.'
      },
      {
        key: 'income',
        label: 'Monthly Income (₹)',
        flabel: 'Monthly Income',
        icon: '💰', min: 500, max: 300000, step: 500, base: 45000, coef: 0.000015,
        fmt: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
        help: 'Verified net monthly disposable income. Directly increases debt-servicing capability and provides strong positive attribution towards loan approval.'
      },
      {
        key: 'foir',
        label: 'Existing Obligation (FOIR %)',
        flabel: 'Debt Ratio (FOIR)',
        icon: '⚖️', min: 10, max: 90, step: 1, base: 45, coef: -0.03,
        fmt: (v) => `${v}%`,
        help: 'Fixed Obligation to Income Ratio (% of monthly income tied to existing debt repayments). Lower FOIR (<40%) indicates sufficient debt servicing headroom.'
      },
      {
        key: 'delinquency',
        label: 'Past 90-Day DPD (Delinquency)',
        flabel: 'Past 90D Delinquencies',
        icon: '⚠️', type: 'select', base: 0, coef: -1.0,
        options: [
          { v: 0, label: '0 Times (Clean Record)' },
          { v: 1, label: '1 Time Delayed' },
          { v: 2, label: '2+ Times Delayed' }
        ],
        help: 'Days Past Due repayment delays in the last 90 days. A clean track record (0 delays) is mandatory for prime underwriting; past delays severely penalize the score.'
      },
      {
        key: 'emp_status',
        label: 'Employment Type',
        flabel: 'Employment Category',
        icon: '💼', type: 'select', base: 1, coef: 0.4,
        options: [
          { v: 2, label: 'Government / PSU Employee' },
          { v: 1, label: 'Salaried Corporate' },
          { v: 0.5, label: 'Self-Employed Professional' },
          { v: -0.5, label: 'Gig / Freelancer' }
        ],
        help: 'Category of applicant employment stability. Government and corporate salaried profiles carry lower default risk compared to gig or freelance contracts.'
      }
    ],
    presets: [
      { label: '🟢 Prime Applicant', values: { score: 790, loan_amount: 300000, income: 120000, foir: 25, delinquency: 0, emp_status: 2 } },
      { label: '🟡 Borderline Profile', values: { score: 670, loan_amount: 600000, income: 45000, foir: 52, delinquency: 0, emp_status: 1 } },
      { label: '🔴 High Risk Defaulter', values: { score: 540, loan_amount: 1500000, income: 25000, foir: 75, delinquency: 2, emp_status: -0.5 } }
    ]
  },

  irdai: {
    key: 'irdai',
    name: 'IRDAI',
    fullName: 'Insurance Regulatory & Development Authority of India',
    certPrefix: 'IRDAI/XAI-CLAIM',
    intercept: 0.75,
    intro: 'Evaluates health & motor insurance claim settlement validity under <b>IRDAI Protection of Policyholders Interests Regulations 2024</b>.',
    citation: 'Section 14(2) (Fair & Transparent Automated Claims Adjudication) & Policyholder Protection Act.',
    decisionWord: {
      pos: 'CLAIM APPROVED',
      neg: 'CLAIM FLAGGED / REJECTED'
    },
    decisionVerb: 'insurance claim settlement',
    fields: [
      {
        key: 'tenure',
        label: 'Policy Vintage (Years)',
        flabel: 'Policy Tenure',
        icon: '📅', min: 0, max: 15, step: 0.5, base: 3, coef: 0.12,
        fmt: (v) => `${v} Yrs`,
        help: 'Duration since policy inception. Under Section 45 of the Insurance Act, policies active over 3 years gain statutory protection against arbitrary claim contestability.'
      },
      {
        key: 'amount',
        label: 'Claim Amount (₹)',
        flabel: 'Claim Value',
        icon: '💳', min: 10000, max: 1000000, step: 10000, base: 150000, coef: -0.0000015,
        fmt: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
        help: 'Billed hospitalization or repair expenditure. High-value claims undergo scrutiny against the sum insured and standard medical procedure costs.'
      },
      {
        key: 'network',
        label: 'Network Hospital / Garage',
        flabel: 'Network Facility Status',
        icon: '🏥', type: 'toggle', base: 1, coef: 0.9,
        help: 'Indicates whether treatment is at an IRDAI-empanelled cashless hospital or garage. Turn ON (1) if admitted to a network cashless hospital; turn OFF (0) if seeking reimbursement at an unlisted facility.'
      },
      {
        key: 'pre_existing',
        label: 'Pre-existing Disease Declared',
        flabel: 'Pre-existing Condition Disclosure',
        icon: '📋', type: 'toggle', base: 1, coef: 1.6,
        help: 'Discloses whether the applicant declared prior chronic medical conditions at inception. Turn ON (1) if declared transparently; turn OFF (0) if undisclosed.'
      },
      {
        key: 'fraud_score',
        label: 'Anomaly / Risk Index (%)',
        flabel: 'Claim Anomaly Score',
        icon: '🔍', min: 0, max: 100, step: 5, base: 15, coef: -0.062,
        fmt: (v) => `${v}%`,
        help: 'Algorithmic anomaly score flagging suspicious billing patterns or duplicate claims. Lower scores (<20%) reflect clean clinical adjudication.'
      }
    ],
    presets: [
      { label: '🟢 Genuine Cashless Claim', values: { tenure: 5, amount: 85000, network: 1, pre_existing: 1, fraud_score: 5 } },
      { label: '🟡 Non-Network Delay', values: { tenure: 2, amount: 250000, network: 0, pre_existing: 1, fraud_score: 35 } },
      { label: '🔴 Suspicious Claim', values: { tenure: 0.5, amount: 650000, network: 0, pre_existing: 0, fraud_score: 85 } }
    ]
  },

  sebi: {
    key: 'sebi',
    name: 'SEBI',
    fullName: 'Securities and Exchange Board of India',
    certPrefix: 'SEBI/XAI-SUIT',
    intercept: 0.3,
    intro: 'Evaluates retail investor risk suitability for structured products under <b>SEBI Investment Advisers Regulations (2020 Amendment)</b>.',
    citation: 'Regulation 16 (Suitability & Risk Profiling of Retail Investors) & SEBI Cybersecurity Circular.',
    decisionWord: {
      pos: 'PRODUCT SUITABLE',
      neg: 'RISK MISMATCH / UNSUITABLE'
    },
    decisionVerb: 'investment product advisory recommendation',
    fields: [
      {
        key: 'risk_appetite',
        label: 'Investor Risk Tolerance (1-100)',
        flabel: 'Risk Tolerance Score',
        icon: '🎯', min: 10, max: 100, step: 5, base: 60, coef: 0.045,
        fmt: (v) => `${v}/100`,
        help: 'Psychometric risk tolerance under SEBI Investment Advisers Regulations. Higher scores (>70) indicate aggressive capital growth capacity; lower scores prioritize capital safety.'
      },
      {
        key: 'income',
        label: 'Annual Net Worth / Income (₹)',
        flabel: 'Annual Net Worth',
        icon: '💵', min: 200000, max: 5000000, step: 100000, base: 1200000, coef: 0.0000004,
        fmt: (v) => `₹${(v / 100000).toFixed(1)} Lakh`,
        help: 'Verifiable annual income or liquid net worth. Represents the financial cushion available to absorb potential capital drawdowns in market cycles.'
      },
      {
        key: 'concentration',
        label: 'Portfolio Concentration (%)',
        flabel: 'Portfolio Exposure',
        icon: '📊', min: 5, max: 90, step: 5, base: 30, coef: -0.025,
        fmt: (v) => `${v}%`,
        help: 'Allocation percentage in a single asset class or thematic fund. High concentration (>40%) violates regulatory diversification guidelines under SEBI circulars.'
      },
      {
        key: 'horizon',
        label: 'Investment Horizon (Years)',
        flabel: 'Investment Tenure',
        icon: '⏳', min: 1, max: 20, step: 1, base: 7, coef: 0.1,
        fmt: (v) => `${v} Yrs`,
        help: 'Planned holding period before redemption. Longer horizons (5+ years) allow compounding and cushion short-term equity volatility.'
      },
      {
        key: 'risk_category',
        label: 'Product Risk Meter Level',
        flabel: 'Product Risk Category',
        icon: '📈', type: 'select', base: 3, coef: -0.9,
        options: [
          { v: 1, label: 'Low Risk (Liquid / G-Sec)' },
          { v: 3, label: 'Moderate Risk (Balanced Funds)' },
          { v: 5, label: 'Very High Risk (Derivative / Crypto)' }
        ],
        help: 'SEBI 6-tier Risk-o-Meter classification of the financial instrument. Products rated High Risk require substantial investor suitability clearance.'
      }
    ],
    presets: [
      { label: '🟢 Suitable Balanced Investor', values: { risk_appetite: 75, income: 1800000, concentration: 25, horizon: 8, risk_category: 3 } },
      { label: '🟡 Conservative Investor', values: { risk_appetite: 45, income: 800000, concentration: 40, horizon: 4, risk_category: 3 } },
      { label: '🔴 High Risk Mismatch', values: { risk_appetite: 20, income: 300000, concentration: 80, horizon: 1, risk_category: 5 } }
    ]
  },

  pfrda: {
    key: 'pfrda',
    name: 'PFRDA',
    fullName: 'Pension Fund Regulatory and Development Authority',
    certPrefix: 'PFRDA/XAI-PENSION',
    intercept: -0.45,
    intro: 'Evaluates citizen retirement pension suitability and National Pension System (NPS) asset allocation under <b>PFRDA (Retirement Adviser) Regulations 2016</b>.',
    citation: 'Regulation 14 (Suitability of Pension Schemes & Life-Cycle Fund Allocation) & PFRDA Master Circular 2023.',
    decisionWord: {
      pos: 'PENSION PLAN SUITABLE',
      neg: 'CORPUS INADEQUATE / UNSUITABLE'
    },
    decisionVerb: 'pension scheme and annuity suitability assessment',
    fields: [
      {
        key: 'age',
        label: 'Current Investor Age (Years)',
        flabel: 'Investor Age',
        icon: '👤', min: 18, max: 70, step: 1, base: 35, coef: -0.04,
        fmt: (v) => `${v} Yrs`,
        help: 'Subscriber current age. Determines remaining wealth-accumulation years until superannuation age 60 under PFRDA life-cycle guidelines.'
      },
      {
        key: 'monthly_contribution',
        label: 'Monthly NPS Contribution (₹)',
        flabel: 'Monthly NPS Savings',
        icon: '💰', min: 500, max: 100000, step: 500, base: 10000, coef: 0.00004,
        fmt: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
        help: 'Monthly recurring contribution into Tier-I NPS retirement account. Sustained recurring savings drive annuity accumulation over time.'
      },
      {
        key: 'equity_allocation',
        label: 'Active Equity Allocation (E-Class %)',
        flabel: 'Equity Exposure',
        icon: '📈', min: 5, max: 75, step: 5, base: 40, coef: 0.025,
        fmt: (v) => `${v}%`,
        help: 'Percentage of retirement portfolio allocated to Class E (Equities). PFRDA caps equity at 75% for young subscribers, automatically tapering down with age.'
      },
      {
        key: 'pension_target',
        label: 'Desired Monthly Pension Target (₹)',
        flabel: 'Target Monthly Pension',
        icon: '🎯', min: 10000, max: 200000, step: 5000, base: 45000, coef: -0.00002,
        fmt: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
        help: 'Targeted post-retirement monthly annuity payout in today purchasing power. Evaluated against actuarial projections of corpus sufficiency.'
      },
      {
        key: 'corpus_index',
        label: 'Retirement Corpus Adequacy Score',
        flabel: 'Corpus Adequacy Ratio',
        icon: '🛡️', min: 10, max: 100, step: 5, base: 50, coef: 0.035,
        fmt: (v) => `${v}/100`,
        help: 'Actuarial index measuring whether projected maturity savings can sustain target annuities. Scores above 70 indicate a fully funded retirement plan.'
      }
    ],
    presets: [
      { label: '🟢 Well-Funded Early Saver', values: { age: 28, monthly_contribution: 25000, equity_allocation: 60, pension_target: 40000, corpus_index: 85 } },
      { label: '🟡 Moderate Mid-Career Gap', values: { age: 44, monthly_contribution: 8000, equity_allocation: 35, pension_target: 50000, corpus_index: 45 } },
      { label: '🔴 Critical Shortfall (Late Entry)', values: { age: 58, monthly_contribution: 3000, equity_allocation: 15, pension_target: 60000, corpus_index: 20 } }
    ]
  },

  ibbi: {
    key: 'ibbi',
    name: 'IBBI',
    fullName: 'Insolvency and Bankruptcy Board of India',
    certPrefix: 'IBBI/XAI-CIRP',
    intercept: -0.20,
    intro: 'Evaluates Corporate Insolvency Resolution Process (CIRP) resolution plan feasibility and liquidation viability under <b>Insolvency and Bankruptcy Code 2016</b>.',
    citation: 'Section 30(2) & Section 31 (Feasibility and Viability of Resolution Plan) & IBBI CIRP Regulations 2024.',
    decisionWord: {
      pos: 'RESOLUTION PLAN VIABLE',
      neg: 'LIQUIDATION RISK / REJECTED'
    },
    decisionVerb: 'insolvency resolution plan evaluation',
    fields: [
      {
        key: 'ev_amount',
        label: 'Resolution Enterprise Value (₹ Cr)',
        flabel: 'Offered Resolution Value',
        icon: '🏢', min: 10, max: 1000, step: 10, base: 150, coef: 0.004,
        fmt: (v) => `₹${v} Cr`,
        help: 'Proposed aggregate valuation and cash payout offered by the Resolution Applicant to take over the corporate debtor under Section 30(2) IBC.'
      },
      {
        key: 'liquidation_coverage',
        label: 'Liquidation Value Coverage (%)',
        flabel: 'Liquidation Coverage Ratio',
        icon: '⚖️', min: 50, max: 200, step: 5, base: 110, coef: 0.015,
        fmt: (v) => `${v}%`,
        help: 'Ratio of offered resolution value relative to the official liquidation benchmark. Must comfortably exceed 100% to protect creditor recovery.'
      },
      {
        key: 'timeline_months',
        label: 'Implementation Horizon (Months)',
        flabel: 'Resolution Timeline',
        icon: '⏳', min: 3, max: 36, step: 1, base: 12, coef: -0.06,
        fmt: (v) => `${v} Mo`,
        help: 'Proposed duration to complete restructuring and disburse funds. Shorter timelines (<180-330 days) receive prioritized Committee of Creditors approval.'
      },
      {
        key: 'op_creditor_recovery',
        label: 'Operational Creditor Recovery (%)',
        flabel: 'Operational Creditor Share',
        icon: '🤝', min: 10, max: 100, step: 5, base: 40, coef: 0.02,
        fmt: (v) => `${v}%`,
        help: 'Percentage payout guaranteed to operational creditors (MSMEs, suppliers, workers) under Section 30(2)(b) IBC.'
      },
      {
        key: 'promoter_track',
        label: 'Applicant Governance / Track Record',
        flabel: 'Resolution Applicant Track Record',
        icon: '🏆', type: 'select', base: 1, coef: 0.45,
        options: [
          { v: 3, label: 'Experienced / Listed Corporate Entity' },
          { v: 1, label: 'Mid-Tier Strategic Consortium' },
          { v: -1, label: 'New / High-Leverage Distress Buyer' }
        ],
        help: 'Due diligence track record of the resolution applicant under Section 29A IBC. Experienced entities with clean compliance histories gain higher viability approval.'
      }
    ],
    presets: [
      { label: '🟢 High-Value Turnaround Plan', values: { ev_amount: 450, liquidation_coverage: 150, timeline_months: 8, op_creditor_recovery: 70, promoter_track: 3 } },
      { label: '🟡 Stretched Implementation', values: { ev_amount: 140, liquidation_coverage: 105, timeline_months: 24, op_creditor_recovery: 35, promoter_track: 1 } },
      { label: '🔴 Sub-Liquidation Risk Plan', values: { ev_amount: 30, liquidation_coverage: 65, timeline_months: 32, op_creditor_recovery: 15, promoter_track: -1 } }
    ]
  },

  nabard: {
    key: 'nabard',
    name: 'NABARD',
    fullName: 'National Bank for Agriculture & Rural Development',
    certPrefix: 'NABARD/XAI-AGRI',
    intercept: -0.85,
    intro: 'Evaluates smallholder farmer Kisan Credit Card (KCC) limit and agricultural crop loan viability under <b>NABARD Master Guidelines on Kisan Credit Card</b>.',
    citation: 'NABARD KCC Operational Guidelines & RBI Master Direction on Priority Sector Lending (Agriculture).',
    decisionWord: {
      pos: 'KCC CROP LOAN APPROVED',
      neg: 'AGRI CREDIT REJECTED / HIGH RISK'
    },
    decisionVerb: 'agricultural credit and Kisan Credit Card underwriting',
    fields: [
      {
        key: 'land_holding',
        label: 'Cultivable Land Holding (Acres)',
        flabel: 'Cultivable Land Size',
        icon: '🌾', min: 0.5, max: 25.0, step: 0.5, base: 3.5, coef: 0.18,
        fmt: (v) => `${v} Acres`,
        help: 'Size of cultivable agricultural land holding. Primary baseline determining scale of finance and borrowing limits under NABARD KCC operational guidelines.'
      },
      {
        key: 'crop_value',
        label: 'Annual Harvest Market Value (₹)',
        flabel: 'Annual Harvest Yield',
        icon: '🚜', min: 5000, max: 1500000, step: 5000, base: 300000, coef: 0.0000035,
        fmt: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
        help: 'Expected gross market turnover from kharif and rabi crop yields based on district MSP (Minimum Support Price) metrics.'
      },
      {
        key: 'informal_debt',
        label: 'Informal Moneylender Debt Share (%)',
        flabel: 'Non-Institutional Debt Ratio',
        icon: '⛓️', min: 0, max: 80, step: 5, base: 20, coef: -0.04,
        fmt: (v) => `${v}%`,
        help: 'Share of liabilities borrowed from non-institutional moneylenders at high rates. High informal debt (>30%) triggers severe credit distress.'
      },
      {
        key: 'irrigation_status',
        label: 'Perennial Irrigation Source Access',
        flabel: 'Irrigation Reliability',
        icon: '💧', type: 'toggle', base: 1, coef: 0.85,
        help: 'Confirms access to perennial irrigation (canal, tube-well, micro-drip). Turn ON (1) for reliable multi-cropping; turn OFF (0) for rainfed monsoon-dependent dryland.'
      },
      {
        key: 'crop_insurance',
        label: 'PM-Fasal Bima Yojana (PMFBY) Insured',
        flabel: 'PMFBY Crop Insurance Coverage',
        icon: '🛡️', type: 'toggle', base: 1, coef: 1.15,
        help: 'Enrollment in Pradhan Mantri Fasal Bima Yojana. Turn ON (1) to safeguard against weather/pest catastrophes; turn OFF (0) if uninsured.'
      }
    ],
    presets: [
      { label: '🟢 Progressive Insured Farmer', values: { land_holding: 7.5, crop_value: 650000, informal_debt: 5, irrigation_status: 1, crop_insurance: 1 } },
      { label: '🟡 Rainfed Marginal Farmer', values: { land_holding: 2.5, crop_value: 180000, informal_debt: 35, irrigation_status: 0, crop_insurance: 1 } },
      { label: '🔴 Over-indebted Uninsured Crop', values: { land_holding: 1.5, crop_value: 75000, informal_debt: 75, irrigation_status: 0, crop_insurance: 0 } }
    ]
  }
};
