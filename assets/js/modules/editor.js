// Módulo do Editor de Anotações - Versão Limpa
var Editor = function() {
    this.currentAnotacao = null;
    this.currentTopico = null;
    this.currentSubtopico = null;
};

Editor.prototype.abrirEditor = function(topico, subtopico, anotacao) {
    this.currentTopico = topico;
    this.currentSubtopico = subtopico;
    this.currentAnotacao = anotacao || null;
    
    var modal = document.getElementById('editor-modal');
    var modalTitle = document.getElementById('modal-title');
    var container = document.getElementById('editor-container');
    
    if (!modal || !modalTitle || !container) {
        console.error('Elementos do modal nao encontrados');
        return;
    }
    
    modalTitle.textContent = anotacao ? 'Editar Conteudo' : 'Novo Conteudo';
    container.innerHTML = this.getEditorHTML();
    
    if (anotacao) {
        var self = this;
        setTimeout(function() {
            self.preencherFormulario(anotacao);
        }, 100);
    }
    
    this.setupEventListeners();
    modal.style.display = 'block';
};

Editor.prototype.getEditorHTML = function() {
    return '<form id="anotacao-form">' +
        '<div class="form-group">' +
            '<label for="anotacao-tipo">Tipo de Conteudo</label>' +
            '<select id="anotacao-tipo" required>' +
                '<option value="guia">📘 Guia</option>' +
                '<option value="observacao">📝 Observacao</option>' +
            '</select>' +
        '</div>' +
        '<div class="form-group">' +
            '<label for="anotacao-titulo">Titulo Principal</label>' +
            '<input type="text" id="anotacao-titulo" required>' +
        '</div>' +
        '<div class="form-group">' +
            '<label for="anotacao-subtitulo">Subtitulo (opcional)</label>' +
            '<input type="text" id="anotacao-subtitulo">' +
        '</div>' +
        '<div class="form-group">' +
            '<label for="anotacao-conteudo">Conteudo</label>' +
            '<textarea id="anotacao-conteudo" rows="12" required></textarea>' +
        '</div>' +
        '<div class="form-group">' +
            '<label for="anotacao-tags">Tags (separadas por virgula)</label>' +
            '<input type="text" id="anotacao-tags" placeholder="Ex: importante, revisar">' +
        '</div>' +
        '<div style="display: flex; gap: 10px; justify-content: flex-end;">' +
            '<button type="button" class="btn-sm" id="btn-cancelar-editor">Cancelar</button>' +
            '<button type="submit" class="btn-sm btn-success">Salvar</button>' +
        '</div>' +
    '</form>';
};

Editor.prototype.preencherFormulario = function(anotacao) {
    var tipoSelect = document.getElementById('anotacao-tipo');
    var tituloInput = document.getElementById('anotacao-titulo');
    var subtituloInput = document.getElementById('anotacao-subtitulo');
    var conteudoTextarea = document.getElementById('anotacao-conteudo');
    var tagsInput = document.getElementById('anotacao-tags');
    
    if (tipoSelect) tipoSelect.value = anotacao.tipo || 'guia';
    if (tituloInput) tituloInput.value = anotacao.titulo || '';
    if (subtituloInput) subtituloInput.value = anotacao.subtitulo || '';
    if (conteudoTextarea) conteudoTextarea.value = anotacao.conteudo || '';
    if (tagsInput && anotacao.tags) {
        tagsInput.value = Array.isArray(anotacao.tags) ? anotacao.tags.join(', ') : '';
    }
};

Editor.prototype.setupEventListeners = function() {
    var self = this;
    
    var form = document.getElementById('anotacao-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            self.salvarAnotacao();
        });
    }
    
    var btnCancelar = document.getElementById('btn-cancelar-editor');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            document.getElementById('editor-modal').style.display = 'none';
        });
    }
};

Editor.prototype.salvarAnotacao = function() {
    var self = this;
    var tipoSelect = document.getElementById('anotacao-tipo');
    var tituloInput = document.getElementById('anotacao-titulo');
    var subtituloInput = document.getElementById('anotacao-subtitulo');
    var conteudoTextarea = document.getElementById('anotacao-conteudo');
    var tagsInput = document.getElementById('anotacao-tags');
    
    if (!tipoSelect || !tituloInput || !conteudoTextarea) {
        alert('Campos nao encontrados');
        return;
    }
    
    var tipo = tipoSelect.value;
    var titulo = tituloInput.value.trim();
    var subtitulo = subtituloInput ? subtituloInput.value.trim() : '';
    var conteudo = conteudoTextarea.value.trim();
    var tagsStr = tagsInput ? tagsInput.value : '';
    
    if (!titulo || !conteudo) {
        alert('Titulo e conteudo sao obrigatorios');
        return;
    }
    
    var user = null;
    if (typeof auth !== 'undefined' && auth.getCurrentUser) {
        user = auth.getCurrentUser();
    }
    
    var anotacao = {
        topico: this.currentTopico,
        subtopico: this.currentSubtopico,
        tipo: tipo,
        titulo: titulo,
        subtitulo: subtitulo || null,
        conteudo: conteudo,
        tags: tagsStr.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; }),
        autor: user ? user.name : 'Sistema',
        autorUsername: user ? user.username : 'sistema'
    };
    
    if (this.currentAnotacao && this.currentAnotacao.id) {
        anotacao.id = Number(this.currentAnotacao.id);
        anotacao.dataCriacao = this.currentAnotacao.dataCriacao;
    }
    
    if (typeof db !== 'undefined' && db.salvarAnotacao) {
        db.salvarAnotacao(anotacao).then(function() {
            document.getElementById('editor-modal').style.display = 'none';
            alert('Salvo com sucesso!');
            
            if (typeof app !== 'undefined' && app.carregarAnotacoes) {
                app.carregarAnotacoes(self.currentTopico, self.currentSubtopico);
            } else {
                location.reload();
            }
        }).catch(function(error) {
            alert('Erro: ' + error.message);
        });
    } else {
        alert('Erro: Banco de dados indisponivel');
    }
};

Editor.prototype.formatarConteudo = function(texto) {
    if (!texto) return '';
    var html = texto;
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
};

// Criar instancia global
var editor = new Editor();
window.editor = editor;
