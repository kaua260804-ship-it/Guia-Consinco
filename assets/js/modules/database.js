// Módulo de Banco de Dados usando IndexedDB
class Database {
    constructor() {
        this.dbName = 'GuiaConsincoDB';
        this.dbVersion = 2; // Incrementar versão para forçar recriação
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
                
                // Criar nova store para anotações COM autoIncrement
                const anotacoesStore = db.createObjectStore('anotacoes', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                anotacoesStore.createIndex('topico', 'topico', { unique: false });
                anotacoesStore.createIndex('subtopico', 'subtopico', { unique: false });
                anotacoesStore.createIndex('data', 'dataCriacao', { unique: false });
                
                // Store para configurações
                db.createObjectStore('configuracoes', { keyPath: 'chave' });
                
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
                
                // Criar uma cópia limpa dos dados
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
                
                // SÓ incluir o id se NÃO for null/undefined e for um número válido
                if (anotacao.id && !isNaN(anotacao.id) && anotacao.id > 0) {
                    dados.id = Number(anotacao.id);
                }
                // Se não tiver ID, o autoIncrement vai gerar um novo
                
                console.log('Salvando anotação:', dados);
                
                let request;
                if (dados.id) {
                    // Atualizar existente
                    request = store.put(dados);
                } else {
                    // Adicionar novo
                    request = store.add(dados);
                }
                
                request.onsuccess = () => {
                    console.log('Anotação salva com ID:', request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error('Erro na operação do banco:', request.error);
                    reject(request.error);
                };
                
                transaction.oncomplete = () => {
                    console.log('Transação completada');
                };
                
                transaction.onerror = () => {
                    console.error('Erro na transação:', transaction.error);
                    reject(transaction.error);
                };
                
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
                    
                    // Ordenar por data de criação (mais recentes primeiro)
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
                const transaction = this.db.transaction(['anotacoes'], 'readwrite');
                const store = transaction.objectStore('anotacoes');
                
                const request = store.delete(Number(id));
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
                
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
    
    // Configurações
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
    
    // Limpar banco de dados (útil para debug)
    async limparBanco() {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['anotacoes', 'configuracoes'], 'readwrite');
                const anotacoesStore = transaction.objectStore('anotacoes');
                const configStore = transaction.objectStore('configuracoes');
                
                anotacoesStore.clear();
                configStore.clear();
                
                transaction.oncomplete = () => {
                    console.log('Banco de dados limpo');
                    resolve(true);
                };
                
                transaction.onerror = () => reject(transaction.error);
                
            } catch (error) {
                console.error('Erro ao limpar banco:', error);
                reject(error);
            }
        });
    }
    
    // Inicializar dados padrão
    async inicializarDadosPadrao() {
        try {
            const config = await this.getConfig('dados_inicializados_v2');
            
            if (!config || !config.valor) {
                console.log('Inicializando dados padrão...');
                
                // Limpar dados antigos se necessário
                const anotacoesExistentes = await this.getTodasAnotacoes();
                if (anotacoesExistentes.length === 0) {
                    // Exemplo de anotações padrão
                    const anotacoesPadrao = [
                        {
                            topico: 'cadastro',
                            subtopico: 'familia',
                            tipo: 'guia',
                            titulo: 'Processo de Cadastro de Família',
                            subtitulo: 'Passo a passo completo',
                            conteudo: 'O cadastro de famílias é fundamental para a organização dos produtos no sistema Consinco.\n\n**Pré-requisitos:**\n- Ter acesso ao módulo de cadastros\n- Conhecer a estrutura de produtos da empresa\n\n**Passo a passo:**\n1. Acesse o menu Cadastros\n2. Selecione Produtos\n3. Clique em Família\n4. Preencha os campos obrigatórios\n5. Salve o cadastro',
                            tags: ['importante', 'passo-a-passo'],
                            autor: 'Sistema',
                            autorUsername: 'sistema'
                        },
                        {
                            topico: 'cadastro',
                            subtopico: 'familia',
                            tipo: 'observacao',
                            titulo: 'Observação importante',
                            subtitulo: '',
                            conteudo: 'Lembre-se de verificar se a família já não existe antes de criar uma nova. Famílias duplicadas podem causar problemas nos relatórios.',
                            tags: ['atenção'],
                            autor: 'Sistema',
                            autorUsername: 'sistema'
                        },
                        {
                            topico: 'recebimento',
                            subtopico: 'nfe',
                            tipo: 'guia',
                            titulo: 'Recebimento de Nota Fiscal',
                            subtitulo: 'Procedimento padrão',
                            conteudo: '**Processo de recebimento de NFE:**\n\n1. Acesse o módulo de Recebimento\n2. Selecione a opção NFE\n3. Informe o número da nota fiscal\n4. Confira os dados do fornecedor\n5. Verifique os produtos e quantidades\n6. Confirme o recebimento\n\n==Importante:== Sempre confira se os valores da nota batem com o pedido de compra.',
                            tags: ['nfe', 'recebimento'],
                            autor: 'Sistema',
                            autorUsername: 'sistema'
                        }
                    ];
                    
                    for (const anotacao of anotacoesPadrao) {
                        await this.salvarAnotacao(anotacao);
                    }
                }
                
                await this.setConfig('dados_inicializados_v2', true);
                console.log('Dados padrão inicializados');
            }
        } catch (error) {
            console.error('Erro ao inicializar dados padrão:', error);
        }
    }
}

// Instância global do banco de dados
const db = new Database();

// Função para limpar e recriar o banco (execute no console se necessário)
window.limparBanco = async () => {
    await db.limparBanco();
    console.log('Banco limpo. Recarregue a página.');
};