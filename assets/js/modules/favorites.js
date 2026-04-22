// Módulo de Favoritos
class FavoritesModule {
    constructor(app) {
        this.app = app;
    }
    
    async toggle(id, button) {
        try {
            const isFavorito = await db.isFavorito(Number(id));
            
            if (isFavorito) {
                await db.removerFavorito(Number(id));
                button.innerHTML = '<i class="far fa-star"></i>';
                button.classList.remove('active');
                ui.showNotification('Removido dos favoritos', 'info');
            } else {
                await db.adicionarFavorito(Number(id));
                button.innerHTML = '<i class="fas fa-star"></i>';
                button.classList.add('active');
                ui.showNotification('Adicionado aos favoritos!', 'success');
            }
        } catch (error) {
            console.error('Erro ao alternar favorito:', error);
            ui.showNotification('Erro ao atualizar favorito', 'error');
        }
    }
    
    async showFavoritos() {
        const wrapper = document.getElementById('content-wrapper');
        
        try {
            const favoritos = await db.getFavoritos();
            
            this.app.updateBreadcrumb('', 'Favoritos');
            document.getElementById('page-title').textContent = 'Favoritos';
            
            if (favoritos.length === 0) {
                wrapper.innerHTML = `
                    <div class="section-header">
                        <h2>⭐ Meus Favoritos</h2>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-star"></i>
                        <h3>Nenhum favorito adicionado</h3>
                        <p>Clique na estrela nos guias para adicionar aos favoritos</p>
                    </div>
                `;
                return;
            }
            
            // Marcar como favoritos
            favoritos.forEach(f => f.isFavorito = true);
            
            wrapper.innerHTML = `
                <div class="section-header">
                    <h2>⭐ Meus Favoritos (${favoritos.length})</h2>
                </div>
                <div class="anotacoes-list">
                    ${this.app.renderAnotacoes(favoritos)}
                </div>
            `;
            
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            wrapper.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar favoritos</h3>
                </div>
            `;
        }
    }
}
