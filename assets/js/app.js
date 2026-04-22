// Aplicação Principal
class App {
    constructor() {
        this.currentTopico = null;
        this.currentSubtopico = null;
        this.topicosExpandidos = new Set(['cadastro']); // Começar com Cadastro expandido
        this.basePath = typeof BASE_PATH !== 'undefined' ? BASE_PATH : '';
        this.init();
    }
    
    async init() {
        try {
            await db.ensureDB();
            await db.inicializarDadosPadrao();
            await this.loadComponents();
            this.setupNavigation();
            this.setupEventListeners();
            this.updateUI();
            
            // Carregar dashboard ou tela de boas-vindas
            this.showWelcomeScreen();
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showError('Erro ao inicializar aplicação');
        }
    }
    
    async loadComponents() {
        try {
            // Carregar sidebar
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                const url = this.basePath + '/components/sidebar.html';
                console.log('Carregando sidebar de:', url);
                const response = await fetch(url);
                if (!response.ok) throw new Error('Falha ao carregar sidebar');
                sidebarContainer.innerHTML = await response.text();
                this.renderTopicos();
            }
            
            // Carregar header
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                const url = this.basePath + '/components/header.html';
                console.log('Carregando header de:', url);
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
            // Navegação para Dashboard
            if (e.target.closest('[data-page="dashboard"]')) {
                e.preventDefault();
                this.showWelcomeScreen();
                this.updateBreadcrumb();
                
                // Remover active de todos os itens
                document.querySelectorAll('.subtopico-item, .nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                const dashboardItem = document.querySelector('[data-page="dashboard"]');
                if (dashboardItem) dashboardItem.classList.add('active');
            }
            
            // Navegação para Subtópico
            const subtopicoElement = e.target.closest('[data-subtopico]');
            if (subtopicoElement) {
                e.preventDefault();
                const topico = subtopicoElement.dataset.topico;
                const subtopico = subtopicoElement.dataset.subtopico;
                
                await this.carregarAnotacoes(topico, subtopico);
                
                // Atualizar classe active
                document.querySelectorAll('.subtopico-item, .nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                subtopicoElement.classList.add('active');
            }
        });
    }
    
    setupEventListeners() {
        // Logout
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-logout')) {
                auth.logout();
            }
        });
        
        // Delegação de eventos para botões de editar e excluir
        document.addEventListener('click', async (e) => {
            // Botão Editar
            const btnEditar = e.target.closest('[data-editar]');
            if (btnEditar) {
                e.preventDefault();
                e.stopPropagation();
                const id = btnEditar.dataset.editar;
                console.log('Clicou em Editar, ID:', id);
                await this.editarAnotacao(id);
            }
            
            // Botão Excluir
            const btnExcluir = e.target.closest('[data-excluir]');
            if (btnExcluir) {
                e.preventDefault();
                e.stopPropagation();
                const id = btnExcluir.dataset.excluir;
                console.log('Clicou em Excluir, ID:', id);
                await this.excluirAnotacao(id);
            }
        });
    }
    
    async carregarAnotacoes(topico, subtopico) {
        this.currentTopico = topico;
        this.currentSubtopico = subtopico;
        
        const wrapper = document.getElementById('content-wrapper');
        if (!wrapper) return;
        
        // Mostrar loading
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
            
            wrapper.innerHTML = `
                <div class="section-header">
                    <div>
                        <h2>${subtopicoInfo.nome}</h2>
                        <p style="color: #666; margin-top: 5px;">${topicoInfo.nome} > ${subtopicoInfo.nome}</p>
                    </div>
                    ${auth.isAdmin() ? `
                        <button class="btn-add" id="btn-nova-anotacao">
                            <i class="fas fa-plus"></i>
                            Novo Guia / Observação
                        </button>
                    ` : ''}
                </div>
                
                <div class="anotacoes-list" id="anotacoes-list">
                    ${this.renderAnotacoes(anotacoes)}
                </div>
            `;
            
            // Adicionar event listener para o botão de nova anotação
            const btnNova = document.getElementById('btn-nova-anotacao');
            if (btnNova) {
                btnNova.addEventListener('click', () => this.novaAnotacao());
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
    
    renderAnotacoes(anotacoes) {
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
            
            // Garantir que o ID seja um número
            const id = Number(anotacao.id);
            
            return `
                <div class="anotacao-bloco ${isGuia ? 'guia-bloco' : 'obs-bloco'}" data-id="${id}">
                    <div class="anotacao-header">
                        <div class="anotacao-titulo">
                            ${tipoIcon} ${this.escapeHtml(anotacao.titulo || 'Sem título')}
                            <span class="anotacao-tipo ${tipoClass}">${tipoLabel}</span>
                        </div>
                        ${auth.isAdmin() ? `
                            <div class="anotacao-actions">
                                <button class="btn-sm btn-primary" data-editar="${id}" type="button">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="btn-sm btn-danger" data-excluir="${id}" type="button">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${anotacao.subtitulo ? `
                        <div class="anotacao-subtitulo">
                            ${this.escapeHtml(anotacao.subtitulo)}
                        </div>
                    ` : ''}
                    
                    <div class="anotacao-conteudo">
                        ${editor.formatarConteudo(anotacao.conteudo || '')}
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
        
        const title = document.getElementById('page-title');
        if (title) {
            title.textContent = subtopico || 'Dashboard';
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
        
        // Adicionar event listeners aos cards
        document.querySelectorAll('[data-topico-card]').forEach(card => {
            card.addEventListener('click', () => {
                const topico = card.dataset.topicoCard;
                const topicoHeader = document.querySelector(`.topico-header[data-topico="${topico}"]`);
                if (topicoHeader) {
                    topicoHeader.click();
                }
            });
        });
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Dashboard';
        }
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
        
        console.log('Abrindo editor para novo conteúdo');
        
        if (typeof editor !== 'undefined') {
            editor.abrirEditor(this.currentTopico, this.currentSubtopico);
        } else {
            console.error('Editor não está definido');
            ui.showNotification('Erro ao abrir editor', 'error');
        }
    }
    
    async editarAnotacao(id) {
        console.log('Editando anotação ID:', id);
        
        if (!auth.isAdmin()) {
            ui.showNotification('Apenas administradores podem editar conteúdo', 'warning');
            return;
        }
        
        try {
            const idNumerico = Number(id);
            const anotacao = await db.getAnotacao(idNumerico);
            
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
        console.log('Excluindo anotação ID:', id);
        
        if (!auth.isAdmin()) {
            ui.showNotification('Apenas administradores podem excluir conteúdo', 'warning');
            return;
        }
        
        const confirmado = await ui.confirmDialog('Tem certeza que deseja excluir este conteúdo? Esta ação não pode ser desfeita.');
        
        if (confirmado) {
            try {
                const idNumerico = Number(id);
                await db.excluirAnotacao(idNumerico);
                await this.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
                ui.showNotification('Conteúdo excluído com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao excluir:', error);
                ui.showNotification('Erro ao excluir conteúdo: ' + error.message, 'error');
            }
        }
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

// Inicializar aplicação quando tudo estiver carregado
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando App...');
    app = new App();
    window.app = app;
});
