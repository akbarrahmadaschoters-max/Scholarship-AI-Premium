import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SatResult, IeltsResult, DayPlan } from '../context/DiagnosticContext';

export function generatePDFReport(satResult: SatResult | undefined, ieltsResult: IeltsResult | undefined, studyPlan: DayPlan[]) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text('Scholar Nova Diagnostic Report', 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
  
  let currentY = 40;

  // SAT Results
  if (satResult) {
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('SAT Diagnostic Results', 14, currentY);
    currentY += 10;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Metric', 'Score']],
      body: [
        ['Overall Score', satResult.overallScore || satResult.scoreRange],
        ['Math Score', satResult.mathScore],
        ['Reading & Writing', satResult.readingWritingScore],
        ['Classification', satResult.classification]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // IELTS Results
  if (ieltsResult) {
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('IELTS Diagnostic Results', 14, currentY);
    currentY += 10;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Section', 'Band Score']],
      body: [
        ['Overall Band', ieltsResult.overallBand.toFixed(1)],
        ['Listening', ieltsResult.listeningBand.toFixed(1)],
        ['Reading', ieltsResult.readingBand.toFixed(1)],
        ['Writing', ieltsResult.writingBand.toFixed(1)],
        ['Speaking', ieltsResult.speakingBand.toFixed(1)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Study Plan
  if (studyPlan && studyPlan.length > 0) {
    // Check page break
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Personalized Daily Study Plan', 14, currentY);
    currentY += 10;

    const planBody = studyPlan.flatMap(day => 
      day.tasks.map(task => [day.day, day.date, task.focus, `${task.duration} min`])
    );

    autoTable(doc, {
      startY: currentY,
      head: [['Day', 'Date', 'Focus Area', 'Duration']],
      body: planBody,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });
  }

  // Download
  doc.save('ScholarNova_Report.pdf');
}
