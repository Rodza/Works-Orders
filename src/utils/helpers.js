// Format currency in ZAR
export function formatCurrency(amount) {
  if (amount == null) return '';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

// Format date
export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// Format datetime
export function formatDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-ZA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Status badge class
export function statusClass(status) {
  switch (status) {
    case 'DRAFT': return 'badge-draft';
    case 'OPEN': return 'badge-open';
    case 'COMPLETED': return 'badge-completed';
    default: return 'badge-draft';
  }
}

// Next status in workflow
export function nextStatus(current) {
  switch (current) {
    case 'DRAFT': return 'OPEN';
    case 'OPEN': return 'COMPLETED';
    default: return null;
  }
}
