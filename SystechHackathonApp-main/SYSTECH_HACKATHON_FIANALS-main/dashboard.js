// Admin Dashboard Logic - Enhanced
let statusChart;

// Enhanced metrics with SLA breaches
function updateMetrics() {
    const total = concerns.length;
    document.getElementById('totalConcerns').textContent = total;
    
    // Avg response time for resolved
    const responseTimes = concerns
        .filter(c => c.status === 'Resolved')
        .map(c => (c.timestamps.resolved - c.timestamps.submitted) / (1000 * 60 * 60)); // hours
    const avgResponse = responseTimes.length ? Math.max(0, (responseTimes.reduce((a,b)=>a+b)/responseTimes.length)).toFixed(1) : '0.0';
    document.getElementById('avgResponse').textContent = avgResponse + 'h';
    
    // Escalation rate
    const escalated = concerns.filter(c => c.status === 'Escalated').length;
    const rate = total ? ((escalated / total) * 100).toFixed(1) : 0;
    document.getElementById('escalationRate').textContent = rate + '%';
    
    // SLA breaches count from audit log
    const slaBreaches = auditLog ? auditLog.filter(log => log.action && log.action.includes('concern_escalated') && log.actor === 'SLA System').length : 0;
    // Add 4th metric card if not exists
    let slaCard = document.querySelector('.metric-card.sla-breaches');
    if (!slaCard) {
        const metrics = document.querySelector('.metrics');
        slaCard = document.createElement('div');
        slaCard.className = 'metric-card sla-breaches';
        slaCard.innerHTML = '<h3>SLA Breaches</h3><span id="slaBreaches">0</span>';
        metrics.appendChild(slaCard);
    }
    document.getElementById('slaBreaches').textContent = slaBreaches;
    
    updateStatusChart();
}

// Status distribution chart
function updateStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    const statusCounts = {};
    
    concerns.forEach(c => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    
    if (statusChart) statusChart.destroy();
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#fbbf24', '#3b82f6', '#10b981', '#06b6d4', '#14b8a6', '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Status Distribution' }
            }
        }
    });
}

// Category breakdown (logged for now)
function updateCategoryChart() {
    const categoryCounts = {};
    concerns.forEach(c => {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });
    console.log('Category breakdown:', categoryCounts);
}

// Enhanced CSV export with history count
function exportCSV() {
    const headers = ['ID', 'Category', 'Program', 'Status', 'Department', 'Submitted', 'Response Time (h)', 'History Updates'];
    const rows = concerns.map(c => {
        const submitted = new Date(c.timestamps.submitted).toLocaleString();
        const responseTime = c.timestamps.resolved ? 
            ((c.timestamps.resolved - c.timestamps.submitted) / 3600000).toFixed(1) : 'N/A';
        return [
            c.id.slice(-4), 
            c.category, 
            c.program, 
            c.status, 
            c.department, 
            submitted, 
            responseTime, 
            c.history.length
        ];
    });
    
    let csv = headers.join(',') + '\n' + rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `concerntrack_${new Date().toISOString().slice(0,10)}.csv`);
    showNotification('Enhanced CSV exported!');
}

// Real PDF export using jsPDF
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header
    doc.setFontSize(20);
    doc.text('ConcernTrack - Management Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Report Date: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Total Concerns: ${concerns.length}`, 20, 45);
    doc.text(`Avg Response Time: ${document.getElementById('avgResponse').textContent}`, 20, 55);
    doc.text(`Escalation Rate: ${document.getElementById('escalationRate').textContent}`, 20, 65);
    
    // Concerns list (first 30)
    doc.text('Recent Concerns:', 20, 85);
    let y = 95;
    concerns.slice(0, 30).forEach((c, i) => {
        doc.text(`${i+1}. #${c.id.slice(-4)} | ${c.status} | ${c.category} | ${c.department}`, 20, y);
        y += 6;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });
    
    doc.save(`concerntrack-report_${new Date().toISOString().slice(0,10)}.pdf`);
    showNotification('Professional PDF report exported!');
}

