// Módulo do Editor de Anotações
class Editor {
    constructor() {
        this.currentAnotacao = null;
        this.currentTopico = null;
        this.currentSubtopico = null;
    }
    
    async abrirEditor(topico, subtopico, anotacao = null) {
        this.currentTopico = topico;
        this.currentSubtopico = subtopico;
        this.currentAnotacao = anotacao;
        
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
            setTimeout(() => this.preencherFormulario(anotacao), 100);
        }
        
        this.setupEventListeners();
        modal.style.display = 'block';
    }
    
    getEditorHTML() {
        return `
            <form id="anotacao-form">
                <div class="form-group">
                    <label for="anotacao-tipo">Tipo de Conteúdo</label>
                    <select id="anotacao-tipo" required>
                        <option value="guia">📘 Guia</option>
                        <option value="observacao">📝 Observação</option>
                    </select>
                    <small style="color: #666; display: block; margin-top: 5px;">
                        <strong>Guia:</strong> Conteúdo principal com título e subtítulo<br>
                        <strong>Observação:</strong> Notas complementares ou lembretes
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="anotacao-titulo">Título Principal</label>
                    <input type="text" id="anotacao-titulo" required 
                           placeholder="Ex: Cadastro de Família de Produtos">
                </div>
                
                <div class="form-group">
                    <label for="anotacao-subtitulo">Subtítulo (opcional)</label>
                    <input type="text" id="anotacao-subtitulo" 
                           placeholder="Ex: Passo a passo completo">
                </div>
                
                <div class="form-group">
                    <label for="anotacao-conteudo">Conteúdo</label>
                    <div class="editor-toolbar">
                        <button type="button" data-format="bold" title="Negrito">
                            <i class="fas fa-bold"></i>
                        </button>
                        <button type="button" data-format="italic" title="Itálico">
                            <i class="fas fa-italic"></i>
                        </button>
                        <button type="button" data-format="underline" title="Sublinhado">
                            <i class="fas fa-underline"></i>
                        </button>
                        <button type="button" data-format="list" title="Lista">
                            <i class="fas fa-list"></i>
                        </button>
                        <button type="button" data-format="number-list" title="Lista Numerada">
                            <i class="fas fa-list-ol"></i>
                        </button>
                        <button type="button" data-format="code" title="Código/Comando">
                            <i class="fas fa-code"></i>
                        </button>
                        <button type="button" data-format="highlight" title="Destacar">
                            <i class="fas fa-highlighter"></i>
                        </button>
                    </div>
                    <textarea id="anotacao-conteudo" rows="15" required 
                              placeholder="Digite o conteúdo do guia aqui..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="anotacao-tags">Tags (separadas por vírgula)</label>
                    <input type="text" id="anotacao-tags" 
                           placeholder="Ex: importante, revisar, urgente">
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" class="btn-sm" id="btn-cancelar-editor">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="submit" class="btn-sm btn-success">
                        <i class="fas fa-save"></i> Salvar
                    </button>
                </div>
            </form>
        `;
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
        document.querySelectorAll('[data-format]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.aplicarFormatacao(button.dataset.format);
            });
        });
        
        const form = document.getElementById('anotacao-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.salvarAnotacao();
            });
        }
        
        const btnCancelar = document.getElementById('btn-cancelar-editor');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                if (typeof ui !== 'undefined') {
                    ui.closeModal();
                }
            });
        }
        
        const tipoSelect = document.getElementById('anotacao-tipo');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', (e) => {
                const textarea = document.getElementById('anotacao-conteudo');
                if (!textarea) return;
                
                if (e.target.value === 'observacao') {
                    textarea.placeholder = 'Digite sua observação aqui...\n\nExemplos:\n- Lembrete importante\n- Ponto de atenção\n- Dica rápida';
                } else {
                    textarea.placeholder = 'Digite o conteúdo do guia aqui...\n\nUse:\n- Listas\n1. Numeradas\n**Negrito**\n*Itálico*';
                }
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
        let cursorOffset = 0;
        
        switch(format) {
            case 'bold':
                formattedText = '**' + (selectedText || 'texto em negrito') + '**';
                cursorOffset = selectedText ? 0 : 2;
                break;
            case 'italic':
                formattedText = '*' + (selectedText || 'texto em itálico') + '*';
                cursorOffset = selectedText ? 0 : 1;
                break;
            case 'underline':
                formattedText = '__' + (selectedText || 'texto sublinhado') + '__';
                cursorOffset = selectedText ? 0 : 2;
                break;
            case 'list':
                formattedText = selectedText ? selectedText.split('\n').map(line => '- ' + line).join('\n') : '- Item 1\n- Item 2\n- Item 3';
                break;
            case 'number-list':
                formattedText = selectedText ? selectedText.split('\n').map((line, i) => (i + 1) + '. ' + line).join('\n') : '1. Primeiro\n2. Segundo\n3. Terceiro';
                break;
            case 'code':
                formattedText = '`' + (selectedText || 'código') + '`';
                cursorOffset = selectedText ? 0 : 1;
                break;
            case 'highlight':
                formattedText = '==' + (selectedText || 'texto destacado') + '==';
                cursorOffset = selectedText ? 0 : 2;
                break;
        }
        
        textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
        textarea.focus();
        
        if (!selectedText) {
            const newPosition = start + formattedText.length - cursorOffset;
            textarea.setSelectionRange(newPosition, newPosition);
        }
    }
    
    async salvarAnotacao() {
        const tipoSelect = document.getElementById('anotacao-tipo');
        const tituloInput = document.getElementById('anotacao-titulo');
        const subtituloInput = document.getElementById('anotacao-subtitulo');
        const conteudoTextarea = document.getElementById('anotacao-conteudo');
        const tagsInput = document.getElementById('anotacao-tags');
        
        if (!tipoSelect || !tituloInput || !conteudoTextarea) {
            console.error('Elementos do formulário não encontrados');
            return false;
        }
        
        const tipo = tipoSelect.value;
        const titulo = tituloInput.value.trim();
        const subtitulo = subtituloInput?.value.trim() || '';
        const conteudo = conteudoTextarea.value.trim();
        const tagsStr = tagsInput?.value || '';
        
        if (!titulo || !conteudo) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Título e conteúdo são obrigatórios', 'warning');
            }
            return false;
        }
        
        const user = typeof auth !== 'undefined' ? auth.getCurrentUser() : null;
        
        const anotacao = {
            topico: this.currentTopico,
            subtopico: this.currentSubtopico,
            tipo: tipo,
            titulo: titulo,
            subtitulo: subtitulo || null,
            conteudo: conteudo,
            tags: tagsStr.split(',').map(t => t.trim()).filter(t => t),
            autor: user?.name || 'Sistema',
            autorUsername: user?.username || 'sistema'
        };
        
        if (this.currentAnotacao?.id) {
            anotacao.id = Number(this.currentAnotacao.id);
            anotacao.dataCriacao = this.currentAnotacao.dataCriacao;
        }
        
        try {
            const isNew = !anotacao.id;
            
            // Verificar se app está disponível
            if (typeof app !== 'undefined' && app.salvarAnotacao) {
                await app.salvarAnotacao(anotacao, isNew);
            } else {
                // Fallback: salvar diretamente no banco
                if (typeof db !== 'undefined') {
                    await db.salvarAnotacao(anotacao);
                }
            }
            
            if (typeof ui !== 'undefined') {
                ui.closeModal();
                ui.showNotification(tipo === 'guia' ? '✅ Guia salvo!' : '✅ Observação salva!', 'success');
            }
            
            // Recarregar anotações
            if (typeof app !== 'undefined' && app.carregarAnotacoes) {
                await app.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar:', error);
            if (typeof ui !== 'undefined') {
                ui.showNotification('Erro ao salvar: ' + error.message, 'error');
            }
            return false;
        }
    }
    
    formatarConteudo(texto) {
        if (!texto) return '';
        
        let html = texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        html = html
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/==(.*?)==/g, '<mark>$1</mark>');
        
        const lines = html.split('\n');
        let inList = false;
        let inNumberedList = false;
        let result = [];
        
        for (let line of lines) {
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
        
        return html;
    }
}

// Criar instância global - GARANTIR QUE SEJA CRIADA
const editor = new Editor();
window.editor = editor;
