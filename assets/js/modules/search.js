// Módulo de Busca e Pesquisa
class SearchModule {
    constructor(app) {
        this.app = app;
        this.searchTerm = '';
        this.searchTimeout = null;
    }
    
    setup() {
        const searchInput = document.getElementById('search-input');
        const clearButton = document.getElementById('clear-search');
        
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.trim();
            
            if (clearButton) {
                clearButton.style.display = term ? 'block' : 'none';
            }
            
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.searchTerm = term;
                this.performSearch(term);
            }, 300);
        });
        
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                clearButton.style.display = 'none';
                this.searchTerm = '';
                
                if (this.app.currentTopico && this.app.currentSubtopico) {
                    this.app.carregarAnotacoes(this.app.currentTopico, this.app.currentSubtopico);
                } else {
                    this.app.showDashboard();
                }
            });
        }
    }
    
    async performSearch(term) {
        if (!term) {
            if (this.app.currentTopico && this.app.currentSubtopico) {
                await this.app.carregarAnotacoes(this.app.currentTopico, this.app.currentSubtopico);
            } else {
                this.app.showDashboard();
            }
            return;
        }
        
        try {
            const todasAnotacoes = await db.getTodasAnotacoes();
            
            const resultados = todasAnotacoes.filter(anotacao => {
                const searchableText = [
                    anotacao.titulo || '',
                    anotacao.subtitulo || '',
                    anotacao.conteudo || '',
                    ...(anotacao.tags || [])
                ].join(' ').toLowerCase();
                
                return searchableText.includes(term.toLowerCase());
            });
            
            this.showResults(resultados, term);
            
        } catch (error) {
            console.error('Erro na pesquisa:', error);
            ui.showNotification('Erro ao realizar pesquisa', 'error');
        }
    }
    
    showResults(resultados, term) {
        const wrapper = document.getElementById('content-wrapper');
        
        this.app.updateBreadcrumb('Pesquisa', `"${term}"`);
        document.getElementById('page-title').textContent = 'Resultados da Pesquisa';
        
        if (resultados.length === 0) {
            wrapper.innerHTML = `
                <div class="section-header">
                    <h2>Resultados da Pesquisa</h2>
                    <p>Termo pesquisado: "${term}"</p>
                </div>
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente outros termos</p>
                </div>
            `;
            return;
        }
        
        // Agrupar por tópico
        const agrupado = {};
        resultados.forEach(anotacao => {
            const chave = `${anotacao.topico}/${anotacao.subtopico}`;
            if (!agrupado[chave]) agrupado[chave] = [];
            agrupado[chave].push(anotacao);
        });
        
        let html = `
            <div class="section-header">
                <h2>Resultados da Pesquisa</h2>
                <p>${resultados.length} resultado(s) para "${term}"</p>
            </div>
        `;
        
        for (const [chave, anotacoes] of Object.entries(agrupado)) {
            const [topico, subtopico] = chave.split('/');
            const topicoInfo = this.app.getTopicoInfo(topico);
            const subtopicoInfo = topicoInfo.subtopicos.find(s => s.id === subtopico) || { nome: subtopico };
            
            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">
                        <i class="fas fa-folder"></i> 
                        ${topicoInfo.nome} > ${subtopicoInfo.nome}
                        <span style="font-size: 0.8em; color: #999; margin-left: 10px;">
                            (${anotacoes.length})
                        </span>
                    </h3>
                    ${this.app.renderAnotacoes(anotacoes, term)}
                </div>
            `;
        }
        
        wrapper.innerHTML = html;
    }
    
    highlightText(text, term) {
        if (!term || !text) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<span class="search-results-highlight">$1</span>');
    }
}
