const ticketForm = document.getElementById('ticketForm');
const ticketTableBody = document.getElementById('ticketTableBody');
const formMessage = document.getElementById('formMessage');
const searchInput = document.getElementById('search');
const filterStatus = document.getElementById('filterStatus');
const emptyMessage = document.getElementById('emptyMessage');
const exportCsvButton = document.getElementById('exportCsv');
const exportJsonButton = document.getElementById('exportJson');
const clearAllButton = document.getElementById('clearAll');
const totalTickets = document.getElementById('totalTickets');
const pendingCount = document.getElementById('pendingCount');
const inProgressCount = document.getElementById('inProgressCount');
const resolvedCount = document.getElementById('resolvedCount');

const ticketModal = document.getElementById('ticketModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalPriority = document.getElementById('modalPriority');
const modalRequester = document.getElementById('modalRequester');
const modalDept = document.getElementById('modalDept');
const modalEmail = document.getElementById('modalEmail');
const modalType = document.getElementById('modalType');
const modalDescription = document.getElementById('modalDescription');

const STORAGE_KEY = 'soportesTiTickets';
const tickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentId = tickets.reduce((max, ticket) => Math.max(max, ticket.id), 0) + 1;

// Función para formatear el ID (Ej: 1 -> INC-0001)
const formatId = (id) => `INC-${String(id).padStart(4, '0')}`;

const fieldMap = {
  requester: 'Solicitante',
  email: 'Correo',
  department: 'Departamento',
  priority: 'Prioridad',
  issueType: 'Categoría',
  description: 'Descripción'
};

function validateForm(data) {
  const errors = [];
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'status' && (!value || !value.trim())) {
      errors.push(`${fieldMap[key] || key} es obligatorio.`);
    }
  });
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('Correo electrónico inválido.');
  }
  return errors;
}

function showMessage(text, type = 'success') {
  formMessage.textContent = text;
  formMessage.style.color = type === 'error' ? 'var(--danger)' : 'var(--status-resolved)';
  setTimeout(() => formMessage.textContent = '', 4000);
}

function updateStats() {
  if (totalTickets) totalTickets.textContent = tickets.length;
  if (pendingCount) pendingCount.textContent = tickets.filter((ticket) => ticket.status === 'Pendiente').length;
  if (inProgressCount) inProgressCount.textContent = tickets.filter((ticket) => ticket.status === 'En proceso').length;
  if (resolvedCount) resolvedCount.textContent = tickets.filter((ticket) => ticket.status === 'Resuelto').length;
}

function renderTickets() {
  const query = searchInput.value.trim().toLowerCase();
  const statusFilter = filterStatus.value;

  const filtered = tickets.filter((ticket) => {
    const stringId = formatId(ticket.id).toLowerCase();
    const matchesQuery = [
      stringId,
      ticket.requester,
      ticket.department,
      ticket.issueType
    ].some((value) => String(value || '').toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'Todos' || ticket.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  ticketTableBody.innerHTML = '';
  updateStats();

  if (filtered.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }

  emptyMessage.style.display = 'none';

  filtered.forEach((ticket) => {
    const row = document.createElement('tr');
    const statusClass = ticket.status.replace(/\s/g, '\\ ');
    const priorityClass = ticket.priority.toLowerCase();
    
    // Formatear fecha simple: DD/MM/YYYY
    const dateObj = new Date(ticket.createdAt);
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

    row.innerHTML = `
      <td><span class="ticket-id">${formatId(ticket.id)}</span></td>
      <td>${dateStr}</td>
      <td>
        <strong>${ticket.requester}</strong><br>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${ticket.email}</span>
      </td>
      <td>${ticket.department}</td>
      <td>${ticket.issueType}</td>
      <td><span class="priority-${priorityClass}">${ticket.priority}</span></td>
      <td><span class="badge status-${statusClass}">${ticket.status}</span></td>
      <td>
        <div class="action-buttons">
          <button type="button" class="btn-icon view-button" data-id="${ticket.id}" title="Ver Detalles">👁️</button>
          <button type="button" class="btn-icon status-button" data-id="${ticket.id}" data-status="En proceso" title="Marcar en Curso">▶️</button>
          <button type="button" class="btn-icon status-button" data-id="${ticket.id}" data-status="Resuelto" title="Marcar Resuelto">✅</button>
          <button type="button" class="btn-icon delete-button" data-id="${ticket.id}" title="Eliminar">🗑️</button>
        </div>
      </td>
    `;
    ticketTableBody.appendChild(row);
  });
}

function handleStatusUpdate(id, status) {
  const ticket = tickets.find((item) => item.id === id);
  if (!ticket) return;
  if (ticket.status === status) return; // Evitar actualizar si ya tiene ese estado
  ticket.status = status;
  saveTickets();
  renderTickets();
  showMessage(`Ticket ${formatId(id)} actualizado a ${status}.`, 'success');
}

function deleteTicket(id) {
  const index = tickets.findIndex((ticket) => ticket.id === id);
  if (index === -1) return;
  if (!confirm(`¿Eliminar permanentemente el ticket ${formatId(id)}?`)) return;
  tickets.splice(index, 1);
  saveTickets();
  renderTickets();
  showMessage('Ticket eliminado del sistema.', 'success');
}

function saveTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function openTicketModal(ticket) {
  modalTitle.textContent = formatId(ticket.id);
  modalPriority.textContent = ticket.priority.toUpperCase();
  modalPriority.className = `badge status-${ticket.status.replace(/\s/g, '\\ ')}`; // Usamos el color de estado para el badge superior
  
  modalRequester.textContent = ticket.requester;
  modalDept.textContent = ticket.department;
  modalEmail.textContent = ticket.email;
  modalType.textContent = ticket.issueType;
  modalDescription.textContent = ticket.description;
  
  ticketModal.classList.add('active');
}

function closeTicketModal() {
  ticketModal.classList.remove('active');
}

function exportToCsv() {
  if (tickets.length === 0) return;
  const header = ['ID', 'Fecha', 'Solicitante', 'Correo', 'Departamento', 'Categoría', 'Prioridad', 'Estado', 'Descripción'];
  const rows = tickets.map((ticket) => [
    formatId(ticket.id),
    new Date(ticket.createdAt).toLocaleString('es-ES'),
    ticket.requester,
    ticket.email,
    ticket.department,
    ticket.issueType,
    ticket.priority,
    ticket.status,
    ticket.description.replace(/\n/g, ' ')
  ]);

  const csvContent = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `reporte_ti_${new Date().getTime()}.csv`;
  link.click();
}

function exportToJson() {
  if (tickets.length === 0) return;
  const blob = new Blob([JSON.stringify(tickets, null, 2)], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `backup_ti_${new Date().getTime()}.json`;
  link.click();
}

function clearAllTickets() {
  if (!confirm('ADVERTENCIA: ¿Deseas purgar toda la base de datos de tickets? Esta acción no se puede deshacer.')) return;
  tickets.length = 0;
  saveTickets();
  renderTickets();
  showMessage('Base de datos purgada.', 'success');
}

ticketForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = {
    requester: document.getElementById('requester').value,
    email: document.getElementById('email').value,
    department: document.getElementById('department').value,
    priority: document.getElementById('priority').value,
    issueType: document.getElementById('issueType').value,
    status: document.getElementById('status').value,
    description: document.getElementById('description').value
  };

  const errors = validateForm(formData);
  if (errors.length > 0) {
    showMessage(errors.join(' '), 'error');
    return;
  }

  tickets.unshift({ id: currentId++, createdAt: new Date().toISOString(), ...formData }); // Insertar al inicio para que el más nuevo salga arriba
  saveTickets();
  ticketForm.reset();
  renderTickets();
  showMessage('Ticket registrado exitosamente.', 'success');
  document.getElementById('requester').focus();
});

ticketForm.addEventListener('reset', () => {
  setTimeout(() => document.getElementById('requester').focus(), 0);
});

ticketTableBody.addEventListener('click', (event) => {
  const viewButton = event.target.closest('.view-button');
  const statusButton = event.target.closest('.status-button');
  const deleteButton = event.target.closest('.delete-button');

  if (viewButton) {
    const id = Number(viewButton.dataset.id);
    const ticket = tickets.find((t) => t.id === id);
    if (ticket) openTicketModal(ticket);
    return;
  }

  if (statusButton) {
    const id = Number(statusButton.dataset.id);
    const status = statusButton.dataset.status;
    handleStatusUpdate(id, status);
    return;
  }

  if (deleteButton) {
    const id = Number(deleteButton.dataset.id);
    deleteTicket(id);
  }
});

closeModal.addEventListener('click', closeTicketModal);
ticketModal.addEventListener('click', (e) => {
  if (e.target === ticketModal) closeTicketModal();
});

searchInput.addEventListener('input', renderTickets);
filterStatus.addEventListener('change', renderTickets);
exportCsvButton.addEventListener('click', exportToCsv);
exportJsonButton.addEventListener('click', exportToJson);
clearAllButton.addEventListener('click', clearAllTickets);

renderTickets();