import { jsPDF } from 'jspdf';
import { ChatSession, ChatMessage, StudyPlan } from '../types';

/**
 * Removes non-Latin emojis and cleans markdown for safe, crisp PDF text rendering
 */
function cleanTextForPdf(text: string): string {
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^\$\n]+?)\$/g, '$1')
    .replace(/\$/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/[^\x00-\xFF\u0100-\u017F\u0180-\u024F]/g, ' ')
    .trim();
}

/**
 * Exports the active chat conversation to a structured, printable PDF document
 */
export function exportSessionToPdf(session: ChatSession): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper for page breaks
    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin - 12) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };

    // --- Header Banner ---
    doc.setFillColor(10, 132, 255); // #0A84FF
    doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('JANGO', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text("Fiche d'explication de cours & devoirs résolus", margin + 6, y + 15);

    const dateStr = new Date(session.updatedAt || Date.now()).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFontSize(8);
    doc.text(dateStr, pageWidth - margin - 6, y + 9, { align: 'right' });
    doc.text(
      `Niveau : ${session.level ? session.level.toUpperCase() : 'SCOLAIRE'}`,
      pageWidth - margin - 6,
      y + 15,
      { align: 'right' }
    );

    y += 32;

    // Session Title Section
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const sessionTitle = cleanTextForPdf(session.title || 'Discussion et exercices JANGO');
    doc.text(sessionTitle, margin, y);
    y += 6;

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Filter messages: keep real dialogue (skip bare welcome unless it's alone)
    const messagesToExport = session.messages.length > 1
      ? session.messages.filter((m) => m.id !== 'welcome-msg')
      : session.messages;

    for (let i = 0; i < messagesToExport.length; i++) {
      const msg = messagesToExport[i];
      const isUser = msg.role === 'user';

      checkPageBreak(25);

      // Section Card Header
      if (isUser) {
        doc.setFillColor(241, 245, 249); // slate-100
        doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
        doc.setTextColor(2, 132, 199); // sky-600
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text("QUESTION DE L'ELEVE", margin + 3, y + 5.5);
      } else {
        doc.setFillColor(238, 242, 255); // indigo-50
        doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
        doc.setTextColor(10, 132, 255); // #0A84FF
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('SOLUTION & EXPLICATION DETAILLEE (JANGO)', margin + 3, y + 5.5);
      }
      y += 12;

      // Handle attached image if present in user message
      if (msg.attachment && msg.attachment.base64 && msg.attachment.mimeType.startsWith('image/')) {
        try {
          checkPageBreak(55);
          const imgData = msg.attachment.previewUrl.startsWith('data:')
            ? msg.attachment.previewUrl
            : `data:${msg.attachment.mimeType};base64,${msg.attachment.base64}`;

          const imgFormat = msg.attachment.mimeType.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(imgData, imgFormat, margin, y, 60, 45, undefined, 'FAST');
          y += 48;
        } catch (imgErr) {
          console.warn('Could not insert image in PDF:', imgErr);
        }
      }

      // Message lines
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);

      const rawLines = msg.text.split('\n');
      for (const line of rawLines) {
        const trimmed = line.trim();
        if (!trimmed) {
          y += 2;
          continue;
        }

        checkPageBreak(8);

        // Highlight step headers
        if (
          trimmed.startsWith('📌') ||
          trimmed.startsWith('💡') ||
          trimmed.startsWith('📝') ||
          trimmed.startsWith('🔍') ||
          trimmed.startsWith('✅') ||
          trimmed.startsWith('Étape') ||
          trimmed.startsWith('Etape') ||
          trimmed.startsWith('###') ||
          trimmed.startsWith('##')
        ) {
          y += 2;
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(2, 132, 199);
          const cleanHeader = cleanTextForPdf(trimmed.replace(/^#+\s*/, ''));
          const splitHeader = doc.splitTextToSize(cleanHeader, contentWidth - 4);
          doc.text(splitHeader, margin + 2, y);
          y += splitHeader.length * 4.5 + 1;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          // Bullet point
          doc.setFillColor(10, 132, 255);
          doc.circle(margin + 3, y - 1, 0.8, 'F');
          const cleanBullet = cleanTextForPdf(trimmed.substring(2));
          const splitBullet = doc.splitTextToSize(cleanBullet, contentWidth - 8);
          doc.text(splitBullet, margin + 6, y);
          y += splitBullet.length * 4.5 + 1;
        } else {
          // Regular text paragraph
          const cleanPara = cleanTextForPdf(trimmed);
          const splitText = doc.splitTextToSize(cleanPara, contentWidth - 2);
          doc.text(splitText, margin + 2, y);
          y += splitText.length * 4.5 + 1;
        }
      }

      y += 6; // Space between messages
    }

    // Add page numbers on all pages
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `JANGO • Tuteur IA Scolaire • Page ${p} sur ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    // Download PDF file
    const safeTitle = sessionTitle.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30) || 'Devoir';
    const filename = `JANGO_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    window.print();
  }
}

/**
 * Exports a single exercise explanation directly to PDF
 */
export function exportSingleMessageToPdf(
  message: ChatMessage,
  question?: string,
  level: string = 'lycee'
): void {
  const pseudoSession: ChatSession = {
    id: `export-${Date.now()}`,
    title: question ? question.slice(0, 35) : 'Explication d exercice',
    createdAt: message.timestamp,
    updatedAt: Date.now(),
    messages: [
      ...(question
        ? [
            {
              id: `q-${Date.now()}`,
              role: 'user' as const,
              text: question,
              timestamp: message.timestamp - 1000,
            },
          ]
        : []),
      message,
    ],
    mode: 'general',
    level: level as any,
  };

  exportSessionToPdf(pseudoSession);
}

/**
 * Exports the AI study schedule to a structured printable PDF document
 */
export function exportStudyPlanToPdf(plan: StudyPlan): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin - 10) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };

    // Header Banner
    doc.setFillColor(10, 132, 255);
    doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('JANGO • Planning de Revision IA', margin + 6, y + 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Programme d etude personnalise • Niveau : ${plan.level.toUpperCase()}`,
      margin + 6,
      y + 14.5
    );

    y += 28;

    // Summary box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    const splitSummary = doc.splitTextToSize(cleanTextForPdf(plan.summary), contentWidth - 8);
    doc.text(splitSummary, margin + 4, y + 5.5);
    y += 18;

    // Goals
    if (plan.goals && plan.goals.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(2, 132, 199);
      doc.text('OBJECTIFS CLES DE LA SEMAINE :', margin, y);
      y += 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      for (const goal of plan.goals) {
        doc.text(`- ${cleanTextForPdf(goal)}`, margin + 3, y);
        y += 4.5;
      }
      y += 4;
    }

    // Days Cards
    for (const day of plan.days) {
      checkPageBreak(30);

      // Day header pill
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(margin, y, contentWidth, 7, 2, 2, 'F');

      doc.setTextColor(10, 132, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const dayHeader = `${cleanTextForPdf(day.dayName).toUpperCase()} - ${cleanTextForPdf(day.focus)}`;
      doc.text(dayHeader, margin + 4, y + 5);

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        `Duree : ${day.durationMinutes} min  |  Priorite : ${day.priority}`,
        pageWidth - margin - 4,
        y + 5,
        { align: 'right' }
      );
      y += 10;

      // Tasks checklist
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      for (const task of day.tasks) {
        checkPageBreak(6);
        doc.setDrawColor(148, 163, 184);
        doc.rect(margin + 4, y - 2.5, 3, 3);

        const cleanTask = cleanTextForPdf(task.text);
        const splitTask = doc.splitTextToSize(cleanTask, contentWidth - 14);
        doc.text(splitTask, margin + 10, y);
        y += splitTask.length * 4.2;
      }

      if (day.tip) {
        checkPageBreak(6);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(2, 132, 199);
        const cleanTip = cleanTextForPdf(day.tip);
        doc.text(`Astuce JANGO : ${cleanTip}`, margin + 10, y);
        y += 4.5;
      }

      y += 3;
    }

    // Advice footer
    if (plan.advice) {
      checkPageBreak(15);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(10, 132, 255);
      doc.text('CONSEIL METHODOLOGIQUE DE JANGO :', margin + 4, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const splitAdv = doc.splitTextToSize(cleanTextForPdf(plan.advice), contentWidth - 8);
      doc.text(splitAdv, margin + 4, y + 9);
      y += 16;
    }

    // Page numbering
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `JANGO • Planning de revision personnalise • Page ${p} sur ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }

    doc.save(`JANGO_Planning_Revision_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('Error generating study plan PDF:', err);
    window.print();
  }
}
