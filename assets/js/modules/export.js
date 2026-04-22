// Módulo de Exportação PDF
class ExportModule {
    constructor(app) {
        this.app = app;
    }
    
    async exportarPDF(anotacaoId = null) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            let anotacoes;
            let titulo = 'Guia Consinco';
            
            if (anotacaoId) {
                const anotacao = await db.getAnotacao(Number(anotacaoId));
                anotacoes = [anotacao];
                titulo = anotacao.titulo || 'Guia';
            } else if (this.app.currentTopico && this.app.currentSubtopico) {
                anotacoes = await db.getAnotacoes(this.app.currentTopico, this.app.currentSubtopico);
                const topicoInfo = this.app.getTopicoInfo(this.app.currentTopico);
                titulo = `${this.app.currentSubtopico} - ${topicoInfo.nome}`;
            } else {
                anotacoes = await db.getTodasAnotacoes();
                titulo = 'Todos os Guias';
            }
            
            if (!anotacoes || anotacoes.length === 0) {
                ui.showNotification('Nenhum conteúdo para exportar', 'warning');
                return;
            }
            
            let y = 20;
            
            // Título
            doc.setFontSize(18);
            doc.setTextColor(44, 62, 80);
            doc.text(titulo, 20, y);
            y += 12;
            
            // Data
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, 20, y);
            y += 15;
            
            for (const anotacao of anotacoes) {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                
                // Tipo
                doc.setFontSize(10);
                doc.setTextColor(52, 152, 219);
                doc.text(anotacao.tipo === 'guia' ? '📘 GUIA' : '📝 OBSERVACAO', 20, y);
                y += 7;
                
                // Título
                doc.setFontSize(13);
                doc.setTextColor(44, 62, 80);
                doc.text(this.limparTexto(anotacao.titulo || 'Sem título'), 20, y);
                y += 7;
                
                // Subtítulo
                if (anotacao.subtitulo) {
                    doc.setFontSize(11);
                    doc.setTextColor(100, 100, 100);
                    doc.text(this.limparTexto(anotacao.subtitulo), 20, y);
                    y += 7;
                }
                
                // Conteúdo
                doc.setFontSize(10);
                doc.setTextColor(60, 60, 60);
                
                const conteudoLimpo = this.limparTexto(anotacao.conteudo || '');
                const linhas = doc.splitTextToSize(conteudoLimpo, 170);
                
                for (const linha of linhas) {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(linha, 20, y);
                    y += 5;
                }
                
                // Tags
                if (anotacao.tags && anotacao.tags.length > 0) {
                    y += 3;
                    doc.setFontSize(9);
                    doc.setTextColor(150, 150, 150);
                    doc.text(`Tags: ${anotacao.tags.join(', ')}`, 20, y);
                }
                
                y += 8;
                doc.setDrawColor(200, 200, 200);
                doc.line(20, y, 190, y);
                y += 10;
            }
            
            // Rodapé
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
            }
            
            doc.save(`guia-consinco-${Date.now()}.pdf`);
            ui.showNotification('PDF exportado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            ui.showNotification('Erro ao exportar PDF: ' + error.message, 'error');
        }
    }
    
    limparTexto(texto) {
        if (!texto) return '';
        return texto
            .replace(/[#*_`=\[\]<>]/g, '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .trim();
    }
}
