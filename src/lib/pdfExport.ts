import jsPDF from 'jspdf';

// VtM Gothic Theme Colors (HSL to RGB)
const COLORS = {
  background: { r: 18, g: 21, b: 25 },      // 220 13% 8%
  card: { r: 27, g: 31, b: 35 },             // 220 13% 12%
  foreground: { r: 242, g: 242, b: 242 },    // 0 0% 95%
  primary: { r: 220, g: 38, b: 38 },         // 0 72% 51% (crimson)
  muted: { r: 140, g: 148, b: 160 },         // muted foreground
  border: { r: 45, g: 50, b: 58 },           // 220 13% 20%
};

interface PDFOptions {
  title: string;
  subtitle?: string;
}

// Draw dots (filled and empty circles) for ratings
function drawDots(pdf: jsPDF, x: number, y: number, filled: number, max: number = 5, dotRadius: number = 1.2): number {
  const spacing = 3.5;
  
  for (let i = 0; i < max; i++) {
    const dotX = x + (i * spacing);
    const dotY = y - 1;
    
    if (i < filled) {
      // Filled dot
      pdf.setFillColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.circle(dotX, dotY, dotRadius, 'F');
    } else {
      // Empty dot (ring)
      pdf.setDrawColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setLineWidth(0.3);
      pdf.circle(dotX, dotY, dotRadius, 'S');
    }
  }
  
  return x + (max * spacing);
}

function createThemedPDF(options: PDFOptions): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Background
  pdf.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Header bar
  pdf.setFillColor(COLORS.card.r, COLORS.card.g, COLORS.card.b);
  pdf.rect(0, 0, pageWidth, 25, 'F');
  
  // Red accent line
  pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.rect(0, 25, pageWidth, 1.5, 'F');
  
  // Title
  pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(options.title, 15, 16);
  
  // Subtitle
  if (options.subtitle) {
    pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(options.subtitle, pageWidth - 15, 16, { align: 'right' });
  }
  
  return pdf;
}

function addSection(pdf: jsPDF, title: string, y: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Section background
  pdf.setFillColor(COLORS.card.r, COLORS.card.g, COLORS.card.b);
  pdf.roundedRect(15, y, pageWidth - 30, 8, 2, 2, 'F');
  
  // Section title
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 20, y + 5.5);
  
  return y + 12;
}

function addText(pdf: jsPDF, text: string, y: number, options?: { 
  indent?: number; 
  maxWidth?: number;
  fontSize?: number;
  color?: 'foreground' | 'muted';
}): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const indent = options?.indent ?? 20;
  const maxWidth = options?.maxWidth ?? (pageWidth - 40);
  const fontSize = options?.fontSize ?? 10;
  const color = options?.color ?? 'foreground';
  
  const textColor = color === 'muted' ? COLORS.muted : COLORS.foreground;
  pdf.setTextColor(textColor.r, textColor.g, textColor.b);
  pdf.setFontSize(fontSize);
  pdf.setFont('helvetica', 'normal');
  
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, indent, y);
  
  return y + (lines.length * (fontSize * 0.5));
}

function addLabelValue(pdf: jsPDF, label: string, value: string, y: number, x: number = 20): number {
  pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label + ':', x, y);
  
  pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
  pdf.setFontSize(10);
  pdf.text(value, x + pdf.getTextWidth(label + ': ') + 2, y);
  
  return y + 6;
}

function addBadge(pdf: jsPDF, text: string, x: number, y: number, isPrimary: boolean = false): number {
  const color = isPrimary ? COLORS.primary : COLORS.border;
  const textColor = COLORS.foreground;
  
  const textWidth = pdf.getTextWidth(text);
  const padding = 3;
  const height = 6;
  
  pdf.setFillColor(color.r, color.g, color.b);
  pdf.roundedRect(x, y - 4, textWidth + padding * 2, height, 1.5, 1.5, 'F');
  
  pdf.setTextColor(textColor.r, textColor.g, textColor.b);
  pdf.setFontSize(8);
  pdf.text(text, x + padding, y);
  
  return x + textWidth + padding * 2 + 4;
}

function checkNewPage(pdf: jsPDF, currentY: number, neededSpace: number = 30): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (currentY + neededSpace > pageHeight - 20) {
    pdf.addPage();
    // Background for new page
    pdf.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pageHeight, 'F');
    return 20;
  }
  return currentY;
}

// Export a Plot/Story to PDF
export function exportPlotToPDF(plot: {
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}, assignedCharacters: { name: string; clan: string }[] = []) {
  const pdf = createThemedPDF({
    title: plot.title,
    subtitle: 'Story / Plot'
  });
  
  let y = 35;
  
  // Status and Priority badges
  pdf.setFontSize(8);
  let badgeX = 20;
  badgeX = addBadge(pdf, plot.status, badgeX, y, true);
  addBadge(pdf, plot.priority + ' Priority', badgeX, y);
  y += 10;
  
  // Description
  if (plot.description) {
    y = addSection(pdf, 'Description', y);
    y = addText(pdf, plot.description, y + 4);
    y += 8;
  }
  
  // Assigned Characters
  if (assignedCharacters.length > 0) {
    y = checkNewPage(pdf, y);
    y = addSection(pdf, 'Assigned Characters', y);
    y += 4;
    assignedCharacters.forEach(char => {
      y = addText(pdf, `• ${char.name} (${char.clan})`, y);
      y += 2;
    });
    y += 4;
  }
  
  // Metadata
  y = checkNewPage(pdf, y);
  y = addSection(pdf, 'Metadata', y);
  y += 4;
  y = addLabelValue(pdf, 'Created', new Date(plot.created_at).toLocaleDateString(), y);
  y = addLabelValue(pdf, 'Updated', new Date(plot.updated_at).toLocaleDateString(), y);
  
  pdf.save(`${plot.title.replace(/[^a-z0-9]/gi, '_')}_story.pdf`);
}

// Export a Session to PDF
export function exportSessionToPDF(session: {
  title: string;
  summary?: string | null;
  date_played: string;
  experience_awarded?: number | null;
  created_at: string;
}) {
  const pdf = createThemedPDF({
    title: session.title,
    subtitle: 'Session Log'
  });
  
  let y = 35;
  
  // Date and XP
  y = addLabelValue(pdf, 'Date Played', new Date(session.date_played).toLocaleDateString(), y);
  if (session.experience_awarded) {
    y = addLabelValue(pdf, 'Experience Awarded', session.experience_awarded.toString() + ' XP', y);
  }
  y += 5;
  
  // Summary
  if (session.summary) {
    y = addSection(pdf, 'Session Summary', y);
    y = addText(pdf, session.summary, y + 4);
  }
  
  pdf.save(`${session.title.replace(/[^a-z0-9]/gi, '_')}_session.pdf`);
}

// Export a Character to PDF
export function exportCharacterToPDF(character: {
  name: string;
  clan: string;
  type: string;
  status: string;
  concept?: string | null;
  sire?: string | null;
  coterie?: string | null;
  generation?: number | null;
  predator_type?: string | null;
  resonance?: string | null;
  ambition?: string | null;
  desire?: string | null;
  appearance?: string | null;
  history?: string | null;
  notes?: string | null;
  strength?: number | null;
  dexterity?: number | null;
  stamina?: number | null;
  charisma?: number | null;
  manipulation?: number | null;
  composure?: number | null;
  intelligence?: number | null;
  wits?: number | null;
  resolve?: number | null;
  humanity?: number | null;
  hunger?: number | null;
  blood_potency?: number | null;
  experience_total?: number | null;
  experience_spent?: number | null;
  skills?: Record<string, { rating: number; specialty?: string }> | null;
  disciplines?: { name: string; level: number }[] | null;
  powers?: { name: string; discipline: string; level: number }[] | null;
  advantages?: { name: string; rating?: number; type: string }[] | null;
  flaws?: { name: string; rating?: number }[] | null;
  convictions?: string[] | null;
  touchstones?: { name: string; conviction?: string }[] | null;
}) {
  const pdf = createThemedPDF({
    title: character.name,
    subtitle: `${character.clan} • ${character.type}`
  });
  
  let y = 35;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const isVampire = character.clan !== 'Human' && character.clan !== 'Ghoul';
  
  // Badges row
  pdf.setFontSize(8);
  let badgeX = 20;
  badgeX = addBadge(pdf, character.clan, badgeX, y, true);
  if (isVampire && character.generation) {
    badgeX = addBadge(pdf, `Gen ${character.generation}`, badgeX, y);
  }
  if (character.predator_type && character.predator_type !== 'None') {
    badgeX = addBadge(pdf, character.predator_type, badgeX, y);
  }
  addBadge(pdf, character.type, badgeX, y);
  y += 10;
  
  // Basic Info
  if (character.concept) {
    y = addLabelValue(pdf, 'Concept', character.concept, y);
  }
  if (character.sire) {
    y = addLabelValue(pdf, 'Sire', character.sire, y);
  }
  if (character.coterie) {
    y = addLabelValue(pdf, 'Coterie', character.coterie, y);
  }
  if (character.resonance && isVampire) {
    y = addLabelValue(pdf, 'Resonance', character.resonance, y);
  }
  y += 5;
  
  // Attributes
  y = checkNewPage(pdf, y, 50);
  y = addSection(pdf, 'Attributes', y);
  y += 4;
  
  const colWidth = (pageWidth - 40) / 3;
  const attributes = {
    Physical: [
      { name: 'Strength', value: character.strength || 1 },
      { name: 'Dexterity', value: character.dexterity || 1 },
      { name: 'Stamina', value: character.stamina || 1 },
    ],
    Social: [
      { name: 'Charisma', value: character.charisma || 1 },
      { name: 'Manipulation', value: character.manipulation || 1 },
      { name: 'Composure', value: character.composure || 1 },
    ],
    Mental: [
      { name: 'Intelligence', value: character.intelligence || 1 },
      { name: 'Wits', value: character.wits || 1 },
      { name: 'Resolve', value: character.resolve || 1 },
    ],
  };
  
  Object.entries(attributes).forEach(([category, attrs], colIndex) => {
    const x = 20 + colIndex * colWidth;
    let attrY = y;
    
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(category, x, attrY);
    attrY += 5;
    
    attrs.forEach(attr => {
      pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${attr.name}:`, x, attrY);
      const textWidth = pdf.getTextWidth(`${attr.name}: `);
      drawDots(pdf, x + textWidth, attrY, attr.value, 5);
      attrY += 5;
    });
  });
  y += 25;
  
  // Trackers
  y = checkNewPage(pdf, y, 30);
  y = addSection(pdf, 'Trackers', y);
  y += 4;
  
  const trackerY = y;
  y = addLabelValue(pdf, 'Humanity', `${character.humanity || 7}/10`, y, 20);
  if (isVampire) {
    y = addLabelValue(pdf, 'Hunger', `${character.hunger || 1}/5`, y, 20);
    y = addLabelValue(pdf, 'Blood Potency', `${character.blood_potency || 0}`, y, 20);
  }
  
  const expUnspent = (character.experience_total || 0) - (character.experience_spent || 0);
  addLabelValue(pdf, 'Experience', `${character.experience_total || 0} total (${expUnspent} unspent)`, trackerY, pageWidth / 2);
  y += 5;
  
  // Skills
  if (character.skills && Object.keys(character.skills).length > 0) {
    y = checkNewPage(pdf, y, 40);
    y = addSection(pdf, 'Skills', y);
    y += 4;
    
    const skills = character.skills as Record<string, { rating: number; specialty?: string }>;
    const skillEntries = Object.entries(skills).filter(([_, s]) => s.rating > 0);
    
    const midPoint = Math.ceil(skillEntries.length / 2);
    const leftSkills = skillEntries.slice(0, midPoint);
    const rightSkills = skillEntries.slice(midPoint);
    
    const skillStartY = y;
    leftSkills.forEach(([name, skill]) => {
      const displayName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const label = skill.specialty 
        ? `${displayName} (${skill.specialty}):`
        : `${displayName}:`;
      pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.setFontSize(8);
      pdf.text(label, 20, y);
      const textWidth = pdf.getTextWidth(label + ' ');
      drawDots(pdf, 20 + textWidth, y, skill.rating, 5, 1);
      y += 4;
    });
    
    let rightY = skillStartY;
    rightSkills.forEach(([name, skill]) => {
      const displayName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const label = skill.specialty 
        ? `${displayName} (${skill.specialty}):`
        : `${displayName}:`;
      pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.setFontSize(8);
      pdf.text(label, pageWidth / 2, rightY);
      const textWidth = pdf.getTextWidth(label + ' ');
      drawDots(pdf, pageWidth / 2 + textWidth, rightY, skill.rating, 5, 1);
      rightY += 4;
    });
    
    y = Math.max(y, rightY) + 5;
  }
  
  // Disciplines and Powers
  if (isVampire && character.disciplines && (character.disciplines as any[]).length > 0) {
    y = checkNewPage(pdf, y, 30);
    y = addSection(pdf, 'Disciplines', y);
    y += 4;
    
    (character.disciplines as { name: string; level: number }[]).forEach(disc => {
      pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.setFontSize(9);
      pdf.text(`${disc.name}:`, 20, y);
      const textWidth = pdf.getTextWidth(`${disc.name}: `);
      drawDots(pdf, 20 + textWidth, y, disc.level, 5);
      y += 5;
    });
    y += 3;
    
    if (character.powers && (character.powers as any[]).length > 0) {
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(8);
      (character.powers as { name: string; discipline: string; level: number }[]).forEach(power => {
        pdf.text(`• ${power.name} (${power.discipline} ${power.level})`, 25, y);
        y += 4;
      });
      y += 3;
    }
  }
  
  // Beliefs
  if (character.ambition || character.desire || (character.convictions && character.convictions.length > 0)) {
    y = checkNewPage(pdf, y, 30);
    y = addSection(pdf, 'Beliefs', y);
    y += 4;
    
    if (character.ambition) {
      y = addLabelValue(pdf, 'Ambition', character.ambition, y);
    }
    if (character.desire) {
      y = addLabelValue(pdf, 'Desire', character.desire, y);
    }
    if (character.convictions && character.convictions.length > 0) {
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text('Convictions:', 20, y);
      y += 4;
      character.convictions.forEach(conv => {
        pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
        pdf.setFontSize(8);
        pdf.text(`• ${conv}`, 25, y);
        y += 4;
      });
    }
    y += 3;
  }
  
  // Advantages & Flaws
  const hasAdvantages = character.advantages && (character.advantages as any[]).length > 0;
  const hasFlaws = character.flaws && (character.flaws as any[]).length > 0;
  
  if (hasAdvantages || hasFlaws) {
    y = checkNewPage(pdf, y, 30);
    y = addSection(pdf, 'Advantages & Flaws', y);
    y += 4;
    
    if (hasAdvantages) {
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text('Advantages:', 20, y);
      y += 4;
      (character.advantages as { name: string; rating?: number; type: string }[]).forEach(adv => {
        pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
        pdf.setFontSize(8);
        const rating = adv.rating || 1;
        const label = `• ${adv.name} (${adv.type})`;
        pdf.text(label, 25, y);
        const textWidth = pdf.getTextWidth(label + ' ');
        drawDots(pdf, 25 + textWidth, y, rating, 5, 1);
        y += 4;
      });
      y += 2;
    }
    
    if (hasFlaws) {
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text('Flaws:', 20, y);
      y += 4;
      (character.flaws as { name: string; rating?: number }[]).forEach(flaw => {
        pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
        pdf.setFontSize(8);
        const rating = flaw.rating || 1;
        const label = `• ${flaw.name}`;
        pdf.text(label, 25, y);
        const textWidth = pdf.getTextWidth(label + ' ');
        drawDots(pdf, 25 + textWidth, y, rating, 5, 1);
        y += 4;
      });
    }
    y += 3;
  }
  
  // Background sections
  if (character.appearance) {
    y = checkNewPage(pdf, y, 25);
    y = addSection(pdf, 'Appearance', y);
    y = addText(pdf, character.appearance, y + 4, { fontSize: 9 });
    y += 5;
  }
  
  if (character.history) {
    y = checkNewPage(pdf, y, 25);
    y = addSection(pdf, 'History', y);
    y = addText(pdf, character.history, y + 4, { fontSize: 9 });
    y += 5;
  }
  
  if (character.notes) {
    y = checkNewPage(pdf, y, 25);
    y = addSection(pdf, 'Notes', y);
    y = addText(pdf, character.notes, y + 4, { fontSize: 9 });
  }
  
  pdf.save(`${character.name.replace(/[^a-z0-9]/gi, '_')}_character.pdf`);
}
