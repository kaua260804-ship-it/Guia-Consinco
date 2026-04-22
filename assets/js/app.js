// Aplicação Principal - Versão Final com Todos os Módulos
class App {
    constructor() {
        this.currentTopico = null;
        this.currentSubtopico = null;
        this.topicosExpandidos = new Set(['cadastro']);
        this.basePath = typeof BASE_PATH !== 'undefined' ? BASE_PATH : '';
        
        // Inicializar módulos principais
        this.searchModule = new SearchModule(this);
        this.exportModule = new ExportModule(this);
        this.favoritesModule = new FavoritesModule(this);
        this.commentsModule = new CommentsModule(this);
        this.dashboardModule = new DashboardModule(this);
        
        // Módulos avançados (inicializados depois)
        this.virtualScroll = null;
        this.dragDrop = null;
        this.mobileLayout = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Verificar criptografia
            if (!encryption.isEnabled() && auth.isAdmin()) {
                await this.setupEncryption();
            }
            
            await db.ensureDB();
            await db.inicializarDadosPadrao();
            await this.loadComponents();
            
            // Inicializar módulos avançados
            this.mobileLayout = new MobileLayout(this);
            
            // Configurar colaboração
            collaboration.on('change', (data) => this.handleRemoteChange(data));
            collaboration.on('editing', (data) => this.handleRemoteEditing(data));
            
            this.setupNavigation();
            this.setupEventListeners();
            this.searchModule.setup();
            this.updateUI();
            
            this.dashboardModule.show();
            
            // Atualizar dashboard periodicamente
            setInterval(() => {
                if (document.querySelector('.stats-grid')) {
                    this.dashboardModule.show();
                }
            }, 30000);
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showError('Erro ao inicializar aplicação');
        }
    }
    
    async setupEncryption() {
        const password = prompt('🔐 Configure uma senha mestra para criptografar os dados:\n(Guarde bem esta senha!)');
        if (password && password.length >= 6) {
            await encryption.setMasterPassword(password);
            ui.showNotification('Criptografia ativada com sucesso!', 'success');
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
                
                // Adicionar botão de auditoria para admin
                if (auth.isAdmin()) {
                    const headerActions = document.querySelector('.header-actions');
                    if (headerActions) {
                        const auditBtn = document.createElement('button');
                        auditBtn.className = 'btn-icon';
                        auditBtn.id = 'btn-audit';
                        auditBtn.title = 'Registro de Atividades';
                        auditBtn.innerHTML = '<i class="fas fa-history"></i>';
                        headerActions.insertBefore(auditBtn, headerActions.firstChild);
                    }
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
                <div class="nav-item" data-page="favoritos">
                    <i class="fas fa-star"></i>
                    <span>Favoritos</span>
                </div>
                ${auth.isAdmin() ? `
                    <div class="nav-item" id="btn-encryption-settings">
                        <i class="fas fa-lock"></i>
                        <span>Criptografia</span>
                    </div>
                ` : ''}
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
                this.dashboardModule.show();
                this.setActiveNav('dashboard');
            }
            
            if (e.target.closest('[data-page="favoritos"]')) {
                e.preventDefault();
                await this.favoritesModule.showFavoritos();
                this.setActiveNav('favoritos');
            }
            
            if (e.target.closest('#btn-encryption-settings')) {
                e.preventDefault();
                this.showEncryptionSettings();
            }
            
            if (e.target.closest('#btn-audit')) {
                e.preventDefault();
                this.showAuditLogs();
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
            
            const btnFavorito = e.target.closest('[data-favorito]');
            if (btnFavorito) {
                e.preventDefault();
                await this.favoritesModule.toggle(btnFavorito.dataset.favorito, btnFavorito);
            }
            
            const btnComentarios = e.target.closest('[data-comentarios]');
            if (btnComentarios) {
                e.preventDefault();
                await this.commentsModule.show(btnComentarios.dataset.comentarios);
            }
            
            const btnExportItem = e.target.closest('[data-export-item]');
            if (btnExportItem) {
                e.preventDefault();
                await this.exportModule.exportarPDF(btnExportItem.dataset.exportItem);
            }
            
            const btnVersoes = e.target.closest('[data-versoes]');
            if (btnVersoes) {
                e.preventDefault();
                this.showVersoes(btnVersoes.dataset.versoes);
            }
        });
        
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.exportModule.exportarPDF());
        }
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
            let anotacoes = await db.getAnotacoes(topico, subtopico);
            
            // Descriptografar anotações
            for (let i = 0; i < anotacoes.length; i++) {
                anotacoes[i] = await encryption.decryptAnotacao(anotacoes[i]);
                anotacoes[i].isFavorito = await db.isFavorito(anotacoes[i].id);
            }
            
            // Aplicar ordenação personalizada (drag and drop)
            if (this.dragDrop) {
                anotacoes = this.dragDrop.applyOrder(anotacoes);
            }
            
            const topicoInfo = this.getTopicoInfo(topico);
            const subtopicoInfo = topicoInfo.subtopicos.find(s => s.id === subtopico) || { nome: subtopico };
            
            this.updateBreadcrumb(topicoInfo.nome, subtopicoInfo.nome);
            document.getElementById('page-title').textContent = subtopicoInfo.nome;
            
            // Registrar visualização para auditoria
            audit.log('VISUALIZAR', topico, subtopico, `${anotacoes.length} itens`);
            
            // Usar Virtual Scroll para listas grandes
            if (anotacoes.length > 50) {
                this.renderWithVirtualScroll(wrapper, anotacoes, topicoInfo, subtopicoInfo);
            } else {
                this.renderNormal(wrapper, anotacoes, topicoInfo, subtopicoInfo);
            }
            
        } catch (error) {
            console.error('Erro ao carregar:', error);
            wrapper.innerHTML = `<div class="empty-state"><h3>Erro ao carregar conteúdo</h3></div>`;
        }
    }
    
    renderNormal(wrapper, anotacoes, topicoInfo, subtopicoInfo) {
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
                    <button class="btn-icon" id="btn-export-current" title="Exportar PDF">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
            
            <div class="anotacoes-list" id="anotacoes-list">
                ${this.renderAnotacoes(anotacoes)}
            </div>
        `;
        
        // Inicializar Drag and Drop
        this.dragDrop = new DragDrop(document.getElementById('anotacoes-list'), this);
        
        document.getElementById('btn-nova-anotacao')?.addEventListener('click', () => this.novaAnotacao());
        document.getElementById('btn-export-current')?.addEventListener('click', () => this.exportModule.exportarPDF());
    }
    
    renderWithVirtualScroll(wrapper, anotacoes, topicoInfo, subtopicoInfo) {
        wrapper.innerHTML = `
            <div class="section-header">
                <div>
                    <h2>${subtopicoInfo.nome}</h2>
                    <p style="color: #666;">${topicoInfo.nome} > ${subtopicoInfo.nome} (${anotacoes.length} itens)</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    ${auth.isAdmin() ? `
                        <button class="btn-add" id="btn-nova-anotacao">
                            <i class="fas fa-plus"></i> Novo
                        </button>
                    ` : ''}
                    <button class="btn-icon" id="btn-export-current" title="Exportar PDF">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
            <div id="virtual-scroll-container" style="height: 70vh; overflow-y: auto;"></div>
        `;
        
        const container = document.getElementById('virtual-scroll-container');
        this.virtualScroll = new AnotacoesVirtualScroll(container, this);
        this.virtualScroll.setItems(anotacoes);
        
        document.getElementById('btn-nova-anotacao')?.addEventListener('click', () => this.novaAnotacao());
        document.getElementById('btn-export-current')?.addEventListener('click', () => this.exportModule.exportarPDF());
    }
    
    renderAnotacoes(anotacoes, highlightTerm = '') {
        if (!anotacoes?.length) {
            return `<div class="empty-state"><h3>Nenhum conteúdo encontrado</h3></div>`;
        }
        
        return anotacoes.map(anotacao => {
            const isGuia = anotacao.tipo === 'guia';
            const id = Number(anotacao.id);
            const isFavorito = anotacao.isFavorito || false;
            
            let titulo = this.escapeHtml(anotacao.titulo || 'Sem título');
            let conteudo = anotacao.conteudo || '';
            
            if (highlightTerm) {
                const regex = new RegExp(`(${highlightTerm})`, 'gi');
                titulo = titulo.replace(regex, '<span class="search-results-highlight">$1</span>');
                conteudo = conteudo.replace(regex, '<span class="search-results-highlight">$1</span>');
            }
            
            return `
                <div class="anotacao-bloco ${isGuia ? 'guia-bloco' : 'obs-bloco'}" data-id="${id}">
                    <div class="anotacao-header">
                        <div class="anotacao-titulo">
                            ${isGuia ? '📘' : '📝'} ${titulo}
                            <span class="anotacao-tipo ${isGuia ? 'tipo-guia' : 'tipo-observacao'}">
                                ${isGuia ? 'Guia' : 'Observação'}
                            </span>
                        </div>
                        <div class="anotacao-actions">
                            <button class="btn-sm btn-favorite ${isFavorito ? 'active' : ''}" data-favorito="${id}">
                                <i class="${isFavorito ? 'fas' : 'far'} fa-star"></i>
                            </button>
                            <button class="btn-sm btn-info" data-comentarios="${id}">
                                <i class="fas fa-comment"></i>
                            </button>
                            <button class="btn-sm btn-secondary" data-export-item="${id}">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn-sm btn-warning" data-versoes="${id}" title="Histórico de versões">
                                <i class="fas fa-code-branch"></i>
                            </button>
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
                    <div class="anotacao-conteudo">${editor.formatarConteudo(conteudo)}</div>
                    ${anotacao.tags?.length ? `
                        <div class="anotacao-tags">
                            ${anotacao.tags.map(tag => `<span class="tag"><i class="fas fa-tag"></i> ${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="anotacao-footer">
                        <span><i class="fas fa-user"></i> ${this.escapeHtml(anotacao.autor || 'Sistema')}</span>
                        <span><i class="fas fa-calendar"></i> ${ui.formatarData(anotacao.dataCriacao)}</span>
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
    }
    
    showWelcomeScreen() {
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
                ${encryption.isEnabled() ? '<p style="color: green;"><i class="fas fa-lock"></i> Criptografia ativada</p>' : ''}
            </div>
        `;
        document.getElementById('page-title').textContent = 'Dashboard';
    }
    
    showError(message) {
        const wrapper = document.getElementById('content-wrapper');
        wrapper.innerHTML = `<div class="empty-state"><h3>Erro</h3><p>${message}</p></div>`;
    }
    
    novaAnotacao() {
        if (!auth.isAdmin()) {
            ui.showNotification('Apenas administradores podem criar conteúdo', 'warning');
            return;
        }
        
        collaboration.startEditing(null, 'novo');
        editor.abrirEditor(this.currentTopico, this.currentSubtopico);
    }
    
    async editarAnotacao(id) {
        if (!auth.isAdmin()) {
            ui.showNotification('Apenas administradores podem editar', 'warning');
            return;
        }
        
        try {
            let anotacao = await db.getAnotacao(Number(id));
            anotacao = await encryption.decryptAnotacao(anotacao);
            
            if (anotacao) {
                collaboration.startEditing(id, 'conteudo');
                editor.abrirEditor(anotacao.topico, anotacao.subtopico, anotacao);
            }
        } catch (error) {
            ui.showNotification('Erro ao carregar para edição', 'error');
        }
    }
    
    async excluirAnotacao(id) {
        if (!auth.isAdmin()) {
            ui.showNotification('Apenas administradores podem excluir', 'warning');
            return;
        }
        
        const confirmado = await ui.confirmDialog('Excluir este conteúdo?');
        if (!confirmado) return;
        
        try {
            const anotacao = await db.getAnotacao(Number(id));
            audit.log('EXCLUIR', anotacao.topico, anotacao.subtopico, anotacao.titulo);
            
            await db.excluirAnotacao(Number(id));
            await this.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
            ui.showNotification('Conteúdo excluído!', 'success');
        } catch (error) {
            ui.showNotification('Erro ao excluir', 'error');
        }
    }
    
    async salvarAnotacao(anotacao, isNew = false) {
        const acao = isNew ? 'CRIAR' : 'EDITAR';
        audit.log(acao, anotacao.topico, anotacao.subtopico, anotacao.titulo);
        
        if (!isNew) {
            audit.createVersion(anotacao);
        }
        
        const encrypted = await encryption.encryptAnotacao(anotacao);
        const result = await db.salvarAnotacao(encrypted);
        
        collaboration.stopEditing(anotacao.id);
        collaboration.sendChange(anotacao.id, { acao, titulo: anotacao.titulo });
        
        return result;
    }
    
    handleRemoteChange(data) {
        if (data.user.id !== auth.getCurrentUser()?.username) {
            ui.showNotification(`${data.user.name} ${data.changes.acao} "${data.changes.titulo}"`, 'info');
            
            if (this.currentTopico && this.currentSubtopico) {
                this.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
            }
        }
    }
    
    handleRemoteEditing(data) {
        if (data.user.id !== auth.getCurrentUser()?.username) {
            const anotacaoElement = document.querySelector(`[data-id="${data.anotacaoId}"]`);
            if (anotacaoElement) {
                if (data.field) {
                    anotacaoElement.style.border = `2px solid ${data.user.color}`;
                    anotacaoElement.setAttribute('title', `${data.user.name} está editando`);
                } else {
                    anotacaoElement.style.border = '';
                    anotacaoElement.removeAttribute('title');
                }
            }
        }
    }
    
    showEncryptionSettings() {
        const status = encryption.isEnabled() ? 'ativada' : 'desativada';
        const action = confirm(`Criptografia está ${status}. Deseja ${encryption.isEnabled() ? 'desativar' : 'ativar'}?`);
        
        if (action) {
            if (encryption.isEnabled()) {
                localStorage.removeItem('encryption_enabled');
                ui.showNotification('Criptografia desativada', 'warning');
            } else {
                this.setupEncryption();
            }
        }
    }
    
    showAuditLogs() {
        const modal = document.getElementById('audit-modal');
        const container = document.getElementById('audit-container');
        
        audit.renderLogs(container, { limite: 100 });
        modal.style.display = 'block';
    }
    
    showVersoes(anotacaoId) {
        const versions = audit.getVersions(Number(anotacaoId));
        const modal = document.getElementById('versoes-modal');
        const container = document.getElementById('versoes-container');
        
        if (versions.length === 0) {
            container.innerHTML = '<p>Nenhuma versão anterior encontrada.</p>';
        } else {
            container.innerHTML = `
                <div class="versions-list">
                    ${versions.reverse().map((v, i) => `
                        <div class="version-item">
                            <div class="version-header">
                                <strong>Versão ${versions.length - i}</strong>
                                <span>${ui.formatarData(v.data)}</span>
                            </div>
                            <p>Autor: ${v.autor}</p>
                            <button class="btn-sm btn-primary" onclick="app.restoreVersion(${anotacaoId}, ${v.id})">
                                <i class="fas fa-undo"></i> Restaurar
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        modal.style.display = 'block';
    }
    
    async restoreVersion(anotacaoId, versionId) {
        const restored = audit.restoreVersion(anotacaoId, versionId);
        if (restored) {
            await this.salvarAnotacao(restored, false);
            ui.showNotification('Versão restaurada com sucesso!', 'success');
            document.getElementById('versoes-modal').style.display = 'none';
            
            if (this.currentTopico && this.currentSubtopico) {
                await this.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
            }
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

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app;
});

// Estender UI
if (typeof ui !== 'undefined') {
    ui.closeComentariosModal = () => {
        document.getElementById('comentarios-modal').style.display = 'none';
    };
}

// Estender Editor para integrar com auditoria e colaboração
const originalSalvar = editor.salvarAnotacao;
editor.salvarAnotacao = async function() {
    const isNew = !this.currentAnotacao?.id;
    const result = await originalSalvar.call(this);
    
    if (result !== false) {
        await app.salvarAnotacao(this.currentAnotacao || result, isNew);
    }
    
    return result;
};
