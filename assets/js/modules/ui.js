// Módulo UI
class UI {
    constructor() {
        this.init();
    }
    
    init() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && e.target.id !== 'editor-modal') {
                e.target.style.display = 'none';
            }
        });
    }
    
    closeModal() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
    
    closeComentariosModal() {
        document.getElementById('comentarios-modal').style.display = 'none';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `<i class="fas fa-${this.getIcon(type)}"></i><span>${message}</span>`;
        notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 20px;background:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;animation:slideIn 0.3s;';
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
    
    getIcon(type) {
        const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
        return icons[type] || 'info-circle';
    }
    
    async confirmDialog(message) {
        return confirm(message);
    }
    
    formatarData(dataISO) {
        if (!dataISO) return '';
        return new Date(dataISO).toLocaleString('pt-BR');
    }
}

const ui = new UI();
