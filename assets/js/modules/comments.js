// Módulo de Comentários
class CommentsModule {
    constructor(app) {
        this.app = app;
        this.currentAnotacaoId = null;
    }
    
    async show(anotacaoId) {
        try {
            const anotacao = await db.getAnotacao(Number(anotacaoId));
            if (!anotacao) {
                ui.showNotification('Anotação não encontrada', 'error');
                return;
            }
            
            this.currentAnotacaoId = Number(anotacaoId);
            
            // Buscar comentários
            const comentarios = await db.getComentarios(Number(anotacaoId));
            
            // Buscar pendentes (apenas para admin)
            let pendentes = [];
            if (auth.isAdmin()) {
                pendentes = await db.getComentariosPendentes();
            }
            
            const modal = document.getElementById('comentarios-modal');
            const title = document.getElementById('comentarios-modal-title');
            const container = document.getElementById('comentarios-container');
            
            if (!modal || !title || !container) {
                console.error('Elementos do modal de comentários não encontrados');
                return;
            }
            
            title.textContent = `Comentários - ${anotacao.titulo || 'Sem título'}`;
            
            // Filtrar comentários aprovados para exibição
            const comentariosAprovados = comentarios.filter(c => c.aprovado === true);
            
            let html = `
                <div class="comentarios-section">
                    <div class="comentarios-header">
                        <h4>${comentariosAprovados.length} Comentário(s)</h4>
                    </div>
                    <div class="comentarios-list">
                        ${comentariosAprovados.length > 0 
                            ? comentariosAprovados.map(c => this.renderComentario(c, auth.isAdmin(), false)).join('')
                            : '<p style="color: #999; text-align: center;">Nenhum comentário ainda</p>'
                        }
                    </div>
            `;
            
            // Comentários pendentes (apenas admin)
            if (auth.isAdmin()) {
                const pendentesDaAnotacao = pendentes.filter(c => c.anotacaoId === Number(anotacaoId));
                if (pendentesDaAnotacao.length > 0) {
                    html += `
                        <div class="comentarios-section" style="margin-top: 20px;">
                            <h4 style="color: #f39c12;">
                                <i class="fas fa-clock"></i> 
                                Pendentes de Aprovação (${pendentesDaAnotacao.length})
                            </h4>
                            <div class="comentarios-list">
                                ${pendentesDaAnotacao.map(c => this.renderComentario(c, true, true)).join('')}
                            </div>
                        </div>
                    `;
                }
            }
            
            // Formulário para novo comentário
            const user = auth.getCurrentUser();
            html += `
                    <div class="comentarios-section" style="margin-top: 20px;">
                        <h4>Adicionar Comentário</h4>
                        <form id="comentario-form">
                            <div class="form-group">
                                <textarea id="comentario-conteudo" rows="3" required 
                                          placeholder="Escreva seu comentário..."></textarea>
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <button type="submit" class="btn-sm btn-primary">
                                    <i class="fas fa-paper-plane"></i> Enviar
                                </button>
                                <span style="font-size: 0.85em; color: #999;">
                                    Comentando como: <strong>${user?.name || 'Visitante'}</strong>
                                </span>
                            </div>
                            ${!auth.isAdmin() ? `
                                <p style="font-size: 0.8em; color: #f39c12; margin-top: 10px;">
                                    <i class="fas fa-info-circle"></i> 
                                    Seu comentário passará por aprovação antes de ser exibido.
                                </p>
                            ` : ''}
                        </form>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
            modal.style.display = 'block';
            
            // Configurar evento do formulário
            const form = document.getElementById('comentario-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.adicionar();
                });
            }
            
            // Configurar eventos dos botões de ação
            this.setupActionButtons();
            
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            ui.showNotification('Erro ao carregar comentários', 'error');
        }
    }
    
    renderComentario(comentario, isAdmin, isPendente = false) {
        const dataFormatada = ui.formatarData(comentario.dataCriacao);
        
        return `
            <div class="comentario-item ${isPendente ? 'comentario-pendente' : ''}" data-comentario-id="${comentario.id}">
                <div class="comentario-header">
                    <span class="comentario-autor">
                        <i class="fas fa-user-circle"></i> 
                        ${this.app.escapeHtml(comentario.autor || 'Anônimo')}
                        ${isPendente ? ' <span style="color: #f39c12; font-size: 0.8em;">(Pendente)</span>' : ''}
                    </span>
                    <span class="comentario-data">
                        <i class="far fa-clock"></i> ${dataFormatada}
                    </span>
                </div>
                <div class="comentario-conteudo">
                    ${this.app.escapeHtml(comentario.conteudo || '')}
                </div>
                ${isAdmin ? `
                    <div class="comentario-actions">
                        ${isPendente ? `
                            <button class="btn-sm btn-success" data-aprovar="${comentario.id}" title="Aprovar comentário">
                                <i class="fas fa-check"></i> Aprovar
                            </button>
                        ` : ''}
                        <button class="btn-sm btn-danger" data-excluir-comentario="${comentario.id}" title="Excluir comentário">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    setupActionButtons() {
        // Usar delegação de eventos no documento
        document.addEventListener('click', async (e) => {
            const btnAprovar = e.target.closest('[data-aprovar]');
            if (btnAprovar) {
                e.preventDefault();
                e.stopPropagation();
                const id = btnAprovar.dataset.aprovar;
                await this.aprovar(id);
            }
            
            const btnExcluir = e.target.closest('[data-excluir-comentario]');
            if (btnExcluir) {
                e.preventDefault();
                e.stopPropagation();
                const id = btnExcluir.dataset.excluirComentario;
                await this.excluir(id);
            }
        });
    }
    
    async adicionar() {
        const textarea = document.getElementById('comentario-conteudo');
        const conteudo = textarea?.value.trim();
        
        if (!conteudo) {
            ui.showNotification('Digite um comentário', 'warning');
            return;
        }
        
        try {
            const user = auth.getCurrentUser();
            
            await db.adicionarComentario({
                anotacaoId: this.currentAnotacaoId,
                autor: user?.name || 'Anônimo',
                autorUsername: user?.username || '',
                conteudo: conteudo,
                aprovado: auth.isAdmin() // Admin aprova automaticamente
            });
            
            // Limpar textarea
            if (textarea) textarea.value = '';
            
            // Recarregar comentários
            await this.show(this.currentAnotacaoId);
            
            if (auth.isAdmin()) {
                ui.showNotification('Comentário adicionado!', 'success');
            } else {
                ui.showNotification('Comentário enviado para aprovação!', 'info');
            }
            
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            ui.showNotification('Erro ao adicionar comentário', 'error');
        }
    }
    
    async aprovar(id) {
        try {
            await db.aprovarComentario(Number(id));
            ui.showNotification('Comentário aprovado!', 'success');
            await this.show(this.currentAnotacaoId);
        } catch (error) {
            console.error('Erro ao aprovar:', error);
            ui.showNotification('Erro ao aprovar comentário', 'error');
        }
    }
    
    async excluir(id) {
        const confirmado = await ui.confirmDialog('Excluir este comentário permanentemente?');
        if (!confirmado) return;
        
        try {
            await db.excluirComentario(Number(id));
            ui.showNotification('Comentário excluído!', 'success');
            await this.show(this.currentAnotacaoId);
        } catch (error) {
            console.error('Erro ao excluir:', error);
            ui.showNotification('Erro ao excluir comentário', 'error');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('comentarios-modal');
        if (modal) {
            modal.style.display = 'none';
            this.currentAnotacaoId = null;
        }
    }
}
