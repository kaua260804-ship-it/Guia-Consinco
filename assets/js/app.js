// Aplicação Principal
class App {
    constructor() {
        this.currentTopico = null;
        this.currentSubtopico = null;
        this.topicosExpandidos = new Set(['cadastro']);
        this.basePath = typeof BASE_PATH !== 'undefined' ? BASE_PATH : '';
        this.searchTerm = '';
        this.searchTimeout = null;
        this.currentAnotacaoForComments = null;
        this.init();
    }
    
    async init() {
        try {
            await db.ensureDB();
            await db.inicializarDadosPadrao();
            await this.loadComponents();
            this.setupNavigation();
            this.setupEventListeners();
            this.setupSearch();
            this.updateUI();
            
            this.showDashboard();
            
            // Atualizar dashboard a cada 30 segundos
            setInterval(() => {
                if (document.querySelector('.stats-grid')) {
                    this.showDashboard();
                }
            }, 30000);
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showError('Erro ao inicializar aplicação');
        }
    }
    
    async loadComponents() {
        try {
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                const url = this.basePath + '/components/sidebar.html';
                const response = await fetch(url);
                if (!response.ok) throw new Error('Falha ao carregar sidebar');
                sidebarContainer.innerHTML = await response.text();
                this.renderTopicos();
            }
            
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                const url = this.basePath + '/components/header.html';
                const response = await fetch(url);
                if (!response.ok) throw new Error('Falha ao carregar header');
                headerContainer.innerHTML = await response.text();
                
                const user = auth.getCurrentUser();
                const userNameElement = document.getElementById('user-name');
                if (userNameElement && user) {
                    userNameElement.textContent = user.name;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar componentes:', error);
            throw error;
        }
    }
    
    renderTopicos() {
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (!sidebarNav) return;
        
        const topicos = this.getTopicosEstrutura();
        
        sidebarNav.innerHTML = `
            <div class="nav-section">
                <div class="nav-item" data-page="dashboard">
                    <i class="fas fa-home"></i>
                    <span>Dashboard</span>
                </div>
                <div class="nav-item" data-page="favoritos">
                    <i class="fas fa-star"></i>
                    <span>Favoritos</span>
                </div>
            </div>
        `;
        
        topicos.forEach(topico => {
            const isExpanded = this.topicosExpandidos.has(topico.id);
            
            const section = document.createElement('div');
            section.className = 'nav-section';
            section.innerHTML = `
                <div class="topico-header ${isExpanded ? '' : 'collapsed'}" data-topico="${topico.id}">
                    <div style="display: flex; align-items: center;">
                        <i class="${topico.icone}"></i>
                        <span>${topico.nome}</span>
                    </div>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="subtopicos-container ${isExpanded ? '' : 'collapsed'}" data-container="${topico.id}">
                    ${topico.subtopicos.map(sub => `
                        <div class="subtopico-item" data-topico="${topico.id}" data-subtopico="${sub.id}">
                            <i class="fas fa-file-alt"></i>
                            <span>${sub.nome}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            sidebarNav.appendChild(section);
        });
        
        this.setupTopicoToggle();
    }
    
    getTopicosEstrutura() {
        return [
            {
                id: 'cadastro',
                nome: 'Cadastros',
                icone: 'fas fa-database',
                subtopicos: [
                    { id: 'familia', nome: 'Família' },
                    { id: 'produto', nome: 'Produto' },
                    { id: 'pessoa', nome: 'Pessoa' },
                    { id: 'fornecedor', nome: 'Fornecedor' },
                    { id: 'comprador', nome: 'Comprador' },
                    { id: 'categoria', nome: 'Categoria' }
                ]
            },
            {
                id: 'recebimento',
                nome: 'Recebimento',
                icone: 'fas fa-truck-loading',
                subtopicos: [
                    { id: 'nfe', nome: 'NFE - Recebimento de Nota' }
                ]
            },
            {
                id: 'inconsistencia',
                nome: 'Inconsistências',
                icone: 'fas fa-exclamation-triangle',
                subtopicos: [
                    { id: 'familia', nome: 'Família' },
                    { id: 'produto', nome: 'Produto' },
                    { id: 'fornecedor', nome: 'Fornecedor' },
                    { id: 'comprador', nome: 'Comprador' },
                    { id: 'categoria', nome: 'Categoria' },
                    { id: 'nfe', nome: 'NFE - Recebimento de Nota' }
                ]
            }
        ];
    }
    
    setupTopicoToggle() {
        document.querySelectorAll('.topico-header').forEach(header => {
            header.addEventListener('click', () => {
                const topico = header.dataset.topico;
                const container = document.querySelector(`[data-container="${topico}"]`);
                
                header.classList.toggle('collapsed');
                container.classList.toggle('collapsed');
                
                if (this.topicosExpandidos.has(topico)) {
                    this.topicosExpandidos.delete(topico);
                } else {
                    this.topicosExpandidos.add(topico);
                }
            });
        });
    }
    
    setupNavigation() {
        document.addEventListener('click', async (e) => {
            if (e.target.closest('[data-page="dashboard"]')) {
                e.preventDefault();
                this.showDashboard();
                this.updateBreadcrumb();
                this.setActiveNav('dashboard');
            }
            
            if (e.target.closest('[data-page="favoritos"]')) {
                e.preventDefault();
                await this.showFavoritos();
                this.setActiveNav('favoritos');
            }
            
            const subtopicoElement = e.target.closest('[data-subtopico]');
            if (subtopicoElement) {
                e.preventDefault();
                const topico = subtopicoElement.dataset.topico;
                const subtopico = subtopicoElement.dataset.subtopico;
                
                await this.carregarAnotacoes(topico, subtopico);
                this.setActiveNav(null, subtopicoElement);
            }
        });
    }
    
    setActiveNav(page = null, element = null) {
        document.querySelectorAll('.subtopico-item, .nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (page) {
            const navItem = document.querySelector(`[data-page="${page}"]`);
            if (navItem) navItem.classList.add('active');
        }
        
        if (element) {
            element.classList.add('active');
        }
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-logout')) {
                auth.logout();
            }
        });
        
        document.addEventListener('click', async (e) => {
            const btnEditar = e.target.closest('[data-editar]');
            if (btnEditar) {
                e.preventDefault();
                e.stopPropagation();
                const id = btnEditar.dataset.editar;
                await this.editarAnotacao(id);
            }
            
            const btnExcluir = e.target.closest('[data-excluir]');
            if (btnExcluir) {
                e.preventDefault();
                e.stopPropagation();
                const id = btnExcluir.dataset.excluir;
                await this.excluirAnotacao(id);
            }
            
            const btnFavorito = e.target.closest('[data-favorito]');
            if (btnFavorito) {
                e.preventDefault();
                e.stopPropagation();
                const id = btnFavorito.dataset.favorito;
                await this.toggleFavorito(id, btnFavorito);
            }
            
            const btnComentarios = e.target.closest('[data-comentarios]');
            if (btnComentarios) {
                e.preventDefault();
                e.stopPropagation();
                const id = btnComentarios.dataset.comentarios;
                await this.showComentarios(id);
            }
            
            const btnExportItem = e.target.closest('[data-export-item]');
            if (btnExportItem) {
                e.preventDefault();
                e.stopPropagation();
                const id = btnExportItem.dataset.exportItem;
                await this.exportarParaPDF(Number(id));
            }
        });
        
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.exportarParaPDF();
            });
        }
    }
    
    setupSearch() {
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
                
                if (this.currentTopico && this.currentSubtopico) {
                    this.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
                } else {
                    this.showDashboard();
                }
            });
        }
    }
    
    async performSearch(term) {
        if (!term) {
            if (this.currentTopico && this.currentSubtopico) {
                await this.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
            } else {
                this.showDashboard();
            }
            return;
        }
        
        try {
            const todasAnotacoes = await db.getTodasAnotacoes();
            
            const resultados = todasAnotacoes.filter(anotacao => {
                const searchableText = [
                    anotacao.titulo,
                    anotacao.subtitulo,
                    anotacao.conteudo,
                    ...(anotacao.tags || [])
                ].join(' ').toLowerCase();
                
                return searchableText.includes(term.toLowerCase());
            });
            
            this.showSearchResults(resultados, term);
            
        } catch (error) {
            console.error('Erro na pesquisa:', error);
            ui.showNotification('Erro ao realizar pesquisa', 'error');
        }
    }
    
    showSearchResults(resultados, term) {
        const wrapper = document.getElementById('content-wrapper');
        
        this.updateBreadcrumb('Pesquisa', `"${term}"`);
        document.getElementById('page-title').textContent = 'Resultados da Pesquisa';
        
        if (resultados.length === 0) {
            wrapper.innerHTML = `
                <div class="section-header">
                    <div>
                        <h2>Resultados da Pesquisa</h2>
                        <p>Termo pesquisado: "${term}"</p>
                    </div>
                </div>
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente outros termos ou verifique a ortografia</p>
                </div>
            `;
            return;
        }
        
        const agrupado = {};
        resultados.forEach(anotacao => {
            const chave = `${anotacao.topico}/${anotacao.subtopico}`;
            if (!agrupado[chave]) {
                agrupado[chave] = [];
            }
            agrupado[chave].push(anotacao);
        });
        
        let html = `
            <div class="section-header">
                <div>
                    <h2>Resultados da Pesquisa</h2>
                    <p>${resultados.length} resultado(s) encontrado(s) para "${term}"</p>
                </div>
            </div>
        `;
        
        for (const [chave, anotacoes] of Object.entries(agrupado)) {
            const [topico, subtopico] = chave.split('/');
            const topicoInfo = this.getTopicoInfo(topico);
            const subtopicoInfo = topicoInfo.subtopicos.find(s => s.id === subtopico) || { nome: subtopico };
            
            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: var(--primary-color); margin-bottom: 15px;">
                        <i class="fas fa-folder"></i> 
                        ${topicoInfo.nome} > ${subtopicoInfo.nome}
                        <span style="font-size: 0.8em; color: #999; margin-left: 10px;">
                            (${anotacoes.length} item${anotacoes.length > 1 ? 'ns' : ''})
                        </span>
                    </h3>
                    ${this.renderAnotacoes(anotacoes, term)}
                </div>
            `;
        }
        
        wrapper.innerHTML = html;
    }
    
    async showDashboard() {
        const wrapper = document.getElementById('content-wrapper');
        
        try {
            const stats = await this.getStatistics();
            const favoritos = await db.getFavoritos();
            
            wrapper.innerHTML = `
                <div class="dashboard-container">
                    <h1>Dashboard</h1>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <i class="fas fa-book"></i>
                            <div class="stat-info">
                                <span class="stat-value">${stats.totalGuias}</span>
                                <span class="stat-label">Total de Guias</span>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <i class="fas fa-sticky-note"></i>
                            <div class="stat-info">
                                <span class="stat-value">${stats.totalObservacoes}</span>
                                <span class="stat-label">Observações</span>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <i class="fas fa-star"></i>
                            <div class="stat-info">
                                <span class="stat-value">${stats.totalFavoritos}</span>
                                <span class="stat-label">Favoritos</span>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <i class="fas fa-clock"></i>
                            <div class="stat-info">
                                <span class="stat-value">${stats.ultimas24h}</span>
                                <span class="stat-label">Últimas 24h</span>
                            </div>
                        </div>
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
            
            this.updateBreadcrumb();
            document.getElementById('page-title').textContent = 'Dashboard';
            
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            this.showWelcomeScreen();
        }
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
                <div class="update-title">${this.escapeHtml(a.titulo)}</div>
                <div class="update-meta">
                    <span><i class="fas fa-user"></i> ${this.escapeHtml(a.autor)}</span>
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
                <div class="update-title">${this.escapeHtml(a.titulo)}</div>
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
                <div class="update-title">${this.escapeHtml(a.titulo)}</div>
                <div class="update-meta">
                    <span><i class="fas fa-star" style="color: #f1c40f;"></i> Favorito</span>
                    <span><i class="fas fa-folder"></i> ${a.subtopico}</span>
                </div>
            </div>
        `).join('');
    }
    
    async showFavoritos() {
        const wrapper = document.getElementById('content-wrapper');
        
        try {
            const favoritos = await db.getFavoritos();
            
            this.updateBreadcrumb('', 'Favoritos');
            document.getElementById('page-title').textContent = 'Favoritos';
            
            if (favoritos.length === 0) {
                wrapper.innerHTML = `
                    <div class="section-header">
                        <h2>⭐ Meus Favoritos</h2>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-star"></i>
                        <h3>Nenhum favorito adicionado</h3>
                        <p>Clique no ícone de estrela nos guias para adicionar aos favoritos</p>
                    </div>
                `;
                return;
            }
            
            wrapper.innerHTML = `
                <div class="section-header">
                    <h2>⭐ Meus Favoritos (${favoritos.length})</h2>
                </div>
                <div class="anotacoes-list">
                    ${this.renderAnotacoes(favoritos)}
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
    
    async toggleFavorito(id, button) {
        try {
            const isFavorito = await db.isFavorito(id);
            
            if (isFavorito) {
                await db.removerFavorito(id);
                button.innerHTML = '<i class="far fa-star"></i>';
                button.classList.remove('active');
                ui.showNotification('Removido dos favoritos', 'info');
            } else {
                await db.adicionarFavorito(id);
                button.innerHTML = '<i class="fas fa-star"></i>';
                button.classList.add('active');
                ui.showNotification('Adicionado aos favoritos!', 'success');
            }
        } catch (error) {
            console.error('Erro ao alternar favorito:', error);
            ui.showNotification('Erro ao atualizar favorito', 'error');
        }
    }
    
    async carregarAnotacoes(topico, subtopico) {
        this.currentTopico = topico;
        this.currentSubtopico = subtopico;
        
        const wrapper = document.getElementById('content-wrapper');
        if (!wrapper) return;
        
        wrapper.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <div class="loading"></div>
                <p>Carregando conteúdo...</p>
            </div>
        `;
        
        try {
            const anotacoes = await db.getAnotacoes(topico, subtopico);
            const topicoInfo = this.getTopicoInfo(topico);
            const subtopicoInfo = topicoInfo.subtopicos.find(s => s.id === subtopico) || { nome: subtopico };
            
            this.updateBreadcrumb(topicoInfo.nome, subtopicoInfo.nome);
            document.getElementById('page-title').textContent = subtopicoInfo.nome;
            
            // Carregar status de favoritos
            for (const anotacao of anotacoes) {
                anotacao.isFavorito = await db.isFavorito(anotacao.id);
            }
            
            wrapper.innerHTML = `
                <div class="section-header">
                    <div>
                        <h2>${subtopicoInfo.nome}</h2>
                        <p style="color: #666; margin-top: 5px;">${topicoInfo.nome} > ${subtopicoInfo.nome}</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${auth.isAdmin() ? `
                            <button class="btn-add" id="btn-nova-anotacao">
                                <i class="fas fa-plus"></i>
                                Novo Guia / Observação
                            </button>
                        ` : ''}
                        <button class="btn-icon" id="btn-export-current" title="Exportar para PDF">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                
                <div class="anotacoes-list" id="anotacoes-list">
                    ${this.renderAnotacoes(anotacoes)}
                </div>
            `;
            
            const btnNova = document.getElementById('btn-nova-anotacao');
            if (btnNova) {
                btnNova.addEventListener('click', () => this.novaAnotacao());
            }
            
            const btnExportCurrent = document.getElementById('btn-export-current');
            if (btnExportCurrent) {
                btnExportCurrent.addEventListener('click', () => this.exportarParaPDF());
            }
            
        } catch (error) {
            console.error('Erro ao carregar anotações:', error);
            wrapper.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar conteúdo</h3>
                    <p>Tente novamente mais tarde</p>
                </div>
            `;
        }
    }
    
    renderAnotacoes(anotacoes, highlightTerm = '') {
        if (!anotacoes || anotacoes.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <h3>Nenhum guia ou observação encontrado</h3>
                    <p>${auth.isAdmin() ? 'Clique em "Novo Guia / Observação" para começar' : 'Aguardando conteúdo do administrador'}</p>
                </div>
            `;
        }
        
        return anotacoes.map(anotacao => {
            const isGuia = anotacao.tipo === 'guia';
            const tipoIcon = isGuia ? '📘' : '📝';
            const tipoLabel = isGuia ? 'Guia' : 'Observação';
            const tipoClass = isGuia ? 'tipo-guia' : 'tipo-observacao';
            const id = Number(anotacao.id);
            const isFavorito = anotacao.isFavorito || false;
            
            let titulo = this.escapeHtml(anotacao.titulo || 'Sem título');
            let subtitulo = anotacao.subtitulo ? this.escapeHtml(anotacao.subtitulo) : '';
            let conteudo = anotacao.conteudo || '';
            
            if (highlightTerm) {
                const regex = new RegExp(`(${highlightTerm})`, 'gi');
                titulo = titulo.replace(regex, '<span class="search-results-highlight">$1</span>');
                subtitulo = subtitulo.replace(regex, '<span class="search-results-highlight">$1</span>');
                conteudo = conteudo.replace(regex, '<span class="search-results-highlight">$1</span>');
            }
            
            return `
                <div class="anotacao-bloco ${isGuia ? 'guia-bloco' : 'obs-bloco'}" data-id="${id}">
                    <div class="anotacao-header">
                        <div class="anotacao-titulo">
                            ${tipoIcon} ${titulo}
                            <span class="anotacao-tipo ${tipoClass}">${tipoLabel}</span>
                        </div>
                        <div class="anotacao-actions">
                            <button class="btn-sm btn-favorite ${isFavorito ? 'active' : ''}" data-favorito="${id}" type="button" title="Adicionar aos favoritos">
                                <i class="${isFavorito ? 'fas' : 'far'} fa-star"></i>
                            </button>
                            <button class="btn-sm btn-info" data-comentarios="${id}" type="button" title="Comentários">
                                <i class="fas fa-comment"></i>
                            </button>
                            <button class="btn-sm btn-secondary" data-export-item="${id}" type="button" title="Exportar item">
                                <i class="fas fa-download"></i>
                            </button>
                            ${auth.isAdmin() ? `
                                <button class="btn-sm btn-primary" data-editar="${id}" type="button">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-sm btn-danger" data-excluir="${id}" type="button">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${subtitulo ? `<div class="anotacao-subtitulo">${subtitulo}</div>` : ''}
                    
                    <div class="anotacao-conteudo">
                        ${editor.formatarConteudo(conteudo)}
                    </div>
                    
                    ${anotacao.tags && anotacao.tags.length > 0 ? `
                        <div class="anotacao-tags">
                            ${anotacao.tags.map(tag => `
                                <span class="tag">
                                    <i class="fas fa-tag"></i> ${this.escapeHtml(tag)}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="anotacao-footer">
                        <span>
                            <i class="fas fa-user"></i> ${this.escapeHtml(anotacao.autor || 'Sistema')}
                        </span>
                        <span>
                            <i class="fas fa-calendar"></i> ${ui.formatarData(anotacao.dataCriacao)}
                            ${anotacao.dataAtualizacao && anotacao.dataAtualizacao !== anotacao.dataCriacao ? 
                                '<i class="fas fa-edit" style="margin-left: 10px;"></i> Atualizado' : ''}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    async showComentarios(anotacaoId) {
        try {
            const anotacao = await db.getAnotacao(anotacaoId);
            if (!anotacao) return;
            
            this.currentAnotacaoForComments = anotacaoId;
            
            const comentarios = await db.getComentarios(anotacaoId);
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
            
            if (auth.isAdmin() && pendentes.length > 0) {
                const pendentesDaAnotacao = pendentes.filter(c => c.anotacaoId === Number(anotacaoId));
                if (pendentesDaAnotacao.length > 0) {
                    html += `
                        <div class="comentarios-section" style="margin-top: 20px;">
                            <h4>Comentários Pendentes (${pendentesDaAnotacao.length})</h4>
                            <div class="comentarios-list">
                                ${pendentesDaAnotacao.map(c => this.renderComentario(c, true, true)).join('')}
                            </div>
                        </div>
                    `;
                }
            }
            
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
            
            document.getElementById('comentario-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.adicionarComentario(anotacaoId);
            });
            
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
                        <i class="fas fa-user"></i> ${this.escapeHtml(comentario.autor)}
                    </span>
                    <span class="comentario-data">
                        ${ui.formatarData(comentario.dataCriacao)}
                    </span>
                </div>
                <div class="comentario-conteudo">
                    ${this.escapeHtml(comentario.conteudo)}
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
    
    async adicionarComentario(anotacaoId) {
        const conteudo = document.getElementById('comentario-conteudo')?.value.trim();
        if (!conteudo) return;
        
        try {
            const user = auth.getCurrentUser();
            
            await db.adicionarComentario({
                anotacaoId: Number(anotacaoId),
                autor: user?.name || 'Anônimo',
                autorUsername: user?.username || '',
                conteudo: conteudo,
                aprovado: auth.isAdmin()
            });
            
            ui.closeComentariosModal();
            
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
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getTopicoInfo(topicoId) {
        return this.getTopicosEstrutura().find(t => t.id === topicoId) || { nome: topicoId, subtopicos: [] };
    }
    
    updateBreadcrumb(topico = '', subtopico = '') {
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) {
            breadcrumb.textContent = topico && subtopico ? `${topico} > ${subtopico}` : '';
        }
    }
    
    showWelcomeScreen() {
        const wrapper = document.getElementById('content-wrapper');
        if (!wrapper) return;
        
        wrapper.innerHTML = `
            <div class="welcome-screen">
                <i class="fas fa-book-open"></i>
                <h2>Bem-vindo ao Guia Consinco</h2>
                <p>Selecione um tópico no menu lateral para acessar os guias e observações</p>
                <br>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 30px;">
                    <div class="dashboard-card" data-topico-card="cadastro">
                        <i class="fas fa-database" style="font-size: 2em; margin-bottom: 10px; color: #3498db;"></i>
                        <h3>Cadastros</h3>
                        <p>Guias para cadastro de produtos, pessoas, fornecedores e mais</p>
                    </div>
                    <div class="dashboard-card" data-topico-card="recebimento">
                        <i class="fas fa-truck-loading" style="font-size: 2em; margin-bottom: 10px; color: #27ae60;"></i>
                        <h3>Recebimento</h3>
                        <p>Processos de recebimento de notas fiscais e mercadorias</p>
                    </div>
                    <div class="dashboard-card" data-topico-card="inconsistencia">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 10px; color: #e74c3c;"></i>
                        <h3>Inconsistências</h3>
                        <p>Resolução de problemas e inconsistências comuns</p>
                    </div>
                </div>
                <br><br>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 5px 0;"><strong>🔐 Credenciais de acesso:</strong></p>
                    <p style="margin: 5px 0;">Visualizador: <code>user</code> / <code>123456</code></p>
                    <p style="margin: 5px 0;">Administrador: <code>admin</code> / <code>admin123</code></p>
                </div>
            </div>
        `;
        
        document.querySelectorAll('[data-topico-card]').forEach(card => {
            card.addEventListener('click', () => {
                const topico = card.dataset.topicoCard;
                const topicoHeader = document.querySelector(`.topico-header[data-topico="${topico}"]`);
                if (topicoHeader) topicoHeader.click();
            });
        });
        
        document.getElementById('page-title').textContent = 'Dashboard';
    }
    
    showError(message) {
        const wrapper = document.getElementById('content-wrapper');
        if (wrapper) {
            wrapper.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    novaAnotacao() {
        if (!auth.isAdmin()) {
            ui.showNotification('Apenas administradores podem criar conteúdo', 'warning');
            return;
        }
        
        if (typeof editor !== 'undefined') {
            editor.abrirEditor(this.currentTopico, this.currentSubtopico);
        } else {
            ui.showNotification('Erro ao abrir editor', 'error');
        }
    }
    
    async editarAnotacao(id) {
        if (!auth.isAdmin()) {
            ui.showNotification('Apenas administradores podem editar conteúdo', 'warning');
            return;
        }
        
        try {
            const anotacao = await db.getAnotacao(Number(id));
            if (anotacao && typeof editor !== 'undefined') {
                editor.abrirEditor(anotacao.topico, anotacao.subtopico, anotacao);
            } else {
                ui.showNotification('Erro ao carregar conteúdo para edição', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar anotação:', error);
            ui.showNotification('Erro ao carregar conteúdo', 'error');
        }
    }
    
    async excluirAnotacao(id) {
        if (!auth.isAdmin()) {
            ui.showNotification('Apenas administradores podem excluir conteúdo', 'warning');
            return;
        }
        
        const confirmado = await ui.confirmDialog('Tem certeza que deseja excluir este conteúdo? Esta ação não pode ser desfeita.');
        
        if (confirmado) {
            try {
                await db.excluirAnotacao(Number(id));
                
                if (this.currentTopico && this.currentSubtopico) {
                    await this.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
                } else {
                    this.showDashboard();
                }
                
                ui.showNotification('Conteúdo excluído com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao excluir:', error);
                ui.showNotification('Erro ao excluir conteúdo', 'error');
            }
        }
    }
    
    async exportarParaPDF(anotacaoId = null) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            let anotacoes;
            let titulo = 'Guia Consinco';
            
            if (anotacaoId) {
                const anotacao = await db.getAnotacao(anotacaoId);
                anotacoes = [anotacao];
                titulo = anotacao.titulo;
            } else if (this.currentTopico && this.currentSubtopico) {
                anotacoes = await db.getAnotacoes(this.currentTopico, this.currentSubtopico);
                const topicoInfo = this.getTopicoInfo(this.currentTopico);
                const subtopicoInfo = topicoInfo.subtopicos.find(s => s.id === this.currentSubtopico);
                titulo = `${subtopicoInfo?.nome || this.currentSubtopico} - ${topicoInfo.nome}`;
            } else {
                anotacoes = await db.getTodasAnotacoes();
                titulo = 'Todos os Guias';
            }
            
            let y = 20;
            
            doc.setFontSize(20);
            doc.setTextColor(44, 62, 80);
            doc.text(titulo, 20, y);
            y += 15;
            
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, 20, y);
            y += 15;
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            for (const anotacao of anotacoes) {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.setFontSize(11);
                doc.setTextColor(52, 152, 219);
                doc.text(`${anotacao.tipo === 'guia' ? '📘 GUIA' : '📝 OBSERVAÇÃO'}`, 20, y);
                y += 8;
                
                doc.setFontSize(14);
                doc.setTextColor(44, 62, 80);
                doc.text(anotacao.titulo || 'Sem título', 20, y);
                y += 8;
                
                if (anotacao.subtitulo) {
                    doc.setFontSize(12);
                    doc.setTextColor(100, 100, 100);
                    doc.text(anotacao.subtitulo, 20, y);
                    y += 8;
                }
                
                doc.setFontSize(11);
                doc.setTextColor(60, 60, 60);
                
                const linhas = doc.splitTextToSize(
                    (anotacao.conteudo || '').replace(/[#*_`=\[\]]/g, ''),
                    170
                );
                
                for (const linha of linhas) {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(linha, 20, y);
                    y += 6;
                }
                
                y += 10;
                doc.setDrawColor(200, 200, 200);
                doc.line(20, y, 190, y);
                y += 10;
            }
            
            doc.save(`guia-consinco-${Date.now()}.pdf`);
            ui.showNotification('PDF exportado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            ui.showNotification('Erro ao exportar PDF', 'error');
        }
    }
    
    registerView(anotacaoId) {
        const views = JSON.parse(localStorage.getItem('guia_views') || '{}');
        views[anotacaoId] = (views[anotacaoId] || 0) + 1;
        localStorage.setItem('guia_views', JSON.stringify(views));
    }
    
    updateUI() {
        const user = auth.getCurrentUser();
        const isAdmin = auth.isAdmin();
        
        const userDisplay = document.getElementById('user-display');
        if (userDisplay && user) {
            userDisplay.textContent = `${user.name} ${isAdmin ? '(Admin)' : '(Visualizador)'}`;
        }
    }
}

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando App...');
    app = new App();
    window.app = app;
});

// Estender UI para fechar modal de comentários
if (typeof ui !== 'undefined') {
    ui.closeComentariosModal = function() {
        const modal = document.getElementById('comentarios-modal');
        if (modal) modal.style.display = 'none';
    };
}
