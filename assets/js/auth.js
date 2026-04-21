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
    }
    
    login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        
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
            window.location.href = 'index.html';
        } else {
            if (errorDiv) {
                errorDiv.textContent = 'Usuário ou senha inválidos!';
            }
        }
    }
    
    checkAuth() {
        const authData = localStorage.getItem('consinco_auth');
        
        if (!authData) {
            window.location.href = 'login.html';
            return false;
        }
        
        try {
            const session = JSON.parse(authData);
            
            // Verificar se a sessão expirou (24 horas)
            const now = new Date().getTime();
            const sessionAge = now - session.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (sessionAge > maxAge) {
                this.logout();
                return false;
            }
            
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
    
    logout() {
        localStorage.removeItem('consinco_auth');
        window.location.href = 'login.html';
    }
}

// Inicializar autenticação
const auth = new Auth();