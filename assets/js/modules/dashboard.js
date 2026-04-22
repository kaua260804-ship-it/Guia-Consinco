// Módulo de Dashboard e Estatísticas
class DashboardModule {
    constructor(app) {
        this.app = app;
    }
    
    async show() {
        const wrapper = document.getElementById('content-wrapper');
        
        try {
            const stats = await this.getStatistics();
            const favoritos = await db.getFavoritos();
            
            wrapper.innerHTML = `
                <div class="dashboard-container">
                    <h1>Dashboard</h1>
                    
                    <div class="stats-grid">
                        ${this.renderStatCard('fas fa-book', stats.totalGuias, 'Total de Guias')}
                        ${this.renderStatCard('fas fa-sticky-note', stats.totalObservacoes, 'Observações')}
                        ${this.renderStatCard('fas fa-star', stats.totalFavoritos, 'Favoritos')}
                        ${this.renderStatCard('fas fa-clock', stats.ultimas24h, 'Últimas 24h')}
                    </div>
                    
                    <div class="dashboard-section">
                        <h3><i class="fas fa-history"></i> Últimas Atualizações</h3>
                        <div class="recent-updates">
                            ${this.renderRecentUpdates(stats.recentes)}
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h3><i class="fas fa-trending-up"></i> Mais Acessados</h3>
                        <div class="popular-items">
                            ${this.renderPopularItems(stats.populares)}
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h3><i class="fas fa-star"></i> Favoritos Recentes</h3>
                        <div class="favorites-preview">
                            ${this.renderFavoritesPreview(favoritos.slice(0, 5))}
                        </div>
                    </div>
                </div>
            `;
            
            this.app.updateBreadcrumb();
            document.getElementById('page-title').textContent = 'Dashboard';
            
            this.setupItemClickListeners();
            
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            this.app.showWelcomeScreen();
        }
    }
    
    renderStatCard(icon, value, label) {
        return `
            <div class="stat-card">
                <i class="${icon}"></i>
                <div class="stat-info">
                    <span class="stat-value">${value}</span>
                    <span class="stat-label">${label}</span>
                </div>
            </div>
        `;
    }
    
    async getStatistics() {
        const anotacoes = await db.getTodasAnotacoes();
        const favoritos = await db.getFavoritos();
        
        const agora = new Date();
        const ultimas24h = new Date(agora - 24 * 60 * 60 * 1000);
        
        const views = JSON.parse(localStorage.getItem('guia_views') || '{}');
        
        const populares = anotacoes
            .map(a => ({ ...a, views: views[a.id] || 0 }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
        
        return {
            totalGuias: anotacoes.filter(a => a.tipo === 'guia').length,
            totalObservacoes: anotacoes.filter(a => a.tipo === 'observacao').length,
            totalFavoritos: favoritos.length,
            ultimas24h: anotacoes.filter(a => new Date(a.dataCriacao) > ultimas24h).length,
            recentes: anotacoes.slice(0, 5),
            populares: populares
        };
    }
    
    renderRecentUpdates(anotacoes) {
        if (!anotacoes.length) {
            return '<p style="color: #999;">Nenhuma atualização recente</p>';
        }
        
        return anotacoes.map(a => `
            <div class="update-item" data-anotacao-id="${a.id}">
                <div class="update-title">${this.app.escapeHtml(a.titulo)}</div>
                <div class="update-meta">
                    <span><i class="fas fa-user"></i> ${this.app.escapeHtml(a.autor)}</span>
                    <span><i class="fas fa-calendar"></i> ${ui.formatarData(a.dataAtualizacao || a.dataCriacao)}</span>
                    <span><i class="fas fa-folder"></i> ${a.subtopico}</span>
                </div>
            </div>
        `).join('');
    }
    
    renderPopularItems(anotacoes) {
        if (!anotacoes.length || anotacoes.every(a => a.views === 0)) {
            return '<p style="color: #999;">Nenhuma visualização registrada</p>';
        }
        
        return anotacoes.filter(a => a.views > 0).map(a => `
            <div class="popular-item" data-anotacao-id="${a.id}">
                <div class="update-title">${this.app.escapeHtml(a.titulo)}</div>
                <div class="update-meta">
                    <span><i class="fas fa-eye"></i> ${a.views} visualizações</span>
                    <span><i class="fas fa-folder"></i> ${a.subtopico}</span>
                </div>
            </div>
        `).join('');
    }
    
    renderFavoritesPreview(favoritos) {
        if (!favoritos.length) {
            return '<p style="color: #999;">Nenhum favorito adicionado</p>';
        }
        
        return favoritos.map(a => `
            <div class="popular-item" data-anotacao-id="${a.id}">
                <div class="update-title">${this.app.escapeHtml(a.titulo)}</div>
                <div class="update-meta">
                    <span><i class="fas fa-star" style="color: #f1c40f;"></i> Favorito</span>
                    <span><i class="fas fa-folder"></i> ${a.subtopico}</span>
                </div>
            </div>
        `).join('');
    }
    
    setupItemClickListeners() {
        document.querySelectorAll('[data-anotacao-id]').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.dataset.anotacaoId;
                const anotacao = await db.getAnotacao(Number(id));
                if (anotacao) {
                    await this.app.carregarAnotacoes(anotacao.topico, anotacao.subtopico);
                }
            });
        });
    }
}
