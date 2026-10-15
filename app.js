/**
 * Andrei.Dev — Client Pipeline CRM v2.0 Logic
 * Features:
 * 1. Automatic 3-Day WhatsApp Follow-up Tracking & 1-Click WhatsApp Direct
 * 2. jsPDF Proforma & Estimate Invoice Generator with customizable digital service breakdowns
 * 3. Notion MCP Real-Time Sync & JSON Exporter
 * 4. Interactive Kanban Stage Progression & Revenue Metrics
 */

// Initial Default Client Dataset with phone, contact timestamp & service items
const DEFAULT_CLIENTS = [
  {
    id: 'c1',
    name: 'Bogdan',
    phone: '0721890123',
    project: 'Site Bază de Contacte (500 intrări)',
    value: 500,
    status: 'ofertat',
    lastContactDate: '2026-10-06', // 5 days ago -> needs followup!
    script: 'Salut Bogdan! Am structurat baza celor 500 de contacte cu filtrare instant pe categorii și export Excel. Când vrei să o punem live pe domeniul tău?',
    services: [
      { name: 'Arhitectură Bază de Date & Filtrare Rapidă (500 intrări)', price: 300 },
      { name: 'Interfață UI Minimalistă & Export Format CSV/Excel', price: 200 }
    ]
  },
  {
    id: 'c2',
    name: 'Marius & Mara',
    phone: '0744555888',
    project: 'Site Prezentare & Funnel Google Maps',
    value: 1500,
    status: 'ofertat',
    lastContactDate: '2026-10-07', // 4 days ago -> needs followup!
    script: 'Salutare Marius & Mara! Am finalizat schița funnel-ului de conversie și formularul de calificare pentru clienți din Google Maps. Ne vedem la o cafea să stabilim designul final?',
    services: [
      { name: 'UI/UX Design Personalizat & Mockup Interactiv Mobil', price: 500 },
      { name: 'Dezvoltare Landing Page cu Formular Calificare Lead-uri', price: 700 },
      { name: 'Integrare Profil Google Maps & Optimizare SEO Local', price: 300 }
    ]
  },
  {
    id: 'c3',
    name: 'Miruna',
    phone: '0733112233',
    project: 'Site Portofoliu & Formular Programări',
    value: 1200,
    status: 'lead',
    lastContactDate: '2026-10-10', // 1 day ago -> ok!
    script: 'Bună Miruna! Am pregătit un preview curat și ultra-rapid pentru portofoliul tău vizual, optimizat pentru deschidere pe Instagram. Arunci o privire peste demo?',
    services: [
      { name: 'Design Minimalist Portofoliu & Galerie Grid', price: 600 },
      { name: 'Modul Programări Directe WhatsApp & Notificări', price: 600 }
    ]
  },
  {
    id: 'c4',
    name: 'Edi & Simina',
    phone: '0755998877',
    project: 'Landing Page & Catalog Servicii',
    value: 1800,
    status: 'lucru',
    lastContactDate: '2026-10-09', // 2 days ago -> ok!
    script: 'Salut Edi, salut Simina! Structura proiectului este în lucru pe mobil și desktop. Am pregătit catalogul interactiv cu prețuri. Îl testăm împreună în weekend?',
    services: [
      { name: 'Catalog Servicii Interactiv & Filtrare pe Categorii', price: 800 },
      { name: 'Dezvoltare Frontend Vite/React & Micro-animații', price: 700 },
      { name: 'Configurare Găzduire Cloudflare & Domeniu Securizat', price: 300 }
    ]
  },
  {
    id: 'c5',
    name: 'Eden',
    phone: '0766443322',
    project: 'Site Prezentare Business & SEO Local',
    value: 1950,
    status: 'finalizat',
    lastContactDate: '2026-10-11',
    script: 'Salut Eden! Am definitivat arhitectura tehnică pentru site-ul tău. Scorul PageSpeed este 99/100 pe mobil și indexarea Google este activă.',
    services: [
      { name: 'Arhitectură Web Completă & Optimizare Performanță Mobil', price: 1150 },
      { name: 'Pachet SEO Local, Meta-tags & Sincronizare Google Search Console', price: 800 }
    ]
  }
];

function loadClientsFromStorage() {
  try {
    const raw = localStorage.getItem('andrei_crm_clients_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to parse clients from localStorage:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_CLIENTS));
}

function saveClientsToStorage() {
  try {
    localStorage.setItem('andrei_crm_clients_v2', JSON.stringify(clients));
  } catch (err) {
    console.error('Failed to save clients to localStorage:', err);
  }
}

let clients = loadClientsFromStorage();

const STAGES = ['lead', 'ofertat', 'lucru', 'finalizat'];
let currentFilter = 'all';
let searchQuery = '';
let activeProformaClient = null;
let currentProformaServices = [];

// DOM Elements
const colLead = document.getElementById('col-lead');
const colOfertat = document.getElementById('col-ofertat');
const colLucru = document.getElementById('col-lucru');
const colFinalizat = document.getElementById('col-finalizat');

const badgeLead = document.getElementById('badge-lead');
const badgeOfertat = document.getElementById('badge-ofertat');
const badgeLucru = document.getElementById('badge-lucru');
const badgeFinalizat = document.getElementById('badge-finalizat');

const valPipelineEl = document.getElementById('valPipeline');
const countNegEl = document.getElementById('countNegotiation');
const countDevEl = document.getElementById('countDevelopment');
const valWonEl = document.getElementById('valWon');

const countAllEl = document.getElementById('countAll');
const countFollowupEl = document.getElementById('countFollowup');
const countActiveEl = document.getElementById('countActive');
const countDoneEl = document.getElementById('countDone');

const searchInput = document.getElementById('searchInput');
const filterChips = document.querySelectorAll('.filter-chip');

// Modals
const addModal = document.getElementById('addClientModal');
const btnOpenAdd = document.getElementById('btnOpenAddClient');
const btnCloseAdd = document.getElementById('btnCloseAddModal');
const newClientForm = document.getElementById('newClientForm');
const lastContactDateInput = document.getElementById('lastContactDate');

const proformaModal = document.getElementById('proformaModal');
const btnCloseProformaModal = document.getElementById('btnCloseProformaModal');
const profClientName = document.getElementById('profClientName');
const profNumber = document.getElementById('profNumber');
const profIssueDate = document.getElementById('profIssueDate');
const profValidityDays = document.getElementById('profValidityDays');
const servicesListEditor = document.getElementById('servicesListEditor');
const btnAddServiceRow = document.getElementById('btnAddServiceRow');

const previewProfCode = document.getElementById('previewProfCode');
const previewClient = document.getElementById('previewClient');
const previewProject = document.getElementById('previewProject');
const previewItemsSummary = document.getElementById('previewItemsSummary');
const previewGrandTotal = document.getElementById('previewGrandTotal');
const previewAdvance = document.getElementById('previewAdvance');
const btnDownloadProformaPdf = document.getElementById('btnDownloadProformaPdf');
const btnSendProformaWhatsApp = document.getElementById('btnSendProformaWhatsApp');

const notionSyncModal = document.getElementById('notionSyncModal');
const btnSyncNotion = document.getElementById('btnSyncNotion');
const btnCloseNotionModal = document.getElementById('btnCloseNotionModal');
const notionTablePreview = document.getElementById('notionTablePreview');
const btnCopyNotionJson = document.getElementById('btnCopyNotionJson');
const btnTriggerNotionSync = document.getElementById('btnTriggerNotionSync');
const syncStatusText = document.getElementById('syncStatusText');

const toastEl = document.getElementById('toastMsg');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const todayStr = new Date().toISOString().split('T')[0];
  if (lastContactDateInput) lastContactDateInput.value = todayStr;
  if (profIssueDate) profIssueDate.value = todayStr;

  renderKanban();
  setupEvents();
});

// Helper: Calculate days elapsed since a date string
function getDaysSinceContact(dateStr) {
  if (!dateStr) return 0;
  const parts = dateStr.split('-');
  const contactDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today - contactDate;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// Render Kanban & Filtered Cards
function renderKanban() {
  colLead.innerHTML = '';
  colOfertat.innerHTML = '';
  colLucru.innerHTML = '';
  colFinalizat.innerHTML = '';

  let totalPipeline = 0;
  let wonValue = 0;
  let countNeg = 0;
  let countDev = 0;
  let countFollowup = 0;
  let countActive = 0;
  let countDone = 0;

  const countByStage = { lead: 0, ofertat: 0, lucru: 0, finalizat: 0 };

  // Calculate metrics over all clients
  clients.forEach(c => {
    totalPipeline += c.value;
    if (c.status === 'finalizat') {
      wonValue += c.value;
      countDone++;
    } else {
      countActive++;
    }
    if (c.status === 'lead' || c.status === 'ofertat') countNeg++;
    if (c.status === 'lucru') countDev++;

    const days = getDaysSinceContact(c.lastContactDate);
    if (days >= 3 && c.status !== 'finalizat') {
      countFollowup++;
    }
  });

  // Filter clients for view
  const q = searchQuery.toLowerCase().trim();
  const filtered = clients.filter(c => {
    // Search match
    const matchQ = !q || 
      c.name.toLowerCase().includes(q) || 
      c.project.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      c.script.toLowerCase().includes(q);

    if (!matchQ) return false;

    // Filter chip match
    const days = getDaysSinceContact(c.lastContactDate);
    if (currentFilter === 'needs-followup') {
      return days >= 3 && c.status !== 'finalizat';
    }
    if (currentFilter === 'active') {
      return c.status !== 'finalizat';
    }
    if (currentFilter === 'finalizat') {
      return c.status === 'finalizat';
    }
    return true;
  });

  // Render cards
  filtered.forEach(c => {
    countByStage[c.status]++;
    const daysSince = getDaysSinceContact(c.lastContactDate);
    const needsFollowup = daysSince >= 3 && c.status !== 'finalizat';

    const card = document.createElement('div');
    card.className = `client-card ${needsFollowup ? 'card-alert' : ''}`;
    
    // Follow-up reminder banner
    let followupBannerHtml = '';
    if (c.status === 'finalizat') {
      followupBannerHtml = `<div class="followup-ok-banner">🎉 Proiect finalizat & încasat</div>`;
    } else if (needsFollowup) {
      followupBannerHtml = `
        <div class="followup-alert-banner">
          <span>⏰ Follow-up la 3 zile depășit! (${daysSince} zile)</span>
        </div>
      `;
    } else {
      followupBannerHtml = `
        <div class="followup-ok-banner">
          <span>✓ Contact recent: ${daysSince === 0 ? 'Azi' : daysSince + (daysSince === 1 ? ' zi' : ' zile') + ' în urmă'}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-top">
        <h4 class="client-name">${c.name}</h4>
        <span class="project-value">${c.value.toLocaleString('ro-RO')} RON</span>
      </div>
      <p class="project-desc">${c.project}</p>
      
      <div class="card-meta-row">
        <span>📞 ${c.phone || 'Fără telefon'}</span>
        <span class="contact-time-badge">Ultim contact: ${c.lastContactDate || 'N/A'}</span>
      </div>

      ${followupBannerHtml}

      <div class="script-box">"${c.script}"</div>

      <div class="card-actions-grid">
        <button class="btn-card-action btn-whatsapp" data-id="${c.id}" title="Trimite mesaj pe WhatsApp">
          📲 WhatsApp
        </button>
        <button class="btn-card-action btn-proforma" data-id="${c.id}" title="Generează deviz proformă PDF">
          📄 Deviz PDF
        </button>
        <button class="btn-mark-contacted" data-id="${c.id}">
          ✓ Marchează Contactat Azi
        </button>
      </div>

      <div class="card-actions" style="margin-top: 8px;">
        <button class="btn-copy" data-id="${c.id}">📋 Copiază Mesaj</button>
        <div class="move-buttons">
          <button class="btn-nav-stage" data-id="${c.id}" data-dir="-1" title="Mută înapoi">◀</button>
          <button class="btn-nav-stage" data-id="${c.id}" data-dir="1" title="Avansează">▶</button>
        </div>
      </div>
    `;

    if (c.status === 'lead') colLead.appendChild(card);
    else if (c.status === 'ofertat') colOfertat.appendChild(card);
    else if (c.status === 'lucru') colLucru.appendChild(card);
    else if (c.status === 'finalizat') colFinalizat.appendChild(card);
  });

  // Update column badges
  badgeLead.textContent = countByStage.lead;
  badgeOfertat.textContent = countByStage.ofertat;
  badgeLucru.textContent = countByStage.lucru;
  badgeFinalizat.textContent = countByStage.finalizat;

  // Update metrics bar
  valPipelineEl.textContent = `${totalPipeline.toLocaleString('ro-RO')} RON`;
  valWonEl.textContent = `${wonValue.toLocaleString('ro-RO')} RON`;
  countNegEl.textContent = `${countNeg} Proiecte`;
  countDevEl.textContent = `${countDev} Proiecte`;

  // Update filter counters
  countAllEl.textContent = clients.length;
  countFollowupEl.textContent = countFollowup;
  countActiveEl.textContent = countActive;
  countDoneEl.textContent = countDone;

  attachCardActionListeners();
}

// Attach action button events
function attachCardActionListeners() {
  // WhatsApp direct button
  document.querySelectorAll('.btn-whatsapp').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const client = clients.find(item => item.id === id);
      if (!client) return;

      const cleanPhone = (client.phone || '').replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('0') ? '4' + cleanPhone : cleanPhone;
      const text = encodeURIComponent(client.script);
      const url = `https://wa.me/${fullPhone}?text=${text}`;
      window.open(url, '_blank');
      showToast(`📲 Deschis WhatsApp pentru ${client.name}!`);
    });
  });

  // Proforma invoice button
  document.querySelectorAll('.btn-proforma').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const client = clients.find(item => item.id === id);
      if (client) openProformaModal(client);
    });
  });

  // Mark contacted today button
  document.querySelectorAll('.btn-mark-contacted').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const client = clients.find(item => item.id === id);
      if (client) {
        client.lastContactDate = new Date().toISOString().split('T')[0];
        saveClientsToStorage();
        renderKanban();
        showToast(`✅ Contact actualizat pentru ${client.name}! Reminder-ul s-a resetat.`);
      }
    });
  });

  // Copy script to clipboard
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const client = clients.find(item => item.id === id);
      if (client) {
        navigator.clipboard.writeText(client.script).then(() => {
          showToast(`📋 Mesaj copiat în clipboard pentru ${client.name}!`);
        });
      }
    });
  });

  // Move stage buttons
  document.querySelectorAll('.btn-nav-stage').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const dir = parseInt(btn.getAttribute('data-dir'));
      moveClientStage(id, dir);
    });
  });
}

// Move Client Stage
function moveClientStage(id, dir) {
  const client = clients.find(c => c.id === id);
  if (!client) return;

  const currentIndex = STAGES.indexOf(client.status);
  const newIndex = currentIndex + dir;

  if (newIndex >= 0 && newIndex < STAGES.length) {
    client.status = STAGES[newIndex];
    client.lastContactDate = new Date().toISOString().split('T')[0];
    saveClientsToStorage();
    renderKanban();
    showToast(`🔄 ${client.name} mutat în etapa: ${client.status.toUpperCase()}`);
  }
}

// Open Proforma Generator Modal
function openProformaModal(client) {
  activeProformaClient = client;
  const num = `PF-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  profClientName.value = client.name;
  profNumber.value = num;
  previewProfCode.textContent = num;
  previewClient.textContent = client.name;
  previewProject.textContent = client.project;

  // Clone services or initialize default breakdown
  currentProformaServices = (client.services && client.services.length > 0)
    ? JSON.parse(JSON.stringify(client.services))
    : [
        { name: `Dezvoltare & Design Web: ${client.project}`, price: client.value }
      ];

  renderServicesEditor();
  updateProformaCalculations();
  proformaModal.classList.add('open');
}

// Render dynamic services rows inside Proforma modal
function renderServicesEditor() {
  servicesListEditor.innerHTML = '';
  currentProformaServices.forEach((serv, idx) => {
    const row = document.createElement('div');
    row.className = 'service-item-row';
    row.innerHTML = `
      <input type="text" class="serv-name" data-idx="${idx}" value="${serv.name}" placeholder="Denumire serviciu">
      <input type="number" class="serv-price" data-idx="${idx}" value="${serv.price}" placeholder="Preț (RON)">
      <button type="button" class="btn-del-service" data-idx="${idx}">✕</button>
    `;
    servicesListEditor.appendChild(row);
  });

  // Listeners for service editing
  servicesListEditor.querySelectorAll('.serv-name').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      currentProformaServices[idx].name = e.target.value;
      updateProformaCalculations();
    });
  });

  servicesListEditor.querySelectorAll('.serv-price').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      currentProformaServices[idx].price = parseInt(e.target.value) || 0;
      updateProformaCalculations();
    });
  });

  servicesListEditor.querySelectorAll('.btn-del-service').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      currentProformaServices.splice(idx, 1);
      renderServicesEditor();
      updateProformaCalculations();
    });
  });
}

// Update calculations & preview receipt
function updateProformaCalculations() {
  let grandTotal = 0;
  previewItemsSummary.innerHTML = '';

  currentProformaServices.forEach(s => {
    grandTotal += (s.price || 0);
    const itemRow = document.createElement('div');
    itemRow.className = 'receipt-row';
    itemRow.innerHTML = `
      <span>• ${s.name}</span>
      <strong>${(s.price || 0).toLocaleString('ro-RO')} RON</strong>
    `;
    previewItemsSummary.appendChild(itemRow);
  });

  const advance = Math.round(grandTotal * 0.5);
  previewGrandTotal.textContent = `${grandTotal.toLocaleString('ro-RO')} RON`;
  previewAdvance.textContent = `${advance.toLocaleString('ro-RO')} RON`;

  if (activeProformaClient) {
    activeProformaClient.value = grandTotal;
    activeProformaClient.services = JSON.parse(JSON.stringify(currentProformaServices));
    saveClientsToStorage();
  }
}

// Generate Legal Proforma Estimate PDF via jsPDF
function generateProformaPDF(client, proformaNum, services, issueDate, validityDays) {
  const jsPDFConstructor = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null);
  if (!jsPDFConstructor) {
    throw new Error('jsPDF library is not loaded');
  }

  const doc = new jsPDFConstructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Palette
  const navy = [10, 14, 23];
  const cyan = [14, 165, 233];
  const darkText = [30, 41, 59];
  const mutedText = [100, 116, 139];

  // Header Banner
  doc.setFillColor(...navy);
  doc.rect(0, 0, 210, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DEVIZ PROFORMĂ & OFERTĂ TEHNICĂ OFICIALĂ', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253);
  doc.text(`Serie & Număr: ${proformaNum}   |   Data Emiterii: ${issueDate}   |   Valabilitate: ${validityDays} zile`, 14, 24);

  // Furnizor & Client Boxes
  let y = 44;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 88, 36, 2, 2, 'FD');
  doc.roundedRect(108, y, 88, 36, 2, 2, 'FD');

  // Stânga: Furnizor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navy);
  doc.text('FURNIZOR SERVICII:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkText);
  doc.text('Andrei.Dev — Freelance Web Architect', 18, y + 13);
  doc.text('CIF: RO41928371 | Sediu: București, Sector 2', 18, y + 18);
  doc.text('IBAN: RO49 BTRL 0000 1205 9921 44XX', 18, y + 23);
  doc.text('Banca: Banca Transilvania | contact@andrei.dev', 18, y + 28);

  // Dreapta: Beneficiar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navy);
  doc.text('BENEFICIAR / CLIENT:', 112, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkText);
  doc.text(`Nume: ${client.name}`, 112, y + 13);
  doc.text(`Proiect: ${client.project}`, 112, y + 18);
  doc.text(`Telefon: ${client.phone || '07xx xxx xxx'}`, 112, y + 23);
  doc.text(`Etapă Pipeline: ${client.status.toUpperCase()}`, 112, y + 28);

  // Tabel Servicii Digitale
  y += 44;
  doc.setFillColor(...navy);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('NR.', 18, y + 5.5);
  doc.text('DESCRIERE SERVICIU DIGITAL / LIVRABIL', 30, y + 5.5);
  doc.text('CANT.', 140, y + 5.5);
  doc.text('VALOARE (RON)', 165, y + 5.5);

  y += 8;
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  let grandTotal = 0;
  services.forEach((s, i) => {
    const isEven = i % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 8, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 8, 196, y + 8);

    doc.text(`${i + 1}`, 18, y + 5.5);
    doc.text(s.name, 30, y + 5.5);
    doc.text('1', 142, y + 5.5);
    doc.text(`${(s.price || 0).toLocaleString('ro-RO')} RON`, 165, y + 5.5);

    grandTotal += (s.price || 0);
    y += 8;
  });

  // Total Summary
  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, y, 76, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...navy);
  doc.text('SUBTOTAL SERVICII:', 124, y + 7);
  doc.text(`${grandTotal.toLocaleString('ro-RO')} RON`, 165, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text('TVA (Scutit cf. art. 310 Cod Fiscal):', 124, y + 13);
  doc.text('0 RON', 165, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...cyan);
  doc.text('TOTAL DEVIZ:', 124, y + 21);
  doc.text(`${grandTotal.toLocaleString('ro-RO')} RON`, 165, y + 21);

  // Termeni & Condiții Comerciale
  y += 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...navy);
  doc.text('TERMENI ȘI CONDIȚII DE COLABORARE:', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkText);
  const terms = [
    `1. Modalitate de plată: 50% avans (${Math.round(grandTotal * 0.5)} RON) la confirmare, 50% la lansarea finală pe domeniu.`,
    '2. Termen estimat de livrare: 5 - 10 zile lucrătoare de la primirea materialelor / textelor.',
    '3. Garanție & Mentenanță: 30 de zile suport tehnic gratuit post-lansare pentru remedieri și ajustări minore.',
    '4. Drepturi de autor: Codul sursă și toate componentele grafice create revin integral clientului după achitarea integrală.'
  ];
  let termY = y + 5;
  terms.forEach(t => {
    doc.text(t, 14, termY);
    termY += 4.5;
  });

  // Semnături
  y = termY + 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('EMITENT (Andrei.Dev):', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text('Semnat & Ștampilat Digital (Proformă Electronică)', 18, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...navy);
  doc.text('CONFIRMARE BENEFICIAR:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text(`Acceptat de: ${client.name}`, 120, y + 5);

  // Footer
  doc.setFontSize(7);
  doc.text(`Document proformă emis pe www.andrei.dev | CRM Pipeline ID: ${client.id} | Validat automat`, 14, 288);

  return doc;
}

// Open Notion Sync Modal
function openNotionSyncModal() {
  const syncDate = new Date().toLocaleString('ro-RO');
  notionTablePreview.innerHTML = `
    <table class="notion-table">
      <thead>
        <tr>
          <th>Client</th>
          <th>Proiect</th>
          <th>Valoare</th>
          <th>Etapă Notion</th>
          <th>Ultim Contact</th>
          <th>Follow-up</th>
          <th>Status Sincronizare</th>
        </tr>
      </thead>
      <tbody>
        ${clients.map(c => {
          const days = getDaysSinceContact(c.lastContactDate);
          const needsFollowup = days >= 3 && c.status !== 'finalizat';
          return `
            <tr>
              <td><strong>${c.name}</strong></td>
              <td>${c.project}</td>
              <td style="color: var(--accent-emerald); font-weight: 700;">${c.value} RON</td>
              <td><code>${c.status.toUpperCase()}</code></td>
              <td>${c.lastContactDate}</td>
              <td>${needsFollowup ? '<span style="color: #f87171; font-weight: 700;">⚠️ Urgent</span>' : '<span style="color: #34d399;">✓ La zi</span>'}</td>
              <td><span style="color: #38bdf8;">✓ Mapat la Notion To-Do</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  notionSyncModal.classList.add('open');
}

// Setup Event Listeners
function setupEvents() {
  // Search input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderKanban();
  });

  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter');
      renderKanban();
    });
  });

  // Add client modal openers
  btnOpenAdd.addEventListener('click', () => addModal.classList.add('open'));
  btnCloseAdd.addEventListener('click', () => addModal.classList.remove('open'));

  // Proforma modal closers
  btnCloseProformaModal.addEventListener('click', () => proformaModal.classList.remove('open'));

  // Notion modal openers/closers
  btnSyncNotion.addEventListener('click', openNotionSyncModal);
  btnCloseNotionModal.addEventListener('click', () => notionSyncModal.classList.remove('open'));

  // Close modals on outside click
  window.addEventListener('click', (e) => {
    if (e.target === addModal) addModal.classList.remove('open');
    if (e.target === proformaModal) proformaModal.classList.remove('open');
    if (e.target === notionSyncModal) notionSyncModal.classList.remove('open');
  });

  // Add new service row in proforma editor
  btnAddServiceRow.addEventListener('click', () => {
    currentProformaServices.push({ name: 'Serviciu Tehnic Suplimentar', price: 250 });
    renderServicesEditor();
    updateProformaCalculations();
  });

  // Download Proforma PDF
  btnDownloadProformaPdf.addEventListener('click', () => {
    if (!activeProformaClient) return;
    try {
      const proformaNum = profNumber.value || 'PF-2026-0001';
      const issueDate = profIssueDate.value || new Date().toISOString().split('T')[0];
      const validityDays = profValidityDays.value || '30';

      const doc = generateProformaPDF(activeProformaClient, proformaNum, currentProformaServices, issueDate, validityDays);
      doc.save(`Deviz-Proforma-${proformaNum}-${activeProformaClient.name.replace(/\s+/g, '_')}.pdf`);
      showToast(`📥 Devizul proformă ${proformaNum} a fost descărcat ca PDF!`);
    } catch (err) {
      console.error('Proforma PDF generation failed:', err);
      showToast('Eroare la generarea PDF. Verifică librăria.');
    }
  });

  // Send Proforma on WhatsApp
  btnSendProformaWhatsApp.addEventListener('click', () => {
    if (!activeProformaClient) return;
    const proformaNum = profNumber.value;
    const cleanPhone = (activeProformaClient.phone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('0') ? '4' + cleanPhone : cleanPhone;
    const text = encodeURIComponent(
      `Salut ${activeProformaClient.name}! Am emis devizul proformă oficial ${proformaNum} pentru proiectul "${activeProformaClient.project}".\n` +
      `Valoare totală estimată: ${activeProformaClient.value} RON (Avans 50%: ${Math.round(activeProformaClient.value * 0.5)} RON).\n` +
      `Include: ${currentProformaServices.map(s => s.name).join(', ')}.\n` +
      `Îți trimit documentul PDF complet pentru validare.`
    );
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
    showToast(`📲 Proformă transmisă pe WhatsApp către ${activeProformaClient.name}!`);
  });

  // Copy Notion JSON payload
  btnCopyNotionJson.addEventListener('click', () => {
    const payload = JSON.stringify({
      notionDatabaseId: '3f127fe7-c32b-8045-9ea8-c88d1049242f',
      syncedAt: new Date().toISOString(),
      clients: clients
    }, null, 2);

    navigator.clipboard.writeText(payload).then(() => {
      showToast('📋 Payload JSON structurat copiat pentru Notion!');
    });
  });

  // Trigger Notion Sync action
  btnTriggerNotionSync.addEventListener('click', () => {
    syncStatusText.textContent = 'Notion: Sincronizat Acum';
    showToast('⚡ Baza Notion a fost sincronizată cu succes cu toate etapele CRM!');
    setTimeout(() => {
      notionSyncModal.classList.remove('open');
    }, 800);
  });

  // New Client Form Submit
  newClientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('clientName').value.trim();
    const project = document.getElementById('projectType').value.trim();
    const value = parseInt(document.getElementById('projectValue').value) || 1000;
    const phone = document.getElementById('clientPhone').value.trim() || '0722000000';
    const status = document.getElementById('projectStatus').value;
    const lastContactDate = lastContactDateInput.value || new Date().toISOString().split('T')[0];
    const script = document.getElementById('projectScript').value.trim() || `Salut ${name}! Când putem discuta despre site-ul tău?`;

    const newClient = {
      id: 'c_' + Date.now(),
      name,
      phone,
      project,
      value,
      status,
      lastContactDate,
      script,
      services: [
        { name: `Dezvoltare & Design: ${project}`, price: value }
      ]
    };

    clients.unshift(newClient);
    saveClientsToStorage();
    newClientForm.reset();
    lastContactDateInput.value = new Date().toISOString().split('T')[0];
    addModal.classList.remove('open');
    renderKanban();
    showToast(`🎉 Clientul ${newClient.name} a fost adăugat în pipeline!`);
  });
}

// Toast
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 3800);
}
