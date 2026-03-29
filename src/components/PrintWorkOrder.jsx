import { useEffect } from 'react';
import { formatDate, formatDateTime } from '../utils/helpers';

export default function PrintWorkOrder({ order, onClose }) {
  useEffect(() => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      alert('Please allow popups to print work orders');
      onClose();
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Work Order #${order.work_order}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; color: #333; }
    .container { max-width: 500px; margin: 0 auto; border: 2px solid #333; }
    .header { background: #1e40af; color: white; padding: 12px 16px; text-align: center; }
    .header h1 { font-size: 18px; margin-bottom: 4px; }
    .header .wo-num { font-size: 24px; font-weight: bold; }
    .section { padding: 12px 16px; border-bottom: 1px solid #ddd; }
    .section:last-child { border-bottom: none; }
    .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .label { font-weight: bold; color: #555; min-width: 140px; }
    .value { text-align: right; flex: 1; }
    .qty-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 8px; }
    .qty-box { text-align: center; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .qty-box .num { font-size: 20px; font-weight: bold; }
    .qty-box .label { font-size: 11px; color: #666; display: block; min-width: auto; }
    .notes { background: #f9f9f9; padding: 10px; border-radius: 4px; margin-top: 4px; white-space: pre-wrap; }
    .flags { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .flag { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .checkbox { width: 16px; height: 16px; border: 2px solid #666; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; }
    .checkbox.checked { background: #e8f0fe; border-color: #1e40af; color: #1e40af; }
    .footer { font-size: 12px; color: #666; }
    @media print {
      body { padding: 0; }
      .container { border: 1px solid #333; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SA GRINDING WHEELS CC</h1>
      <div class="wo-num">WORK ORDER: ${order.work_order}</div>
    </div>

    <div class="section">
      <div class="row">
        <span class="label">Date:</span>
        <span class="value">${formatDate(order.order_date)}</span>
      </div>
      <div class="row">
        <span class="label">Customer:</span>
        <span class="value">${order.customer_name || '-'}</span>
      </div>
      <div class="row">
        <span class="label">Customer Order #:</span>
        <span class="value">${order.order_number || '-'}</span>
      </div>
    </div>

    <div class="section">
      <div class="row">
        <span class="label">Product:</span>
        <span class="value">${order.product || '-'}</span>
      </div>
      ${order.product_note ? `<div class="row"><span class="label">Product Note:</span><span class="value">${order.product_note}</span></div>` : ''}
      <div class="qty-grid">
        <div class="qty-box">
          <div class="num">${order.order_qty || 0}</div>
          <span class="label">Qty Ordered</span>
        </div>
        <div class="qty-box">
          <div class="num">${order.manufactured || 0}</div>
          <span class="label">Manufactured</span>
        </div>
        <div class="qty-box">
          <div class="num" style="color: ${(order.remaining || 0) > 0 ? '#ea580c' : '#16a34a'}">${order.remaining || 0}</div>
          <span class="label">Remaining</span>
        </div>
      </div>
    </div>

    ${order.note ? `
    <div class="section">
      <div class="label" style="margin-bottom: 4px;">Notes:</div>
      <div class="notes">${order.note}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="flags">
        <div class="flag">
          <span class="checkbox ${order.mount_up == 1 ? 'checked' : ''}">${order.mount_up == 1 ? '✓' : ''}</span>
          Mount Up
        </div>
        <div class="flag">
          <span class="checkbox ${order.double_labels == 1 ? 'checked' : ''}">${order.double_labels == 1 ? '✓' : ''}</span>
          Double Label
        </div>
        <div class="flag">
          <span class="checkbox ${order.customer_own_label == 1 ? 'checked' : ''}">${order.customer_own_label == 1 ? '✓' : ''}</span>
          Own Label
        </div>
        <div class="flag">
          <span class="checkbox ${order.customer_courier == 1 ? 'checked' : ''}">${order.customer_courier == 1 ? '✓' : ''}</span>
          Courier
        </div>
        <div class="flag">
          <span class="checkbox ${order.weight_list == 1 ? 'checked' : ''}">${order.weight_list == 1 ? '✓' : ''}</span>
          Weight List
        </div>
      </div>
    </div>

    <div class="section footer">
      <div class="row">
        <span class="label">Captured:</span>
        <span class="value">${order.captured_by || '-'}</span>
      </div>
      <div class="row">
        <span class="label">Date/Time:</span>
        <span class="value">${formatDateTime(order.timestamp)}</span>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    onClose();
  }, [order, onClose]);

  return null;
}
