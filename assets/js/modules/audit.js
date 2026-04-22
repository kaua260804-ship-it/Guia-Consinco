// Módulo de Auditoria e Versionamento
class Audit {
    constructor() {
        this.logs = [];
        this.versions = new Map();
        this.loadFromStorage();
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('audit_logs');
        this.logs = saved ? JSON.parse(saved) : [];
        
        const savedVersions = localStorage.getItem('anotacao_versions');
        this.versions = savedVersions ? new Map(JSON.parse(savedVersions)) : new Map();
    }
    
    saveToStorage() {
        localStorage.setItem('audit_logs', JSON.stringify(this.logs.slice(-1000)));
        localStorage.setItem('anotacao_versions', JSON.stringify([...this.versions]));
    }
    
    log(acao, topico, subtopico, detalhes = '') {
        const user = auth.getCurrentUser();
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            usuario: user?.name || 'Sistema',
            username: user?.username || 'sistema',
            acao,
            topico,
            subtopico,
            detalhes,
            ip: 'local'
        };
        
        this.logs.unshift(entry);
        this.saveToStorage();
        
        return entry;
    }
    
    createVersion(anotacao) {
        const key = `anotacao_${anotacao.id}`;
        const versions = this.versions.get(key) || [];
        
        const version = {
            id: Date.now(),
            data: new Date().toISOString(),
            autor: auth.getCurrentUser()?.name || 'Sistema',
            conteudo: { ...anotacao }
        };
        
        versions.push(version);
        
        // Manter apenas últimas 20 versões
        if (versions.length > 20) {
            versions.shift();
        }
        
        this.versions.set(key, versions);
        this.saveToStorage();
        
        return version;
    }
    
    getVersions(anotacaoId) {
        return this.versions.get(`anotacao_${anotacaoId}`) || [];
    }
    
    restoreVersion(anotacaoId, versionId) {
        const versions = this.getVersions(anotacaoId);
        const version = versions.find(v => v.id === versionId);
        
        if (version) {
            this.log('RESTAURAR', version.conteudo.topico, version.conteudo.subtopico, 
                     `Restaurado para versão de ${version.data}`);
            return version.conteudo;
        }
        
        return null;
    }
    
    getLogs(filtro = {}) {
        let filtered = [...this.logs];
        
        if (filtro.usuario) {
            filtered = filtered.filter(l => l.username === filtro.usuario);
        }
        if (filtro.acao) {
            filtered = filtered.filter(l => l.acao === filtro.acao);
        }
        if (filtro.topico) {
            filtered = filtered.filter(l => l.topico === filtro.topico);
        }
        
        return filtered.slice(0, filtro.limite || 100);
    }
    
    renderLogs(container, filtro = {}) {
        const logs = this.getLogs(filtro);
        
        container.innerHTML = `
            <div class="audit-logs">
                <h3>📋 Registro de Atividades</h3>
                ${logs.map(l => this.renderLogEntry(l)).join('')}
            </div>
        `;
    }
    
    renderLogEntry(log) {
        const icones = {
            'CRIAR': '➕',
            'EDITAR': '✏️',
            'EXCLUIR': '🗑️',
            'VISUALIZAR': '👁️',
            'RESTAURAR': '↩️'
        };
        
        const data = new Date(log.timestamp).toLocaleString('pt-BR');
        
        return `
            <div class="log-entry">
                <span class="log-icon">${icones[log.acao] || '📌'}</span>
                <div class="log-content">
                    <strong>${log.usuario}</strong> ${log.acao} 
                    <em>${log.topico}/${log.subtopico}</em>
                    ${log.detalhes ? `<br><small>${log.detalhes}</small>` : ''}
                </div>
                <span class="log-time">${data}</span>
            </div>
        `;
    }
    
    compareVersions(v1, v2) {
        const diff = {};
        
        Object.keys(v1).forEach(key => {
            if (JSON.stringify(v1[key]) !== JSON.stringify(v2[key])) {
                diff[key] = { antes: v2[key], depois: v1[key] };
            }
        });
        
        return diff;
    }
}

const audit = new Audit();
