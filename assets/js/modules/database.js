// Módulo de Banco de Dados usando IndexedDB
class Database {
    constructor() {
        this.dbName = 'GuiaConsincoDB';
        this.dbVersion = 3; // Versão incrementada para incluir favoritos e comentários
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
    
    // Operações com Anotações
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
                        return
