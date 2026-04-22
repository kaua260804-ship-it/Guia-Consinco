// Módulo de Drag and Drop
class DragDrop {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.draggedItem = null;
        this.dropTarget = null;
        this.orderKey = 'anotacoes_order';
        this.init();
    }
    
    init() {
        this.loadOrder();
        this.setupEventListeners();
    }
    
    loadOrder() {
        const saved = localStorage.getItem(this.orderKey);
        this.order = saved ? JSON.parse(saved) : {};
    }
    
    saveOrder() {
        localStorage.setItem(this.orderKey, JSON.stringify(this.order));
    }
    
    setupEventListeners() {
        this.container.addEventListener('dragstart', (e) => {
            const item = e.target.closest('[data-draggable]');
            if (!item) {
                e.preventDefault();
                return;
            }
            
            this.draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.dataset.id);
        });
        
        this.container.addEventListener('dragend', (e) => {
            const item = e.target.closest('[data-draggable]');
            if (item) {
                item.classList.remove('dragging');
            }
            
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            
            this.draggedItem = null;
            this.dropTarget = null;
        });
        
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            
            const item = e.target.closest('[data-draggable]');
            if (!item || !this.draggedItem || item === this.draggedItem) return;
            
            e.dataTransfer.dropEffect = 'move';
            
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            
            item.classList.add('drag-over');
            this.dropTarget = item;
        });
        
        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (!this.draggedItem || !this.dropTarget) return;
            
            const draggedId = this.draggedItem.dataset.id;
            const targetId = this.dropTarget.dataset.id;
            
            this.reorderItems(draggedId, targetId);
            
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });
    }
    
    reorderItems(draggedId, targetId) {
        const items = Array.from(this.container.querySelectorAll('[data-draggable]'));
        const draggedIndex = items.findIndex(el => el.dataset.id === draggedId);
        const targetIndex = items.findIndex(el => el.dataset.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Reordenar no DOM
        if (draggedIndex < targetIndex) {
            this.dropTarget.parentNode.insertBefore(this.draggedItem, this.dropTarget.nextSibling);
        } else {
            this.dropTarget.parentNode.insertBefore(this.draggedItem, this.dropTarget);
        }
        
        // Salvar ordem
        const newOrder = Array.from(this.container.querySelectorAll('[data-draggable]'))
            .map(el => el.dataset.id);
        
        const key = `${this.app.currentTopico}_${this.app.currentSubtopico}`;
        this.order[key] = newOrder;
        this.saveOrder();
    }
    
    applyOrder(anotacoes) {
        const key = `${this.app.currentTopico}_${this.app.currentSubtopico}`;
        const savedOrder = this.order[key];
        
        if (!savedOrder || savedOrder.length === 0) return anotacoes;
        
        const ordered = [];
        const remaining = [...anotacoes];
        
        savedOrder.forEach(id => {
            const index = remaining.findIndex(a => String(a.id) === String(id));
            if (index !== -1) {
                ordered.push(remaining[index]);
                remaining.splice(index, 1);
            }
        });
        
        return [...ordered, ...remaining];
    }
    
    makeDraggable(element, id) {
        element.setAttribute('draggable', 'true');
        element.setAttribute('data-draggable', 'true');
        element.setAttribute('data-id', id);
        
        // Indicador visual
        element.style.cursor = 'grab';
        
        element.addEventListener('mousedown', () => {
            element.style.cursor = 'grabbing';
        });
        
        element.addEventListener('mouseup', () => {
            element.style.cursor = 'grab';
        });
    }
}
