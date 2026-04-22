// Sistema de autenticação
class Auth {
    constructor() {
        this.users = [
            {
                username: 'user',
                password: '123456',
                role: 'viewer',
                name: 'Usuário Visualizador'
            },
            {
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'Administrador'
            }
        ];
        
        // Definir caminho base para GitHub Pages
        this.basePath = typeof BASE_PATH !== 'undefined' ? BASE_PATH : '';
        
        this.init();
    }
    
    init() {
        // Verificar se está na página de login
        const isLoginPage = window.location.pathname.includes('login.html');
        
        if (isLoginPage) {
            this.setupLoginForm();
        } else {
            // Verificar autenticação apenas se não for a página de login
            this.checkAuth();
        }
    }
    
    setupLoginForm() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        // Adicionar link para voltar se necessário
        this.addBackToHomeLink();
    }
    
    addBackToHomeLink() {
        // Verificar se já existe um link de voltar
        if (document.getElementById('back-to-home')) return;
        
        const loginBox = document.querySelector('.login-box');
        if (loginBox) {
            const backLink = document.createElement('div');
            backLink.id = 'back-to-home';
            backLink.style.marginTop = '20px';
            backLink.style.textAlign = 'center';
            backLink.innerHTML = `<a href="${this.basePath}/index.html" style="color: #3498db; text-decoration: none;">← Voltar para o início</a>`;
            loginBox.appendChild(backLink);
        }
    }
    
    login() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorDiv = document.getElementById('login-error');
        
        if (!usernameInput || !passwordInput) {
            console.error('Campos de login não encontrados');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Salvar sessão
            const sessionData = {
                username: user.username,
                role: user.role,
                name: user.name,
                loggedIn: true,
                timestamp: new Date().getTime()
            };
            
            localStorage.setItem('consinco_auth', JSON.stringify(sessionData));
            
            // Redirecionar para a página principal
            window.location.href = this.basePath + '/index.html';
        } else {
            if (errorDiv) {
                errorDiv.textContent = 'Usuário ou senha inválidos!';
                errorDiv.style.animation = 'shake 0.5s';
                
                // Limpar animação após executar
                setTimeout(() => {
                    errorDiv.style.animation = '';
                }, 500);
            }
            
            // Limpar campos
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
    
    checkAuth() {
        const authData = localStorage.getItem('consinco_auth');
        
        if (!authData) {
            console.log('Usuário não autenticado, redirecionando para login...');
            this.redirectToLogin();
            return false;
        }
        
        try {
            const session = JSON.parse(authData);
            
            // Verificar se a sessão expirou (24 horas)
            const now = new Date().getTime();
            const sessionAge = now - session.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
            
            if (sessionAge > maxAge) {
                console.log('Sessão expirada');
                this.logout();
                return false;
            }
            
            // Atualizar timestamp da sessão
            session.timestamp = now;
            localStorage.setItem('consinco_auth', JSON.stringify(session));
            
            return true;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.logout();
            return false;
        }
    }
    
    getCurrentUser() {
        const authData = localStorage.getItem('consinco_auth');
        if (!authData) return null;
        
        try {
            return JSON.parse(authData);
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            return null;
        }
    }
    
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
    
    isViewer() {
        const user = this.getCurrentUser();
        return user && user.role === 'viewer';
    }
    
    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    }
    
    redirectToLogin() {
        // Verificar se já está na página de login para evitar loop
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = this.basePath + '/login.html';
        }
    }
    
    logout() {
        localStorage.removeItem('consinco_auth');
        
        // Limpar outros dados sensíveis se necessário
        sessionStorage.clear();
        
        // Redirecionar para login
        window.location.href = this.basePath + '/login.html';
    }
    
    // Método para verificar se o usuário tem permissão para uma ação específica
    canEdit() {
        return this.isAdmin();
    }
    
    canDelete() {
        return this.isAdmin();
    }
    
    canCreate() {
        return this.isAdmin();
    }
    
    // Método para renovar a sessão
    refreshSession() {
        const user = this.getCurrentUser();
        if (user) {
            user.timestamp = new Date().getTime();
            localStorage.setItem('consinco_auth', JSON.stringify(user));
        }
    }
}

// Adicionar animação shake para erro de login
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Inicializar autenticação
const auth = new Auth();

// Expor para debug (opcional)
window.auth = auth;

// Verificar autenticação periodicamente (a cada 5 minutos)
if (!window.location.pathname.includes('login.html')) {
    setInterval(() => {
        const isAuthenticated = auth.checkAuth();
        if (!isAuthenticated) {
            console.log('Sessão expirada, redirecionando...');
        }
    }, 5 * 60 * 1000); // 5 minutos
}
