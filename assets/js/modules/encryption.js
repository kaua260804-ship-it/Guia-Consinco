// Módulo de Criptografia
class Encryption {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.salt = 'GuiaConsinco-Salt-2024';
        this.encryptionKey = null;
    }
    
    async setMasterPassword(password) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );
        
        this.encryptionKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(this.salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
        
        localStorage.setItem('encryption_enabled', 'true');
    }
    
    async encrypt(data) {
        if (!this.encryptionKey) return data;
        
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.encryptionKey,
            encoder.encode(JSON.stringify(data))
        );
        
        return {
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        };
    }
    
    async decrypt(encryptedData) {
        if (!this.encryptionKey || !encryptedData) return encryptedData;
        
        const decoder = new TextDecoder();
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
            this.encryptionKey,
            new Uint8Array(encryptedData.data)
        );
        
        return JSON.parse(decoder.decode(decrypted));
    }
    
    isEnabled() {
        return localStorage.getItem('encryption_enabled') === 'true';
    }
    
    async encryptAnotacao(anotacao) {
        if (!this.isEnabled()) return anotacao;
        
        const camposSensiveis = ['conteudo', 'subtitulo'];
        const encrypted = { ...anotacao };
        
        for (const campo of camposSensiveis) {
            if (encrypted[campo]) {
                encrypted[campo] = await this.encrypt(encrypted[campo]);
            }
        }
        
        return encrypted;
    }
    
    async decryptAnotacao(anotacao) {
        if (!this.isEnabled()) return anotacao;
        
        const camposSensiveis = ['conteudo', 'subtitulo'];
        const decrypted = { ...anotacao };
        
        for (const campo of camposSensiveis) {
            if (decrypted[campo] && typeof decrypted[campo] === 'object') {
                decrypted[campo] = await this.decrypt(decrypted[campo]);
            }
        }
        
        return decrypted;
    }
}

const encryption = new Encryption();
