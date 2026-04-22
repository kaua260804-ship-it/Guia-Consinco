// Módulo de Layout Mobile
class MobileLayout {
    constructor(app) {
        this.app = app;
        this.isMobile = window.innerWidth <= 768;
        this.bottomNav = null;
        this.sheetModal = null;
        this.init();
    }
    
    init() {
        this.detectMobile();
        window.addEventListener('resize', () => this.detectMobile());
        
        if (this.isMobile) {
            this.createBottomNavigation();
            this.createSheetModal();
            this.convertModalsToSheets();
            this.hideSidebar();
        }
    }
    
    detectMobile() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            location.reload();
        }
    }
    
    createBottomNavigation() {
        this.bottomNav = document.createElement('nav');
        this.bottomNav.className = 'bottom-nav';
        this.bottomNav.innerHTML = `
            <div class="bottom-nav-item" data-action="dashboard">
                <i class="fas fa-home"></i>
                <span>Início</span>
            </div>
            <div class="bottom-nav-item" data-action="menu">
                <i class="fas fa-bars"></i>
                <span>Menu</span>
            </div>
            <div class="bottom-nav-item" data-action="search">
                <i class="fas fa-search"></i>
                <span>Buscar</span>
            </div>
            <div class="bottom-nav-item" data-action="favoritos">
                <i class="fas fa-star"></i>
                <span>Favoritos</span>
            </div>
            <div class="bottom-nav-item" data-action="novo" ${!auth.isAdmin() ? 'style="display:none"' : ''}>
                <i class="fas fa-plus-circle"></i>
                <span>Novo</span>
            </div>
        `;
        
        document.querySelector('.app-container').appendChild(this.bottomNav);
        
        this.bottomNav.querySelectorAll('[data-action]').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.dataset.action;
                this.handleBottomNavAction(action);
            });
        });
    }
    
    handleBottomNavAction(action) {
        switch(action) {
            case 'dashboard':
                this.app.showDashboard();
                break;
            case 'menu':
                this.openMenuSheet();
                break;
            case 'search':
                document.getElementById('search-input')?.focus();
                break;
            case 'favoritos':
                this.app.favoritesModule.showFavoritos();
                break;
            case 'novo':
                if (this.app.currentTopico && this.app.currentSubtopico) {
                    this.app.novaAnotacao();
                }
                break;
        }
    }
    
    createSheetModal() {
        this.sheetModal = document.createElement('div');
        this.sheetModal.className = 'sheet-modal';
        this.sheetModal.innerHTML = `
            <div class="sheet-overlay"></div>
            <div class="sheet-content">
                <div class="sheet-handle"></div>
                <div class="sheet-body"></div>
            </div>
        `;
        
        document.body.appendChild(this.sheetModal);
        
        const overlay = this.sheetModal.querySelector('.sheet-overlay');
        const handle = this.sheetModal.querySelector('.sheet-handle');
        
        overlay.addEventListener('click', () => this.closeSheet());
        
        // Swipe para fechar
        let startY = 0;
        handle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        handle.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].clientY - startY;
            if (deltaY > 0) {
                this.sheetModal.querySelector('.sheet-content').style.transform = `translateY(${deltaY}px)`;
            }
        });
        
        handle.addEventListener('touchend', (e) => {
            const deltaY = e.changedTouches[0].clientY - startY;
            if (deltaY > 100) {
                this.closeSheet();
            } else {
                this.sheetModal.querySelector('.sheet-content').style.transform = '';
            }
        });
    }
    
    openMenuSheet() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        const sheetBody = this.sheetModal.querySelector('.sheet-body');
        sheetBody.innerHTML = sidebar.innerHTML;
        
        this.sheetModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeSheet() {
        this.sheetModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    convertModalsToSheets() {
        // Converter modais para sheets no mobile
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .modal .modal-content {
                    margin: 0;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    width: 100%;
                    max-width: 100%;
                    border-radius: 20px 20px 0 0;
                    animation: slideUp 0.3s;
                    max-height: 90vh;
                }
                
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    hideSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.style.display = 'none';
        }
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.marginLeft = '0';
        }
    }
}

// Adicionar estilos CSS necessários
const mobileStyles = `
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 65px;
    background: white;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -2px 20px rgba(0,0,0,0.1);
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: #666;
}

.bottom-nav-item i {
    font-size: 1.4em;
}

.bottom-nav-item span {
    font-size: 0.7em;
}

.bottom-nav-item:active {
    background: #f0f0f0;
    color: var(--secondary-color);
}

.sheet-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2000;
    display: none;
}

.sheet-modal.active {
    display: block;
}

.sheet-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    animation: fadeIn 0.3s;
}

.sheet-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 20px 20px 0 0;
    max-height: 80vh;
    overflow-y: auto;
    animation: slideUp 0.3s;
}

.sheet-handle {
    width: 40px;
    height: 4px;
    background: #ddd;
    border-radius: 2px;
    margin: 12px auto;
}

.sheet-body {
    padding: 0 20px 20px;
}
`;

// Injetar estilos
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileStyles;
document.head.appendChild(styleSheet);
