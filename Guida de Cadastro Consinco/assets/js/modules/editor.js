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
            this.preencherFormulario(anotacao);
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
                        <button type="button" data-format="link" title="Link">
                            <i class="fas fa-link"></i>
                        </button>
                    </div>
                    <textarea id="anotacao-conteudo" rows="15" required 
                              placeholder="Digite o conteúdo do guia aqui..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="anotacao-tags">Tags (separadas por vírgula)</label>
                    <input type="text" id="anotacao-tags" 
                           placeholder="Ex: importante, revisar, urgente, passo-a-passo">
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
        setTimeout(() => {
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
        }, 100);
    }
    
    setupEventListeners() {
        // Formatação da toolbar
        document.querySelectorAll('[data-format]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const format = button.dataset.format;
                this.aplicarFormatacao(format);
            });
        });
        
        // Salvar formulário
        const form = document.getElementById('anotacao-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.salvarAnotacao();
            });
        }
        
        // Botão cancelar
        const btnCancelar = document.getElementById('btn-cancelar-editor');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                if (typeof ui !== 'undefined') {
                    ui.closeModal();
                } else {
                    const modal = document.getElementById('editor-modal');
                    if (modal) modal.style.display = 'none';
                }
            });
        }
        
        // Atualizar placeholder baseado no tipo
        const tipoSelect = document.getElementById('anotacao-tipo');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', (e) => {
                const tipo = e.target.value;
                const textarea = document.getElementById('anotacao-conteudo');
                
                if (!textarea) return;
                
                if (tipo === 'observacao') {
                    textarea.placeholder = 'Digite sua observação aqui...\n\nExemplos:\n- Lembrete importante\n- Ponto de atenção\n- Dica rápida\n- Nota complementar';
                } else {
                    textarea.placeholder = 'Digite o conteúdo do guia aqui...\n\nVocê pode usar:\n- Listas com tópicos\n1. Listas numeradas\n**Texto em negrito**\n*Texto em itálico*\n==Texto destacado==\n`código ou comandos`';
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
                if (selectedText) {
                    formattedText = selectedText.split('\n').map(line => '- ' + line).join('\n');
                } else {
                    formattedText = '- Item 1\n- Item 2\n- Item 3';
                }
                break;
            case 'number-list':
                if (selectedText) {
                    formattedText = selectedText.split('\n').map((line, i) => (i + 1) + '. ' + line).join('\n');
                } else {
                    formattedText = '1. Primeiro item\n2. Segundo item\n3. Terceiro item';
                }
                break;
            case 'code':
                formattedText = '`' + (selectedText || 'código ou comando') + '`';
                cursorOffset = selectedText ? 0 : 1;
                break;
            case 'highlight':
                formattedText = '==' + (selectedText || 'texto destacado') + '==';
                cursorOffset = selectedText ? 0 : 2;
                break;
            case 'link':
                formattedText = '[' + (selectedText || 'texto do link') + '](url)';
                cursorOffset = selectedText ? 0 : 1;
                break;
            default:
                return;
        }
        
        textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
        textarea.focus();
        
        // Posicionar cursor apropriadamente
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
            if (typeof ui !== 'undefined') {
                ui.showNotification('Erro: Campos não encontrados', 'error');
            }
            return;
        }
        
        const tipo = tipoSelect.value;
        const titulo = tituloInput.value.trim();
        const subtitulo = subtituloInput ? subtituloInput.value.trim() : '';
        const conteudo = conteudoTextarea.value.trim();
        const tagsStr = tagsInput ? tagsInput.value : '';
        
        if (!titulo || !conteudo) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Título e conteúdo são obrigatórios', 'warning');
            }
            return;
        }
        
        // Obter usuário atual
        let user = null;
        try {
            if (typeof auth !== 'undefined') {
                user = auth.getCurrentUser();
            }
        } catch (e) {
            console.warn('Auth não disponível:', e);
        }
        
        // Criar objeto da anotação
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
        
        // SÓ adicionar o ID se estiver editando uma anotação existente
        if (this.currentAnotacao && this.currentAnotacao.id) {
            anotacao.id = Number(this.currentAnotacao.id);
            anotacao.dataCriacao = this.currentAnotacao.dataCriacao;
        }
        
        console.log('Salvando anotação:', anotacao);
        
        try {
            // Verificar se db existe
            if (typeof db === 'undefined') {
                throw new Error('Banco de dados não inicializado');
            }
            
            const resultado = await db.salvarAnotacao(anotacao);
            console.log('Anotação salva com sucesso:', resultado);
            
            // Fechar modal
            if (typeof ui !== 'undefined') {
                ui.closeModal();
            } else {
                const modal = document.getElementById('editor-modal');
                if (modal) modal.style.display = 'none';
            }
            
            // Recarregar as anotações
            if (typeof app !== 'undefined' && app.carregarAnotacoes) {
                await app.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
            }
            
            // Mostrar notificação
            if (typeof ui !== 'undefined') {
                ui.showNotification(
                    tipo === 'guia' ? '✅ Guia salvo com sucesso!' : '✅ Observação salva com sucesso!', 
                    'success'
                );
            }
            
        } catch (error) {
            console.error('Erro ao salvar anotação:', error);
            
            let errorMessage = 'Erro ao salvar conteúdo';
            if (error.message) {
                errorMessage += ': ' + error.message;
            }
            
            if (typeof ui !== 'undefined') {
                ui.showNotification(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
        }
    }
    
    formatarConteudo(texto) {
        if (!texto) return '';
        
        // Escapar HTML primeiro para evitar injeção
        let html = texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Converter formatação markdown para HTML
        html = html
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/==(.*?)==/g, '<mark>$1</mark>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Converter listas
        const lines = html.split('\n');
        let inList = false;
        let inNumberedList = false;
        let result = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Lista não numerada
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
            
            // Lista numerada
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
            
            // Linha normal
            if (line.trim() === '') {
                result.push('<br>');
            } else {
                result.push(line);
            }
        }
        
        // Fechar listas abertas
        if (inList) result.push('</ul>');
        if (inNumberedList) result.push('</ol>');
        
        // Juntar e adicionar parágrafos
        html = result.join('\n');
        
        // Converter quebras de linha duplas em parágrafos
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        return html;
    }
}

// Criar instância global
const editor = new Editor();

// Expor para debug
window.editor = editor;