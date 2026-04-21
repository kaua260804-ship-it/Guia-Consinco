// Módulo de Interface do Usuário
class UI {
    constructor() {
        this.modal = null;
        this.initModal();
    }
    
    initModal() {
        // Aguardar o DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.modal = document.getElementById('editor-modal');
            });
        } else {
            this.modal = document.getElementById('editor-modal');
        }
    }
    
    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        } else {
            const modal = document.getElementById('editor-modal');
            if (modal) modal.style.display = 'none';
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            animation: slideIn 0.3s;
            border-left: 4px solid ${this.getColor(type)};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    getColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || '#3498db';
    }
    
    async confirmDialog(message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'modal';
            dialog.style.display = 'block';
            dialog.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>Confirmar</h3>
                        <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button class="btn-sm" onclick="this.closest('.modal').remove(); window.confirmResult = false;">
                                Cancelar
                            </button>
                            <button class="btn-sm btn-danger" onclick="this.closest('.modal').remove(); window.confirmResult = true;">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            const checkResult = setInterval(() => {
                if (window.confirmResult !== undefined) {
                    clearInterval(checkResult);
                    resolve(window.confirmResult);
                    delete window.confirmResult;
                }
            }, 100);
        });
    }
    
    formatarData(dataISO) {
        if (!dataISO) return 'Data não disponível';
        
        try {
            const data = new Date(dataISO);
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Data inválida';
        }
    }
}

// Criar instância global
const ui = new UI();

// Adicionar animação fadeOut se não existir
if (!document.querySelector('#fadeOut-animation')) {
    const style = document.createElement('style');
    style.id = 'fadeOut-animation';
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}