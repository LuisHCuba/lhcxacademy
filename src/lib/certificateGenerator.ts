import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CertificateData {
  id: number;
  userName: string;
  trackName: string;
  issueDate: string;
  userEmail?: string;
  trackType?: string;
}

/**
 * Converte uma cor RGB [r, g, b] para formato hexadecimal (#RRGGBB)
 */
const rgbToHex = (rgb: number[]): string => {
  return '#' + rgb.map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Gera um certificado em PDF e inicia o download
 * @param data Dados do certificado
 * @returns Promise resolvida quando o download foi iniciado
 */
export const generateCertificatePDF = async (data: CertificateData): Promise<void> => {
  // Criar documento PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Definir dimensões da página
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Cores modernas
  const colors = {
    primary: [63, 94, 251],       // Azul vibrante
    secondary: [252, 70, 107],    // Rosa
    accent: [80, 201, 195],       // Turquesa
    dark: [33, 41, 89],           // Azul escuro
    light: [245, 247, 250]        // Quase branco
  };
  
  // Cores em formato hexadecimal para o QR Code
  const hexColors = {
    primary: rgbToHex(colors.primary),
    secondary: rgbToHex(colors.secondary),
    accent: rgbToHex(colors.accent),
    dark: rgbToHex(colors.dark),
    light: rgbToHex(colors.light)
  };
  
  // Desenhar fundo com estilo moderno
  pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Adicionar decoração ao fundo
  // Círculos nos cantos (simplificado para evitar problemas com opacidade)
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.circle(0, 0, 80, 'F');
  
  pdf.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.circle(pageWidth, pageHeight, 80, 'F');
  
  // Adicionar área central branca 
  pdf.setDrawColor(220, 220, 220);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15, 15, pageWidth - 30, pageHeight - 30, 5, 5, 'FD');
  
  // Adicionar barra de destaque superior
  const barHeight = 15;
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(15, 15, pageWidth - 30, barHeight, 'F');
  
  // Logo e título do certificado
  pdf.setFillColor(255, 255, 255);
  pdf.circle(40, 22.5, 7, 'F');
  pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  
  // Título principal
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text('CERTIFICADO DE CONCLUSÃO', pageWidth / 2, 47, { align: 'center' });
  
  // Linha divisória decorativa
  pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 - 50, 52, pageWidth / 2 + 50, 52);
  
  // Elementos decorativos adicionais
  pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.circle(pageWidth / 2 - 70, 47, 3, 'F');
  pdf.circle(pageWidth / 2 + 70, 47, 3, 'F');
  
  // Texto do certificado com design moderno
  pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.text('Este certificado é conferido a', pageWidth / 2, 65, { align: 'center' });
  
  // Nome do usuário com destaque
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(30);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(data.userName, pageWidth / 2, 85, { align: 'center' });
  
  // Texto de conclusão
  pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.text('por completar com êxito o curso', pageWidth / 2, 100, { align: 'center' });
  
  // Nome do curso com destaque
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.text(data.trackName, pageWidth / 2, 115, { align: 'center' });
  
  // Adicionar tipo do curso se disponível
  if (data.trackType) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(14);
    pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    pdf.text(`Categoria: ${data.trackType}`, pageWidth / 2, 130, { align: 'center' });
  }
  
  // Data de emissão com formato moderno
  const formattedDate = format(new Date(data.issueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  pdf.text(`Emitido em ${formattedDate}`, pageWidth / 2, 145, { align: 'center' });
  
  // Assinatura digital
  pdf.setDrawColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 - 40, 165, pageWidth / 2 + 40, 165);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('GO ACADEMY', pageWidth / 2, 173, { align: 'center' });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Diretor de Educação Corporativa', pageWidth / 2, 180, { align: 'center' });
  
  // Adicionar elementos decorativos na assinatura
  pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.circle(pageWidth / 2 - 45, 165, 2, 'F');
  pdf.circle(pageWidth / 2 + 45, 165, 2, 'F');
  
  // Gerar QR Code para verificação com cores modernas
  const verificationUrl = `https://goacademy.com/verify/${data.id}`;
  
  const qrCodeOptions = {
    width: 128,
    margin: 1,
    color: {
      dark: hexColors.primary, // Usando formato hexadecimal
      light: '#FFFFFF'
    }
  };
  
  const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, qrCodeOptions);
  
  // Adicionar QR Code ao PDF
  const qrSize = 35;
  pdf.addImage(qrCodeDataURL, 'PNG', pageWidth - 55, pageHeight - 55, qrSize, qrSize);
  
  // Texto de verificação
  pdf.setFontSize(9);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('VERIFICAR AUTENTICIDADE', pageWidth - 37.5, pageHeight - 15, { align: 'center' });
  
  // Adicionar número do certificado com design moderno
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2], 0.1);
  pdf.roundedRect(20, pageHeight - 25, 90, 15, 3, 3, 'F');
  
  pdf.setFontSize(10);
  pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  pdf.text(`ID DO CERTIFICADO: ${data.id}`, 25, pageHeight - 16);
  
  // Rodapé moderno
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(15, pageHeight - 5, pageWidth - 30, 2, 'F');
  
  // Logo no rodapé
  pdf.setFontSize(8);
  pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  pdf.text('© GO ACADEMY - Plataforma de Aprendizado Corporativo', pageWidth / 2, pageHeight - 8, { align: 'center' });
  
  // Iniciar download do PDF
  pdf.save(`certificado-${data.trackName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

/**
 * Verifica a autenticidade de um certificado pelo ID
 * @param id ID do certificado
 * @returns URL para verificação
 */
export const getCertificateVerificationURL = (id: number): string => {
  return `https://goacademy.com/verify/${id}`;
}; 