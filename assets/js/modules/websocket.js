// Módulo de Colaboração (Simulação para ambiente local)
class Collaboration {
    constructor() {
        this.channel = new BroadcastChannel('consinco_collaboration');
        this.onlineUsers = new Map();
        this.currentUser = null;
        this.callbacks = new Map();
        this.init();
    }
    
    init() {
        const user = auth.getCurrentUser();
        if (user) {
            this.currentUser = {
                id: user.username,
                name: user.name,
                color: this.generateColor(user.username)
            };
        }
        
        this.channel.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        
        // Anunciar presença
        this.sendPresence();
        
        // Ping a cada 30 segundos
        setInterval(() => this.sendPresence(), 30000);
        
        // Limpar usuários inativos
        setInterval(() => this.cleanInactiveUsers(), 60000);
    }
    
    generateColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${hash % 360}, 70%, 50%)`;
    }
    
    sendPresence() {
        if (!this.currentUser) return;
        
        this.broadcast({
            type: 'presence',
            user: this.currentUser,
            timestamp: Date.now()
        });
    }
    
    broadcast(message) {
        this.channel.postMessage(message);
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'presence':
                this.onlineUsers.set(message.user.id, {
                    ...message.user,
                    lastSeen: message.timestamp
                });
                this.updateOnlineUsers();
                break;
                
            case 'editing':
                this.triggerCallback('editing', message);
                break;
                
            case 'change':
                this.triggerCallback('change', message);
                break;
                
            case 'cursor':
                this.triggerCallback('cursor', message);
                break;
        }
    }
    
    updateOnlineUsers() {
        const container = document.getElementById('online-users');
        if (!container) return;
        
        const users = Array.from(this.onlineUsers.values())
            .filter(u => u.id !== this.currentUser?.id);
        
        container.innerHTML = `
            <div class="online-indicator">
                <span class="online-dot"></span>
                ${users.length} online
            </div>
            <div class="online-avatars">
                ${users.map(u => `
                    <div class="user-avatar" style="background: ${u.color}" title="${u.name}">
                        ${u.name.charAt(0).toUpperCase()}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    cleanInactiveUsers() {
        const now = Date.now();
        for (const [id, user] of this.onlineUsers) {
            if (now - user.lastSeen > 60000) {
                this.onlineUsers.delete(id);
            }
        }
        this.updateOnlineUsers();
    }
    
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }
    
    triggerCallback(event, data) {
        const callbacks = this.callbacks.get(event) || [];
        callbacks.forEach(cb => cb(data));
    }
    
    startEditing(anotacaoId, field = 'conteudo') {
        this.broadcast({
            type: 'editing',
            anotacaoId,
            field,
            user: this.currentUser,
            timestamp: Date.now()
        });
    }
    
    stopEditing(anotacaoId) {
        this.broadcast({
            type: 'editing',
            anotacaoId,
            field: null,
            user: this.currentUser
        });
    }
    
    sendChange(anotacaoId, changes) {
        this.broadcast({
            type: 'change',
            anotacaoId,
            changes,
            user: this.currentUser,
            timestamp: Date.now()
        });
    }
    
    sendCursor(anotacaoId, position) {
        this.broadcast({
            type: 'cursor',
            anotacaoId,
            position,
            user: this.currentUser
        });
    }
    
    getOnlineUsers() {
        return Array.from(this.onlineUsers.values());
    }
    
    destroy() {
        this.channel.close();
    }
}

const collaboration = new Collaboration();
