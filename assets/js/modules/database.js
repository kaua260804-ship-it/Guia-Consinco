// Módulo de Banco de Dados usando IndexedDB
class Database {
    constructor() {
        this.dbName = 'GuiaConsincoDB';
        this.dbVersion = 3;
        this.db = null;
        this.initPromise = null;
    }
    
    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }
        
        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Erro ao abrir banco de dados');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Banco de dados conectado com sucesso');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;
                
                console.log('Atualizando banco de dados da versão', oldVersion, 'para', this.dbVersion);
                
                // Remover stores antigas se existirem
                if (db.objectStoreNames.contains('anotacoes')) {
                    db.deleteObjectStore('anotacoes');
                }
                if (db.objectStoreNames.contains('configuracoes')) {
                    db.deleteObjectStore('configuracoes');
                }
                if (db.objectStoreNames.contains('favoritos')) {
                    db.deleteObjectStore('favoritos');
                }
                if (db.objectStoreNames.contains('comentarios')) {
                    db.deleteObjectStore('comentarios');
                }
                
                // Store para anotações
                const anotacoesStore = db.createObjectStore('anotacoes', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                anotacoesStore.createIndex('topico', 'topico', { unique: false });
                anotacoesStore.createIndex('subtopico', 'subtopico', { unique: false });
                anotacoesStore.createIndex('data', 'dataCriacao', { unique: false });
                
                // Store para configurações
                db.createObjectStore('configuracoes', { keyPath: 'chave' });
                
                // Store para favoritos
                const favoritosStore = db.createObjectStore('favoritos', { keyPath: 'id' });
                favoritosStore.createIndex('anotacaoId', 'anotacaoId', { unique: true });
                
                // Store para comentários
                const comentariosStore = db.createObjectStore('comentarios', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                comentariosStore.createIndex('anotacaoId', 'anotacaoId', { unique: false });
                comentariosStore.createIndex('aprovado', 'aprovado', { unique: false });
                
                console.log('Estrutura do banco de dados criada');
            };
        });
        
        return this.initPromise;
    }
    
    async ensureDB() {
        if (!this.db) {
            await this.init();
        }
        return this.db;
    }
    
    // ==================== ANOTAÇÕES ====================
    async salvarAnotacao(anotacao) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['anotacoes'], 'readwrite');
                const store = transaction.objectStore('anotacoes');
                
                const dados = {
                    topico: anotacao.topico,
                    subtopico: anotacao.subtopico,
                    tipo: anotacao.tipo || 'guia',
                    titulo: anotacao.titulo || '',
                    subtitulo: anotacao.subtitulo || null,
                    conteudo: anotacao.conteudo || '',
                    tags: anotacao.tags || [],
                    autor: anotacao.autor || 'Sistema',
                    autorUsername: anotacao.autorUsername || 'sistema',
                    dataCriacao: anotacao.dataCriacao || new Date().toISOString(),
                    dataAtualizacao: new Date().toISOString()
                };
                
                if (anotacao.id && !isNaN(anotacao.id) && anotacao.id > 0) {
                    dados.id = Number(anotacao.id);
                }
                
                let request;
                if (dados.id) {
                    request = store.put(dados);
                } else {
                    request = store.add(dados);
                }
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao salvar anotação:', error);
                reject(error);
            }
        });
    }
    
    async getAnotacoes(topico, subtopico = null) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['anotacoes'], 'readonly');
                const store = transaction.objectStore('anotacoes');
                const index = store.index('topico');
                
                const request = index.getAll(topico);
                
                request.onsuccess = () => {
                    let anotacoes = request.result || [];
                    
                    if (subtopico) {
                        anotacoes = anotacoes.filter(a => a.subtopico === subtopico);
                    }
                    
                    anotacoes.sort((a, b) => {
                        const dateA = new Date(a.dataCriacao || 0);
                        const dateB = new Date(b.dataCriacao || 0);
                        return dateB - dateA;
                    });
                    
                    resolve(anotacoes);
                };
                
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao buscar anotações:', error);
                reject(error);
            }
        });
    }
    
    async getAnotacao(id) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['anotacoes'], 'readonly');
                const store = transaction.objectStore('anotacoes');
                
                const request = store.get(Number(id));
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao buscar anotação:', error);
                reject(error);
            }
        });
    }
    
    async excluirAnotacao(id) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['anotacoes', 'favoritos', 'comentarios'], 'readwrite');
                const anotacoesStore = transaction.objectStore('anotacoes');
                const favoritosStore = transaction.objectStore('favoritos');
                const comentariosStore = transaction.objectStore('comentarios');
                
                // Excluir anotação
                anotacoesStore.delete(Number(id));
                
                // Excluir favorito relacionado
                favoritosStore.delete(`fav_${id}`);
                
                // Excluir comentários relacionados
                const comentariosIndex = comentariosStore.index('anotacaoId');
                const comentariosRequest = comentariosIndex.getAll(Number(id));
                comentariosRequest.onsuccess = () => {
                    const comentarios = comentariosRequest.result || [];
                    comentarios.forEach(c => comentariosStore.delete(c.id));
                };
                
                transaction.oncomplete = () => resolve(true);
                transaction.onerror = () => reject(transaction.error);
                
            } catch (error) {
                console.error('Erro ao excluir anotação:', error);
                reject(error);
            }
        });
    }
    
    async getTodasAnotacoes() {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['anotacoes'], 'readonly');
                const store = transaction.objectStore('anotacoes');
                
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const anotacoes = request.result || [];
                    anotacoes.sort((a, b) => {
                        const dateA = new Date(a.dataCriacao || 0);
                        const dateB = new Date(b.dataCriacao || 0);
                        return dateB - dateA;
                    });
                    resolve(anotacoes);
                };
                
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao buscar todas anotações:', error);
                reject(error);
            }
        });
    }
    
    // ==================== CONFIGURAÇÕES ====================
    async setConfig(chave, valor) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['configuracoes'], 'readwrite');
                const store = transaction.objectStore('configuracoes');
                
                const request = store.put({ chave, valor });
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao salvar configuração:', error);
                reject(error);
            }
        });
    }
    
    async getConfig(chave) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['configuracoes'], 'readonly');
                const store = transaction.objectStore('configuracoes');
                
                const request = store.get(chave);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao buscar configuração:', error);
                reject(error);
            }
        });
    }
    
    // ==================== FAVORITOS ====================
    async adicionarFavorito(anotacaoId) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['favoritos'], 'readwrite');
            const store = transaction.objectStore('favoritos');
            
            const favorito = {
                id: `fav_${anotacaoId}`,
                anotacaoId: Number(anotacaoId),
                dataAdicionado: new Date().toISOString()
            };
            
            const request = store.add(favorito);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    async removerFavorito(anotacaoId) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['favoritos'], 'readwrite');
            const store = transaction.objectStore('favoritos');
            
            const request = store.delete(`fav_${anotacaoId}`);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    async isFavorito(anotacaoId) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['favoritos'], 'readonly');
            const store = transaction.objectStore('favoritos');
            
            const request = store.get(`fav_${anotacaoId}`);
            request.onsuccess = () => resolve(!!request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getFavoritos() {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['favoritos', 'anotacoes'], 'readonly');
            const favoritosStore = transaction.objectStore('favoritos');
            const anotacoesStore = transaction.objectStore('anotacoes');
            
            const request = favoritosStore.getAll();
            
            request.onsuccess = async () => {
                const favoritos = request.result || [];
                const anotacoes = [];
                
                for (const fav of favoritos) {
                    const anotacaoRequest = anotacoesStore.get(fav.anotacaoId);
                    await new Promise((res) => {
                        anotacaoRequest.onsuccess = () => {
                            if (anotacaoRequest.result) {
                                anotacoes.push({
                                    ...anotacaoRequest.result,
                                    dataFavorito: fav.dataAdicionado
                                });
                            }
                            res();
                        };
                    });
                }
                
                anotacoes.sort((a, b) => {
                    const dateA = new Date(a.dataFavorito || 0);
                    const dateB = new Date(b.dataFavorito || 0);
                    return dateB - dateA;
                });
                
                resolve(anotacoes);
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    // ==================== COMENTÁRIOS ====================
    async adicionarComentario(comentario) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['comentarios'], 'readwrite');
                const store = transaction.objectStore('comentarios');
                
                const dados = {
                    anotacaoId: Number(comentario.anotacaoId),
                    autor: comentario.autor || 'Anônimo',
                    autorUsername: comentario.autorUsername || '',
                    conteudo: comentario.conteudo || '',
                    dataCriacao: new Date().toISOString(),
                    aprovado: comentario.aprovado === true
                };
                
                const request = store.add(dados);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao adicionar comentário:', error);
                reject(error);
            }
        });
    }
    
    async getComentarios(anotacaoId) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['comentarios'], 'readonly');
                const store = transaction.objectStore('comentarios');
                const index = store.index('anotacaoId');
                
                const request = index.getAll(Number(anotacaoId));
                
                request.onsuccess = () => {
                    let comentarios = request.result || [];
                    comentarios.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
                    resolve(comentarios);
                };
                
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao buscar comentários:', error);
                reject(error);
            }
        });
    }
    
    async aprovarComentario(id) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['comentarios'], 'readwrite');
                const store = transaction.objectStore('comentarios');
                
                const getRequest = store.get(Number(id));
                getRequest.onsuccess = () => {
                    const comentario = getRequest.result;
                    if (comentario) {
                        comentario.aprovado = true;
                        const putRequest = store.put(comentario);
                        putRequest.onsuccess = () => resolve(true);
                        putRequest.onerror = () => reject(putRequest.error);
                    } else {
                        reject(new Error('Comentário não encontrado'));
                    }
                };
                getRequest.onerror = () => reject(getRequest.error);
                
            } catch (error) {
                console.error('Erro ao aprovar comentário:', error);
                reject(error);
            }
        });
    }
    
    async excluirComentario(id) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['comentarios'], 'readwrite');
                const store = transaction.objectStore('comentarios');
                
                const request = store.delete(Number(id));
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao excluir comentário:', error);
                reject(error);
            }
        });
    }
    
    async getComentariosPendentes() {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['comentarios'], 'readonly');
                const store = transaction.objectStore('comentarios');
                
                // Buscar todos os comentários e filtrar
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const comentarios = request.result || [];
                    // Filtrar apenas os não aprovados (aprovado === false)
                    const pendentes = comentarios.filter(c => c.aprovado === false);
                    pendentes.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
                    resolve(pendentes);
                };
                
                request.onerror = () => reject(request.error);
                
            } catch (error) {
                console.error('Erro ao buscar comentários pendentes:', error);
                reject(error);
            }
        });
    }
    
    // ==================== INICIALIZAÇÃO ====================
    async limparBanco() {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['anotacoes', 'configuracoes', 'favoritos', 'comentarios'], 'readwrite');
                transaction.objectStore('anotacoes').clear();
                transaction.objectStore('configuracoes').clear();
                transaction.objectStore('favoritos').clear();
                transaction.objectStore('comentarios').clear();
                
                transaction.oncomplete = () => resolve(true);
                transaction.onerror = () => reject(transaction.error);
                
            } catch (error) {
                console.error('Erro ao limpar banco:', error);
                reject(error);
            }
        });
    }
    
    async inicializarDadosPadrao() {
        try {
            const config = await this.getConfig('dados_inicializados_v3');
            
            if (!config || !config.valor) {
                console.log('Inicializando dados padrão...');
                
                const anotacoesExistentes = await this.getTodasAnotacoes();
                if (anotacoesExistentes.length === 0) {
                    const anotacoesPadrao = [
                        {
                            topico: 'cadastro',
                            subtopico: 'familia',
                            tipo: 'guia',
                            titulo: 'CADASTRO DE FAMILIA - MERCEARIA',
                            subtitulo: 'TELA - GERAL',
                            conteudo: '**Campo Família:**\n\nSempre Consulta se a família a ser cadastrada não possui cadastro.\nSeguir o padrão estabelecido: PRODUTO + MARCA + (LINHA) +COR/SABOR/AROMA + (ATRIBUTO) + GRAMATURA\nPara Cadastro de Vinho é sempre Priorizar o RÓTULO\n\n**Campo Marca**\nInserir a Marca de acordo com o Cadastrado da família\nPara Cadastro de Vinho é VINICOLA VAI NA MARCA\n\n**Flags**\n- É Pesável - apenas para famílias que sairão em Balança\n- Permite Quantidade Decimais - para famílias que terão como embalagem KG\n- Permite Multiplicação - ativar a todas as familias\n- Bebida Alcoólica - para famílias que tem como composição Álcool',
                            tags: ['cadastro', 'familia', 'mercearia'],
                            autor: 'Administrador',
                            autorUsername: 'admin'
                        }
                    ];
                    
                    for (const anotacao of anotacoesPadrao) {
                        await this.salvarAnotacao(anotacao);
                    }
                }
                
                await this.setConfig('dados_inicializados_v3', true);
                console.log('Dados padrão inicializados');
            }
        } catch (error) {
            console.error('Erro ao inicializar dados padrão:', error);
        }
    }
}

// Instância global
const db = new Database();

// Função de debug
window.limparBanco = async () => {
    await db.limparBanco();
    console.log('Banco limpo. Recarregue a página.');
};
