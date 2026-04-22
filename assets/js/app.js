// Aplicação Principal - Versão Simplificada
var App = function() {
    this.currentTopico = null;
    this.currentSubtopico = null;
    this.topicosExpandidos = ['cadastro'];
    this.basePath = typeof BASE_PATH !== 'undefined' ? BASE_PATH : '';
    this.init();
};

App.prototype.init = function() {
    var self = this;
    
    db.ensureDB().then(function() {
        return db.inicializarDadosPadrao();
    }).then(function() {
        return self.loadComponents();
    }).then(function() {
        self.setupNavigation();
        self.setupEventListeners();
        self.updateUI();
        self.showDashboard();
    }).catch(function(error) {
        console.error('Erro:', error);
        self.showError('Erro ao inicializar');
    });
};

App.prototype.loadComponents = function() {
    var self = this;
    var sidebarContainer = document.getElementById('sidebar-container');
    var headerContainer = document.getElementById('header-container');
    
    var promises = [];
    
    if (sidebarContainer) {
        var url = this.basePath + '/components/sidebar.html';
        promises.push(fetch(url).then(function(r) { return r.text(); }).then(function(html) {
            sidebarContainer.innerHTML = html;
            self.renderTopicos();
        }));
    }
    
    if (headerContainer) {
        var url = this.basePath + '/components/header.html';
        promises.push(fetch(url).then(function(r) { return r.text(); }).then(function(html) {
            headerContainer.innerHTML = html;
            var user = auth.getCurrentUser();
            var userNameElement = document.getElementById('user-name');
            if (userNameElement && user) {
                userNameElement.textContent = user.name;
            }
        }));
    }
    
    return Promise.all(promises);
};

App.prototype.renderTopicos = function() {
    var sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;
    
    var self = this;
    var topicos = this.getTopicosEstrutura();
    
    sidebarNav.innerHTML = '<div class="nav-section"><div class="nav-item" data-page="dashboard"><i class="fas fa-home"></i><span>Dashboard</span></div></div>';
    
    topicos.forEach(function(topico) {
        var isExpanded = self.topicosExpandidos.indexOf(topico.id) !== -1;
        
        var section = document.createElement('div');
        section.className = 'nav-section';
        section.innerHTML = '<div class="topico-header ' + (isExpanded ? '' : 'collapsed') + '" data-topico="' + topico.id + '">' +
            '<div style="display: flex; align-items: center;"><i class="' + topico.icone + '"></i><span>' + topico.nome + '</span></div>' +
            '<i class="fas fa-chevron-down"></i>' +
        '</div>' +
        '<div class="subtopicos-container ' + (isExpanded ? '' : 'collapsed') + '" data-container="' + topico.id + '">' +
            topico.subtopicos.map(function(sub) {
                return '<div class="subtopico-item" data-topico="' + topico.id + '" data-subtopico="' + sub.id + '">' +
                    '<i class="fas fa-file-alt"></i><span>' + sub.nome + '</span>' +
                '</div>';
            }).join('') +
        '</div>';
        
        sidebarNav.appendChild(section);
    });
    
    this.setupTopicoToggle();
};

App.prototype.getTopicosEstrutura = function() {
    return [
        {
            id: 'cadastro',
            nome: 'Cadastros',
            icone: 'fas fa-database',
            subtopicos: [
                { id: 'familia', nome: 'Familia' },
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
            nome: 'Inconsistencias',
            icone: 'fas fa-exclamation-triangle',
            subtopicos: [
                { id: 'familia', nome: 'Familia' },
                { id: 'produto', nome: 'Produto' },
                { id: 'fornecedor', nome: 'Fornecedor' },
                { id: 'comprador', nome: 'Comprador' },
                { id: 'categoria', nome: 'Categoria' },
                { id: 'nfe', nome: 'NFE - Recebimento de Nota' }
            ]
        }
    ];
};

App.prototype.setupTopicoToggle = function() {
    var self = this;
    document.querySelectorAll('.topico-header').forEach(function(header) {
        header.addEventListener('click', function() {
            var topico = this.dataset.topico;
            var container = document.querySelector('[data-container="' + topico + '"]');
            
            this.classList.toggle('collapsed');
            container.classList.toggle('collapsed');
            
            var index = self.topicosExpandidos.indexOf(topico);
            if (index === -1) {
                self.topicosExpandidos.push(topico);
            } else {
                self.topicosExpandidos.splice(index, 1);
            }
        });
    });
};

App.prototype.setupNavigation = function() {
    var self = this;
    
    document.addEventListener('click', function(e) {
        var dashboardLink = e.target.closest('[data-page="dashboard"]');
        if (dashboardLink) {
            e.preventDefault();
            self.showDashboard();
            return;
        }
        
        var subtopicoElement = e.target.closest('[data-subtopico]');
        if (subtopicoElement) {
            e.preventDefault();
            var topico = subtopicoElement.dataset.topico;
            var subtopico = subtopicoElement.dataset.subtopico;
            self.carregarAnotacoes(topico, subtopico);
            
            document.querySelectorAll('.subtopico-item').forEach(function(item) {
                item.classList.remove('active');
            });
            subtopicoElement.classList.add('active');
        }
    });
};

App.prototype.setupEventListeners = function() {
    var self = this;
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('#btn-logout')) {
            auth.logout();
        }
        
        var btnEditar = e.target.closest('[data-editar]');
        if (btnEditar) {
            e.preventDefault();
            self.editarAnotacao(btnEditar.dataset.editar);
        }
        
        var btnExcluir = e.target.closest('[data-excluir]');
        if (btnExcluir) {
            e.preventDefault();
            self.excluirAnotacao(btnExcluir.dataset.excluir);
        }
    });
};

App.prototype.carregarAnotacoes = function(topico, subtopico) {
    var self = this;
    this.currentTopico = topico;
    this.currentSubtopico = subtopico;
    
    var wrapper = document.getElementById('content-wrapper');
    if (!wrapper) return;
    
    wrapper.innerHTML = '<div style="text-align:center;padding:50px;"><div class="loading"></div></div>';
    
    db.getAnotacoes(topico, subtopico).then(function(anotacoes) {
        var topicoInfo = self.getTopicoInfo(topico);
        var subtopicoInfo = topicoInfo.subtopicos.find(function(s) { return s.id === subtopico; }) || { nome: subtopico };
        
        document.getElementById('page-title').textContent = subtopicoInfo.nome;
        
        var html = '<div class="section-header">' +
            '<div><h2>' + subtopicoInfo.nome + '</h2><p style="color:#666;">' + topicoInfo.nome + ' > ' + subtopicoInfo.nome + '</p></div>' +
            '<div style="display:flex;gap:10px;">';
        
        if (auth.isAdmin()) {
            html += '<button class="btn-add" id="btn-nova-anotacao"><i class="fas fa-plus"></i> Novo</button>';
        }
        
        html += '</div></div><div class="anotacoes-list">' + self.renderAnotacoes(anotacoes) + '</div>';
        
        wrapper.innerHTML = html;
        
        var btnNova = document.getElementById('btn-nova-anotacao');
        if (btnNova) {
            btnNova.addEventListener('click', function() {
                self.novaAnotacao();
            });
        }
    }).catch(function(error) {
        wrapper.innerHTML = '<div class="empty-state"><h3>Erro ao carregar</h3></div>';
    });
};

App.prototype.renderAnotacoes = function(anotacoes) {
    var self = this;
    
    if (!anotacoes || !anotacoes.length) {
        return '<div class="empty-state"><h3>Nenhum conteudo encontrado</h3></div>';
    }
    
    return anotacoes.map(function(anotacao) {
        var isGuia = anotacao.tipo === 'guia';
        var id = Number(anotacao.id);
        
        var html = '<div class="anotacao-bloco ' + (isGuia ? 'guia-bloco' : 'obs-bloco') + '">' +
            '<div class="anotacao-header">' +
                '<div class="anotacao-titulo">' +
                    (isGuia ? '📘' : '📝') + ' ' + self.escapeHtml(anotacao.titulo || 'Sem titulo') +
                    '<span class="anotacao-tipo ' + (isGuia ? 'tipo-guia' : 'tipo-observacao') + '">' + (isGuia ? 'Guia' : 'Observacao') + '</span>' +
                '</div>' +
                '<div class="anotacao-actions">';
        
        if (auth.isAdmin()) {
            html += '<button class="btn-sm btn-primary" data-editar="' + id + '"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn-sm btn-danger" data-excluir="' + id + '"><i class="fas fa-trash"></i></button>';
        }
        
        html += '</div></div>';
        
        if (anotacao.subtitulo) {
            html += '<div class="anotacao-subtitulo">' + self.escapeHtml(anotacao.subtitulo) + '</div>';
        }
        
        var conteudo = anotacao.conteudo || '';
        conteudo = conteudo.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        conteudo = conteudo.replace(/\*(.*?)\*/g, '<em>$1</em>');
        conteudo = conteudo.replace(/\n/g, '<br>');
        
        html += '<div class="anotacao-conteudo">' + conteudo + '</div>';
        html += '<div class="anotacao-footer">' +
            '<span><i class="fas fa-user"></i> ' + self.escapeHtml(anotacao.autor || 'Sistema') + '</span>' +
            '<span><i class="fas fa-calendar"></i> ' + new Date(anotacao.dataCriacao).toLocaleDateString('pt-BR') + '</span>' +
        '</div></div>';
        
        return html;
    }).join('');
};

App.prototype.escapeHtml = function(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

App.prototype.getTopicoInfo = function(topicoId) {
    return this.getTopicosEstrutura().find(function(t) { return t.id === topicoId; }) || { nome: topicoId, subtopicos: [] };
};

App.prototype.showDashboard = function() {
    var wrapper = document.getElementById('content-wrapper');
    wrapper.innerHTML = '<div class="welcome-screen">' +
        '<i class="fas fa-book-open"></i>' +
        '<h2>Guia Consinco</h2>' +
        '<p>Selecione um topico no menu lateral</p>' +
        '<br><p><strong>Credenciais:</strong></p>' +
        '<p>Visualizador: user / 123456</p>' +
        '<p>Admin: admin / admin123</p>' +
    '</div>';
    document.getElementById('page-title').textContent = 'Dashboard';
};

App.prototype.showError = function(message) {
    var wrapper = document.getElementById('content-wrapper');
    wrapper.innerHTML = '<div class="empty-state"><h3>Erro</h3><p>' + message + '</p></div>';
};

App.prototype.novaAnotacao = function() {
    if (!auth.isAdmin()) {
        alert('Apenas administradores podem criar conteudo');
        return;
    }
    
    if (typeof editor !== 'undefined') {
        editor.abrirEditor(this.currentTopico, this.currentSubtopico, null);
    } else {
        alert('Editor nao disponivel');
    }
};

App.prototype.editarAnotacao = function(id) {
    var self = this;
    
    if (!auth.isAdmin()) {
        alert('Apenas administradores podem editar');
        return;
    }
    
    db.getAnotacao(Number(id)).then(function(anotacao) {
        if (anotacao && typeof editor !== 'undefined') {
            editor.abrirEditor(anotacao.topico, anotacao.subtopico, anotacao);
        }
    }).catch(function() {
        alert('Erro ao carregar');
    });
};

App.prototype.excluirAnotacao = function(id) {
    var self = this;
    
    if (!auth.isAdmin()) {
        alert('Apenas administradores podem excluir');
        return;
    }
    
    if (!confirm('Excluir este conteudo?')) return;
    
    db.excluirAnotacao(Number(id)).then(function() {
        self.carregarAnotacoes(self.currentTopico, self.currentSubtopico);
    }).catch(function() {
        alert('Erro ao excluir');
    });
};

App.prototype.updateUI = function() {
    var user = auth.getCurrentUser();
    var userDisplay = document.getElementById('user-display');
    if (userDisplay && user) {
        userDisplay.textContent = user.name + (auth.isAdmin() ? ' (Admin)' : '');
    }
};

// Inicializar
var app;
document.addEventListener('DOMContentLoaded', function() {
    app = new App();
    window.app = app;
});
