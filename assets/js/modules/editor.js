// Modulo do Editor de Anotacoes
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
    }
    
    getEditorHTML() {
        var html = '';
        html += '<form id="anotacao-form">';
        html += '<div class="form-group">';
        html += '<label for="anotacao-tipo">Tipo de Conteudo</label>';
        html += '<select id="anotacao-tipo" required>';
        html += '<option value="guia">📘 Guia</option>';
        html += '<option value="observacao">📝 Observacao</option>';
        html += '</select>';
        html += '<small style="color: #666; display: block; margin-top: 5px;">';
        html += '<strong>Guia:</strong> Conteudo principal com titulo e subtitulo<br>';
        html += '<strong>Observacao:</strong> Notas complementares ou lembretes';
        html += '</small>';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label for="anotacao-titulo">Titulo Principal</label>';
        html += '<input type="text" id="anotacao-titulo" required placeholder="Ex: Cadastro de Familia de Produtos">';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label for="anotacao-subtitulo">Subtitulo (opcional)</label>';
        html += '<input type="text" id="anotacao-subtitulo" placeholder="Ex: TELA - DADOS FISCAIS">';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label for="anotacao-conteudo">Conteudo</label>';
        html += '<div class="editor-toolbar">';
        html += '<button type="button" data-format="bold" title="Negrito"><i class="fas fa-bold"></i></button>';
        html += '<button type="button" data-format="italic" title="Italico"><i class="fas fa-italic"></i></button>';
        html += '<button type="button" data-format="underline" title="Sublinhado"><i class="fas fa-underline"></i></button>';
        html += '<button type="button" data-format="list" title="Lista"><i class="fas fa-list"></i></button>';
        html += '<button type="button" data-format="number-list" title="Lista Numerada"><i class="fas fa-list-ol"></i></button>';
        html += '<button type="button" data-format="highlight" title="Destacar"><i class="fas fa-highlighter"></i></button>';
        html += '<button type="button" data-format="code" title="Codigo"><i class="fas fa-code"></i></button>';
        html += '</div>';
        html += '<textarea id="anotacao-conteudo" rows="15" required placeholder="Digite o conteudo do guia aqui..."></textarea>';
        html += '</div>';
        
        html += '<div class="form-group">';
        html += '<label for="anotacao-tags">Tags (separadas por virgula)</label>';
        html += '<input type="text" id="anotacao-tags" placeholder="Ex: importante, revisar, urgente">';
        html += '</div>';
        
        html += '<div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">';
        html += '<button type="button" class="btn-sm" id="btn-cancelar-editor"><i class="fas fa-times"></i> Cancelar</button>';
        html += '<button type="submit" class="btn-sm btn-success"><i class="fas fa-save"></i> Salvar</button>';
        html += '</div>';
        html += '</form>';
        
        return html;
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
        
        var formatButtons = document.querySelectorAll('[data-format]');
        for (var i = 0; i < formatButtons.length; i++) {
            formatButtons[i].addEventListener('click', function(e) {
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
                document.getElementById('editor-modal').style.display = 'none';
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
            formattedText = '*' + (selectedText || 'texto em italico') + '*';
        } else if (format === 'underline') {
            formattedText = '__' + (selectedText || 'texto sublinhado') + '__';
        } else if (format === 'highlight') {
            formattedText = '==' + (selectedText || 'texto destacado') + '==';
        } else if (format === 'code') {
            formattedText = '`' + (selectedText || 'codigo') + '`';
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
        
        if (formattedText) {
            textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
            textarea.focus();
        }
    }
    
    salvarAnotacao() {
        var self = this;
        var tipoSelect = document.getElementById('anotacao-tipo');
        var tituloInput = document.getElementById('anotacao-titulo');
        var subtituloInput = document.getElementById('anotacao-subtitulo');
        var conteudoTextarea = document.getElementById('anotacao-conteudo');
        var tagsInput = document.getElementById('anotacao-tags');
        
        if (!tipoSelect || !tituloInput || !conteudoTextarea) {
            console.error('Elementos do formulario nao encontrados');
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
        
        var isNew = !anotacao.id;
        
        var promise;
        if (typeof app !== 'undefined' && app.salvarAnotacao) {
            promise = app.salvarAnotacao(anotacao, isNew);
        } else if (typeof db !== 'undefined' && db.salvarAnotacao) {
            promise = db.salvarAnotacao(anotacao);
        } else {
            alert('Erro: Banco de dados nao disponivel');
            return;
        }
        
        promise.then(function() {
            document.getElementById('editor-modal').style.display = 'none';
            
            if (typeof ui !== 'undefined' && ui.showNotification) {
                ui.showNotification('Salvo com sucesso!', 'success');
            } else {
                alert('Salvo com sucesso!');
            }
            
            if (typeof app !== 'undefined' && app.carregarAnotacoes) {
                app.carregarAnotacoes(self.currentTopico, self.currentSubtopico);
            } else {
                location.reload();
            }
        }).catch(function(error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar: ' + error.message);
        });
    }
    
    formatarConteudo(texto) {
        if (!texto) return '';
        
        var html = texto;
        
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/==([^=]+)==/g, '<mark>$1</mark>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
        
        var lines = html.split('\n');
        var result = [];
        var inList = false;
        var inNumberedList = false;
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            
            if (line.match(/^- /)) {
                if (!inList) {
                    result.push('<ul>');
                    inList = true;
                }
                result.push('<li>' + line.substring(2) + '</li>');
                continue;
            } else if (inList) {
                result.push('</ul>');
                inList = false;
            }
            
            if (line.match(/^\d+\. /)) {
                if (!inNumberedList) {
                    result.push('<ol>');
                    inNumberedList = true;
                }
                result.push('<li>' + line.replace(/^\d+\. /, '') + '</li>');
                continue;
            } else if (inNumberedList) {
                result.push('</ol>');
                inNumberedList = false;
            }
            
            if (line.trim() === '') {
                result.push('<br>');
            } else {
                result.push(line);
            }
        }
        
        if (inList) result.push('</ul>');
        if (inNumberedList) result.push('</ol>');
        
        html = result.join('\n');
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p><br><\/p>/g, '<br>');
        
        return html;
    }
}

// Criar instancia global
var editor = new Editor();
window.editor = editor;
