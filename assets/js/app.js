// Aplicação Principal - Versão Corrigida
class App {
    constructor() {
        this.currentTopico = null;
        this.currentSubtopico = null;
        this.topicosExpandidos = new Set(['cadastro']);
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
            this.showDashboard();
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
                sidebarContainer.innerHTML = await response.text();
                this.renderTopicos();
            }
            
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                const url = this.basePath + '/components/header.html';
                const response = await fetch(url);
                headerContainer.innerHTML = await response.text();
                
                const user = auth.getCurrentUser();
                const userNameElement = document.getElementById('user-name');
                if (userNameElement && user) {
                    userNameElement.textContent = user.name;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar componentes:', error);
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
            if (e.target.closest('[data-page="dashboard"]')) {
                e.preventDefault();
                this.showDashboard();
                this.setActiveNav('dashboard');
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
                await this.editarAnotacao(btnEditar.dataset.editar);
            }
            
            const btnExcluir = e.target.closest('[data-excluir]');
            if (btnExcluir) {
                e.preventDefault();
                await this.excluirAnotacao(btnExcluir.dataset.excluir);
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
    
    async carregarAnotacoes(topico, subtopico) {
        this.currentTopico = topico;
        this.currentSubtopico = subtopico;
        
        const wrapper = document.getElementById('content-wrapper');
        if (!wrapper) return;
        
        wrapper.innerHTML = `<div style="text-align: center; padding: 50px;"><div class="loading"></div></div>`;
        
        try {
            const anotacoes = await db.getAnotacoes(topico, subtopico);
            const topicoInfo = this.getTopicoInfo(topico);
            const subtopicoInfo = topicoInfo.subtopicos.find(s => s.id === subtopico) || { nome: subtopico };
            
            this.updateBreadcrumb(topicoInfo.nome, subtopicoInfo.nome);
            document.getElementById('page-title').textContent = subtopicoInfo.nome;
            
            wrapper.innerHTML = `
                <div class="section-header">
                    <div>
                        <h2>${subtopicoInfo.nome}</h2>
                        <p style="color: #666;">${topicoInfo.nome} > ${subtopicoInfo.nome}</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${auth.isAdmin() ? `
                            <button class="btn-add" id="btn-nova-anotacao">
                                <i class="fas fa-plus"></i> Novo
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="anotacoes-list">
                    ${this.renderAnotacoes(anotacoes)}
                </div>
            `;
            
            document.getElementById('btn-nova-anotacao')?.addEventListener('click', () => this.novaAnotacao());
            
        } catch (error) {
            console.error('Erro ao carregar:', error);
            wrapper.innerHTML = `<div class="empty-state"><h3>Erro ao carregar conteúdo</h3></div>`;
        }
    }
    
    renderAnotacoes(anotacoes) {
        if (!anotacoes?.length) {
            return `<div class="empty-state"><h3>Nenhum conteúdo encontrado</h3></div>`;
        }
        
        return anotacoes.map(anotacao => {
            const isGuia = anotacao.tipo === 'guia';
            const id = Number(anotacao.id);
            
            return `
                <div class="anotacao-bloco ${isGuia ? 'guia-bloco' : 'obs-bloco'}">
                    <div class="anotacao-header">
                        <div class="anotacao-titulo">
                            ${isGuia ? '📘' : '📝'} ${this.escapeHtml(anotacao.titulo || 'Sem título')}
                            <span class="anotacao-tipo ${isGuia ? 'tipo-guia' : 'tipo-observacao'}">
                                ${isGuia ? 'Guia' : 'Observação'}
                            </span>
                        </div>
                        <div class="anotacao-actions">
                            ${auth.isAdmin() ? `
                                <button class="btn-sm btn-primary" data-editar="${id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-sm btn-danger" data-excluir="${id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${anotacao.subtitulo ? `<div class="anotacao-subtitulo">${this.escapeHtml(anotacao.subtitulo)}</div>` : ''}
                    <div class="anotacao-conteudo">${this.formatarConteudo(anotacao.conteudo || '')}</div>
                    <div class="anotacao-footer">
                        <span><i class="fas fa-user"></i> ${this.escapeHtml(anotacao.autor || 'Sistema')}</span>
                        <span><i class="fas fa-calendar"></i> ${this.formatarData(anotacao.dataCriacao)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    formatarConteudo(texto) {
        if (!texto) return '';
        
        return texto
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
    
    formatarData(dataISO) {
        if (!dataISO) return '';
        try {
            return new Date(dataISO).toLocaleDateString('pt-BR');
        } catch {
            return '';
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
    
    showDashboard() {
        const wrapper = document.getElementById('content-wrapper');
        wrapper.innerHTML = `
            <div class="welcome-screen">
                <i class="fas fa-book-open"></i>
                <h2>Guia Consinco</h2>
                <p>Selecione um tópico no menu lateral</p>
                <br>
                <p><strong>Credenciais:</strong></p>
                <p>Visualizador: user / 123456</p>
                <p>Admin: admin / admin123</p>
            </div>
        `;
        document.getElementById('page-title').textContent = 'Dashboard';
        this.updateBreadcrumb();
    }
    
    showError(message) {
        const wrapper = document.getElementById('content-wrapper');
        wrapper.innerHTML = `<div class="empty-state"><h3>Erro</h3><p>${message}</p></div>`;
    }
    
    novaAnotacao() {
        if (!auth.isAdmin()) {
            alert('Apenas administradores podem criar conteúdo');
            return;
        }
        
        if (typeof editor !== 'undefined') {
            editor.abrirEditor(this.currentTopico, this.currentSubtopico);
        } else {
            console.error('Editor não disponível');
            alert('Erro ao abrir editor');
        }
    }
    
    async editarAnotacao(id) {
        if (!auth.isAdmin()) {
            alert('Apenas administradores podem editar');
            return;
        }
        
        try {
            const anotacao = await db.getAnotacao(Number(id));
            if (anotacao && typeof editor !== 'undefined') {
                editor.abrirEditor(anotacao.topico, anotacao.subtopico, anotacao);
            }
        } catch (error) {
            alert('Erro ao carregar para edição');
        }
    }
    
    async excluirAnotacao(id) {
        if (!auth.isAdmin()) {
            alert('Apenas administradores podem excluir');
            return;
        }
        
        if (!confirm('Excluir este conteúdo?')) return;
        
        try {
            await db.excluirAnotacao(Number(id));
            await this.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
        } catch (error) {
            alert('Erro ao excluir');
        }
    }
    
    async salvarAnotacao(anotacao, isNew) {
        if (isNew) {
            return await db.salvarAnotacao(anotacao);
        } else {
            return await db.salvarAnotacao(anotacao);
        }
    }
    
    updateUI() {
        const user = auth.getCurrentUser();
        const userDisplay = document.getElementById('user-display');
        if (userDisplay && user) {
            userDisplay.textContent = `${user.name} ${auth.isAdmin() ? '(Admin)' : ''}`;
        }
    }
}

// Inicializar quando DOM estiver pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app;
});
