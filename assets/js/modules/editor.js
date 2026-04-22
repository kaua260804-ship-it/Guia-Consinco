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
            console.error('Elementos do modal nao encontrados');
            return;
        }
        
        modalTitle.textContent = anotacao ? 'Editar Conteudo' : 'Novo Conteudo';
        container.innerHTML = this.getEditorHTML();
        
        if (anotacao) {
            setTimeout(() => this.preencherFormulario(anotacao), 100);
        }
        
        this.setupEventListeners();
        modal.style.display = 'block';
    }
    
    getEditorHTML() {
        return '<form id="anotacao-form">' +
            '<div class="form-group">' +
                '<label for="anotacao-tipo">Tipo de Conteudo</label>' +
                '<select id="anotacao-tipo" required>' +
                    '<option value="guia">📘 Guia</option>' +
                    '<option value="observacao">📝 Observacao</option>' +
                '</select>' +
                '<small style="color: #666; display: block; margin-top: 5px;">' +
                    '<strong>Guia:</strong> Conteudo principal com titulo e subtitulo<br>' +
                    '<strong>Observacao:</strong> Notas complementares ou lembretes' +
                '</small>' +
            '</div>' +
            '<div class="form-group">' +
                '<label for="anotacao-titulo">Titulo Principal</label>' +
                '<input type="text" id="anotacao-titulo" required placeholder="Ex: Cadastro de Familia de Produtos">' +
            '</div>' +
            '<div class="form-group">' +
                '<label for="anotacao-subtitulo">Subtitulo (opcional)</label>' +
                '<input type="text" id="anotacao-subtitulo" placeholder="Ex: TELA - DADOS FISCAIS">' +
            '</div>' +
            '<div class="form-group">' +
                '<label for="anotacao-conteudo">Conteudo</label>' +
                '<div class="editor-toolbar">' +
                    '<button type="button" data-format="bold" title="Negrito ( **texto** )"><i class="fas fa-bold"></i></button>' +
                    '<button type="button" data-format="italic" title="Italico ( *texto* )"><i class="fas fa-italic"></i></button>' +
                    '<button type="button" data-format="underline" title="Sublinhado ( __texto__ )"><i class="fas fa-underline"></i></button>' +
                    '<button type="button" data-format="list" title="Lista ( - item )"><i class="fas fa-list"></i></button>' +
                    '<button type="button" data-format="number-list" title="Lista Numerada ( 1. item )"><i class="fas fa-list-ol"></i></button>' +
                    '<button type="button" data-format="highlight" title="Destacar ( ==texto== )"><i class="fas fa-highlighter"></i></button>' +
                    '<button type="button" data-format="code" title="Codigo ( `codigo` )"><i class="fas fa-code"></i></button>' +
                '</div>' +
                '<textarea id="anotacao-conteudo" rows="15" required placeholder="Digite o conteudo do guia aqui..."></textarea>' +
            '</div>' +
            '<div class="form-group">' +
                '<label for="anotacao-tags">Tags (separadas por virgula)</label>' +
                '<input type="text" id="anotacao-tags" placeholder="Ex: importante, revisar, urgente">' +
            '</div>' +
            '<div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">' +
                '<button type="button" class="btn-sm" id="btn-cancelar-editor"><i class="fas fa-times"></i> Cancelar</button>' +
                '<button type="submit" class="btn-sm btn-success"><i class="fas fa-save"></i> Salvar</button>' +
            '</div>' +
        '</form>';
    }
    
    preencherFormulario(anotacao) {
        const tipoSelect = document.getElementById('anotacao-tipo');
        const tituloInput = document.getElementById('anotacao-titulo');
        const subtituloInput = document.getElementById('anotacao-subtitulo');
        const conteudoTextarea = document.getElementById('anotacao-conteudo');
        const tagsInput = document.getElementById('anotacao-tags');
        
        if (tipoSelect) tipoSelect.value = anotacao.tipo || 'guia';
        if (tituloInput) tituloInput.value = anotacao.titulo || '';
        if (subtituloInput) subtituloInput.value = anotacao.subtitulo || '';
        if (conteudoTextarea) conteudoTextarea.value = anotacao.conteudo || '';
        if (tagsInput && anotacao.tags) {
            tagsInput.value = Array.isArray(anotacao.tags) ? anotacao.tags.join(', ') : '';
        }
    }
    
    setupEventListeners() {
        const self = this;
        
        document.querySelectorAll('[data-format]').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.aplicarFormatacao(this.dataset.format);
            });
        });
        
        const form = document.getElementById('anotacao-form');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                await self.salvarAnotacao();
            });
        }
        
        const btnCancelar = document.getElementById('btn-cancelar-editor');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', function() {
                document.getElementById('editor-modal').style.display = 'none';
            });
        }
    }
    
    aplicarFormatacao(format) {
        const textarea = document.getElementById('anotacao-conteudo');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        let formattedText = '';
        
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
                formattedText = selectedText.split('\n').map(line => '- ' + line).join('\n');
            } else {
                formattedText = '- Item 1\n- Item 2\n- Item 3';
            }
        } else if (format === 'number-list') {
            if (selectedText) {
                formattedText = selectedText.split('\n').map((line, i) => (i + 1) + '. ' + line).join('\n');
            } else {
                formattedText = '1. Primeiro item\n2. Segundo item\n3. Terceiro item';
            }
        }
        
        if (formattedText) {
            textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
            textarea.focus();
        }
    }
    
    async salvarAnotacao() {
        const self = this;
        const tipoSelect = document.getElementById('anotacao-tipo');
        const tituloInput = document.getElementById('anotacao-titulo');
        const subtituloInput = document.getElementById('anotacao-subtitulo');
        const conteudoTextarea = document.getElementById('anotacao-conteudo');
        const tagsInput = document.getElementById('anotacao-tags');
        
        if (!tipoSelect || !tituloInput || !conteudoTextarea) {
            console.error('Elementos do formulario nao encontrados');
            return;
        }
        
        const tipo = tipoSelect.value;
        const titulo = tituloInput.value.trim();
        const subtitulo = subtituloInput ? subtituloInput.value.trim() : '';
        const conteudo = conteudoTextarea.value.trim();
        const tagsStr = tagsInput ? tagsInput.value : '';
        
        if (!titulo || !conteudo) {
            alert('Titulo e conteudo sao obrigatorios');
            return;
        }
        
        let user = null;
        if (typeof auth !== 'undefined' && auth.getCurrentUser) {
            user = auth.getCurrentUser();
        }
        
        const anotacao = {
            topico: this.currentTopico,
            subtopico: this.currentSubtopico,
            tipo: tipo,
            titulo: titulo,
            subtitulo: subtitulo || null,
            conteudo: conteudo,
            tags: tagsStr.split(',').map(t => t.trim()).filter(t => t),
            autor: user ? user.name : 'Sistema',
            autorUsername: user ? user.username : 'sistema'
        };
        
        if (this.currentAnotacao && this.currentAnotacao.id) {
            anotacao.id = Number(this.currentAnotacao.id);
            anotacao.dataCriacao = this.currentAnotacao.dataCriacao;
        }
        
        try {
            if (typeof app !== 'undefined' && app.salvarAnotacao) {
                await app.salvarAnotacao(anotacao, !anotacao.id);
            } else if (typeof db !== 'undefined') {
                await db.salvarAnotacao(anotacao);
            }
            
            document.getElementById('editor-modal').style.display = 'none';
            
            if (typeof ui !== 'undefined') {
                ui.showNotification('Salvo com sucesso!', 'success');
            } else {
                alert('Salvo com sucesso!');
            }
            
            if (typeof app !== 'undefined' && app.carregarAnotacoes) {
                await app.carregarAnotacoes(self.currentTopico, self.currentSubtopico);
            }
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar: ' + error.message);
        }
    }
    
    formatarConteudo(texto) {
        if (!texto) return '';
        
        let html = texto;
        
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/==([^=]+)==/g, '<mark>$1</mark>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
        
        const lines = html.split('\n');
        let result = [];
        let inList = false;
        let inNumberedList = false;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
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

// Criar instância global
const editor = new Editor();
window.editor = editor;
