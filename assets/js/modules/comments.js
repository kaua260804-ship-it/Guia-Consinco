// Módulo de Comentários
class CommentsModule {
    constructor(app) {
        this.app = app;
        this.currentAnotacaoId = null;
    }
    
    async show(anotacaoId) {
        try {
            const anotacao = await db.getAnotacao(Number(anotacaoId));
            if (!anotacao) return;
            
            this.currentAnotacaoId = Number(anotacaoId);
            
            const comentarios = await db.getComentarios(Number(anotacaoId));
            const pendentes = auth.isAdmin() ? await db.getComentariosPendentes() : [];
            
            const modal = document.getElementById('comentarios-modal');
            const title = document.getElementById('comentarios-modal-title');
            const container = document.getElementById('comentarios-container');
            
            title.textContent = `Comentários - ${anotacao.titulo}`;
            
            let html = `
                <div class="comentarios-section">
                    <div class="comentarios-header">
                        <h4>${comentarios.length} Comentário(s)</h4>
                    </div>
                    <div class="comentarios-list">
                        ${comentarios.map(c => this.renderComentario(c, auth.isAdmin())).join('')}
                    </div>
            `;
            
            // Comentários pendentes (apenas admin)
            if (auth.isAdmin()) {
                const pendentesDaAnotacao = pendentes.filter(c => c.anotacaoId === Number(anotacaoId));
                if (pendentesDaAnotacao.length > 0) {
                    html += `
                        <div class="comentarios-section" style="margin-top: 20px;">
                            <h4>Pendentes (${pendentesDaAnotacao.length})</h4>
                            <div class="comentarios-list">
                                ${pendentesDaAnotacao.map(c => this.renderComentario(c, true, true)).join('')}
                            </div>
                        </div>
                    `;
                }
            }
            
            // Formulário para novo comentário
            html += `
                    <div class="comentarios-section" style="margin-top: 20px;">
                        <h4>Adicionar Comentário</h4>
                        <form id="comentario-form">
                            <div class="form-group">
                                <textarea id="comentario-conteudo" rows="3" required 
                                          placeholder="Escreva seu comentário..."></textarea>
                            </div>
                            <button type="submit" class="btn-sm btn-primary">
                                <i class="fas fa-paper-plane"></i> Enviar
                            </button>
                        </form>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
            modal.style.display = 'block';
            
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            ui.showNotification('Erro ao carregar comentários', 'error');
        }
    }
    
    renderComentario(comentario, isAdmin, isPendente = false) {
        return `
            <div class="comentario-item ${isPendente ? 'comentario-pendente' : ''}">
                <div class="comentario-header">
                    <span class="comentario-autor">
                        <i class="fas fa-user"></i> ${this.app.escapeHtml(comentario.autor || 'Anônimo')}
                    </span>
                    <span class="comentario-data">
                        ${ui.formatarData(comentario.dataCriacao)}
                    </span>
                </div>
                <div class="comentario-conteudo">
                    ${this.app.escapeHtml(comentario.conteudo || '')}
                </div>
                ${isAdmin ? `
                    <div class="comentario-actions">
                        ${isPendente ? `
                            <button class="btn-sm btn-success" data-aprovar="${comentario.id}">
                                <i class="fas fa-check"></i> Aprovar
                            </button>
                        ` : ''}
                        <button class="btn-sm btn-danger" data-excluir-comentario="${comentario.id}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    setupEventListeners() {
        const form = document.getElementById('comentario-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.adicionar();
            });
        }
        
        document.addEventListener('click', async (e) => {
            const btnAprovar = e.target.closest('[data-aprovar]');
            if (btnAprovar) {
                const id = btnAprovar.dataset.aprovar;
                await this.aprovar(id);
            }
            
            const btnExcluir = e.target.closest('[data-excluir-comentario]');
            if (btnExcluir) {
                const id = btnExcluir.dataset.excluirComentario;
                await this.excluir(id);
            }
        });
    }
    
    async adicionar() {
        const conteudo = document.getElementById('comentario-conteudo')?.value.trim();
        if (!conteudo) return;
        
        try {
            const user = auth.getCurrentUser();
            
            await db.adicionarComentario({
                anotacaoId: this.currentAnotacaoId,
                autor: user?.name || 'Anônimo',
                autorUsername: user?.username || '',
                conteudo: conteudo,
                aprovado: auth.isAdmin()
            });
            
            this.closeModal();
            
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
            this.show(this.currentAnotacaoId);
        } catch (error) {
            console.error('Erro ao aprovar:', error);
            ui.showNotification('Erro ao aprovar comentário', 'error');
        }
    }
    
    async excluir(id) {
        const confirmado = await ui.confirmDialog('Excluir este comentário?');
        if (!confirmado) return;
        
        try {
            await db.excluirComentario(Number(id));
            ui.showNotification('Comentário excluído!', 'success');
            this.show(this.currentAnotacaoId);
        } catch (error) {
            console.error('Erro ao excluir:', error);
            ui.showNotification('Erro ao excluir comentário', 'error');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('comentarios-modal');
        if (modal) modal.style.display = 'none';
    }
}
