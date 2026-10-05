/* CKYC 2.0 Hub — demo edition.
 * Everything here runs in the browser: the Hub's intake API, work queues,
 * consent module and a simulated CKYC registry behind a simulated gateway.
 * No data leaves the browser. */
(function () {
  'use strict';

  const STORE_KEY = 'ckycHubDemo.v2';
  const RE_ID = 'IN9999';
  const POLL_DELAY_MS = 4000;

  // ---------- reference data ----------
  const CHANNELS = [
    { code: 'DMS_CA', name: 'DMS — Current Account', product: 'Current account', types: 'Individual, Legal entity' },
    { code: 'TAB_CA', name: 'TAB Current Account', product: 'Current account', types: 'Individual (proprietor), Legal entity' },
    { code: 'CPH_SB', name: 'Savings Account CPH', product: 'Savings bank', types: 'Individual' },
    { code: 'TAB_SB', name: 'TAB Savings Account', product: 'Savings bank', types: 'Individual' },
    { code: 'VCIP', name: 'VCIP (video KYC)', product: 'Savings bank', types: 'Individual' },
  ];

  const BRANCHES = {
    '0123': { name: 'Mumbai - Andheri', city: 'Mumbai', state: 'MH', district: '443', pin: '400053' },
    '0456': { name: 'Chennai - T Nagar', city: 'Chennai', state: 'TN', district: '603', pin: '600017' },
    '0789': { name: 'Bengaluru - Jayanagar', city: 'Bengaluru', state: 'KA', district: '572', pin: '560041' },
    '0234': { name: 'Delhi - Karol Bagh', city: 'New Delhi', state: 'DL', district: '090', pin: '110005' },
  };

  const DEFAULT_USERS = [
    { username: 'kyc.maker', password: 'user123', name: 'KYC Operator', role: 'OPERATOR' },
    { username: 'branch.0123', password: 'user123', name: 'Andheri branch desk', role: 'BRANCH', dp: '0123' },
    { username: 'branch.0456', password: 'user123', name: 'T Nagar branch desk', role: 'BRANCH', dp: '0456' },
    { username: 'branch.0789', password: 'user123', name: 'Jayanagar branch desk', role: 'BRANCH', dp: '0789' },
    { username: 'admin', password: 'admin123', name: 'Hub Administrator', role: 'ADMIN' },
    { username: 'kyc.viewer', password: 'user123', name: 'Auditor (read-only)', role: 'VIEWER' },
  ];

  const STATUS = {
    RECEIVED: { queue: 'CREATE', label: 'Received', bucket: 'action', desc: 'Data received; no registry action yet' },
    SEARCHED: { queue: 'CREATE', label: 'Searched', bucket: 'action', desc: 'De-duplication search done; searchKey held' },
    CREATE_PENDING: { queue: 'CREATE', label: 'Create pending', bucket: 'waiting', desc: 'Create submitted; awaiting registry' },
    PROBABLE_MATCH: { queue: 'CREATE', label: 'Probable match', bucket: 'action', desc: 'Registry returned look-alike candidates' },
    CONFIRMED_MATCH: { queue: 'CREATE', label: 'Confirmed match', bucket: 'action', desc: 'Customer already exists at the registry' },
    CKYC_CREATED: { queue: 'CREATE', label: 'CKYC created', bucket: 'done', desc: 'CKYC number issued' },
    UPDATE_REQUIRED: { queue: 'UPDATE', label: 'Update required', bucket: 'action', desc: 'Registry needs our data' },
    UPDATE_PENDING: { queue: 'UPDATE', label: 'Update pending', bucket: 'waiting', desc: 'Update submitted; awaiting registry' },
    CKYC_UPDATED: { queue: 'UPDATE', label: 'CKYC updated', bucket: 'done', desc: 'Registry accepted the update' },
    REJECTED: { queue: '*', label: 'Rejected', bucket: 'rejected', desc: 'Registry rejected the last submission' },
  };

  const OVD_TYPES = { A: 'Passport', B: 'Voter ID', C: 'PAN', D: 'Driving Licence', E: 'Aadhaar', F: 'NREGA job card', G: 'NPR letter' };
  const KYC_MODES = ['FACE_TO_FACE_WITH_OFFICIAL', 'VIDEO_BASED_CIP', 'NON_FACE_TO_FACE_BY_RE_OFFICIAL', 'DIGITAL_KYC', 'OTP_BASED_EKYC'];
  const DOC_SLOTS = {
    INDIVIDUAL: ['PHOTO', 'PAN_CARD', 'OVD', 'CURRENT_ADDRESS_PROOF', 'DECLARATION', 'UNDERTAKING', 'CONSENT_FORM'],
    LEGAL: ['PAN_CARD', 'TAX_ID_CERTIFICATE', 'IDENTITY_PROOF', 'REGISTERED_ADDRESS_PROOF', 'PRINCIPAL_ADDRESS_PROOF', 'CONSENT_FORM'],
  };
  const CONTENT_TYPES = ['jpeg', 'jpg', 'png', 'pdf', 'tiff'];

  // Updatable-tag catalogue: update path ← intake field, and whether the
  // registry returns it on download (so it can be compared).
  const T = (group, tag, src, label, cmp = true) => ({ group, tag, src, label, cmp });
  const TAGS = {
    INDIVIDUAL: [
      T('Name', 'personalDetails.name.title', 'individual.name.title', 'Title'),
      T('Name', 'personalDetails.name.firstName', 'individual.name.firstName', 'First name'),
      T('Name', 'personalDetails.name.middleName', 'individual.name.middleName', 'Middle name'),
      T('Name', 'personalDetails.name.lastName', 'individual.name.lastName', 'Last name'),
      T('Family', 'personalDetails.familyDetails.father.firstName', 'individual.fatherName.firstName', "Father's first name"),
      T('Family', 'personalDetails.familyDetails.father.lastName', 'individual.fatherName.lastName', "Father's last name"),
      T('Family', 'personalDetails.familyDetails.mother.firstName', 'individual.motherName.firstName', "Mother's first name"),
      T('Personal', 'personalDetails.dob', 'individual.dob', 'Date of birth'),
      T('Personal', 'personalDetails.gender', 'individual.gender', 'Gender'),
      T('Personal', 'personalDetails.panDetails.number', 'individual.pan.number', 'PAN'),
      T('Personal', 'personalDetails.residentialStatus', 'individual.residentialStatus', 'Residential status'),
      T('Personal', 'personalDetails.nationality', 'individual.nationality', 'Nationality'),
      T('Identity', 'identityProofs', 'individual.identityProofs', 'Identity proofs (whole list)'),
      T('Address as per OVD', 'addressDetails.addressAsPerOvd.line1', 'individual.addressAsPerOvd.line1', 'Line 1'),
      T('Address as per OVD', 'addressDetails.addressAsPerOvd.line2', 'individual.addressAsPerOvd.line2', 'Line 2'),
      T('Address as per OVD', 'addressDetails.addressAsPerOvd.city', 'individual.addressAsPerOvd.city', 'City'),
      T('Address as per OVD', 'addressDetails.addressAsPerOvd.district', 'individual.addressAsPerOvd.district', 'District code'),
      T('Address as per OVD', 'addressDetails.addressAsPerOvd.state', 'individual.addressAsPerOvd.state', 'State'),
      T('Address as per OVD', 'addressDetails.addressAsPerOvd.pincode', 'individual.addressAsPerOvd.pincode', 'PIN code'),
      T('Current address', 'addressDetails.currentAddress.sameAsAddressAsPerOvd', 'individual.currentAddress.sameAsAddressAsPerOvd', 'Same as OVD address'),
      T('Current address', 'addressDetails.currentAddress.line1', 'individual.currentAddress.line1', 'Line 1'),
      T('Current address', 'addressDetails.currentAddress.city', 'individual.currentAddress.city', 'City'),
      T('Current address', 'addressDetails.currentAddress.pincode', 'individual.currentAddress.pincode', 'PIN code'),
      T('Contact', 'contactDetails.mobile.number', 'individual.contact.mobile.number', 'Mobile'),
      T('Contact', 'contactDetails.email.address', 'individual.contact.email.address', 'Email'),
      T('Attestation', 'attestationDetails.kycVerification.mode', 'attestation.kycVerification.mode', 'KYC verification mode'),
      T('Attestation', 'attestationDetails.employee.name', 'attestation.employee.name', 'Attesting official', false),
      T('Documents', 'photo', 'documents.PHOTO', 'Photograph', false),
      T('Documents', 'identityProofs[].documents', 'documents.OVD', 'OVD images', false),
    ],
    LEGAL: [
      T('Entity', 'entityDetails.name', 'legal.entity.name', 'Entity name'),
      T('Entity', 'entityDetails.constitutionType', 'legal.entity.constitutionType', 'Constitution type'),
      T('Entity', 'entityDetails.dateOfRegistration', 'legal.entity.dateOfRegistration', 'Date of registration'),
      T('Entity', 'entityDetails.panDetails.number', 'legal.pan.number', 'PAN'),
      T('Entity', 'entityDetails.taxIdentification.number', 'legal.taxIdentification.number', 'GSTIN'),
      T('Identity', 'identityProof.number', 'legal.identityProof.number', 'CIN / LLPIN'),
      T('Registered address', 'addressDetails.registeredAddress.line1', 'legal.registeredAddress.line1', 'Line 1'),
      T('Registered address', 'addressDetails.registeredAddress.city', 'legal.registeredAddress.city', 'City'),
      T('Registered address', 'addressDetails.registeredAddress.state', 'legal.registeredAddress.state', 'State'),
      T('Registered address', 'addressDetails.registeredAddress.pincode', 'legal.registeredAddress.pincode', 'PIN code'),
      T('Contact', 'contactDetails.primary.mobile.number', 'legal.contact.primary.mobile.number', 'Mobile'),
      T('Contact', 'contactDetails.primary.email.address', 'legal.contact.primary.email.address', 'Email'),
      T('Related parties', 'relatedParties', 'legal.relatedParties', 'Directors / partners (whole list)'),
      T('Documents', 'identityProof.documents', 'documents.IDENTITY_PROOF', 'Identity proof images', false),
    ],
  };

  // ---------- helpers ----------
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  function setPath(o, p, v) {
    const ks = p.split('.');
    let cur = o;
    ks.slice(0, -1).forEach((k) => { if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k]; });
    cur[ks[ks.length - 1]] = v;
  }
  let clockOffset = 0; // seeding back-dates events
  const now = () => Date.now() - clockOffset;
  const iso = (t) => new Date(t == null ? now() : t).toISOString();
  const ddmmyyyy = (t) => { const d = new Date(t == null ? now() : t); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; };
  const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); });
  const digits = (n) => Array.from({ length: n }, (_, i) => (i === 0 ? 1 + Math.floor(Math.random() * 9) : Math.floor(Math.random() * 10))).join('');
  const sleepish = () => 80 + Math.floor(Math.random() * 420);
  const maskPan = (p) => (p ? p.slice(0, 2) + 'XXXX' + p.slice(6, 9) + 'X' : '');
  const maskName = (n) => (n || '').split(' ').map((w) => (w ? w[0] + '*'.repeat(Math.max(1, w.length - 1)) : w)).join(' ');
  async function sha256(s) {
    try {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
    } catch (e) { return 'unavailable'; }
  }

  function fmtVal(v) {
    if (v === undefined || v === null || v === '') return '';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (Array.isArray(v)) {
      return v.map((x) => {
        if (x && x.ovdType) return `${OVD_TYPES[x.ovdType] || x.ovdType}: ${x.ovdType === 'E' ? 'XXXX-XXXX-' + x.ovdNo : x.ovdNo}`;
        if (x && x.name) return `${x.name}${x.din ? ' (DIN ' + x.din + ')' : ''}${x.ownership ? ' ' + x.ownership + '%' : ''}`;
        return typeof x === 'object' ? JSON.stringify(x) : String(x);
      }).join('; ');
    }
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  // ---------- persistence ----------
  let state = null;
  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) { state = JSON.parse(raw); if (state && state.v === 2) return state; } } catch (e) { /* storage unavailable */ }
    state = seed();
    save();
    return state;
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* in-memory only */ } }
  function reset() { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } state = seed(); save(); return state; }

  // ---------- payload builders ----------
  function individualPayload(o) {
    const br = BRANCHES[o.branch];
    const p = {
      eventId: uuid(),
      eventType: o.eventType || 'ACCOUNT_ACTIVATED',
      occurredAt: iso(),
      account: {
        accountNumber: o.accountNumber, customerId: o.cif,
        productCode: o.channel.endsWith('CA') ? 'CA' : 'SB',
        productName: o.channel.endsWith('CA') ? 'Current Account' : 'Savings Bank Account',
        branchCode: o.branch, branchName: br.name, activatedAt: iso(), accountType: 'NORMAL',
      },
      customerType: 'INDIVIDUAL',
      ckyc: { ckycNo: o.ckycNo || null, ckycRefNo: null, consentGiven: o.consent !== false, consentDate: ddmmyyyy() },
      attestation: {
        employee: { name: o.official || 'A. Kulkarni', code: 'EMP' + o.branch + '1', designation: 'KYC Officer', branch: br.name },
        kycVerification: { mode: o.channel === 'VCIP' ? 'VIDEO_BASED_CIP' : 'FACE_TO_FACE_WITH_OFFICIAL', carriedOutDate: ddmmyyyy() },
        declaration: { date: ddmmyyyy(), place: br.city },
      },
      individual: {
        name: { title: o.gender === 'F' ? 'Ms' : 'Mr', firstName: o.first, middleName: '', lastName: o.last },
        fatherName: { title: 'Mr', firstName: o.father, lastName: o.last },
        motherName: { title: 'Mrs', firstName: o.mother || '', lastName: o.last },
        dob: o.dob, gender: o.gender, isMinor: false,
        pan: { number: o.pan, verified: true, form60Submitted: false },
        residentialStatus: 'RESIDENT', nationality: 'IN',
        identityProofs: [
          { ovdType: 'E', ovdNo: o.aadhaar4, modeOfAadhaarVerification: 'OFFLINE_VERIFICATION', verifiedFromDigilocker: true },
          { ovdType: 'C', ovdNo: o.pan, certifiedCopyVerifiedWithOriginalOVD: true },
        ],
        addressAsPerOvd: { line1: o.addr, line2: o.addr2 || '', countryCode: 'IN', state: br.state, district: br.district, city: br.city, pincode: br.pin, matchType: 'EXACT_MATCH' },
        currentAddress: { sameAsAddressAsPerOvd: true },
        contact: {
          mobile: { countryCode: '+91', number: o.mobile, verifiedThroughOTP: true },
          email: { address: o.email || '', verifiedThroughOTP: !!o.email },
        },
        relatedParties: [], remarks: '',
      },
      documents: [],
    };
    if (o.noMobile) p.individual.contact.mobile.number = '';
    if (o.photo !== false) p.documents.push({ slot: 'PHOTO', fileName: 'photo.jpg', contentType: 'jpeg', b64Content: 'demo' });
    p.documents.push({ slot: 'PAN_CARD', fileName: 'pan.pdf', contentType: 'pdf', b64Content: 'demo' });
    p.documents.push({ slot: 'OVD', ovdType: 'E', fileName: 'aadhaar.pdf', contentType: 'pdf', b64Content: 'demo' });
    p.documents.push({ slot: 'CONSENT_FORM', fileName: 'ckyc_consent.pdf', contentType: 'pdf', b64Content: 'demo' });
    return p;
  }

  function legalPayload(o) {
    const br = BRANCHES[o.branch];
    return {
      eventId: uuid(), eventType: 'ACCOUNT_ACTIVATED', occurredAt: iso(),
      account: { accountNumber: o.accountNumber, customerId: o.cif, productCode: 'CA', productName: 'Current Account', branchCode: o.branch, branchName: br.name, activatedAt: iso(), accountType: 'NORMAL' },
      customerType: 'LEGAL',
      ckyc: { ckycNo: o.ckycNo || null, ckycRefNo: null, consentGiven: true, consentDate: ddmmyyyy() },
      attestation: {
        employee: { name: o.official || 'A. Kulkarni', code: 'EMP' + o.branch + '1', designation: 'KYC Officer', branch: br.name },
        kycVerification: { mode: 'FACE_TO_FACE_WITH_OFFICIAL', carriedOutDate: ddmmyyyy() },
        declaration: { date: ddmmyyyy(), place: br.city },
      },
      legal: {
        entity: { name: o.name, constitutionType: o.constitution, dateOfRegistration: o.doi, countryOfRegistration: 'IN' },
        pan: { number: o.pan },
        taxIdentification: { type: 'GSTIN', number: o.gstin },
        identityProof: { type: o.idType, number: o.idNo },
        registeredAddress: { line1: o.addr, countryCode: 'IN', state: br.state, district: br.district, city: br.city, pincode: br.pin, proofOfAddress: { type: 'REGISTRATION_CERTIFICATE' } },
        principalAddress: { sameAsRegistered: true },
        contact: { primary: { mobile: { countryCode: '+91', number: o.mobile }, email: { address: o.email } } },
        relatedParties: o.parties,
      },
      documents: [
        { slot: 'PAN_CARD', fileName: 'pan.pdf', contentType: 'pdf', b64Content: 'demo' },
        { slot: 'IDENTITY_PROOF', documentType: o.idType, fileName: 'incorporation.pdf', contentType: 'pdf', b64Content: 'demo' },
        { slot: 'CONSENT_FORM', fileName: 'ckyc_consent.pdf', contentType: 'pdf', b64Content: 'demo' },
      ],
    };
  }

  // Random fictional customer for "simulate a push".
  const FIRST_M = ['Aditya', 'Nikhil', 'Sanjay', 'Imran', 'Rahul', 'Varun', 'Anil', 'Joseph', 'Harish', 'Gautam'];
  const FIRST_F = ['Divya', 'Pooja', 'Neha', 'Aisha', 'Shalini', 'Rekha', 'Nandini', 'Swati', 'Anjali', 'Ritu'];
  const LAST = ['Sharma', 'Patil', 'Joshi', 'Nair', 'Banerjee', 'Kapoor', 'Desai', 'Chatterjee', 'Rao', 'Thomas', 'Pillai', 'Saxena'];
  const STREETS = ['MG Road', 'Station Road', 'Lake View Colony', 'Temple Street', 'Park Avenue', 'Gandhi Nagar', 'Nehru Street', 'Hill Road'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function randomPan(last, type = 'P') {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return L[Math.floor(Math.random() * 26)] + L[Math.floor(Math.random() * 26)] + L[Math.floor(Math.random() * 26)] + type + (last ? last[0].toUpperCase() : 'K') + digits(4) + L[Math.floor(Math.random() * 26)];
  }
  function randomIndividual(channel, branch, extra = {}) {
    const gender = Math.random() < 0.5 ? 'M' : 'F';
    const first = pick(gender === 'M' ? FIRST_M : FIRST_F);
    const last = pick(LAST);
    const y = 1960 + Math.floor(Math.random() * 40);
    return individualPayload(Object.assign({
      channel, branch, first, last, gender, father: pick(FIRST_M), mother: pick(FIRST_F),
      dob: `${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${y}`,
      pan: randomPan(last), aadhaar4: digits(4), mobile: '9' + digits(9),
      email: `${first}.${last}@example.com`.toLowerCase(),
      addr: `${1 + Math.floor(Math.random() * 300)} ${pick(STREETS)}`,
      accountNumber: '11' + branch + digits(6), cif: 'CIF' + digits(7),
    }, extra));
  }

  // ---------- validation & readiness ----------
  const DATE_RE = /^\d{2}-\d{2}-\d{4}$/;
  const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  function validate(p) {
    const errs = [];
    const e = (path, message) => errs.push({ path, message });
    if (!p || typeof p !== 'object' || Array.isArray(p)) { e('$', 'Body must be a JSON object'); return errs; }
    if (!p.eventId || typeof p.eventId !== 'string') e('eventId', 'Required string (idempotency key)');
    if (!['ACCOUNT_ACTIVATED', 'CUSTOMER_UPDATED'].includes(p.eventType)) e('eventType', 'Must be ACCOUNT_ACTIVATED or CUSTOMER_UPDATED');
    if (!p.account || !p.account.accountNumber) e('account.accountNumber', 'Required');
    if (!p.account || !p.account.branchCode) e('account.branchCode', 'Required (DP code)');
    if (!['INDIVIDUAL', 'LEGAL'].includes(p.customerType)) e('customerType', 'Must be INDIVIDUAL or LEGAL');
    if (p.ckyc && p.ckyc.ckycNo && !/^\d{14}$/.test(String(p.ckyc.ckycNo))) e('ckyc.ckycNo', 'Must be 14 digits');
    const kv = p.attestation && p.attestation.kycVerification;
    if (kv && kv.mode && !KYC_MODES.includes(kv.mode)) e('attestation.kycVerification.mode', 'Unknown mode');
    if (kv && kv.carriedOutDate && !DATE_RE.test(kv.carriedOutDate)) e('attestation.kycVerification.carriedOutDate', 'Use DD-MM-YYYY');
    if (p.customerType === 'INDIVIDUAL') {
      const i = p.individual;
      if (!i) e('individual', 'Required for INDIVIDUAL');
      else {
        if (i.dob && !DATE_RE.test(i.dob)) e('individual.dob', 'Use DD-MM-YYYY');
        if (i.gender && !['M', 'F', 'T'].includes(i.gender)) e('individual.gender', 'Must be M, F or T');
        if (i.pan && i.pan.number && !PAN_RE.test(i.pan.number)) e('individual.pan.number', 'Invalid PAN format');
        (i.identityProofs || []).forEach((x, k) => {
          if (!OVD_TYPES[x.ovdType]) e(`individual.identityProofs[${k}].ovdType`, 'Must be A–G');
          if (x.ovdType === 'E' && !/^\d{4}$/.test(String(x.ovdNo || ''))) e(`individual.identityProofs[${k}].ovdNo`, 'Aadhaar: send only the last 4 digits');
        });
      }
    }
    if (p.customerType === 'LEGAL') {
      const l = p.legal;
      if (!l) e('legal', 'Required for LEGAL');
      else if (l.pan && l.pan.number && !PAN_RE.test(l.pan.number)) e('legal.pan.number', 'Invalid PAN format');
    }
    (p.documents || []).forEach((d, k) => {
      const slots = DOC_SLOTS[p.customerType] || [];
      if (!slots.includes(d.slot)) e(`documents[${k}].slot`, `Unknown slot "${d.slot}"`);
      if (d.contentType && !CONTENT_TYPES.includes(String(d.contentType).toLowerCase())) e(`documents[${k}].contentType`, 'jpeg, png, pdf or tiff');
      if (!d.b64Content) e(`documents[${k}].b64Content`, 'Required');
    });
    return errs;
  }

  function readiness(p) {
    const block = []; const adv = [];
    const hasDoc = (s) => (p.documents || []).some((d) => d.slot === s);
    if (!p.ckyc || p.ckyc.consentGiven !== true) block.push('Customer consent (ckyc.consentGiven) not given');
    if (!getPath(p, 'attestation.employee.name')) block.push('Attesting official missing');
    if (!getPath(p, 'attestation.kycVerification.mode')) block.push('KYC verification mode missing');
    if (p.customerType === 'INDIVIDUAL') {
      const i = p.individual || {};
      if (!hasDoc('PHOTO')) block.push('Photograph (PHOTO document) missing');
      if (!getPath(i, 'contact.mobile.number')) block.push('Mobile number missing');
      if (!(i.identityProofs || []).length) block.push('No officially valid document (OVD)');
      if (!getPath(i, 'addressAsPerOvd.line1') || !getPath(i, 'addressAsPerOvd.pincode')) block.push('Address as per OVD incomplete');
      if (!getPath(i, 'fatherName.firstName') && !getPath(i, 'motherName.firstName')) block.push("Father's or mother's name required");
      if (!getPath(i, 'contact.email.address')) adv.push('No email address — registry notifications will go by SMS only');
      if (!getPath(i, 'pan.number')) adv.push('No PAN — Form 60 must be on file');
    } else {
      const l = p.legal || {};
      if (!hasDoc('IDENTITY_PROOF')) block.push('At least one IDENTITY_PROOF document required');
      if (!getPath(l, 'pan.number')) block.push('Entity PAN missing');
      if (!getPath(l, 'registeredAddress.line1')) block.push('Registered address missing');
      if (!getPath(l, 'contact.primary.mobile.number')) block.push('Primary mobile missing');
      if (!(l.relatedParties || []).length) adv.push('No related parties listed');
    }
    return { ready: block.length === 0, block, adv };
  }

  // ---------- accounts ----------
  function displayName(p) {
    if (p.customerType === 'LEGAL') return getPath(p, 'legal.entity.name') || '(entity)';
    const n = getPath(p, 'individual.name') || {};
    return [n.firstName, n.middleName, n.lastName].filter(Boolean).join(' ') || '(customer)';
  }
  function partyOf(p) { return clone({ customerType: p.customerType, individual: p.individual, legal: p.legal, attestation: p.attestation }); }

  function summary(acc) {
    const p = acc.payload;
    return {
      name: displayName(p),
      mobile: getPath(p, 'individual.contact.mobile.number') || getPath(p, 'legal.contact.primary.mobile.number') || '',
      pan: getPath(p, 'individual.pan.number') || getPath(p, 'legal.pan.number') || '',
    };
  }

  function addTimeline(acc, actor, text, kind = 'info') { acc.timeline.unshift({ at: iso(), actor, text, kind }); acc.updatedAt = iso(); }

  function visibleAccounts(user) {
    return state.accounts.filter((a) => user.role !== 'BRANCH' || a.branchCode === user.dp);
  }
  function findAccount(id) { return state.accounts.find((a) => a.id === id); }

  // ---------- Data Fetch API (intake) ----------
  // Simulated POST /api/v1/accounts/activated.  Returns { http, body }.
  function intake(channelCode, payload, opts = {}) {
    const ch = state.channels.find((c) => c.code === channelCode);
    const ev = { at: iso(), channel: channelCode, eventId: payload && payload.eventId, eventType: payload && payload.eventType, size: JSON.stringify(payload || {}).length };
    const finish = (http, body, outcome) => { ev.outcome = outcome; ev.http = http; state.intake.unshift(ev); state.intake = state.intake.slice(0, 300); save(); return { http, body }; };
    if (!ch) return finish(401, { accepted: false, message: 'Unknown API key' }, 'REJECTED');
    if (!ch.enabled) return finish(403, { accepted: false, message: `Channel ${channelCode} is disabled` }, 'REJECTED');
    const errors = validate(payload);
    if (errors.length) { ev.errors = errors; return finish(400, { accepted: false, message: 'Validation failed', errors }, 'REJECTED'); }

    const dup = state.accounts.find((a) => a.channel === channelCode && a.eventIds.includes(payload.eventId));
    if (dup) return finish(200, { accepted: true, duplicate: true, message: 'eventId already processed — nothing changed', account: pub(dup) }, 'DUPLICATE');

    let acc = state.accounts.find((a) => a.channel === channelCode && a.accountNumber === payload.account.accountNumber);
    if (acc) {
      acc.payload = clone(payload);
      acc.eventIds.push(payload.eventId);
      acc.dataVersion += 1;
      acc.branchCode = payload.account.branchCode;
      const suppliedNo = payload.ckyc && payload.ckyc.ckycNo;
      if (suppliedNo && !acc.ckycNo) acc.ckycNo = suppliedNo;
      if (acc.ckycNo) {
        if (acc.status !== 'UPDATE_PENDING') { acc.queue = 'UPDATE'; acc.status = 'UPDATE_REQUIRED'; }
      } else if (acc.status === 'REJECTED') {
        acc.status = 'RECEIVED'; acc.searchKey = null; acc.search = null;
        if (opts.fixScenario) acc.sim.create = 'APPROVED';
      }
      addTimeline(acc, channelCode, `Data re-sent by channel (${payload.eventType}); data version ${acc.dataVersion}` + (acc.queue === 'UPDATE' ? ' — queued for registry update' : ''), 'intake');
      return finish(200, { accepted: true, outcome: 'UPDATED', account: pub(acc) }, 'UPDATED');
    }

    state.seq += 1;
    const ckycNo = (payload.ckyc && payload.ckyc.ckycNo) || null;
    acc = {
      id: 'A' + String(state.seq).padStart(5, '0'),
      channel: channelCode, accountNumber: payload.account.accountNumber, branchCode: payload.account.branchCode,
      customerType: payload.customerType, payload: clone(payload), eventIds: [payload.eventId], dataVersion: 1,
      queue: ckycNo ? 'UPDATE' : 'CREATE', status: ckycNo ? 'UPDATE_REQUIRED' : 'RECEIVED',
      ckycNo, ckycRefNo: null, ackNo: null, searchKey: null, search: null, candidates: null, rejectReason: null,
      submittedAt: null, registry: null, fetched: null, consentOnFile: false,
      receivedAt: iso(), updatedAt: iso(),
      timeline: [], submissions: [], wire: [], consents: [], notes: [],
      sim: Object.assign({ create: 'APPROVED', update: 'APPROVED' }, opts.sim || {}),
    };
    if (ckycNo) acc.registry = driftedRecord(acc.payload); // already on the registry, with older data
    addTimeline(acc, channelCode, `Account received via Data Fetch API (${payload.eventType}) → ${acc.queue === 'CREATE' ? 'Create Requests' : 'Update Requests (CKYC no. supplied)'}`, 'intake');
    state.accounts.unshift(acc);
    return finish(201, { accepted: true, outcome: 'CREATED', account: pub(acc) }, 'CREATED');
  }

  function pub(acc) { return { id: acc.id, accountNumber: acc.accountNumber, queue: acc.queue, ckycStatus: acc.status, ckycNo: acc.ckycNo, dataVersion: acc.dataVersion }; }

  function statusReadBack(channelCode, accountNumber) {
    const acc = state.accounts.find((a) => a.channel === channelCode && a.accountNumber === accountNumber);
    if (!acc) return { http: 404, body: { found: false } };
    const lastC = acc.consents.find((c) => c.status === 'VERIFIED');
    return {
      http: 200,
      body: {
        found: true, queue: acc.queue, ckycStatus: acc.status, ckycNo: acc.ckycNo, ckycRefNo: acc.ckycRefNo, lastAckNo: acc.ackNo,
        dataVersion: acc.dataVersion, lastSubmittedAt: acc.submittedAt,
        lastDownloadConsent: lastC ? { consentType: lastC.mode, status: lastC.status, purpose: lastC.purpose, verifiedAt: lastC.at } : null,
      },
    };
  }

  // The registry's copy of a customer who was KYC'd elsewhere earlier: same
  // person, some stale details.
  function driftedRecord(p) {
    const r = partyOf(p);
    if (r.customerType === 'INDIVIDUAL') {
      r.individual.contact.mobile.number = '98' + String(r.individual.contact.mobile.number || '00000000').slice(2, 6) + '1177';
      r.individual.contact.email.address = '';
      r.individual.addressAsPerOvd.line1 = 'Flat 12, ' + pick(['Shanti Apartments', 'Green Park Society', 'Sai Residency']);
      r.individual.addressAsPerOvd.line2 = '';
      r.attestation.kycVerification.mode = 'FACE_TO_FACE_WITH_OFFICIAL';
    } else {
      r.legal.contact.primary.email.address = 'accounts@old-domain.example';
      r.legal.registeredAddress.line1 = 'Plot 7, Industrial Estate';
      r.legal.relatedParties = (r.legal.relatedParties || []).slice(0, 1);
    }
    return r;
  }

  // ---------- simulated gateway + registry ----------
  const GW = { v3: 'https://gateway.example/v3/micgw-ckyc', v4: 'https://gateway.example/v4/micgw-ckyc' };
  function wire(acc, user, endpoint, ckycInq, response, http = 200) {
    const reqId = uuid();
    const latency = sleepish();
    const entry = {
      at: iso(), user, endpoint, http, latency,
      request: { reId: RE_ID, requestId: reqId, timestamp: iso(), ckycInq },
      response,
    };
    acc.wire.unshift(entry);
    state.stats.calls.push({ at: entry.at, endpoint: endpoint.split('/').slice(-1)[0], user, http });
    if (state.stats.calls.length > 1000) state.stats.calls = state.stats.calls.slice(-1000);
    return entry;
  }
  function gatewayDown(acc, user, endpoint, ckycInq) {
    if (!state.settings.gatewayDown) return false;
    wire(acc, user, endpoint, ckycInq, { errorCode: '503', errorMessage: 'Service Unavailable — backend not reachable' }, 503);
    addTimeline(acc, user, `Registry call failed (${endpoint.split('/').pop()}): gateway 503 Service Unavailable — status unchanged`, 'error');
    save();
    return true;
  }
  class HubError extends Error {}
  const fail = (m) => { throw new HubError(m); };

  function searchPayload(acc) {
    const p = acc.payload;
    if (p.customerType === 'LEGAL') {
      const l = p.legal;
      return { ckycType: 'LEGAL_ENTITY', searchOption: 'OVD', payload: [{ ovdType: l.identityProof.type, ovdNo: l.identityProof.number }, { ovdType: 'PAN', ovdNo: l.pan.number }] };
    }
    const i = p.individual;
    const ovds = (i.identityProofs || []).map((x) => ({ ovdType: x.ovdType, ovdNo: x.ovdNo, ...(x.ovdType === 'E' ? { fullName: i.name.firstName + i.name.lastName, dob: i.dob, gender: i.gender } : {}) }));
    if (ovds.length) return { ckycType: 'INDIVIDUAL', searchOption: 'OVD', payload: ovds };
    return { ckycType: 'INDIVIDUAL', searchOption: 'DEMOGRAPHIC', payload: [{ fullName: displayName(p), dob: i.dob, gender: i.gender }] };
  }

  function actSearch(acc, user) {
    if (acc.queue !== 'CREATE' || !['RECEIVED', 'SEARCHED', 'REJECTED'].includes(acc.status)) fail('Search is available for new Create Requests only');
    const inq = searchPayload(acc);
    if (gatewayDown(acc, user, GW.v3 + '/search', inq)) return;
    const searchKey = 'SK' + digits(16);
    const results = [];
    if (acc.sim.create === 'CONFIRMED_MATCH') {
      acc.sim.refNo = acc.sim.refNo || 'R' + digits(13);
      const s = summary(acc);
      results.push({ ckycRefNo: acc.sim.refNo, name: maskName(s.name), dob: 'XX-XX-' + String(getPath(acc.payload, 'individual.dob') || getPath(acc.payload, 'legal.entity.dateOfRegistration') || '').slice(-4), matchedOn: acc.customerType === 'LEGAL' ? 'PAN' : 'PAN + Aadhaar (last 4)', pan: maskPan(s.pan) });
    }
    wire(acc, user, GW.v3 + '/search', inq, { success: true, data: { searchKey, validTill: ddmmyyyy(now() + 15 * 864e5), results } });
    acc.searchKey = searchKey;
    acc.search = { at: iso(), option: inq.searchOption, results };
    acc.status = 'SEARCHED';
    addTimeline(acc, user, `De-duplication search (${inq.searchOption}) — ${results.length ? results.length + ' existing record found' : 'no existing record'}; searchKey held`, results.length ? 'warn' : 'ok');
    save();
  }

  function createPayload(acc) {
    const p = acc.payload;
    const out = { searchKey: acc.searchKey };
    if (p.customerType === 'INDIVIDUAL') {
      const i = p.individual;
      Object.assign(out, {
        personalDetails: { name: i.name, familyDetails: { father: i.fatherName, mother: i.motherName }, dob: i.dob, gender: i.gender, panDetails: { number: i.pan && i.pan.number, document: '<PAN_CARD redacted>' }, residentialStatus: i.residentialStatus, nationality: i.nationality },
        identityProofs: (i.identityProofs || []).map((x) => ({ ...x, documents: ['<OVD redacted>'] })),
        addressDetails: { addressAsPerOvd: i.addressAsPerOvd, currentAddress: i.currentAddress },
        contactDetails: { mobile: i.contact.mobile, email: i.contact.email },
        attestationDetails: p.attestation,
        photo: '<PHOTO redacted>',
      });
    } else {
      const l = p.legal;
      Object.assign(out, {
        entityDetails: { ...l.entity, panDetails: { number: l.pan.number }, taxIdentification: l.taxIdentification },
        identityProof: { ...l.identityProof, documents: ['<IDENTITY_PROOF redacted>'] },
        addressDetails: { registeredAddress: l.registeredAddress, principalAddress: l.principalAddress },
        contactDetails: l.contact, relatedParties: l.relatedParties, attestationDetails: p.attestation,
      });
    }
    return out;
  }

  function actCreate(acc, user) {
    if (acc.status !== 'SEARCHED') fail('Run the de-duplication search first');
    const r = readiness(acc.payload);
    if (!r.ready) fail('Data is not CKYC-ready: ' + r.block.join('; '));
    const inq = { ckycType: acc.customerType === 'LEGAL' ? 'LEGAL_ENTITY' : 'INDIVIDUAL', payload: createPayload(acc) };
    if (gatewayDown(acc, user, GW.v3 + '/create', inq)) return;
    const ackNo = 'ACK' + digits(12);
    wire(acc, user, GW.v3 + '/create', inq, { success: true, data: { ackNo, status: 'PENDING' } });
    acc.ackNo = ackNo; acc.status = 'CREATE_PENDING'; acc.submittedAt = iso();
    acc.submissions.unshift({ at: iso(), kind: 'CREATE', ackNo, status: 'PENDING', user, tags: null, result: '' });
    addTimeline(acc, user, `CKYC create submitted — ackNo ${ackNo}`, 'info');
    save();
  }

  function actPollCreate(acc, user, force) {
    if (acc.status !== 'CREATE_PENDING') fail('Nothing awaiting the registry');
    const inq = { ckycType: acc.customerType === 'LEGAL' ? 'LEGAL_ENTITY' : 'INDIVIDUAL', payload: { ackNo: acc.ackNo } };
    if (gatewayDown(acc, user, GW.v3 + '/createStatus', inq)) return 'ERROR';
    const sub = acc.submissions.find((s) => s.ackNo === acc.ackNo);
    if (!force && now() - Date.parse(acc.submittedAt) < POLL_DELAY_MS) {
      wire(acc, user, GW.v3 + '/createStatus', inq, { success: true, data: { ackNo: acc.ackNo, status: 'PENDING' } });
      addTimeline(acc, user, 'Status checked — registry still processing (PENDING)');
      save();
      return 'PENDING';
    }
    const sc = acc.sim.create;
    if (sc === 'APPROVED') {
      const ckycNo = digits(14);
      wire(acc, user, GW.v3 + '/createStatus', inq, { success: true, data: { ackNo: acc.ackNo, status: 'APPROVED', ckycNo } });
      acc.ckycNo = ckycNo; acc.status = 'CKYC_CREATED'; acc.registry = partyOf(acc.payload); acc.consentOnFile = true;
      if (sub) { sub.status = 'APPROVED'; sub.result = 'CKYC no. ' + ckycNo; }
      addTimeline(acc, user, `Registry APPROVED — CKYC number ${ckycNo} issued`, 'ok');
    } else if (sc === 'PROBABLE_MATCH') {
      const s = summary(acc);
      const parts = s.name.split(' ');
      acc.candidates = [
        { ckycRefNo: 'R' + digits(13), name: maskName(parts[0] + ' ' + (parts[parts.length - 1] || '')), criteria: 'Name + DOB + father\'s name', score: 87, decision: null },
        { ckycRefNo: 'R' + digits(13), name: maskName(parts[0] + 'a ' + (parts[parts.length - 1] || '')), criteria: 'Name + mobile', score: 64, decision: null },
      ];
      wire(acc, user, GW.v3 + '/createStatus', inq, { success: true, data: { ackNo: acc.ackNo, status: 'PROBABLE_MATCH', probableMatches: acc.candidates.map(({ decision, ...c }) => c) } });
      acc.status = 'PROBABLE_MATCH';
      if (sub) { sub.status = 'PROBABLE_MATCH'; sub.result = acc.candidates.length + ' candidates'; }
      addTimeline(acc, user, `Registry returned PROBABLE_MATCH with ${acc.candidates.length} candidates — adjudication needed`, 'warn');
    } else if (sc === 'CONFIRMED_MATCH') {
      acc.sim.refNo = acc.sim.refNo || 'R' + digits(13);
      wire(acc, user, GW.v3 + '/createStatus', inq, { success: true, data: { ackNo: acc.ackNo, status: 'CONFIRMED_MATCH', ckycRefNo: acc.sim.refNo } });
      acc.ckycRefNo = acc.sim.refNo; acc.status = 'CONFIRMED_MATCH';
      if (sub) { sub.status = 'CONFIRMED_MATCH'; sub.result = 'ckycRefNo ' + acc.ckycRefNo; }
      addTimeline(acc, user, `Registry CONFIRMED_MATCH — customer already on the registry (ref ${acc.ckycRefNo}); no duplicate created`, 'warn');
    } else {
      const reason = acc.sim.reason || 'Photograph not legible / does not match OVD';
      wire(acc, user, GW.v3 + '/createStatus', inq, { success: true, data: { ackNo: acc.ackNo, status: 'REJECTED', remarks: reason } });
      acc.status = 'REJECTED'; acc.rejectReason = reason;
      if (sub) { sub.status = 'REJECTED'; sub.result = reason; }
      addTimeline(acc, user, `Registry REJECTED the create: ${reason}`, 'error');
    }
    save();
    return acc.status;
  }

  function actAdjudicate(acc, user, decisions) {
    if (acc.status !== 'PROBABLE_MATCH') fail('No candidates to adjudicate');
    acc.candidates.forEach((c, k) => { c.decision = decisions[k]; });
    if (acc.candidates.some((c) => !c.decision)) fail('Mark every candidate MATCH or NO_MATCH');
    const inq = { ckycType: 'INDIVIDUAL', payload: { ackNo: acc.ackNo, matchActions: acc.candidates.map((c) => ({ action: c.decision === 'MATCH' ? 'MATCH' : 'NOMATCH', ckycRefNo: c.ckycRefNo })) } };
    if (gatewayDown(acc, user, GW.v3 + '/createAction', inq)) return;
    wire(acc, user, GW.v3 + '/createAction', inq, { success: true, data: { ackNo: acc.ackNo, message: 'Action recorded' } });
    const m = acc.candidates.find((c) => c.decision === 'MATCH');
    if (m) {
      acc.sim.create = 'CONFIRMED_MATCH'; acc.sim.refNo = m.ckycRefNo;
      addTimeline(acc, user, `Adjudicated: ${m.ckycRefNo} marked MATCH — awaiting registry confirmation`, 'info');
    } else {
      acc.sim.create = 'APPROVED';
      addTimeline(acc, user, 'Adjudicated: all candidates NO_MATCH — registry will create a new record', 'info');
    }
    acc.status = 'CREATE_PENDING'; acc.submittedAt = iso();
    save();
  }

  function actLink(acc, user, ckycNo) {
    if (!/^\d{14}$/.test(ckycNo || '')) fail('CKYC number must be 14 digits');
    acc.ckycNo = ckycNo; acc.queue = 'UPDATE'; acc.status = 'UPDATE_REQUIRED';
    acc.registry = acc.registry || driftedRecord(acc.payload);
    addTimeline(acc, user, `CKYC number ${ckycNo} linked manually → moved to Update Requests`, 'ok');
    save();
  }

  // Download chain with consent.  purpose: OBTAIN_CKYC | FETCH_FOR_UPDATE
  function downloadInitiate(acc, user) {
    const id = acc.ckycNo ? { ckycNo: acc.ckycNo } : { ckycRefNo: acc.ckycRefNo || (acc.search && acc.search.results[0] && acc.search.results[0].ckycRefNo) };
    if (!id.ckycNo && !id.ckycRefNo) fail('No CKYC number or reference to download');
    const inq = { ckycType: acc.customerType === 'LEGAL' ? 'LEGAL_ENTITY' : 'INDIVIDUAL', payload: id };
    if (gatewayDown(acc, user, GW.v4 + '/download/initiate', inq)) fail('Gateway unavailable — try again later');
    const consentCheck = !acc.consentOnFile;
    wire(acc, user, GW.v4 + '/download/initiate', inq, { success: true, data: { transactionId: 'TXN' + digits(10), consentCheck } });
    save();
    return { consentCheck, id };
  }

  function consentStart(acc, user, mode, purpose, extra = {}) {
    const c = { id: uuid(), at: iso(), mode, purpose, status: 'INITIATED', user, authFactor: extra.authFactor || (mode === 'OTP' ? 'MOBILE ******' + String(summary(acc).mobile).slice(-4) : ''), evidence: null };
    const inq = { consentType: mode, payload: mode === 'OTP' ? { authFactor: 'MOBILE' } : { authFactorType: extra.factorType, authFactor: '<masked>' } };
    wire(acc, user, GW.v4 + '/download/validate', inq, { success: true, data: { message: mode === 'OTP' ? 'OTP sent to registered mobile' : 'Auth factor verified', otpRef: mode === 'OTP' ? digits(6) : undefined } });
    acc.consents.unshift(c);
    save();
    return c;
  }

  function factorOk(acc, factorType, value) {
    const p = acc.payload;
    const v = String(value || '').trim().toLowerCase();
    if (factorType === 'DOB') return v === String(getPath(p, 'individual.dob') || '').toLowerCase();
    if (factorType === 'DOI') return v === String(getPath(p, 'legal.entity.dateOfRegistration') || '').toLowerCase();
    if (factorType === 'RELATION') return v === String(getPath(p, 'individual.fatherName.firstName') || '').toLowerCase() || v === String(getPath(p, 'individual.motherName.firstName') || '').toLowerCase();
    if (factorType === 'YOB_PIN') { const y = String(getPath(p, 'individual.dob') || '').slice(-4); const pin = getPath(p, 'individual.addressAsPerOvd.pincode'); return v.replace(/\s/g, '') === (y + '+' + pin) || v.replace(/\s/g, '') === y + pin; }
    return false;
  }

  function consentComplete(acc, user, consentId, proof) {
    const c = acc.consents.find((x) => x.id === consentId);
    if (!c) fail('Consent attempt not found');
    let endpoint; let ok;
    if (c.mode === 'OTP') { endpoint = '/download/validate-otp'; ok = proof.otp === '123456'; }
    else if (c.mode === 'PHYSICAL') { endpoint = '/download/upload-consent'; ok = !!proof.document; }
    else { endpoint = '/download/face-auth'; ok = !!proof.photo; }
    const inq = { consentType: c.mode, payload: c.mode === 'OTP' ? { otp: '******' } : c.mode === 'PHYSICAL' ? { b64Doc: '<consent form redacted>' } : { b64Photo: '<face capture redacted>' } };
    if (!ok) {
      wire(acc, user, GW.v4 + endpoint, inq, { success: false, error: { code: 'CNS-401', message: c.mode === 'OTP' ? 'Invalid OTP' : 'Evidence missing' } }, 200);
      c.status = 'FAILED';
      addTimeline(acc, user, `Download consent (${c.mode}) FAILED — ${c.mode === 'OTP' ? 'wrong OTP' : 'no evidence'}`, 'error');
      save();
      fail(c.mode === 'OTP' ? 'Wrong OTP — in this demo the OTP is 123456' : 'Evidence required');
    }
    if (proof.evidenceName) {
      c.evidence = proof.evidenceName;
      acc.payload.documents.push({ slot: c.mode === 'PHYSICAL' ? 'CONSENT_FORM' : 'FACE_CAPTURE', fileName: proof.evidenceName, contentType: 'jpeg', b64Content: 'demo', hubAdded: true, preview: proof.preview || null });
    }
    c.status = 'VERIFIED'; c.verifiedAt = iso();
    const record = recordFor(acc);
    wire(acc, user, GW.v4 + endpoint, inq, { success: true, data: { ckycNo: record.ckycNo, kycRecord: '<decoded record stored on account>' } });
    acc.consentOnFile = true;
    addTimeline(acc, user, `Customer consent VERIFIED (${c.mode}) for ${c.purpose === 'OBTAIN_CKYC' ? 'obtaining CKYC number' : 'fetch for update'}`, 'ok');
    finishDownload(acc, user, record, c.purpose);
    return record;
  }

  function consentFail(acc, user, consentId, reason) {
    const c = acc.consents.find((x) => x.id === consentId);
    if (c) c.status = 'FAILED';
    addTimeline(acc, user, `Download consent (${c ? c.mode : '?'}) FAILED — ${reason}`, 'error');
    save();
  }

  function recordFor(acc) {
    if (!acc.registry) acc.registry = driftedRecord(acc.payload);
    if (!acc.ckycNo && !acc.sim.issuedNo) acc.sim.issuedNo = digits(14);
    return { ckycNo: acc.ckycNo || acc.sim.issuedNo, record: clone(acc.registry) };
  }

  function finishDownload(acc, user, rec, purpose) {
    acc.fetched = { at: iso(), record: rec.record };
    if (purpose === 'OBTAIN_CKYC') {
      acc.ckycNo = rec.ckycNo; acc.queue = 'UPDATE'; acc.status = 'UPDATE_REQUIRED';
      addTimeline(acc, user, `Registry record downloaded — CKYC number ${rec.ckycNo} obtained → moved to Update Requests`, 'ok');
    } else {
      addTimeline(acc, user, 'Current registry record fetched for comparison', 'ok');
    }
    save();
  }

  // Consent already on file: initiate returns consentCheck=false, straight to the record.
  function downloadOnFile(acc, user, purpose) {
    const rec = recordFor(acc);
    wire(acc, user, GW.v4 + '/download/validate', { consentType: 'ON_FILE', payload: {} }, { success: true, data: { ckycNo: rec.ckycNo, kycRecord: '<decoded record stored on account>' } });
    acc.consents.unshift({ id: uuid(), at: iso(), mode: 'ON_FILE', purpose, status: 'VERIFIED', user, authFactor: '', verifiedAt: iso() });
    finishDownload(acc, user, rec, purpose);
  }

  function compare(acc) {
    const tags = TAGS[acc.customerType];
    const reg = acc.fetched && acc.fetched.record;
    return tags.map((t) => {
      let ours; let theirs; let state;
      if (t.src.startsWith('documents.')) { const slot = t.src.split('.')[1]; ours = (acc.payload.documents || []).filter((d) => d.slot === slot).map((d) => d.fileName).join(', '); }
      else ours = getPath(acc.payload, t.src);
      if (!t.cmp) { theirs = null; state = 'NOT_RETURNED'; }
      else if (!reg) { theirs = null; state = 'NOT_FETCHED'; }
      else {
        theirs = getPath(reg, t.src);
        const a = fmtVal(ours); const b = fmtVal(theirs);
        if (!b && a) state = 'NOT_IN_REGISTRY';
        else state = a === b ? 'SAME' : 'DIFFERENT';
      }
      return { ...t, ours, theirs, state };
    });
  }

  function actUpdate(acc, user, tagKeys) {
    if (acc.status !== 'UPDATE_REQUIRED' && !(acc.status === 'REJECTED' && acc.queue === 'UPDATE')) fail('Account is not awaiting an update');
    if (!tagKeys.length) fail('Select at least one tag');
    const rows = compare(acc).filter((r) => tagKeys.includes(r.tag));
    const partial = { ckycNo: acc.ckycNo };
    rows.forEach((r) => setPath(partial, r.tag, r.cmp ? r.ours : `<${r.label} redacted>`));
    const inq = { ckycType: acc.customerType === 'LEGAL' ? 'LEGAL_ENTITY' : 'INDIVIDUAL', payload: partial };
    if (gatewayDown(acc, user, GW.v3 + '/update', inq)) return;
    const ackNo = 'UAK' + digits(12);
    wire(acc, user, GW.v3 + '/update', inq, { success: true, data: { ackNo, status: 'Pending' } });
    acc.ackNo = ackNo; acc.status = 'UPDATE_PENDING'; acc.submittedAt = iso();
    acc.pendingTags = rows.map((r) => ({ src: r.src, value: clone(r.ours === undefined ? null : r.ours), cmp: r.cmp }));
    acc.submissions.unshift({ at: iso(), kind: 'UPDATE', ackNo, status: 'PENDING', user, tags: rows.map((r) => r.tag), result: '' });
    addTimeline(acc, user, `CKYC update submitted with ${rows.length} tag(s) — ackNo ${ackNo}`, 'info');
    save();
  }

  function actPollUpdate(acc, user, force) {
    if (acc.status !== 'UPDATE_PENDING') fail('No update awaiting the registry');
    const inq = { ckycType: acc.customerType === 'LEGAL' ? 'LEGAL_ENTITY' : 'INDIVIDUAL', payload: { ackNo: acc.ackNo, ckycNo: acc.ckycNo } };
    if (gatewayDown(acc, user, GW.v3 + '/updateStatus', inq)) return 'ERROR';
    const sub = acc.submissions.find((s) => s.ackNo === acc.ackNo);
    if (!force && now() - Date.parse(acc.submittedAt) < POLL_DELAY_MS) {
      wire(acc, user, GW.v3 + '/updateStatus', inq, { success: true, data: { ackNo: acc.ackNo, status: 'Pending' } });
      addTimeline(acc, user, 'Status checked — registry still processing (Pending)');
      save();
      return 'PENDING';
    }
    if (acc.sim.update === 'REJECTED') {
      const reason = acc.sim.updateReason || 'Address proof document not attached for changed address';
      wire(acc, user, GW.v3 + '/updateStatus', inq, { success: true, data: { ackNo: acc.ackNo, status: 'Rejected', remarks: reason } });
      acc.status = 'REJECTED'; acc.rejectReason = reason; acc.sim.update = 'APPROVED';
      if (sub) { sub.status = 'REJECTED'; sub.result = reason; }
      addTimeline(acc, user, `Registry REJECTED the update: ${reason}`, 'error');
    } else {
      wire(acc, user, GW.v3 + '/updateStatus', inq, { success: true, data: { ackNo: acc.ackNo, status: 'Approved', ckycNo: acc.ckycNo } });
      (acc.pendingTags || []).forEach((t) => { if (t.cmp) setPath(acc.registry, t.src, t.value); });
      if (acc.fetched) (acc.pendingTags || []).forEach((t) => { if (t.cmp) setPath(acc.fetched.record, t.src, t.value); });
      acc.status = 'CKYC_UPDATED';
      if (sub) { sub.status = 'APPROVED'; sub.result = 'Registry record updated'; }
      addTimeline(acc, user, 'Registry APPROVED the update — CKYC record now matches bank data', 'ok');
    }
    save();
    return acc.status;
  }

  // "Channel re-sends" helpers used by the console to drive the story.
  function simulateResend(acc, kind) {
    const p = clone(acc.payload);
    p.eventId = uuid(); p.occurredAt = iso();
    p.documents = p.documents.filter((d) => !d.hubAdded);
    if (kind === 'COMPLETE') {
      p.eventType = 'CUSTOMER_UPDATED';
      if (!p.documents.some((d) => d.slot === 'PHOTO') && p.customerType === 'INDIVIDUAL') p.documents.unshift({ slot: 'PHOTO', fileName: 'photo.jpg', contentType: 'jpeg', b64Content: 'demo' });
      if (p.individual && !p.individual.contact.mobile.number) p.individual.contact.mobile.number = '9' + digits(9);
    } else if (kind === 'CORRECTED') {
      p.eventType = 'CUSTOMER_UPDATED';
      p.documents = p.documents.map((d) => (d.slot === 'PHOTO' ? { ...d, fileName: 'photo_rescanned.jpg' } : d));
    } else {
      p.eventType = 'CUSTOMER_UPDATED';
      p.ckyc.ckycNo = acc.ckycNo;
      if (p.individual) {
        p.individual.contact.mobile.number = '9' + digits(9);
        p.individual.addressAsPerOvd.line1 = `${1 + Math.floor(Math.random() * 300)} ${pick(STREETS)}`;
      } else {
        p.legal.contact.primary.mobile.number = '9' + digits(9);
      }
    }
    return intake(acc.channel, p, { fixScenario: kind === 'CORRECTED' });
  }

  function addNote(acc, user, text) { addTimeline(acc, user, 'Note: ' + text, 'note'); save(); }

  // ---------- seed ----------
  function seed() {
    const realState = state;
    state = {
      v: 2, seq: 0, createdAt: iso(),
      channels: CHANNELS.map((c, k) => ({ ...c, enabled: true, keyPrefix: 'ck_' + c.code.toLowerCase() + '_' + ['7f3a', '19c2', 'b84e', '0d51', 'e6a9'][k], keyRotatedAt: iso() })),
      users: clone(DEFAULT_USERS),
      accounts: [], intake: [], stats: { calls: [] },
      settings: { gatewayDown: false },
    };
    const S = 'kyc.maker';
    const H = 3600e3;
    const at = (hoursAgo, fn) => { clockOffset = hoursAgo * H; try { fn(); } finally { clockOffset = 0; } };
    const add = (hoursAgo, ch, payload, sim) => { let acc; at(hoursAgo, () => { intake(ch, payload, { sim }); acc = state.accounts[0]; }); return acc; };
    const ind = (o) => individualPayload(Object.assign({ addr: '12 MG Road', email: `${o.first}.${o.last}@example.com`.toLowerCase() }, o));

    // Create queue stories
    add(70, 'TAB_SB', ind({ channel: 'TAB_SB', branch: '0123', first: 'Rohan', last: 'Bose', gender: 'M', father: 'Kavya', mother: 'Mitali', dob: '24-10-1975', pan: 'TZRPB8410Y', aadhaar4: '3185', mobile: '9443463180', addr: '123 MG Road', addr2: 'Apt 4B', accountNumber: '110123456601', cif: 'CIF1208954' }));

    const priya = add(66, 'CPH_SB', ind({ channel: 'CPH_SB', branch: '0123', first: 'Priya', last: 'Nair', gender: 'F', father: 'Suresh', mother: 'Latha', dob: '02-03-1990', pan: 'BQNPN2231K', aadhaar4: '7702', mobile: '9820012345', addr: '7 Juhu Tara Road', accountNumber: '110123456602', cif: 'CIF1208961' }));
    at(65, () => actSearch(priya, S));

    const arjun = add(60, 'VCIP', ind({ channel: 'VCIP', branch: '0456', first: 'Arjun', last: 'Mehta', gender: 'M', father: 'Ramesh', mother: 'Usha', dob: '15-07-1988', pan: 'AMZPM5521L', aadhaar4: '4410', mobile: '9840098400', addr: '45 Usman Road', accountNumber: '110456789001', cif: 'CIF2209110' }));
    at(59, () => { actSearch(arjun, S); actCreate(arjun, S); });

    const sneha = add(55, 'TAB_SB', ind({ channel: 'TAB_SB', branch: '0789', first: 'Sneha', last: 'Iyer', gender: 'F', father: 'Venkat', mother: 'Kamala', dob: '30-11-1993', pan: 'CXIPI7781P', aadhaar4: '9921', mobile: '9900112233', addr: '18 4th Block', accountNumber: '110789000301', cif: 'CIF3301122' }), { create: 'PROBABLE_MATCH' });
    at(54, () => { actSearch(sneha, S); actCreate(sneha, S); });
    at(50, () => actPollCreate(sneha, S, true));

    const vikram = add(48, 'DMS_CA', ind({ channel: 'DMS_CA', branch: '0123', first: 'Vikram', last: 'Rao', gender: 'M', father: 'Mohan', mother: 'Sarala', dob: '09-01-1979', pan: 'DKRPR4402Q', aadhaar4: '6618', mobile: '9769001122', addr: '3 Lokhandwala Complex', accountNumber: '110123456603', cif: 'CIF1208999' }), { create: 'CONFIRMED_MATCH' });
    at(47, () => { actSearch(vikram, S); vikram.status = 'SEARCHED'; actCreate(vikram, S); });
    at(44, () => actPollCreate(vikram, S, true));

    const ananya = add(46, 'CPH_SB', ind({ channel: 'CPH_SB', branch: '0456', first: 'Ananya', last: 'Das', gender: 'F', father: 'Biswajit', mother: 'Rina', dob: '21-05-1996', pan: 'EADPD1190M', aadhaar4: '3307', mobile: '9884412299', addr: '22 Pondy Bazaar', accountNumber: '110456789002', cif: 'CIF2209133' }));
    at(45, () => { actSearch(ananya, S); actCreate(ananya, S); });
    at(40, () => actPollCreate(ananya, S, true));

    const karan = add(42, 'TAB_CA', ind({ channel: 'TAB_CA', branch: '0234', first: 'Karan', last: 'Malhotra', gender: 'M', father: 'Raj', mother: 'Simran', dob: '11-12-1985', pan: 'FKMPM6634D', aadhaar4: '5150', mobile: '9811098110', addr: '9 Pusa Road', accountNumber: '110234500101', cif: 'CIF4400871' }), { create: 'REJECTED' });
    at(41, () => { actSearch(karan, S); actCreate(karan, S); });
    at(38, () => actPollCreate(karan, S, true));

    add(30, 'VCIP', ind({ channel: 'VCIP', branch: '0123', first: 'Meera', last: 'Pillai', gender: 'F', father: 'Gopal', mother: 'Radha', dob: '05-08-1998', pan: 'GMPPP3345H', aadhaar4: '8812', mobile: '', noMobile: true, photo: false, addr: '14 Versova Link Road', accountNumber: '110123456604', cif: 'CIF1209012' }));

    add(28, 'DMS_CA', legalPayload({ branch: '0789', name: 'Sunrise Agro Foods Private Limited', constitution: 'C', doi: '14-02-2012', pan: 'AAECS4471K', gstin: '29AAECS4471K1Z5', idType: 'CIN', idNo: 'U15400KA2012PTC062211', addr: '41 2nd Cross, Jayanagar', mobile: '9845011223', email: 'accounts@sunriseagro.example', accountNumber: '110789000302', cif: 'CIF3301190', parties: [{ name: 'Harsha Gowda', din: '05521190', ownership: 60, role: 'DIRECTOR' }, { name: 'Leela Gowda', din: '05521191', ownership: 40, role: 'DIRECTOR' }] }));

    add(20, 'TAB_SB', ind({ channel: 'TAB_SB', branch: '0456', first: 'Suresh', last: 'Menon', gender: 'M', father: 'Krishnan', mother: 'Devi', dob: '17-04-1970', pan: 'HSMPM9910B', aadhaar4: '2246', mobile: '9444012345', addr: '6 Thyagaraya Road', accountNumber: '110456789003', cif: 'CIF2209177' }), { create: 'CONFIRMED_MATCH' });

    add(16, 'CPH_SB', ind({ channel: 'CPH_SB', branch: '0234', first: 'Lakshmi', last: 'Krishnan', gender: 'F', father: 'Raman', mother: 'Janaki', dob: '28-09-1982', pan: 'JLKPK2207S', aadhaar4: '9034', mobile: '9810234567', addr: '31 Arya Samaj Road', accountNumber: '110234500102', cif: 'CIF4400890' }), { create: 'PROBABLE_MATCH' });

    const blue = add(64, 'DMS_CA', legalPayload({ branch: '0456', name: 'Bluewave Logistics LLP', constitution: 'L', doi: '03-06-2018', pan: 'AAKFB2210R', gstin: '33AAKFB2210R1Z9', idType: 'LLPIN', idNo: 'AAK-4410', addr: '88 Harbour Road', mobile: '9840155667', email: 'finance@bluewave.example', accountNumber: '110456789004', cif: 'CIF2209190', parties: [{ name: 'Joseph Mathew', din: '07710032', ownership: 50, role: 'PARTNER' }, { name: 'Ayesha Khan', din: '07710033', ownership: 50, role: 'PARTNER' }] }));
    at(63, () => { actSearch(blue, S); actCreate(blue, S); });
    at(60, () => actPollCreate(blue, S, true));

    // Update queue stories
    add(26, 'TAB_SB', ind({ channel: 'TAB_SB', branch: '0123', first: 'Deepak', last: 'Verma', gender: 'M', father: 'Om Prakash', mother: 'Kusum', dob: '19-02-1981', pan: 'KDVPV3381N', aadhaar4: '6612', mobile: '9930099300', addr: '501 Sea Breeze, Andheri West', accountNumber: '110123456605', cif: 'CIF1209044', ckycNo: '50012345678901' }));

    add(22, 'CPH_SB', ind({ channel: 'CPH_SB', branch: '0789', first: 'Fatima', last: 'Sheikh', gender: 'F', father: 'Abdul', mother: 'Noor', dob: '07-06-1991', pan: 'LFSPS7720C', aadhaar4: '1408', mobile: '9886655443', addr: '27 South End Road', accountNumber: '110789000303', cif: 'CIF3301201', ckycNo: '50098765432109' }), { update: 'REJECTED' });

    const rahul = add(36, 'TAB_CA', ind({ channel: 'TAB_CA', branch: '0456', first: 'Rahul', last: 'Gupta', gender: 'M', father: 'Sunil', mother: 'Asha', dob: '23-03-1987', pan: 'MRGPG4492E', aadhaar4: '5523', mobile: '9791012345', addr: '14 Anna Salai', accountNumber: '110456789005', cif: 'CIF2209201', ckycNo: '50055566677788' }));
    at(35, () => {
      const c = consentStart(rahul, S, 'OTP', 'FETCH_FOR_UPDATE');
      consentComplete(rahul, S, c.id, { otp: '123456' });
      actUpdate(rahul, S, compare(rahul).filter((r) => r.state === 'DIFFERENT' || r.state === 'NOT_IN_REGISTRY').map((r) => r.tag));
    });

    const kavitha = add(52, 'VCIP', ind({ channel: 'VCIP', branch: '0234', first: 'Kavitha', last: 'Reddy', gender: 'F', father: 'Narayana', mother: 'Sujatha', dob: '12-12-1989', pan: 'NKRPR8823F', aadhaar4: '7719', mobile: '9958123456', addr: '72 Rajendra Place', accountNumber: '110234500103', cif: 'CIF4400911', ckycNo: '50011122233344' }));
    at(51, () => {
      const c = consentStart(kavitha, S, 'PHYSICAL', 'FETCH_FOR_UPDATE', { factorType: 'DOB', authFactor: 'DOB XX-XX-1989' });
      consentComplete(kavitha, S, c.id, { document: true, evidenceName: 'ckyc_consent.pdf' });
      actUpdate(kavitha, S, compare(kavitha).filter((r) => r.state === 'DIFFERENT' || r.state === 'NOT_IN_REGISTRY').map((r) => r.tag));
    });
    at(48, () => actPollUpdate(kavitha, S, true));

    // More branch 0123 (Mumbai - Andheri) work for the branch login.
    const A = (o) => ind(Object.assign({ branch: '0123', addr: o.addr || '10 Andheri Kurla Road' }, o));
    const b1 = add(58, 'TAB_SB', A({ channel: 'TAB_SB', first: 'Aditya', last: 'Sharma', gender: 'M', father: 'Vinod', mother: 'Sunita', dob: '14-08-1992', pan: 'PASPS1123A', aadhaar4: '4471', mobile: '9821034567', addr: '204 Chakala Road', accountNumber: '110123456606', cif: 'CIF1209101' }));
    const b2 = add(57, 'CPH_SB', A({ channel: 'CPH_SB', first: 'Pooja', last: 'Patil', gender: 'F', father: 'Dattatray', mother: 'Shobha', dob: '03-02-1995', pan: 'QPPPP2234B', aadhaar4: '5582', mobile: '9867123450', addr: '11 Marol Naka', accountNumber: '110123456607', cif: 'CIF1209102' }));
    at(56, () => actSearch(b2, S));
    const b3 = add(54, 'VCIP', A({ channel: 'VCIP', first: 'Imran', last: 'Qureshi', gender: 'M', father: 'Salim', mother: 'Shabana', dob: '27-11-1986', pan: 'RIQPQ3345C', aadhaar4: '6693', mobile: '9892045671', addr: '7 Saki Naka', accountNumber: '110123456608', cif: 'CIF1209103' }));
    at(53, () => { actSearch(b3, S); actCreate(b3, S); });
    const b4 = add(50, 'TAB_SB', A({ channel: 'TAB_SB', first: 'Neha', last: 'Joshi', gender: 'F', father: 'Prakash', mother: 'Medha', dob: '19-06-1994', pan: 'SNJPJ4456D', aadhaar4: '7704', mobile: '9819056782', addr: '33 JB Nagar', accountNumber: '110123456609', cif: 'CIF1209104' }), { create: 'PROBABLE_MATCH' });
    at(49, () => { actSearch(b4, S); actCreate(b4, S); });
    at(47, () => actPollCreate(b4, S, true));
    const b5 = add(62, 'DMS_CA', A({ channel: 'DMS_CA', first: 'Sanjay', last: 'Desai', gender: 'M', father: 'Mahesh', mother: 'Nirmala', dob: '08-09-1978', pan: 'TSDPD5567E', aadhaar4: '8815', mobile: '9820167893', addr: '5 Sher-e-Punjab Colony', accountNumber: '110123456610', cif: 'CIF1209105' }));
    at(61, () => { actSearch(b5, S); actCreate(b5, S); });
    at(58, () => actPollCreate(b5, S, true));
    const b6 = add(45, 'CPH_SB', A({ channel: 'CPH_SB', first: 'Anjali', last: 'Kapoor', gender: 'F', father: 'Rakesh', mother: 'Neelam', dob: '22-04-1990', pan: 'UAKPK6678F', aadhaar4: '9926', mobile: '9833278904', addr: '18 Four Bungalows', accountNumber: '110123456611', cif: 'CIF1209106' }), { create: 'REJECTED', reason: "Father's name does not match the OVD" });
    at(44, () => { actSearch(b6, S); actCreate(b6, S); });
    at(41, () => actPollCreate(b6, S, true));
    const b7 = add(40, 'TAB_CA', A({ channel: 'TAB_CA', first: 'Joseph', last: 'Thomas', gender: 'M', father: 'Mathew', mother: 'Mary', dob: '30-01-1983', pan: 'VJTPT7789G', aadhaar4: '1037', mobile: '9869389015', addr: '2 Gilbert Hill Road', accountNumber: '110123456612', cif: 'CIF1209107' }), { create: 'CONFIRMED_MATCH' });
    at(39, () => { actSearch(b7, S); actCreate(b7, S); });
    at(37, () => actPollCreate(b7, S, true));
    add(34, 'VCIP', A({ channel: 'VCIP', first: 'Ritu', last: 'Saxena', gender: 'F', father: 'Alok', mother: 'Kiran', dob: '12-12-1997', pan: 'WRSPS8890H', aadhaar4: '2148', mobile: '9930490126', photo: false, addr: '41 Seven Bungalows', accountNumber: '110123456613', cif: 'CIF1209108' }));
    add(32, 'TAB_SB', A({ channel: 'TAB_SB', first: 'Harish', last: 'Banerjee', gender: 'M', father: 'Subrata', mother: 'Mitra', dob: '05-05-1980', pan: 'XHBPB9901J', aadhaar4: '3259', mobile: '9821501237', addr: '9 Veera Desai Road', accountNumber: '110123456614', cif: 'CIF1209109', ckycNo: '50033344455566' }));
    const b10 = add(29, 'CPH_SB', A({ channel: 'CPH_SB', first: 'Swati', last: 'Chatterjee', gender: 'F', father: 'Amit', mother: 'Rupa', dob: '16-10-1988', pan: 'YSCPC1012K', aadhaar4: '4360', mobile: '9867612348', addr: '23 Azad Nagar', accountNumber: '110123456615', cif: 'CIF1209110', ckycNo: '50066677788899' }));
    at(28, () => {
      const c = consentStart(b10, S, 'OTP', 'FETCH_FOR_UPDATE');
      consentComplete(b10, S, c.id, { otp: '123456' });
      actUpdate(b10, S, compare(b10).filter((r) => r.state === 'DIFFERENT' || r.state === 'NOT_IN_REGISTRY').map((r) => r.tag));
    });
    const b11 = add(26, 'DMS_CA', A({ channel: 'DMS_CA', first: 'Gautam', last: 'Rao', gender: 'M', father: 'Srinivas', mother: 'Padma', dob: '25-07-1975', pan: 'ZGRPR2123L', aadhaar4: '5471', mobile: '9892723459', addr: '6 Lokhandwala Back Road', accountNumber: '110123456616', cif: 'CIF1209111', ckycNo: '50077788899900' }));
    at(25, () => {
      const c = consentStart(b11, S, 'FACEAUTH', 'FETCH_FOR_UPDATE', { factorType: 'DOB', authFactor: 'DOB XX-XX-1975' });
      consentComplete(b11, S, c.id, { photo: true, evidenceName: 'face_capture.jpg' });
      actUpdate(b11, S, compare(b11).filter((r) => r.state === 'DIFFERENT' || r.state === 'NOT_IN_REGISTRY').map((r) => r.tag));
    });
    at(23, () => actPollUpdate(b11, S, true));
    add(18, 'DMS_CA', legalPayload({ branch: '0123', name: 'Andheri Textiles Private Limited', constitution: 'C', doi: '21-08-2009', pan: 'AABCA3234M', gstin: '27AABCA3234M1Z2', idType: 'CIN', idNo: 'U17100MH2009PTC195512', addr: '14 MIDC Central Road', mobile: '9820834560', email: 'accounts@andheritextiles.example', accountNumber: '110123456617', cif: 'CIF1209112', parties: [{ name: 'Ramesh Agarwal', din: '02231190', ownership: 70, role: 'DIRECTOR' }, { name: 'Kavita Agarwal', din: '02231191', ownership: 30, role: 'DIRECTOR' }] }));
    void b1;

    // A few rejected pushes for the intake statistics.
    at(33, () => intake('TAB_SB', { eventId: uuid(), eventType: 'ACCOUNT_ACTIVATED', account: { accountNumber: '110123999999', branchCode: '0123' }, customerType: 'INDIVIDUAL', individual: { dob: '1990/01/01', identityProofs: [{ ovdType: 'E', ovdNo: '123412341234' }] }, documents: [] }));
    at(12, () => intake('VCIP', { eventId: uuid(), eventType: 'ACCOUNT_ACTIVATED', account: { accountNumber: '110456999998', branchCode: '0456' }, customerType: 'INDIVIDUAL', individual: { pan: { number: 'ABC123' } }, documents: [{ slot: 'SELFIE', b64Content: 'x' }] }));

    state.accounts.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const out = state;
    state = realState;
    return out;
  }

  window.Hub = {
    CHANNELS, BRANCHES, STATUS, OVD_TYPES, KYC_MODES, DOC_SLOTS, TAGS, RE_ID, POLL_DELAY_MS,
    get state() { return state; },
    load, save, reset, uuid, iso, getPath, fmtVal, maskPan, sha256, digits,
    validate, readiness, summary, displayName, visibleAccounts, findAccount, intake, statusReadBack,
    randomIndividual, individualPayload, legalPayload,
    actSearch, actCreate, actPollCreate, actAdjudicate, actLink, downloadInitiate, downloadOnFile, consentStart, consentComplete, consentFail, factorOk,
    compare, actUpdate, actPollUpdate, simulateResend, addNote, HubError,
  };
})();
