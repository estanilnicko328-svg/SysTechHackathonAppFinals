// Demo Data Generator for ConcernTrack
// Generates 50+ realistic concerns for testing

function generateDemoData() {
    const programs = ['CS', 'BSIT', 'BSBA', 'BSA', 'BEED', 'BSED', 'BSN'];
    const categories = ['Academic', 'Financial', 'Welfare'];
    const descriptions = {
        Academic: [
            'Need course extension due to illness',
            'Grade discrepancy in midterm',
            'Request for prerequisite waiver',
            'Thesis advisor change needed',
            'Exam schedule conflict'
        ],
        Financial: [
            'Scholarship payment delayed',
            'Tuition installment issue',
            'Financial aid application status',
            'Refund request for dropped subject',
            'Book allowance not received'
        ],
        Welfare: [
            'Hostel accommodation issue',
            'Counseling service needed',
            'Health center appointment',
            'Transportation pass renewal',
            'Sports facility access'
        ]
    };
    
    const demoConcerns = [];
    const statuses = ['Submitted', 'Routed', 'Read', 'Screened', 'Resolved', 'Escalated'];
    const students = ['stu1', 'stu2', 'stu3', 'stu4', 'stu5', 'stu6'];
    
    for (let i = 0; i < 60; i++) {
        const id = (1000 + i).toString();
        const category = categories[Math.floor(Math.random() * categories.length)];
        const program = programs[Math.floor(Math.random() * programs.length)];
        const desc = descriptions[category][Math.floor(Math.random() * descriptions[category].length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const studentId = students[Math.floor(Math.random() * students.length)];
        const anonymous = Math.random() > 0.7;
        const daysAgo = Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000;
        
        const timestamps = { submitted: Date.now() - daysAgo };
        
        // Add realistic timestamps based on status progression
        if (status === 'Routed') timestamps.routed = timestamps.submitted + 1000 * 60 * 5;
        if (status === 'Read') {
            timestamps.routed = timestamps.submitted + 1000 * 60 * 5;
            timestamps.read = timestamps.routed + 1000 * 60 * 30;
        }
        if (status === 'Screened') {
            timestamps.read = timestamps.routed + 1000 * 60 * 30;
            timestamps.screened = timestamps.read + 1000 * 60 * 120;
        }
        if (status === 'Resolved') {
            timestamps.screened = timestamps.read + 1000 * 60 * 120;
            timestamps.resolved = timestamps.screened + 1000 * 60 * 240;
        }
        
        const history = [];
        if (status !== 'Submitted') history.push({ status: 'Routed', timestamp: timestamps.routed || timestamps.submitted + 5000, actor: { role: 'system' } });
        if (status === 'Read' || status === 'Screened' || status === 'Resolved') history.push({ status: 'Read', timestamp: timestamps.read, actor: { role: 'admin' } });
        if (status === 'Screened' || status === 'Resolved') history.push({ status: 'Screened', timestamp: timestamps.screened, actor: { role: 'admin' } });
        if (status === 'Resolved') history.push({ status: 'Resolved', timestamp: timestamps.resolved, actor: { role: 'admin' } });
        
        demoConcerns.push({
            id,
            category,
            program,
            description: desc,
            attachment: Math.random() > 0.6 ? `doc_${id}.pdf` : null,
            anonymous,
            status,
            department: getDepartment(category, program),
            timestamps,
            studentId,
            history
        });
    }
    
    return demoConcerns;
}

function getDepartment(category, program) {
    const programMap = {
        Academic: {
            CS: 'Academic-CS Dept',
            BSIT: 'Academic-IT Dept',
            BSBA: 'Academic-Business Dept'
        },
        Financial: 'Finance Dept',
        Welfare: 'Student Welfare Dept'
    };
    
    if (category === 'Academic' && programMap.Academic[program]) {
        return programMap.Academic[program];
    }
    return category === 'Academic' ? 'Academic Dept' : programMap[category] || 'General Dept';
}
