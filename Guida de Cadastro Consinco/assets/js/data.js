// Gerenciamento de dados dos guias
class DataManager {
    constructor() {
        this.guiasKey = 'consinco_guias';
        this.initData();
    }
    
    initData() {
        if (!localStorage.getItem(this.guiasKey)) {
            const defaultGuias = {
                cadastro: {
                    familia: {
                        titulo: 'Cadastro de Família',
                        conteudo: `# Como cadastrar uma Família no Consinco
                        
1. Acesse o menu: Cadastros > Produtos > Família
2. Clique em "Novo"
3. Preencha os campos obrigatórios:
   - Código da Família
   - Descrição
   - Tipo de Família
4. Clique em "Salvar"

**Observações importantes:**
- O código da família deve seguir o padrão da empresa
- A descrição deve ser clara e objetiva
- Verifique se a família não existe antes de cadastrar`
                    },
                    produto: {
                        titulo: 'Cadastro de Produto',
                        conteudo: `# Como cadastrar um Produto no Consinco
                        
1. Acesse: Cadastros > Produtos > Produto
2. Clique em "Novo Produto"
3. Preencha as informações:
   - Código do Produto
   - Descrição completa
   - Família
   - Unidade de Medida
   - NCM
   - CEST (se aplicável)
4. Configure os parâmetros fiscais
5. Salve o cadastro

**Dicas:**
- Sempre verifique o NCM correto
- Configure corretamente a tributação`
                    }
                    // Adicionar outros subtópicos conforme necessário
                }
            };
            
            localStorage.setItem(this.guiasKey, JSON.stringify(defaultGuias));
        }
    }
    
    getGuias() {
        return JSON.parse(localStorage.getItem(this.guiasKey));
    }
    
    getGuia(topico, subtopico) {
        const guias = this.getGuias();
        return guias[topico]?.[subtopico] || null;
    }
    
    saveGuia(topico, subtopico, titulo, conteudo) {
        const guias = this.getGuias();
        
        if (!guias[topico]) {
            guias[topico] = {};
        }
        
        guias[topico][subtopico] = {
            titulo: titulo,
            conteudo: conteudo,
            ultimaAtualizacao: new Date().toISOString()
        };
        
        localStorage.setItem(this.guiasKey, JSON.stringify(guias));
        return true;
    }
    
    deleteGuia(topico, subtopico) {
        const guias = this.getGuias();
        
        if (guias[topico] && guias[topico][subtopico]) {
            delete guias[topico][subtopico];
            localStorage.setItem(this.guiasKey, JSON.stringify(guias));
            return true;
        }
        
        return false;
    }
    
    getAllTopicos() {
        return {
            cadastro: {
                titulo: 'Cadastro',
                subtopicos: ['familia', 'produto', 'pessoa', 'fornecedor', 'comprador', 'categoria']
            },
            recebimento: {
                titulo: 'Recebimento',
                subtopicos: ['nfe']
            },
            inconsistencia: {
                titulo: 'Inconsistência',
                subtopicos: ['familia', 'produto', 'fornecedor', 'comprador', 'categoria', 'nfe']
            }
        };
    }
}

const dataManager = new DataManager();