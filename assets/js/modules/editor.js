// Módulo do Editor de Anotações
class Editor {
    constructor() {
        this.currentAnotacao = null;
        this.currentTopico = null;
        this.currentSubtopico = null;
    }
    
    abrirEditor(topico, subtopico, anotacao) {
        this.currentTopico = topico;
        this.currentSubtopico = subtopico;
        this.currentAnotacao = anotacao || null;
        
        const modal = document.getElementById('editor-modal');
        const modalTitle = document.getElementById('modal-title');
        const container = document.getElementById('editor-container');
        
        if (!modal || !modalTitle || !container) {
            console.error('Elementos do modal não encontrados');
            return;
        }
        
        modalTitle.textContent = anotacao ? 'Editar Conteúdo' : 'Novo Conteúdo';
        container.innerHTML = this.getEditorHTML();
        
        if (anotacao) {
            setTimeout(() => {
                this.preencherFormulario(anotacao);
            }, 100);
        }
        
        this.setupEventListeners();
        modal.style.display = 'block';
    }
    
    getEditorHTML() {
        return '<form id="anotacao-form">' +
            '<div class="form-group">' +
                '<label for="anotacao-tipo">Tipo de Conteúdo</label>' +
                '<select id="anotacao-tipo" required>' +
                    '<option value="guia">📘 Guia</option>' +
                    '<option value="observacao">📝 Observação</option>' +
                '</select>' +
                '<small style="color: #666; display: block; margin-top: 5px;">' +
                    '<strong>Guia:</strong> Conteúdo principal<br>' +
                    '<strong>Observação:</strong> Notas complementares' +
                '</small>' +
            '</div>' +
            '<div class="form-group">' +
                '<label for="anotacao-titulo">Título Principal</label>' +
                '<input type="text" id="anotacao-titulo" required placeholder="Ex: Cadastro de Família de Produtos">' +
            '</div>' +
            '<div class="form-group">' +
                '<label for="anotacao-subtitulo">Subtítulo (opcional)</label>' +
                '<input type="text" id="anotacao-subtitulo" placeholder="Ex: Passo a passo completo">' +
            '</div>' +
            '<div class="form-group">' +
                '<label for="anotacao-conteudo">Conteúdo</label>' +
                '<div class="editor-toolbar">' +
                    '<button type="button" data-format="bold" title="Negrito"><i class="fas fa-bold"></i></button>' +
                    '<button type="button" data-format="italic" title="Itálico"><i class="fas fa-italic"></i></button>' +
                    '<button type="button" data-format="underline" title="Sublinhado"><i class="fas fa-underline"></i></button>' +
                    '<button type="button" data-format="list" title="Lista"><i class="fas fa-list"></i></button>' +
                    '<button type="button" data-format="number-list" title="Lista Numerada"><i class="fas fa-list-ol"></i></button>' +
                '</div>' +
                '<textarea id="anotacao-conteudo" rows="15" required placeholder="Digite o conteúdo aqui..."></textarea>' +
            '</div>' +
            '<div class="form-group">' +
                '<label for="anotacao-tags">Tags (separadas por vírgula)</label>' +
                '<input type="text" id="anotacao-tags" placeholder="Ex: importante, revisar">' +
            '</div>' +
            '<div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">' +
                '<button type="button" class="btn-sm" id="btn-cancelar-editor"><i class="fas fa-times"></i> Cancelar</button>' +
                '<button type="submit" class="btn-sm btn-success"><i class="fas fa-save"></i> Salvar</button>' +
            '</div>' +
        '</form>';
    }
    
    preencherFormulario(anotacao) {
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
    }
    
    setupEventListeners() {
        var self = this;
        var buttons = document.querySelectorAll('[data-format]');
        
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.aplicarFormatacao(this.dataset.format);
            });
        }
        
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
                if (typeof ui !== 'undefined' && ui.closeModal) {
                    ui.closeModal();
                } else {
                    document.getElementById('editor-modal').style.display = 'none';
                }
            });
        }
    }
    
    aplicarFormatacao(format) {
        var textarea = document.getElementById('anotacao-conteudo');
        if (!textarea) return;
        
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var selectedText = textarea.value.substring(start, end);
        var formattedText = '';
        
        if (format === 'bold') {
            formattedText = '**' + (selectedText || 'texto em negrito') + '**';
        } else if (format === 'italic') {
            formattedText = '*' + (selectedText || 'texto em itálico') + '*';
        } else if (format === 'underline') {
            formattedText = '__' + (selectedText || 'texto sublinhado') + '__';
        } else if (format === 'list') {
            if (selectedText) {
                var lines = selectedText.split('\n');
                formattedText = '';
                for (var i = 0; i < lines.length; i++) {
                    formattedText += '- ' + lines[i] + '\n';
                }
            } else {
                formattedText = '- Item 1\n- Item 2\n- Item 3';
            }
        } else if (format === 'number-list') {
            if (selectedText) {
                var lines = selectedText.split('\n');
                formattedText = '';
                for (var i = 0; i < lines.length; i++) {
                    formattedText += (i + 1) + '. ' + lines[i] + '\n';
                }
            } else {
                formattedText = '1. Primeiro item\n2. Segundo item\n3. Terceiro item';
            }
        }
        
        textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
        textarea.focus();
    }
    
    salvarAnotacao() {
        var self = this;
        var tipoSelect = document.getElementById('anotacao-tipo');
        var tituloInput = document.getElementById('anotacao-titulo');
        var subtituloInput = document.getElementById('anotacao-subtitulo');
        var conteudoTextarea = document.getElementById('anotacao-conteudo');
        var tagsInput = document.getElementById('anotacao-tags');
        
        if (!tipoSelect || !tituloInput || !conteudoTextarea) {
            console.error('Elementos do formulário não encontrados');
            return;
        }
        
        var tipo = tipoSelect.value;
        var titulo = tituloInput.value.trim();
        var subtitulo = subtituloInput ? subtituloInput.value.trim() : '';
        var conteudo = conteudoTextarea.value.trim();
        var tagsStr = tagsInput ? tagsInput.value : '';
        
        if (!titulo || !conteudo) {
            alert('Título e conteúdo são obrigatórios');
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
        
        // Salvar no banco
        if (typeof db !== 'undefined' && db.salvarAnotacao) {
            db.salvarAnotacao(anotacao).then(function() {
                // Fechar modal
                var modal = document.getElementById('editor-modal');
                if (modal) modal.style.display = 'none';
                
                // Notificação
                if (typeof ui !== 'undefined' && ui.showNotification) {
                    ui.showNotification('Salvo com sucesso!', 'success');
                } else {
                    alert('Salvo com sucesso!');
                }
                
                // Recarregar
                if (typeof app !== 'undefined' && app.carregarAnotacoes) {
                    app.carregarAnotacoes(self.currentTopico, self.currentSubtopico);
                }
            }).catch(function(error) {
                console.error('Erro ao salvar:', error);
                alert('Erro ao salvar: ' + error.message);
            });
        } else {
            console.error('Banco de dados não disponível');
            alert('Erro: Banco de dados não disponível');
        }
    }
    
    formatarConteudo(texto) {
        if (!texto) return '';
        
        var html = texto;
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/__(.*?)__/g, '<u>$1</u>');
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }
}

// Criar instância global
var editor = new Editor();
window.editor = editor;
