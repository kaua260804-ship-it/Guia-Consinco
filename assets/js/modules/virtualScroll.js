// Módulo de Virtual Scrolling
class VirtualScroll {
    constructor(container, itemHeight = 200) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.items = [];
        this.visibleItems = new Map();
        this.scrollTop = 0;
        this.containerHeight = 0;
    }
    
    setItems(items) {
        this.items = items;
        this.render();
    }
    
    render() {
        if (!this.container) return;
        
        this.containerHeight = this.container.clientHeight;
        const totalHeight = this.items.length * this.itemHeight;
        
        // Criar estrutura
        this.container.innerHTML = `
            <div style="height: ${totalHeight}px; position: relative;">
                <div id="virtual-viewport" style="position: absolute; width: 100%;"></div>
            </div>
        `;
        
        this.viewport = document.getElementById('virtual-viewport');
        this.updateVisibleItems();
        
        // Event listener
        this.container.addEventListener('scroll', () => this.updateVisibleItems());
    }
    
    updateVisibleItems() {
        if (!this.viewport) return;
        
        this.scrollTop = this.container.scrollTop;
        
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.min(
            startIndex + Math.ceil(this.containerHeight / this.itemHeight) + 1,
            this.items.length
        );
        
        this.viewport.style.top = `${startIndex * this.itemHeight}px`;
        
        // Renderizar apenas itens visíveis
        let html = '';
        for (let i = startIndex; i < endIndex; i++) {
            if (this.items[i]) {
                html += this.renderItem(this.items[i], i);
            }
        }
        
        this.viewport.innerHTML = html;
    }
    
    renderItem(item, index) {
        // Método a ser sobrescrito
        return `<div style="height: ${this.itemHeight}px;">${item.titulo}</div>`;
    }
    
    scrollToItem(index) {
        this.container.scrollTop = index * this.itemHeight;
    }
}

// Implementação específica para anotações
class AnotacoesVirtualScroll extends VirtualScroll {
    constructor(container, app) {
        super(container, 250);
        this.app = app;
    }
    
    renderItem(anotacao, index) {
        return this.app.renderAnotacoes([anotacao]);
    }
}
