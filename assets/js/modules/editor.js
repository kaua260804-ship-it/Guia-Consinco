// Substituir o método salvarAnotacao existente por:
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
        ui.showNotification('Título e conteúdo são obrigatórios', 'warning');
        return false;
    }
    
    const user = auth.getCurrentUser();
    
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
        // Usar o método do app que inclui auditoria e criptografia
        const isNew = !anotacao.id;
        await app.salvarAnotacao(anotacao, isNew);
        
        ui.closeModal();
        await app.carregarAnotacoes(this.currentTopico, this.currentSubtopico);
        ui.showNotification(tipo === 'guia' ? '✅ Guia salvo!' : '✅ Observação salva!', 'success');
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar:', error);
        ui.showNotification('Erro ao salvar: ' + error.message, 'error');
        return false;
    }
}
