import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * 从 DOM 元素生成 PDF
 * @param title - PDF 文件名（不含扩展名）
 * @param element - 要转换为 PDF 的 DOM 元素
 */
export async function generatePDFFromDOM(
  title: string,
  element: HTMLElement
): Promise<void> {
  try {
    // 显示加载提示
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = '正在生成 PDF...';
    loadingMsg.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
    `;
    document.body.appendChild(loadingMsg);

    // 创建 canvas
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      // 确保中文字符正确渲染
      onclone: (clonedDoc) => {
        // 可以在这里修改克隆的文档
        const clonedElement = clonedDoc.querySelector('[id="editor-scroll-container"]') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.height = 'auto';
        }
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210; // A4 宽度 (mm)
    const pageHeight = 297; // A4 高度 (mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // 第一页
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 后续页
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 保存 PDF
    pdf.save(`${title}.pdf`);

    // 移除加载提示
    document.body.removeChild(loadingMsg);
  } catch (error) {
    console.error('PDF export failed:', error);

    // 显示错误提示
    const errorMsg = document.createElement('div');
    errorMsg.textContent = 'PDF 导出失败，请重试';
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(220, 38, 38, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
    `;
    document.body.appendChild(errorMsg);

    // 3秒后自动移除
    setTimeout(() => {
      document.body.removeChild(errorMsg);
    }, 3000);

    throw error;
  }
}

/**
 * 简化版 PDF 导出（直接从 TipTap HTML 内容生成）
 * 这个方法不依赖 html2canvas，更轻量但样式受限
 * @param title - PDF 文件名
 * @param htmlContent - HTML 内容字符串
 */
export async function generatePDFFromHTML(
  title: string,
  htmlContent: string
): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 添加中文字体支持（需要先加载字体）
    // doc.addFont('/fonts/NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal');
    // doc.setFont('NotoSansSC');

    // 标题
    doc.setFontSize(20);
    doc.text(title, 20, 20);

    // 内容
    doc.setFontSize(12);

    // 解析 HTML 内容（简化版）
    const parser = new DOMParser();
    const docDom = parser.parseFromString(htmlContent, 'text/html');
    const elements = docDom.body.children;

    let yPosition = 40;
    const pageHeight = 297; // A4 高度
    const margin = 20;
    const maxWidth = 170;

    for (const element of elements) {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      if (element.tagName === 'H1') {
        doc.setFontSize(18);
        doc.text(element.textContent || '', margin, yPosition);
        yPosition += 10;
      } else if (element.tagName === 'H2') {
        doc.setFontSize(16);
        doc.text(element.textContent || '', margin, yPosition);
        yPosition += 8;
      } else if (element.tagName === 'H3') {
        doc.setFontSize(14);
        doc.text(element.textContent || '', margin, yPosition);
        yPosition += 6;
      } else if (element.tagName === 'P') {
        doc.setFontSize(12);
        const text = element.textContent || '';
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 6;
      } else if (element.tagName === 'UL' || element.tagName === 'OL') {
        doc.setFontSize(12);
        const listItems = element.querySelectorAll('li');
        listItems.forEach((li) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          const text = li.textContent || '';
          const prefix = element.tagName === 'OL' ? '• ' : '- ';
          const lines = doc.splitTextToSize(prefix + text, maxWidth - 5);
          doc.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6;
        });
      }
    }

    // 保存
    doc.save(`${title}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}
