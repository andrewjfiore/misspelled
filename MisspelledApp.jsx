import React, { useState, useMemo, useEffect } from 'react';
import { Search, ExternalLink, Copy, Check, Filter, Keyboard, ChevronDown, X, Plus, Shuffle, AlertCircle, Sparkles, Globe } from 'lucide-react';

// ============================================================
// KEYBOARD LAYOUTS
// ============================================================
const KEYBOARD_LAYOUTS = {
  qwerty: {
    name: 'QWERTY (US)',
    map: {
      'q':'wa12','w':'qeas23','e':'wrds34','r':'etdf45','t':'ryfg56',
      'y':'tugh67','u':'yihj78','i':'uojk89','o':'ipkl90','p':'ol0',
      'a':'qwsz','s':'awedzx','d':'serfxc','f':'drtgcv','g':'ftyhvb',
      'h':'gyujbn','j':'huiknm','k':'jiolm','l':'kop',
      'z':'asx','x':'zsdc','c':'xdfv','v':'cfgb','b':'vghn',
      'n':'bhjm','m':'njk',
      '1':'2q','2':'13qw','3':'24we','4':'35er','5':'46rt',
      '6':'57ty','7':'68yu','8':'79ui','9':'80io','0':'9op',
    }
  },
  qwertz: {
    name: 'QWERTZ (DE)',
    map: {
      'q':'wa12','w':'qeas23','e':'wrds34','r':'etdf45','t':'rzfg56',
      'z':'tugh67','u':'zihj78','i':'uojk89','o':'ipkl90','p':'ol0',
      'a':'qwsy','s':'awedyx','d':'serfxc','f':'drtgcv','g':'ftzhvb',
      'h':'gzujbn','j':'huiknm','k':'jiolm','l':'kop',
      'y':'asx','x':'ysdc','c':'xdfv','v':'cfgb','b':'vghn',
      'n':'bhjm','m':'njk',
    }
  },
  azerty: {
    name: 'AZERTY (FR)',
    map: {
      'a':'zq12','z':'aesq23','e':'zrds34','r':'etfd45','t':'rygf56',
      'y':'tuhg67','u':'yijh78','i':'uokj89','o':'iplk90','p':'om0l',
      'q':'aszw','s':'qzedwx','d':'serfxc','f':'drtgcv','g':'ftyhvb',
      'h':'gyujbn','j':'huiknm','k':'jiolm','l':'kopm',
      'w':'qsx','x':'wsdc','c':'xdfv','v':'cfgb','b':'vghn',
      'n':'bhjm','m':'nplj',
    }
  },
};

// ============================================================
// TYPO GENERATORS
// ============================================================
function generateMissing(word) {
  const out = new Set();
  for (let i = 0; i < word.length; i++) {
    const r = word.slice(0, i) + word.slice(i + 1);
    if (r.length >= 2) out.add(r);
  }
  return [...out];
}

function generateSwapped(word) {
  const out = new Set();
  for (let i = 0; i < word.length - 1; i++) {
    if (word[i] === word[i + 1]) continue;
    const arr = word.split('');
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    out.add(arr.join(''));
  }
  return [...out];
}

function generateDoubled(word) {
  const out = new Set();
  for (let i = 0; i < word.length; i++) {
    out.add(word.slice(0, i) + word[i] + word.slice(i));
  }
  return [...out];
}

function generateReplaced(word, neighbors) {
  const out = new Set();
  for (let i = 0; i < word.length; i++) {
    const ch = word[i].toLowerCase();
    const adj = neighbors[ch] || '';
    for (const n of adj) {
      if (/[a-z0-9]/.test(n)) {
        out.add(word.slice(0, i) + n + word.slice(i + 1));
      }
    }
  }
  return [...out];
}

function generateInserted(word, neighbors) {
  const out = new Set();
  for (let i = 0; i < word.length; i++) {
    const ch = word[i].toLowerCase();
    const adj = neighbors[ch] || '';
    for (const n of adj) {
      if (/[a-z0-9]/.test(n)) {
        out.add(word.slice(0, i) + n + word.slice(i));
        out.add(word.slice(0, i + 1) + n + word.slice(i + 1));
      }
    }
  }
  return [...out];
}

function generatePhonetic(word) {
  const out = new Set();
  const subs = [
    ['c','k'],['c','s'],['k','c'],['ph','f'],['f','ph'],
    ['ie','ei'],['ei','ie'],['y','i'],['i','y'],
    ['s','z'],['z','s'],['ck','k'],['k','ck'],
    ['ou','u'],['u','ou'],['er','re'],['re','er'],
    ['tion','sion'],['sion','tion'],
    // Greek-letter glyph/spelling confusions (e.g. Sony Alpha listings written as α / a / cx)
    ['alpha','cx'],['cx','alpha'],['alpha','a'],
    // 10 cross-language phoneme confusions common in eBay brand misspellings:
    ['j','g'],['g','j'],          // soft-g (fujifilm <-> fugifilm)
    ['j','y'],['y','j'],          // Spanish/Slavic (yamaha <-> jamaha)
    ['w','v'],['v','w'],          // German consonant (voigtlander <-> woigtlander)
    ['v','b'],['b','v'],          // Spanish b/v collapse (vivitar <-> bibitar)
    ['sch','sh'],['sh','sch'],    // German digraph (schneider <-> shneider)
    ['ch','k'],['k','ch'],        // German hard-ch (bach <-> bak)
    ['ks','x'],['x','ks'],        // pentax <-> pentaks
    ['qu','kw'],['kw','qu'],      // quasar <-> kwasar
    ['dt','t'],['t','dt'],        // German final-cluster collapse (schmidt <-> schmit)
    ['th','t'],['t','th'],        // English speakers drop the 'h'
  ];
  const lower = word.toLowerCase();
  for (const [from, to] of subs) {
    let idx = 0;
    while ((idx = lower.indexOf(from, idx)) !== -1) {
      out.add(word.slice(0, idx) + to + word.slice(idx + from.length));
      idx++;
    }
  }
  return [...out];
}

function generateNumLetter(word) {
  const out = new Set();
  const subs = {
    '0':['o'], 'o':['0'], 'O':['0'],
    '1':['l','i'], 'l':['1'], 'i':['1','l'],
    '5':['s'], 's':['5'], '8':['B'], 'B':['8'],
    '3':['e','E'], 'e':['3'], 'E':['3'],
  };
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (subs[ch]) {
      for (const sub of subs[ch]) {
        out.add(word.slice(0, i) + sub + word.slice(i + 1));
      }
    }
  }
  return [...out];
}

function generateSpacing(word) {
  const out = new Set();
  // Add space between each pair
  for (let i = 1; i < word.length; i++) {
    out.add(word.slice(0, i) + ' ' + word.slice(i));
  }
  // Remove spaces
  if (word.includes(' ')) {
    out.add(word.replace(/ /g, ''));
  }
  return [...out];
}

function generateCase(word) {
  const out = new Set();
  // All lowercase (if not already)
  if (word.toLowerCase() !== word) out.add(word.toLowerCase());
  // All uppercase
  if (word.toUpperCase() !== word) out.add(word.toUpperCase());
  // Capitalize first letter of each word
  const cap = word.replace(/\b\w/g, c => c.toUpperCase());
  if (cap !== word) out.add(cap);
  return [...out];
}

// Vowel epenthesis: insert a/e/i/o/u between adjacent consonants.
// Catches the dominant misspelling mode for foreign brand names:
// tamron -> tamaron, mclaren -> mcalaren, schwarzkopf -> schawarzkopf.
function generateVowelEpenthesis(word) {
  const out = new Set();
  const isCon = (c) => /^[bcdfghjklmnpqrstvwxz]$/i.test(c);
  const vowels = ['a','e','i','o','u'];
  for (let i = 0; i < word.length - 1; i++) {
    if (isCon(word[i]) && isCon(word[i + 1])) {
      for (const v of vowels) {
        out.add(word.slice(0, i + 1) + v + word.slice(i + 1));
      }
    }
  }
  return [...out];
}

// Collapse doubles: for each double-letter pair, output the single-letter version.
// The inverse of generateDoubled. Catches philippe -> philipe, cannon -> canon.
function generateCollapseDoubles(word) {
  const out = new Set();
  for (let i = 0; i < word.length - 1; i++) {
    if (word[i].toLowerCase() === word[i + 1].toLowerCase() && /[a-z]/i.test(word[i])) {
      out.add(word.slice(0, i) + word.slice(i + 1));
    }
  }
  return [...out];
}

// Vowel swap: replace each vowel with every other vowel.
// More aggressive than the y/i pair in phonetic. Catches a/e/o foreign-name confusions.
function generateVowelSwap(word) {
  const out = new Set();
  const vowels = ['a','e','i','o','u'];
  for (let i = 0; i < word.length; i++) {
    const ch = word[i].toLowerCase();
    if (vowels.includes(ch)) {
      for (const v of vowels) {
        if (v !== ch) out.add(word.slice(0, i) + v + word.slice(i + 1));
      }
    }
  }
  return [...out];
}

// Hard-C / K positional swap. Cleaner than the global c<->k in phonetic.
// Word-start: canon <-> kanon, konica <-> conica.
// Word-end: panic -> panick, kodak -> kodack / kodac.
function generateHardCK(word) {
  const out = new Set();
  const lower = word.toLowerCase();
  if (lower[0] === 'c') out.add('k' + word.slice(1));
  if (lower[0] === 'k') out.add('c' + word.slice(1));
  if (lower.endsWith('ck')) out.add(word.slice(0, -2) + 'c');
  else if (lower.endsWith('c')) out.add(word.slice(0, -1) + 'ck');
  else if (lower.endsWith('k')) out.add(word.slice(0, -1) + 'ck');
  out.delete(word);
  return [...out];
}

// British vs American spelling pairs. Crucial for cross-region eBay arbitrage
// (UK sellers listing "aluminium" never surface in US "aluminum" searches).
const REGIONAL_PAIRS = [
  ['color','colour'],['flavor','flavour'],['honor','honour'],
  ['neighbor','neighbour'],['humor','humour'],['labor','labour'],
  ['behavior','behaviour'],['favor','favour'],['armor','armour'],
  ['center','centre'],['theater','theatre'],['fiber','fibre'],
  ['liter','litre'],['meter','metre'],
  ['jewelry','jewellery'],['catalog','catalogue'],['analog','analogue'],
  ['dialog','dialogue'],['epilog','epilogue'],
  ['defense','defence'],['offense','offence'],['license','licence'],
  ['practice','practise'],['pretense','pretence'],
  ['organize','organise'],['realize','realise'],['recognize','recognise'],
  ['analyze','analyse'],['paralyze','paralyse'],
  ['gray','grey'],['mold','mould'],['plow','plough'],['donut','doughnut'],
  ['tire','tyre'],['curb','kerb'],['aluminum','aluminium'],
  ['program','programme'],['pajamas','pyjamas'],
  ['canceled','cancelled'],['traveled','travelled'],['modeled','modelled'],
];
function generateRegional(word) {
  const out = new Set();
  const lower = word.toLowerCase();
  for (const [a, b] of REGIONAL_PAIRS) {
    let idx = 0;
    while ((idx = lower.indexOf(a, idx)) !== -1) {
      out.add(word.slice(0, idx) + b + word.slice(idx + a.length));
      idx++;
    }
    idx = 0;
    while ((idx = lower.indexOf(b, idx)) !== -1) {
      out.add(word.slice(0, idx) + a + word.slice(idx + b.length));
      idx++;
    }
  }
  out.delete(word);
  return [...out];
}

// Hyphenation: insert or strip hyphens in compound names.
// iphone -> i-phone / i phone, playstation -> play-station.
function generateHyphenation(word) {
  const out = new Set();
  if (word.includes('-')) {
    out.add(word.replace(/-/g, ''));
    out.add(word.replace(/-/g, ' '));
  } else if (!word.includes(' ')) {
    // Only insert if both sides would be >=2 chars (avoids "i-phone"-style noise we DO want
    // for short brand prefixes, so keep i=1 too -- but stop at length-2 to avoid trailing -s)
    for (let i = 1; i <= word.length - 2; i++) {
      out.add(word.slice(0, i) + '-' + word.slice(i));
    }
  }
  return [...out];
}

// Plural / singular: add or strip a trailing s.
function generatePlural(word) {
  const out = new Set();
  if (word.length < 3) return [];
  if (word.toLowerCase().endsWith('s')) {
    out.add(word.slice(0, -1));
  } else if (/[a-z0-9]$/i.test(word)) {
    out.add(word + 's');
  }
  return [...out];
}

// Visual / OCR lookalikes beyond keyboard adjacency. Catches handwriting-style
// or image-OCR-fed listings: norman -> norrnan, harmless -> hamless.
function generateOcrLookalikes(word) {
  const out = new Set();
  const subs = [
    ['rn','m'],['m','rn'],
    ['cl','d'],['d','cl'],
    ['vv','w'],['w','vv'],
    ['nn','m'],['ii','n'],
  ];
  const lower = word.toLowerCase();
  for (const [from, to] of subs) {
    let idx = 0;
    while ((idx = lower.indexOf(from, idx)) !== -1) {
      out.add(word.slice(0, idx) + to + word.slice(idx + from.length));
      idx++;
    }
  }
  out.delete(word);
  return [...out];
}

// ============================================================
// EBAY REGIONS
// ============================================================
const EBAY_REGIONS = [
  { value: 'com', label: 'US (ebay.com)', flag: 'US' },
  { value: 'co.uk', label: 'UK (ebay.co.uk)', flag: 'UK' },
  { value: 'de', label: 'Germany (ebay.de)', flag: 'DE' },
  { value: 'fr', label: 'France (ebay.fr)', flag: 'FR' },
  { value: 'it', label: 'Italy (ebay.it)', flag: 'IT' },
  { value: 'es', label: 'Spain (ebay.es)', flag: 'ES' },
  { value: 'ca', label: 'Canada (ebay.ca)', flag: 'CA' },
  { value: 'com.au', label: 'Australia (ebay.com.au)', flag: 'AU' },
  { value: 'nl', label: 'Netherlands (ebay.nl)', flag: 'NL' },
  { value: 'ie', label: 'Ireland (ebay.ie)', flag: 'IE' },
];

const EBAY_CATEGORIES = [
  { value: 'all', label: 'All categories' },
  { value: '625', label: 'Cameras & Photo' },
  { value: '293', label: 'Consumer Electronics' },
  { value: '15032', label: 'Cell Phones & Accessories' },
  { value: '58058', label: 'Computers, Tablets & Networking' },
  { value: '11450', label: 'Clothing, Shoes & Accessories' },
  { value: '281', label: 'Jewelry & Watches' },
  { value: '1', label: 'Collectibles' },
  { value: '220', label: 'Toys & Hobbies' },
  { value: '11116', label: 'Coins & Paper Money' },
  { value: '870', label: 'Pottery & Glass' },
  { value: '550', label: 'Art' },
  { value: '267', label: 'Books, Movies & Music' },
  { value: '888', label: 'Sporting Goods' },
  { value: '6000', label: 'eBay Motors' },
  { value: '11700', label: 'Home & Garden' },
  { value: '12576', label: 'Business & Industrial' },
];

const EBAY_CONDITIONS = [
  { value: 'all', label: 'Any condition' },
  { value: '1000', label: 'New' },
  { value: '1500', label: 'New other (see details)' },
  { value: '2500', label: 'Seller refurbished' },
  { value: '3000', label: 'Used' },
  { value: '7000', label: 'For parts or not working' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Best Match' },
  { value: '12', label: 'Time: ending soonest' },
  { value: '10', label: 'Time: newly listed' },
  { value: '15', label: 'Price + Shipping: lowest' },
  { value: '16', label: 'Price + Shipping: highest' },
  { value: '1', label: 'Distance: nearest' },
];

// ============================================================
// EBAY URL BUILDER
// ============================================================
function buildEbayUrl(query, options) {
  const params = new URLSearchParams();
  params.set('_nkw', query);
  // Do NOT use _in_kw=2 ("any words, any order") -- eBay Boolean-rewrites the term list and
  // pulls a trailing `-foo` exclusion *inside* the rewritten paren-OR group, treating it as
  // a literal OR'd keyword. The exclusion is silently lost and the query matches everything.
  // Verified 2026-06-08 via direct eBay testing. Use the default _in_kw (omit it) with the
  // documented (a,b,c) -excl grammar instead. See eBay Developers KB 2190.
  if (options.category && options.category !== 'all') params.set('_sacat', options.category);
  if (options.condition && options.condition !== 'all') params.set('LH_ItemCondition', options.condition);
  if (options.minPrice) params.set('_udlo', options.minPrice);
  if (options.maxPrice) params.set('_udhi', options.maxPrice);
  if (options.soldOnly) { params.set('LH_Sold', '1'); params.set('LH_Complete', '1'); }
  if (options.freeShipping) params.set('LH_FS', '1');
  if (options.buyItNow) params.set('LH_BIN', '1');
  if (options.auction) params.set('LH_Auction', '1');
  if (options.acceptOffers) params.set('LH_BO', '1');
  if (options.sortBy) params.set('_sop', options.sortBy);
  return `https://www.ebay.${options.region || 'com'}/sch/i.html?${params.toString()}`;
}

// ============================================================
// TYPO TYPE METADATA
// ============================================================
const TYPO_TYPES = [
  { key: 'missing', label: 'Missing letter', symbol: 'X', desc: 'A letter dropped (cod -> cd)', defaultOn: true, color: 'rust' },
  { key: 'swapped', label: 'Swapped letters', symbol: '<>', desc: 'Adjacent letters flipped (cod -> ocd)', defaultOn: true, color: 'amber' },
  { key: 'doubled', label: 'Doubled letter', symbol: 'XX', desc: 'A letter typed twice (cod -> ccod)', defaultOn: true, color: 'olive' },
  { key: 'replaced', label: 'Neighbor key', symbol: '~', desc: 'Adjacent key hit instead (cod -> xod)', defaultOn: true, color: 'teal' },
  { key: 'inserted', label: 'Extra neighbor', symbol: '+', desc: 'Adjacent key added (cod -> xcod)', defaultOn: true, color: 'ink' },
  { key: 'phonetic', label: 'Phonetic', symbol: 'Φ', desc: 'Sound-alike (c/k, ph/f, alpha/cx)', defaultOn: true, color: 'rust' },
  { key: 'vowel_epen', label: 'Vowel epenthesis', symbol: 'V+', desc: 'Vowel inserted between consonants (tamron -> tamaron)', defaultOn: true, color: 'rust' },
  { key: 'collapse_doubles', label: 'Collapse doubles', symbol: 'Xx', desc: 'Double letter to single (philippe -> philipe)', defaultOn: true, color: 'amber' },
  { key: 'vowel_swap', label: 'Vowel swap', symbol: 'aei', desc: 'Vowel replaced with another (mamiya -> memiya)', defaultOn: true, color: 'olive' },
  { key: 'hard_ck', label: 'Hard C/K', symbol: 'c/k', desc: 'Word-start c/k swap, end c/ck (canon -> kanon)', defaultOn: true, color: 'teal' },
  { key: 'regional', label: 'UK/US spelling', symbol: 'UK', desc: 'British/American variants (aluminum/aluminium)', defaultOn: true, color: 'rust' },
  { key: 'hyphenation', label: 'Hyphenation', symbol: '-/', desc: 'Hyphens added/removed (iphone -> i-phone)', defaultOn: true, color: 'olive' },
  { key: 'plural', label: 'Plural +/-s', symbol: '+s', desc: 'Trailing s added or removed (photo -> photos)', defaultOn: true, color: 'teal' },
  { key: 'ocr', label: 'Visual lookalikes', symbol: 'rn', desc: 'Handwriting/OCR (rn/m, cl/d, vv/w)', defaultOn: true, color: 'ink' },
  { key: 'numletter', label: 'Number/letter', symbol: '01', desc: '0/o, 1/l, 5/s confusions', defaultOn: true, color: 'amber' },
  { key: 'spacing', label: 'Spacing', symbol: '_', desc: 'Space added or removed', defaultOn: true, color: 'olive' },
  { key: 'case', label: 'Case', symbol: 'Aa', desc: 'Different capitalization', defaultOn: true, color: 'teal' },
];

const COLOR_MAP = {
  rust: { bg: '#fef2f2', border: '#991b1b', text: '#991b1b' },
  amber: { bg: '#fef7e6', border: '#b45309', text: '#92400e' },
  olive: { bg: '#f3f4e8', border: '#65a30d', text: '#3f6212' },
  teal: { bg: '#e8f4f1', border: '#0f766e', text: '#115e59' },
  ink: { bg: '#f5f5f4', border: '#1c1917', text: '#1c1917' },
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MisspelledApp() {
  const [word, setWord] = useState('mamiya rb67');
  const [layout, setLayout] = useState('qwerty');
  const [modes, setModes] = useState(() => {
    const m = {};
    TYPO_TYPES.forEach(t => { m[t.key] = t.defaultOn; });
    return m;
  });

  // Custom typos are stored per token-group index: { 0: ['mamyia'], 1: ['rb670'] }
  const [customByGroup, setCustomByGroup] = useState({});
  const [customInput, setCustomInput] = useState('');
  const [customGroupIdx, setCustomGroupIdx] = useState(0);

  // Selection is flat, keyed by `${groupIdx}|${typoWord}` to handle collisions across groups
  const [selected, setSelected] = useState(new Set());

  // Per-group toggle: if a group's index is in this set, its correct spelling is EXCLUDED from
  // the combined query (default empty = include correct in every group, the broadest match)
  const [excludeCorrectFor, setExcludeCorrectFor] = useState(new Set());

  // Free-form exclude list (-term in eBay query). Default empty so we match any spelling broadly.
  const [excludeStrings, setExcludeStrings] = useState([]);
  const [excludeInput, setExcludeInput] = useState('');

  // Free-form INCLUDE list: terms appended verbatim (not misspelled) to every generated
  // sub-query. eBay AND-joins them with the typo group. Use case: brand+model where only
  // the brand should be misspelled and the model number must appear literally
  // (e.g. word="fujifilm", include="gfx" -> (fujfilm,fujifim,...) gfx).
  const [includeStrings, setIncludeStrings] = useState([]);
  const [includeInput, setIncludeInput] = useState('');

  const [copiedTerm, setCopiedTerm] = useState(null);

  // Combined-search mode. 'and' = per-group ORs joined by space (eBay AND across groups):
  // (mamiya,amiya) (rb67,rb6t)  -- listing must have one variant from EACH group.
  // 'or' = all variants collapsed into one flat OR group: (mamiya,amiya,rb67,rb6t) --
  // listing only needs ANY one variant. 'or' is the typo-hunting default: matches
  // listings where the seller misspelled only one of several words.
  const [combinedMode, setCombinedMode] = useState('or');

  const [ebayOpts, setEbayOpts] = useState({
    region: 'com',
    category: 'all',
    condition: 'all',
    minPrice: '',
    maxPrice: '',
    soldOnly: false,
    freeShipping: false,
    buyItNow: false,
    auction: false,
    acceptOffers: false,
    sortBy: '',
  });

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Special+Elite&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const neighbors = KEYBOARD_LAYOUTS[layout].map;

  // Split input into tokens. Commas are stripped (they break eBay's OR syntax).
  const tokens = useMemo(() => {
    return word.replace(/,/g, '').trim().split(/\s+/).filter(Boolean);
  }, [word]);

  const isMultiToken = tokens.length > 1;

  // Keep customGroupIdx valid as tokens change
  useEffect(() => {
    if (customGroupIdx >= tokens.length && tokens.length > 0) {
      setCustomGroupIdx(0);
    }
  }, [tokens.length, customGroupIdx]);

  // Generate typos per token. Each token gets its own group with its own typo list.
  const tokenGroups = useMemo(() => {
    return tokens.map((token, idx) => {
      const typos = [];
      const seen = new Set([token.toLowerCase()]);
      const add = (arr, type) => {
        for (const t of arr) {
          const k = t.toLowerCase();
          if (!seen.has(k) && t.trim().length >= 1 && !t.includes(',')) {
            seen.add(k);
            typos.push({ word: t, type });
          }
        }
      };
      if (modes.missing) add(generateMissing(token), 'missing');
      if (modes.swapped) add(generateSwapped(token), 'swapped');
      if (modes.doubled) add(generateDoubled(token), 'doubled');
      if (modes.replaced) add(generateReplaced(token, neighbors), 'replaced');
      if (modes.inserted) add(generateInserted(token, neighbors), 'inserted');
      if (modes.phonetic) add(generatePhonetic(token), 'phonetic');
      if (modes.vowel_epen) add(generateVowelEpenthesis(token), 'vowel_epen');
      if (modes.collapse_doubles) add(generateCollapseDoubles(token), 'collapse_doubles');
      if (modes.vowel_swap) add(generateVowelSwap(token), 'vowel_swap');
      if (modes.hard_ck) add(generateHardCK(token), 'hard_ck');
      if (modes.regional) add(generateRegional(token), 'regional');
      if (modes.hyphenation) add(generateHyphenation(token), 'hyphenation');
      if (modes.plural) add(generatePlural(token), 'plural');
      if (modes.ocr) add(generateOcrLookalikes(token), 'ocr');
      if (modes.numletter) add(generateNumLetter(token), 'numletter');
      if (modes.spacing) add(generateSpacing(token), 'spacing');
      if (modes.case) add(generateCase(token), 'case');
      (customByGroup[idx] || []).forEach(t => add([t], 'custom'));
      return { token, typos };
    });
  }, [tokens, modes, neighbors, customByGroup]);

  const totalTypos = tokenGroups.reduce((sum, g) => sum + g.typos.length, 0);

  // Effective combined-search mode: with only one token group, AND and OR are semantically
  // identical (no per-group ANDing happens) -- but OR produces a cleaner flat URL with no
  // parens. Force OR in that case so the toggle's choice is irrelevant and the URL is simpler.
  const effectiveMode = tokenGroups.length <= 1 ? 'or' : combinedMode;

  // Stats by type (across all groups)
  const statsByType = useMemo(() => {
    const s = {};
    tokenGroups.forEach(g => {
      g.typos.forEach(t => { s[t.type] = (s[t.type] || 0) + 1; });
    });
    return s;
  }, [tokenGroups]);

  // ===== Selection helpers =====
  const keyOf = (groupIdx, typoWord) => `${groupIdx}|${typoWord}`;
  const isSelected = (groupIdx, typoWord) => selected.has(keyOf(groupIdx, typoWord));
  const toggleSelect = (groupIdx, typoWord) => {
    setSelected(s => {
      const next = new Set(s);
      const k = keyOf(groupIdx, typoWord);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };
  const selectAllInGroup = (groupIdx) => {
    setSelected(s => {
      const next = new Set(s);
      tokenGroups[groupIdx].typos.forEach(t => next.add(keyOf(groupIdx, t.word)));
      return next;
    });
  };
  const clearGroupSelection = (groupIdx) => {
    setSelected(s => {
      const next = new Set(s);
      tokenGroups[groupIdx].typos.forEach(t => next.delete(keyOf(groupIdx, t.word)));
      return next;
    });
  };
  const selectAll = () => {
    const next = new Set();
    tokenGroups.forEach((g, i) => g.typos.forEach(t => next.add(keyOf(i, t.word))));
    setSelected(next);
  };
  const clearSelection = () => setSelected(new Set());

  // ===== Per-group correct-spelling toggle =====
  const includesCorrect = (groupIdx) => !excludeCorrectFor.has(groupIdx);
  const toggleCorrect = (groupIdx) => {
    setExcludeCorrectFor(s => {
      const next = new Set(s);
      if (next.has(groupIdx)) next.delete(groupIdx); else next.add(groupIdx);
      return next;
    });
  };

  // ===== Custom typo handlers (per group) =====
  const addCustomTypo = () => {
    const t = customInput.trim().replace(/,/g, '');
    if (!t) return;
    const idx = customGroupIdx;
    setCustomByGroup(prev => {
      const existing = prev[idx] || [];
      if (existing.includes(t)) return prev;
      return { ...prev, [idx]: [...existing, t] };
    });
    setCustomInput('');
  };
  const removeCustomTypo = (groupIdx, t) => {
    setCustomByGroup(prev => ({
      ...prev,
      [groupIdx]: (prev[groupIdx] || []).filter(x => x !== t),
    }));
  };

  // ===== Exclude string handlers =====
  const addExcludeString = () => {
    const t = excludeInput.trim();
    if (t && !excludeStrings.includes(t)) {
      setExcludeStrings([...excludeStrings, t]);
      setExcludeInput('');
    }
  };
  const removeExcludeString = (t) => setExcludeStrings(excludeStrings.filter(x => x !== t));
  const seedExcludeWithTokens = () => {
    const fresh = tokens.filter(t => t && !excludeStrings.includes(t));
    setExcludeStrings([...excludeStrings, ...fresh]);
  };
  const clearExcludes = () => setExcludeStrings([]);

  // ===== Include string handlers =====
  const addIncludeString = () => {
    const t = includeInput.trim();
    if (t && !includeStrings.includes(t)) {
      setIncludeStrings([...includeStrings, t]);
      setIncludeInput('');
    }
  };
  const removeIncludeString = (t) => setIncludeStrings(includeStrings.filter(x => x !== t));
  const clearIncludes = () => setIncludeStrings([]);

  // ===== Query building =====
  // eBay truncates _nkw beyond ~300 chars. Keep some headroom for URL encoding.
  const MAX_QUERY_LEN = 250;
  // Cap on cartesian-product output. Beyond this we'd be generating an unusable pile of tabs;
  // we truncate and tell the user to reduce their selection.
  const MAX_TOTAL_QUERIES = 25;

  // Build the per-group variant list for one token group, honoring selection + correct toggle.
  const variantsForGroup = (groupIdx) => {
    const group = tokenGroups[groupIdx];
    if (!group) return [];
    const variants = [];
    if (includesCorrect(groupIdx)) variants.push(group.token);
    group.typos.forEach(t => {
      if (isSelected(groupIdx, t.word)) variants.push(t.word);
    });
    return [...new Set(variants)];
  };

  // Wrap in quotes when the variant contains a space (spacing typos) OR a hyphen
  // (hyphenation typos). Without quoting, eBay's tokenizer splits on '-' and treats
  // anything after a leading '-' as an exclusion -- so a typo like 'mam-iya' would be
  // parsed as "include mam, EXCLUDE iya", silently filtering out matching listings.
  const quoteVariant = (v) => /[\s-]/.test(v) ? `"${v}"` : v;
  const formatGroup = (variants) => {
    const quoted = variants.map(quoteVariant);
    return quoted.length === 1 ? quoted[0] : `(${quoted.join(',')})`;
  };

  // Correct tokens whose group is toggled "exclude correct" — these get auto-appended
  // as -correct exclusions OUTSIDE the parens so eBay actually filters out the correctly
  // spelled listings (otherwise dropping them from the variant list just makes the search
  // not require them, which doesn't exclude anything).
  const autoExcludedCorrect = () => {
    const out = [];
    tokenGroups.forEach((g, i) => {
      if (g && excludeCorrectFor.has(i) && g.token) out.push(g.token);
    });
    return out;
  };

  const buildExcludeSuffix = () => {
    let suffix = '';
    const seen = new Set();
    for (const ex of [...autoExcludedCorrect(), ...excludeStrings]) {
      const e = (ex || '').trim();
      if (!e || seen.has(e.toLowerCase())) continue;
      seen.add(e.toLowerCase());
      suffix += ` -${e.includes(' ') ? `"${e}"` : e}`;
    }
    return suffix;
  };

  // Required literal terms, appended verbatim to every chunk's query. eBay AND-joins them
  // with the typo paren-OR group: `(typo1,typo2,...) gfx -broken` matches listings that
  // contain any typo AND the literal word "gfx" AND do not contain "broken".
  const buildIncludeSuffix = () => {
    let suffix = '';
    const seen = new Set();
    for (const inc of includeStrings) {
      const e = (inc || '').trim();
      if (!e || seen.has(e.toLowerCase())) continue;
      seen.add(e.toLowerCase());
      suffix += ` ${e.includes(' ') ? `"${e}"` : e}`;
    }
    return suffix;
  };

  // Combined trailing suffix that every chunk gets: required terms first, then exclusions.
  // Order is cosmetic (eBay grammar doesn't care) but makes the URL easier to read.
  const buildFixedSuffix = () => buildIncludeSuffix() + buildExcludeSuffix();

  // Chunk a single group's variants into pieces, each formatted as a complete group string,
  // such that each piece's length stays at or under `budget`.
  // budget is the total budget INCLUDING the parens (if applicable).
  const MAX_PAREN_OR_TERMS = 14; // eBay caps paren-OR groups at ~14 terms (15+ → null SRP).
  const chunkGroupVariants = (variants, budget) => {
    if (variants.length === 1) return [quoteVariant(variants[0])];
    const innerBudget = budget - 2; // subtract the two parens chars
    const chunks = [];
    let cur = [], curLen = 0;
    for (const v of variants) {
      const vStr = quoteVariant(v);
      const addLen = vStr.length + (cur.length > 0 ? 1 : 0); // +1 for comma when not first
      const wouldOverflow = curLen + addLen > innerBudget;
      const wouldExceedTermCap = cur.length >= MAX_PAREN_OR_TERMS;
      if ((wouldOverflow || wouldExceedTermCap) && cur.length > 0) {
        chunks.push(cur);
        cur = [vStr];
        curLen = vStr.length;
      } else {
        cur.push(vStr);
        curLen += addLen;
      }
    }
    if (cur.length > 0) chunks.push(cur);
    return chunks.map(c => c.length === 1 ? c[0] : `(${c.join(',')})`);
  };

  // Split the combined query into 1+ sub-queries that each fit under MAX_QUERY_LEN.
  // Returns { queries, truncated }. Branches on combinedMode.
  const buildSplitQueries = () => {
    return effectiveMode === 'or' ? buildSplitQueriesOr() : buildSplitQueriesAnd();
  };

  // OR mode: emit eBay's documented (a,b,c) paren-OR with the exclusion OUTSIDE the parens:
  //   (typo1,typo2,...,typoN) -correct
  // Hard cap: ~14 variants per paren group. eBay returns a null SRP ("Let's try that again")
  // for paren-OR groups with 15+ terms -- verified 2026-06-08 by direct testing. We also
  // enforce the per-query char budget (MAX_QUERY_LEN). A single variant skips the parens.
  const MAX_OR_TERMS_PER_GROUP = 14;
  const buildSplitQueriesOr = () => {
    const all = [];
    for (let i = 0; i < tokenGroups.length; i++) {
      for (const v of variantsForGroup(i)) {
        if (!all.includes(v)) all.push(v);
      }
    }
    if (all.length === 0) return { queries: [], truncated: false };

    const excludeSuffix = buildFixedSuffix();
    const quoted = all.map(quoteVariant);

    // Pack into chunks of at most MAX_OR_TERMS_PER_GROUP variants, each fitting MAX_QUERY_LEN.
    const budget = MAX_QUERY_LEN - excludeSuffix.length;
    const chunks = [];
    let cur = [], curLen = 2; // start at 2 for the wrapping parens
    for (const v of quoted) {
      const addLen = v.length + (cur.length > 0 ? 1 : 0); // +1 for the comma
      const wouldOverflow = curLen + addLen > budget;
      const wouldExceedTermCap = cur.length >= MAX_OR_TERMS_PER_GROUP;
      if ((wouldOverflow || wouldExceedTermCap) && cur.length > 0) {
        chunks.push(cur);
        cur = [v];
        curLen = 2 + v.length;
      } else {
        cur.push(v);
        curLen += addLen;
      }
    }
    if (cur.length > 0) chunks.push(cur);

    let truncated = false;
    let final = chunks.map(c => (c.length === 1 ? c[0] : `(${c.join(',')})`) + excludeSuffix);
    if (final.length > MAX_TOTAL_QUERIES) {
      final = final.slice(0, MAX_TOTAL_QUERIES);
      truncated = true;
    }
    return { queries: final, truncated };
  };

  // AND mode (per-group):
  //   1. If the full query fits, return it (single element array).
  //   2. Otherwise, allocate a per-group budget proportional to each group's content size.
  //   3. Chunk each group's variants into pieces that fit its allocated budget.
  //   4. Take the cartesian product of all chunk sets so the union covers every combination.
  //   5. Cap total output at MAX_TOTAL_QUERIES; the UI warns when coverage is partial.
  const buildSplitQueriesAnd = () => {
    const active = [];
    for (let i = 0; i < tokenGroups.length; i++) {
      const variants = variantsForGroup(i);
      if (variants.length > 0) active.push({ idx: i, variants });
    }
    if (active.length === 0) return { queries: [], truncated: false };

    const excludeSuffix = buildFixedSuffix();
    const fullQuery = active.map(g => formatGroup(g.variants)).join(' ') + excludeSuffix;
    if (fullQuery.length <= MAX_QUERY_LEN) return { queries: [fullQuery], truncated: false };

    const interGroupSpaces = Math.max(0, active.length - 1);
    const totalBudget = MAX_QUERY_LEN - excludeSuffix.length - interGroupSpaces;

    const minBudgets = active.map(g => Math.max(...g.variants.map(v => quoteVariant(v).length)) + 2);
    const totalMin = minBudgets.reduce((a, b) => a + b, 0);

    // Pathological: not even one variant per group fits. Cartesian on single-variant chunks.
    if (totalMin > totalBudget) {
      const natural = active.reduce((p, g) => p * g.variants.length, 1);
      let combos = [[]];
      outer: for (const g of active) {
        const next = [];
        for (const combo of combos) {
          for (const v of g.variants) {
            if (next.length >= MAX_TOTAL_QUERIES) break outer;
            next.push([...combo, quoteVariant(v)]);
          }
        }
        combos = next;
      }
      return {
        queries: combos.map(c => c.join(' ') + excludeSuffix),
        truncated: natural > MAX_TOTAL_QUERIES,
      };
    }

    const fullSizes = active.map(g => formatGroup(g.variants).length);
    const needs = active.map((_, i) => Math.max(0, fullSizes[i] - minBudgets[i]));
    const totalNeed = needs.reduce((a, b) => a + b, 0);
    const slack = totalBudget - totalMin;

    const groupBudgets = active.map((_, i) => {
      if (totalNeed === 0) return minBudgets[i];
      return minBudgets[i] + Math.floor(needs[i] / totalNeed * slack);
    });

    const allChunks = active.map((g, i) => chunkGroupVariants(g.variants, groupBudgets[i]));
    const naturalCartesian = allChunks.reduce((p, c) => p * c.length, 1);

    let combos = [[]];
    outer: for (const chunks of allChunks) {
      const next = [];
      for (const combo of combos) {
        for (const chunk of chunks) {
          if (next.length >= MAX_TOTAL_QUERIES) break outer;
          next.push([...combo, chunk]);
        }
      }
      combos = next;
    }

    return {
      queries: combos.map(c => c.join(' ') + excludeSuffix),
      truncated: naturalCartesian > MAX_TOTAL_QUERIES,
    };
  };

  const splitResult = useMemo(buildSplitQueries, [tokenGroups, selected, excludeCorrectFor, excludeStrings, includeStrings, effectiveMode]);
  const combinedQueries = splitResult.queries;
  const combinedUrls = useMemo(
    () => combinedQueries.map(q => buildEbayUrl(q, ebayOpts)),
    [combinedQueries, ebayOpts, effectiveMode]
  );
  const isSplit = combinedQueries.length > 1;
  const isTruncated = splitResult.truncated;

  // Count how many variants would actually appear in the search per group
  const variantsPerGroup = tokenGroups.map((_, i) => variantsForGroup(i).length);
  const groupsWithVariants = variantsPerGroup.filter(n => n > 0).length;
  const totalSelectedTypos = selected.size;

  // Individual typo search: open eBay for ONLY the misspelled word. The previous
  // behavior (variant ANDed with other correct tokens) returned 0 results when no
  // listing contained both -- which is the common case for typo hunting, since a
  // seller who misspells one word usually doesn't spell the other word correctly
  // either, or the typo is on a brand name whose model number is also lost.
  const openTypoSearch = (groupIdx, typoWord) => {
    window.open(buildEbayUrl(typoWord, ebayOpts), '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTerm(label);
      setTimeout(() => setCopiedTerm(null), 1500);
    } catch (e) {}
  };

  const openCombined = () => {
    // Fire window.open synchronously per URL. Browsers usually allow this from a single
    // click event for a handful of tabs; popup blockers may intervene beyond ~5-8.
    combinedUrls.forEach(url => window.open(url, '_blank', 'noopener,noreferrer'));
  };

  // Paper texture (subtle noise)
  const paperBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.45 0 0 0 0 0.3 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      minHeight: '100vh',
      background: '#f4ecd8',
      backgroundImage: paperBg,
      color: '#1c1917',
      padding: '24px 16px',
    }}>
      <style>{`
        .typewriter { font-family: 'Special Elite', 'Courier New', monospace; letter-spacing: -0.01em; }
        .mono { font-family: 'JetBrains Mono', 'Courier New', monospace; }
        input:focus, select:focus, textarea:focus { outline: 2px solid #b45309; outline-offset: 2px; }
        .typo-card:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #1c1917; }
        .btn-shadow { box-shadow: 3px 3px 0 #1c1917; }
        .btn-shadow:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #1c1917; }
        .btn-shadow:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #1c1917; }
        .checkmark { transition: all 0.15s; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ===== HEADER ===== */}
        <header style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            border: '3px double #1c1917',
            padding: '8px 24px',
            transform: 'rotate(-1deg)',
            background: '#fefdf8',
            marginBottom: '12px',
          }}>
            <div className="typewriter" style={{ fontSize: '11px', letterSpacing: '0.3em', color: '#78716c' }}>
              CLASSIFIED ADS DEPT.  EST. 2026
            </div>
          </div>
          <h1 className="typewriter" style={{
            fontSize: 'clamp(36px, 7vw, 64px)',
            fontWeight: '400',
            margin: '0',
            lineHeight: '1',
            letterSpacing: '-0.02em',
          }}>
            MIS<span style={{ color: '#991b1b' }}>SPELL</span>ED
          </h1>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#57534e', fontStyle: 'italic', maxWidth: '600px', margin: '8px auto 0' }}>
            A typo generator for the patient bargain hunter. Per-word matching, any spelling, any order.
          </div>
        </header>

        {/* ===== INPUT BAR ===== */}
        <section style={{
          background: '#fefdf8',
          border: '3px solid #1c1917',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '6px 6px 0 #1c1917',
        }}>
          <label className="typewriter" style={{
            display: 'block', fontSize: '11px', letterSpacing: '0.2em', marginBottom: '8px', color: '#57534e',
          }}>
            ITEM / BRAND / MODEL TO SEARCH
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={word}
              onChange={(e) => { setWord(e.target.value); setSelected(new Set()); setExcludeCorrectFor(new Set()); }}
              placeholder="e.g. mamiya rb67"
              className="mono"
              style={{
                flex: '1 1 300px', padding: '14px 16px', fontSize: '20px',
                border: '2px solid #1c1917', background: '#fefdf8', fontWeight: '500',
              }}
            />
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              style={{
                padding: '12px 16px', fontSize: '14px', border: '2px solid #1c1917',
                background: '#fefdf8', fontFamily: 'inherit', cursor: 'pointer',
              }}
              title="Keyboard layout for neighbor-key typo generation"
            >
              {Object.entries(KEYBOARD_LAYOUTS).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>
          {tokens.length > 0 && (
            <div className="typewriter" style={{
              marginTop: '10px', fontSize: '11px', color: '#78716c', letterSpacing: '0.05em',
            }}>
              PARSED AS {tokens.length} TOKEN{tokens.length === 1 ? '' : 'S'}:{' '}
              {tokens.map((t, i) => (
                <span key={i} className="mono" style={{
                  display: 'inline-block', padding: '1px 6px', margin: '0 4px 0 0',
                  background: '#fef7e6', border: '1.5px solid #b45309', color: '#92400e', fontSize: '11px',
                }}>{t}</span>
              ))}
            </div>
          )}
        </section>

        {/* ===== TYPO MODE TOGGLES ===== */}
        <section style={{
          background: '#fefdf8', border: '2px solid #1c1917', padding: '16px', marginBottom: '20px',
        }}>
          <div className="typewriter" style={{
            fontSize: '11px', letterSpacing: '0.2em', marginBottom: '12px', color: '#57534e',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Keyboard size={12} /> TYPO TYPES
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px',
          }}>
            {TYPO_TYPES.map(t => {
              const on = modes[t.key];
              const c = COLOR_MAP[t.color];
              const count = statsByType[t.key] || 0;
              return (
                <button
                  key={t.key}
                  onClick={() => setModes(m => ({ ...m, [t.key]: !m[t.key] }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                    border: `2px solid ${on ? c.border : '#d6d3d1'}`,
                    background: on ? c.bg : '#fafaf9',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'all 0.15s', opacity: on ? 1 : 0.6,
                  }}
                >
                  <span className="mono" style={{
                    width: '28px', height: '28px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700',
                    border: `1.5px solid ${on ? c.border : '#a8a29e'}`,
                    color: on ? c.text : '#78716c',
                    background: on ? '#fefdf8' : 'transparent',
                  }}>
                    {t.symbol}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: on ? c.text : '#57534e' }}>{t.label}</div>
                    <div style={{ fontSize: '10.5px', color: '#78716c', lineHeight: '1.3', marginTop: '1px' }}>{t.desc}</div>
                  </div>
                  {on && count > 0 && (
                    <span className="mono" style={{
                      fontSize: '11px', fontWeight: '700', color: c.text,
                      padding: '2px 6px', background: '#fefdf8', border: `1px solid ${c.border}`,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== EBAY OPTIONS ===== */}
        <section style={{
          background: '#fefdf8', border: '2px solid #1c1917', padding: '16px', marginBottom: '20px',
        }}>
          <div className="typewriter" style={{
            fontSize: '11px', letterSpacing: '0.2em', marginBottom: '12px', color: '#57534e',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Filter size={12} /> EBAY SEARCH FILTERS
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px', marginBottom: '12px',
          }}>
            <Field label="Region">
              <select value={ebayOpts.region} onChange={e => setEbayOpts({...ebayOpts, region: e.target.value})} style={selectStyle}>
                {EBAY_REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select value={ebayOpts.category} onChange={e => setEbayOpts({...ebayOpts, category: e.target.value})} style={selectStyle}>
                {EBAY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Condition">
              <select value={ebayOpts.condition} onChange={e => setEbayOpts({...ebayOpts, condition: e.target.value})} style={selectStyle}>
                {EBAY_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Sort by">
              <select value={ebayOpts.sortBy} onChange={e => setEbayOpts({...ebayOpts, sortBy: e.target.value})} style={selectStyle}>
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Min price">
              <input type="number" value={ebayOpts.minPrice} onChange={e => setEbayOpts({...ebayOpts, minPrice: e.target.value})} placeholder="$" style={selectStyle} />
            </Field>
            <Field label="Max price">
              <input type="number" value={ebayOpts.maxPrice} onChange={e => setEbayOpts({...ebayOpts, maxPrice: e.target.value})} placeholder="$" style={selectStyle} />
            </Field>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px dashed #a8a29e', paddingTop: '12px' }}>
            <Toggle on={ebayOpts.buyItNow} onClick={() => setEbayOpts({...ebayOpts, buyItNow: !ebayOpts.buyItNow})} label="Buy It Now" />
            <Toggle on={ebayOpts.auction} onClick={() => setEbayOpts({...ebayOpts, auction: !ebayOpts.auction})} label="Auction" />
            <Toggle on={ebayOpts.acceptOffers} onClick={() => setEbayOpts({...ebayOpts, acceptOffers: !ebayOpts.acceptOffers})} label="Accepts offers" />
            <Toggle on={ebayOpts.freeShipping} onClick={() => setEbayOpts({...ebayOpts, freeShipping: !ebayOpts.freeShipping})} label="Free shipping" />
            <Toggle on={ebayOpts.soldOnly} onClick={() => setEbayOpts({...ebayOpts, soldOnly: !ebayOpts.soldOnly})} label="Sold listings only" />
          </div>
        </section>

        {/* ===== CUSTOM TYPOS (PER GROUP) ===== */}
        {tokens.length > 0 && (
          <section style={{
            background: '#fefdf8', border: '2px solid #1c1917', padding: '16px', marginBottom: '20px',
          }}>
            <div className="typewriter" style={{
              fontSize: '11px', letterSpacing: '0.2em', marginBottom: '12px', color: '#57534e',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Plus size={12} /> CUSTOM MISSPELLINGS{isMultiToken && ' (PER TOKEN)'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {isMultiToken && (
                <select
                  value={customGroupIdx}
                  onChange={e => setCustomGroupIdx(Number(e.target.value))}
                  className="mono"
                  style={{
                    padding: '8px 10px', border: '2px solid #1c1917', background: '#fef7e6',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '14px',
                  }}
                  title="Which token this custom misspelling belongs to"
                >
                  {tokens.map((t, i) => <option key={i} value={i}>{t}</option>)}
                </select>
              )}
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomTypo()}
                placeholder={isMultiToken ? `Add a misspelling for "${tokens[customGroupIdx] || ''}"` : "Add a misspelling"}
                className="mono"
                style={{ flex: '1 1 240px', padding: '8px 12px', border: '2px solid #1c1917', background: '#fefdf8', fontSize: '14px' }}
              />
              <button onClick={addCustomTypo} className="btn-shadow typewriter" style={{
                padding: '8px 16px', border: '2px solid #1c1917', background: '#1c1917',
                color: '#fefdf8', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'inherit',
              }}>
                ADD
              </button>
            </div>
          </section>
        )}

        {/* ===== INCLUDE STRINGS ===== */}
        <section style={{
          background: '#fefdf8', border: '2px solid #1c1917', padding: '16px', marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '8px', marginBottom: '12px', flexWrap: 'wrap',
          }}>
            <div className="typewriter" style={{
              fontSize: '11px', letterSpacing: '0.2em', color: '#57534e',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Sparkles size={12} /> REQUIRE IN EVERY SEARCH
              <span style={{ marginLeft: '4px', color: '#a8a29e', fontWeight: '400', letterSpacing: '0.05em' }}>
                (literal term, not misspelled, AND'd to every chunk)
              </span>
            </div>
            {includeStrings.length > 0 && (
              <button
                onClick={clearIncludes}
                className="typewriter"
                style={{
                  padding: '4px 10px', border: '1.5px solid #b45309', background: 'transparent',
                  color: '#b45309', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.1em',
                  fontFamily: "'Special Elite', monospace",
                }}
              >
                CLEAR
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: includeStrings.length ? '12px' : '0' }}>
            <input
              type="text"
              value={includeInput}
              onChange={e => setIncludeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIncludeString()}
              placeholder="Term to require literally, e.g. 'gfx', 'rb67', '50mm'"
              className="mono"
              style={{ flex: 1, padding: '8px 12px', border: '2px solid #1c1917', background: '#fefdf8', fontSize: '14px' }}
            />
            <button onClick={addIncludeString} className="btn-shadow typewriter" style={{
              padding: '8px 16px', border: '2px solid #1c1917', background: '#b45309',
              color: '#fefdf8', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'inherit',
            }}>
              REQUIRE
            </button>
          </div>
          {includeStrings.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {includeStrings.map(t => (
                <div key={t} className="mono" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 8px', background: '#fef7e6', border: '1.5px solid #b45309',
                  fontSize: '13px', color: '#92400e',
                }}>
                  <span style={{ color: '#b45309', fontWeight: '700' }}>{'+'}</span>
                  <span>{t}</span>
                  <button onClick={() => removeIncludeString(t)} style={{
                    border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', color: '#b45309',
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="typewriter" style={{
              fontSize: '10px', letterSpacing: '0.1em', color: '#a8a29e',
            }}>
              No required terms. Each chunk searches only the typo variants.
            </div>
          )}
        </section>

        {/* ===== EXCLUDE STRINGS ===== */}
        <section style={{
          background: '#fefdf8', border: '2px solid #1c1917', padding: '16px', marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '8px', marginBottom: '12px', flexWrap: 'wrap',
          }}>
            <div className="typewriter" style={{
              fontSize: '11px', letterSpacing: '0.2em', color: '#57534e',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <X size={12} /> EXCLUDE FROM RESULTS
              <span style={{ marginLeft: '4px', color: '#a8a29e', fontWeight: '400', letterSpacing: '0.05em' }}>
                (appended as -term)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={seedExcludeWithTokens}
                className="typewriter"
                style={{
                  padding: '4px 10px', border: '1.5px solid #57534e', background: 'transparent',
                  color: '#57534e', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.1em',
                  fontFamily: "'Special Elite', monospace",
                }}
                title="Add each correctly-spelled token as an exclusion (strict misspelling-only mode)"
              >
                + EXCLUDE CORRECT TOKENS
              </button>
              {excludeStrings.length > 0 && (
                <button
                  onClick={clearExcludes}
                  className="typewriter"
                  style={{
                    padding: '4px 10px', border: '1.5px solid #991b1b', background: 'transparent',
                    color: '#991b1b', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.1em',
                    fontFamily: "'Special Elite', monospace",
                  }}
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: excludeStrings.length ? '12px' : '0' }}>
            <input
              type="text"
              value={excludeInput}
              onChange={e => setExcludeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addExcludeString()}
              placeholder="Term to exclude, e.g. 'reproduction', 'broken', 'parts only'"
              className="mono"
              style={{ flex: 1, padding: '8px 12px', border: '2px solid #1c1917', background: '#fefdf8', fontSize: '14px' }}
            />
            <button onClick={addExcludeString} className="btn-shadow typewriter" style={{
              padding: '8px 16px', border: '2px solid #1c1917', background: '#0f766e',
              color: '#fefdf8', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'inherit',
            }}>
              EXCLUDE
            </button>
          </div>
          {excludeStrings.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {excludeStrings.map(t => (
                <div key={t} className="mono" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 8px', background: '#e8f4f1', border: '1.5px solid #0f766e',
                  fontSize: '13px', color: '#115e59',
                }}>
                  <span style={{ color: '#0f766e', fontWeight: '700' }}>{'-'}</span>
                  <span style={{ textDecoration: 'line-through', textDecorationColor: '#0f766e', textDecorationThickness: '1px' }}>{t}</span>
                  <button onClick={() => removeExcludeString(t)} style={{
                    border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', color: '#0f766e',
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="typewriter" style={{
              fontSize: '11px', color: '#a8a29e', fontStyle: 'italic', letterSpacing: '0.05em',
            }}>
              No exclusions. Combined search returns broad matches including correctly-spelled listings.
            </div>
          )}
        </section>

        {/* ===== STATS + ACTIONS BAR ===== */}
        <section style={{
          background: '#1c1917', color: '#f4ecd8', padding: '14px 16px',
          border: '2px solid #1c1917', borderBottom: 'none',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px',
        }}>
          <div className="typewriter" style={{ fontSize: '13px', letterSpacing: '0.1em' }}>
            <span style={{ color: '#fcd34d', fontSize: '20px', fontWeight: '700' }}>{totalTypos}</span>
            <span style={{ marginLeft: '6px', color: '#a8a29e' }}>
              TYPOS IN {tokenGroups.length} GROUP{tokenGroups.length === 1 ? '' : 'S'}
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <div className="typewriter" style={{ fontSize: '11px', color: '#a8a29e', letterSpacing: '0.1em' }}>
            {totalSelectedTypos} SELECTED
          </div>
          <button onClick={selectAll} disabled={totalTypos === 0} style={miniBtn()}>
            Select all
          </button>
          <button onClick={clearSelection} disabled={totalSelectedTypos === 0} style={miniBtn()}>
            Clear
          </button>
        </section>

        {/* ===== TOKEN GROUPS ===== */}
        <section style={{
          background: '#fefdf8', border: '2px solid #1c1917', borderTop: 'none',
          padding: '16px', marginBottom: '20px', minHeight: '200px',
        }}>
          {tokenGroups.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#78716c', fontStyle: 'italic', fontSize: '15px' }}>
              <Shuffle size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div>Enter an item above and pick some typo types to begin.</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Try "iphone 14 pro max" or "patek philippe" or "mamiya rb67"
              </div>
            </div>
          ) : tokenGroups.map((group, gIdx) => {
            const correctIncluded = includesCorrect(gIdx);
            const groupSelectedCount = group.typos.filter(t => isSelected(gIdx, t.word)).length;
            const variantCount = variantsForGroup(gIdx).length;
            const groupCustom = customByGroup[gIdx] || [];
            return (
              <div key={gIdx} style={{
                marginBottom: gIdx < tokenGroups.length - 1 ? '20px' : '0',
                paddingBottom: gIdx < tokenGroups.length - 1 ? '20px' : '0',
                borderBottom: gIdx < tokenGroups.length - 1 ? '2px dashed #d6d3d1' : 'none',
              }}>
                {/* Group header */}
                <div style={{
                  display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
                  marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #d6d3d1',
                }}>
                  <div className="mono" style={{
                    padding: '4px 10px', background: '#fef7e6',
                    border: '2px solid #b45309', color: '#92400e',
                    fontSize: '15px', fontWeight: '700',
                  }}>
                    {group.token}
                  </div>
                  <span className="typewriter" style={{ fontSize: '11px', color: '#78716c', letterSpacing: '0.05em' }}>
                    {group.typos.length} typo{group.typos.length === 1 ? '' : 's'}
                    {groupSelectedCount > 0 && ` · ${groupSelectedCount} selected`}
                    {' · '}{variantCount} in search
                  </span>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => toggleCorrect(gIdx)}
                    className="typewriter"
                    style={{
                      padding: '4px 10px',
                      border: `1.5px solid ${correctIncluded ? '#0f766e' : '#a8a29e'}`,
                      background: correctIncluded ? '#e8f4f1' : 'transparent',
                      color: correctIncluded ? '#115e59' : '#78716c',
                      cursor: 'pointer', fontSize: '10px', letterSpacing: '0.1em',
                      fontFamily: "'Special Elite', monospace",
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}
                    title={correctIncluded ? 'Correct spelling is included in this group' : 'Correct spelling is excluded'}
                  >
                    {correctIncluded ? <Check size={11} /> : <X size={11} />}
                    INCLUDE "{group.token}"
                  </button>
                  <button onClick={() => selectAllInGroup(gIdx)} disabled={group.typos.length === 0} style={miniBtnLight()}>
                    All
                  </button>
                  <button onClick={() => clearGroupSelection(gIdx)} disabled={groupSelectedCount === 0} style={miniBtnLight()}>
                    None
                  </button>
                </div>

                {/* Custom typo chips for this group */}
                {groupCustom.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {groupCustom.map(t => (
                      <div key={t} className="mono" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '3px 8px', background: '#fef2f2', border: '1.5px solid #991b1b',
                        fontSize: '12px', color: '#991b1b',
                      }}>
                        custom: {t}
                        <button onClick={() => removeCustomTypo(gIdx, t)} style={{
                          border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                          display: 'flex', alignItems: 'center', color: '#991b1b',
                        }}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Typo grid for this group */}
                {group.typos.length === 0 ? (
                  <div className="typewriter" style={{
                    padding: '16px', textAlign: 'center', color: '#a8a29e',
                    fontSize: '12px', fontStyle: 'italic',
                  }}>
                    No typos generated for "{group.token}". Try enabling more typo types above.
                  </div>
                ) : (
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px',
                  }}>
                    {group.typos.map((t, i) => {
                      const c = COLOR_MAP[TYPO_TYPES.find(tt => tt.key === t.type)?.color || 'ink'];
                      const sel = isSelected(gIdx, t.word);
                      const typeMeta = TYPO_TYPES.find(tt => tt.key === t.type);
                      return (
                        <div
                          key={`${t.word}-${i}`}
                          className="typo-card"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '6px 8px',
                            border: `2px solid ${sel ? '#1c1917' : '#d6d3d1'}`,
                            background: sel ? '#fef7e6' : '#fefdf8',
                            transition: 'all 0.15s', cursor: 'pointer',
                          }}
                          onClick={() => toggleSelect(gIdx, t.word)}
                        >
                          <div className="checkmark" style={{
                            width: '16px', height: '16px', flexShrink: 0,
                            border: `2px solid ${sel ? '#1c1917' : '#a8a29e'}`,
                            background: sel ? '#1c1917' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {sel && <Check size={10} color="#fcd34d" strokeWidth={3} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="mono" style={{
                              fontSize: '13px', fontWeight: '500', color: '#1c1917',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }} title={t.word}>
                              {t.word}
                            </div>
                            <div className="typewriter" style={{
                              fontSize: '8.5px', letterSpacing: '0.1em', color: c.text,
                              textTransform: 'uppercase',
                            }}>
                              {typeMeta?.label || t.type}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); openTypoSearch(gIdx, t.word); }}
                            title={`Search "${t.word}" alone on eBay (the combined search button below filters by other tokens)`}
                            style={{
                              width: '24px', height: '24px', flexShrink: 0,
                              border: `1.5px solid ${c.border}`, background: c.bg, color: c.text,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <ExternalLink size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* ===== COMBINED SEARCH BAR ===== */}
        {tokenGroups.length > 0 && (
          <section style={{
            background: '#fefdf8', border: '3px solid #b45309', padding: '16px', marginBottom: '20px',
            boxShadow: '6px 6px 0 #1c1917', position: 'sticky', bottom: '16px',
          }}>
            <div className="typewriter" style={{
              fontSize: '11px', letterSpacing: '0.2em', marginBottom: '10px', color: '#b45309',
              display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
            }}>
              <Sparkles size={12} /> COMBINED SEARCH
              <span style={{ color: '#78716c', fontWeight: '400', letterSpacing: '0.05em' }}>
                · {groupsWithVariants}/{tokenGroups.length} groups active
                · {variantsPerGroup.reduce((a, b) => a + b, 0)} total variants
                {isSplit && (
                  <span style={{ color: '#b45309', fontWeight: '700' }}>
                    {' · '}SPLIT INTO {combinedQueries.length} QUERIES
                  </span>
                )}
              </span>
              <div style={{ flex: 1 }} />
              {tokenGroups.length > 1 ? (
                <div style={{ display: 'inline-flex', border: '1.5px solid #b45309' }}>
                  <button
                    onClick={() => setCombinedMode('or')}
                    className="typewriter"
                    title="ANY variant matches. Listing only needs one of (mamiya, amiya, rb67). Best for typo hunting."
                    style={{
                      padding: '4px 10px', border: 'none', cursor: 'pointer',
                      fontSize: '10px', letterSpacing: '0.1em',
                      fontFamily: "'Special Elite', monospace",
                      background: effectiveMode === 'or' ? '#b45309' : 'transparent',
                      color: effectiveMode === 'or' ? '#fefdf8' : '#b45309',
                    }}
                  >
                    OR (ANY)
                  </button>
                  <button
                    onClick={() => setCombinedMode('and')}
                    className="typewriter"
                    title="One variant per group must match. (mamiya OR amiya) AND (rb67 OR rb6t). Strict normal-search behavior."
                    style={{
                      padding: '4px 10px', border: 'none', borderLeft: '1.5px solid #b45309',
                      cursor: 'pointer', fontSize: '10px', letterSpacing: '0.1em',
                      fontFamily: "'Special Elite', monospace",
                      background: effectiveMode === 'and' ? '#b45309' : 'transparent',
                      color: effectiveMode === 'and' ? '#fefdf8' : '#b45309',
                    }}
                  >
                    AND (PER GROUP)
                  </button>
                </div>
              ) : (
                <span className="typewriter" style={{
                  fontSize: '10px', letterSpacing: '0.1em', color: '#78716c',
                  border: '1.5px solid #d6d3d1', padding: '4px 10px',
                }} title="Single-token search: OR is used automatically (cleaner URL, same semantics).">
                  OR (AUTO)
                </span>
              )}
            </div>

            {combinedQueries.length === 0 ? (
              <div className="mono" style={{
                padding: '10px 12px', background: '#fef7e6', border: '1.5px solid #b45309',
                fontSize: '12px', marginBottom: '10px',
                color: '#a8a29e', fontStyle: 'italic',
              }}>
                (no variants in any group, toggle "include correct" on, or select some typos)
              </div>
            ) : isSplit ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '8px 10px', marginBottom: '10px',
                  background: isTruncated ? '#fef2f2' : '#fef7e6',
                  border: `1.5px solid ${isTruncated ? '#991b1b' : '#b45309'}`,
                  fontSize: '12px',
                  color: isTruncated ? '#7f1d1d' : '#92400e',
                }}>
                  <AlertCircle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
                  <div>
                    {isTruncated ? (
                      <>
                        Combined query is too combinatorially large. Capped at <strong>{combinedQueries.length}</strong> sub-searches,
                        so coverage is <strong>partial</strong>. To get full coverage, reduce typo types or deselect some variants.
                      </>
                    ) : (
                      <>
                        Combined query is too long for a single eBay URL (over {MAX_QUERY_LEN} chars).
                        Auto-split into <strong>{combinedQueries.length}</strong> sub-searches that together cover the full variant space.
                        Open all in tabs below, or click each link.
                      </>
                    )}
                  </div>
                </div>

                {/* Per-chunk preview list */}
                <div style={{
                  marginBottom: '10px',
                  border: '1.5px solid #d6d3d1',
                  maxHeight: '180px',
                  overflow: 'auto',
                }}>
                  {combinedQueries.map((q, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px',
                      borderBottom: i < combinedQueries.length - 1 ? '1px dashed #d6d3d1' : 'none',
                      background: i % 2 === 0 ? '#fefdf8' : '#faf6ec',
                    }}>
                      <span className="typewriter" style={{
                        flexShrink: 0,
                        fontSize: '10px', letterSpacing: '0.1em',
                        padding: '2px 6px',
                        background: '#1c1917', color: '#fcd34d',
                        minWidth: '30px', textAlign: 'center',
                      }}>
                        {i + 1}/{combinedQueries.length}
                      </span>
                      <div className="mono" style={{
                        flex: 1, fontSize: '11px', color: '#1c1917',
                        wordBreak: 'break-all', minWidth: 0,
                      }} title={`${q.length} chars`}>
                        {q}
                      </div>
                      <span className="mono" style={{
                        flexShrink: 0,
                        fontSize: '10px', color: '#78716c',
                      }}>
                        {q.length}c
                      </span>
                      <a
                        href={combinedUrls[i]}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flexShrink: 0,
                          width: '26px', height: '26px',
                          border: '1.5px solid #b45309', background: '#fef7e6', color: '#92400e',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                        title={`Open search ${i + 1} in a new tab`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mono" style={{
                padding: '10px 12px', background: '#fef7e6', border: '1.5px solid #b45309',
                fontSize: '12px', wordBreak: 'break-all', marginBottom: '10px',
                maxHeight: '80px', overflow: 'auto', color: '#1c1917',
              }}>
                {combinedQueries[0]}
                <span style={{ color: '#78716c', marginLeft: '8px' }}>
                  ({combinedQueries[0].length}c)
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={openCombined}
                disabled={combinedQueries.length === 0}
                className="btn-shadow typewriter"
                style={{
                  padding: '12px 20px', border: '2px solid #1c1917',
                  background: combinedQueries.length > 0 ? '#b45309' : '#a8a29e',
                  color: '#fefdf8', cursor: combinedQueries.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '13px', letterSpacing: '0.15em', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}
                title={isSplit ? 'Open all queries in new tabs (popup blocker may interfere beyond ~5 tabs)' : 'Open the search in a new tab'}
              >
                <Search size={14} />
                {isSplit ? `OPEN ALL ${combinedQueries.length} IN TABS` : 'SEARCH ON EBAY'}
              </button>
              <button
                onClick={() => copyToClipboard(combinedUrls.join('\n'), 'url')}
                disabled={combinedUrls.length === 0}
                className="btn-shadow typewriter"
                style={{
                  padding: '12px 16px', border: '2px solid #1c1917', background: '#fefdf8',
                  cursor: combinedUrls.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
                title={isSplit ? 'Copy all URLs, one per line' : 'Copy URL'}
              >
                {copiedTerm === 'url' ? <Check size={14} /> : <Copy size={14} />}
                {isSplit ? `Copy ${combinedUrls.length} URLs` : 'Copy URL'}
              </button>
              <button
                onClick={() => copyToClipboard(combinedQueries.join('\n'), 'query')}
                disabled={combinedQueries.length === 0}
                className="btn-shadow typewriter"
                style={{
                  padding: '12px 16px', border: '2px solid #1c1917', background: '#fefdf8',
                  cursor: combinedQueries.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                {copiedTerm === 'query' ? <Check size={14} /> : <Copy size={14} />}
                {isSplit ? `Copy ${combinedQueries.length} queries` : 'Copy query'}
              </button>
            </div>
          </section>
        )}

        {/* ===== FOOTER ===== */}
        <footer style={{
          textAlign: 'center', padding: '24px 16px', fontSize: '11px', color: '#78716c',
        }}>
          <div className="typewriter" style={{ letterSpacing: '0.15em', marginBottom: '4px' }}>
            EBAY: both modes use (a,b,c) paren-OR · capped at 14 terms per group · -term excludes (outside the parens) · click a typo card to search that word alone
          </div>
          <div style={{ fontSize: '10.5px', fontStyle: 'italic' }}>
            Sellers who can't spell don't get top dollar. Happy hunting.
          </div>
        </footer>

      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================
const selectStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '13px',
  border: '2px solid #1c1917',
  background: '#fefdf8',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div className="typewriter" style={{
        fontSize: '10px',
        letterSpacing: '0.15em',
        marginBottom: '4px',
        color: '#57534e',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function Toggle({ on, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        border: `2px solid ${on ? '#1c1917' : '#a8a29e'}`,
        background: on ? '#1c1917' : '#fefdf8',
        color: on ? '#fcd34d' : '#57534e',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'inherit',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span style={{
        width: '10px', height: '10px',
        border: `1.5px solid ${on ? '#fcd34d' : '#a8a29e'}`,
        background: on ? '#fcd34d' : 'transparent',
      }} />
      {label}
    </button>
  );
}

function miniBtn(primary) {
  return {
    padding: '6px 10px',
    border: `1.5px solid ${primary ? '#fcd34d' : '#57534e'}`,
    background: primary ? '#fcd34d' : 'transparent',
    color: primary ? '#1c1917' : '#f4ecd8',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: "'Special Elite', monospace",
    letterSpacing: '0.1em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  };
}

function miniBtnLight() {
  return {
    padding: '4px 10px',
    border: '1.5px solid #57534e',
    background: 'transparent',
    color: '#57534e',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: "'Special Elite', monospace",
    letterSpacing: '0.1em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  };
}
