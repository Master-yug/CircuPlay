// Storage System for CircuPlay - Save/Load functionality
class StorageManager {
    constructor() {
        this.storageKey = 'circuplay_circuits';
        this.autoSaveKey = 'circuplay_autosave';
        this.settingsKey = 'circuplay_settings';
        this.autoSaveInterval = 30000; // Auto-save every 30 seconds
        this.autoSaveTimer = null;
    }
    
    // Initialize storage system
    init() {
        this.startAutoSave();
        this.loadSettings();
    }
    
    // Save circuit to localStorage
    saveCircuit(name, circuitData, description = '') {
        try {
            const circuits = this.getAllCircuits();
            const circuit = {
                name: name,
                description: description,
                data: circuitData,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            circuits[name] = circuit;
            localStorage.setItem(this.storageKey, JSON.stringify(circuits));
            
            console.log(`Circuit "${name}" saved successfully`);
            return true;
        } catch (error) {
            console.error('Failed to save circuit:', error);
            this.showError('Failed to save circuit. Storage may be full.');
            return false;
        }
    }
    
    // Load circuit from localStorage
    loadCircuit(name) {
        try {
            const circuits = this.getAllCircuits();
            const circuit = circuits[name];
            
            if (!circuit) {
                console.warn(`Circuit "${name}" not found`);
                return null;
            }
            
            console.log(`Circuit "${name}" loaded successfully`);
            return circuit;
        } catch (error) {
            console.error('Failed to load circuit:', error);
            this.showError('Failed to load circuit.');
            return null;
        }
    }
    
    // Get all saved circuits
    getAllCircuits() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to get circuits:', error);
            return {};
        }
    }
    
    // Delete circuit
    deleteCircuit(name) {
        try {
            const circuits = this.getAllCircuits();
            if (circuits[name]) {
                delete circuits[name];
                localStorage.setItem(this.storageKey, JSON.stringify(circuits));
                console.log(`Circuit "${name}" deleted successfully`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete circuit:', error);
            return false;
        }
    }
    
    // Auto-save current circuit
    autoSave(circuitData) {
        try {
            const autoSaveData = {
                data: circuitData,
                timestamp: Date.now()
            };
            localStorage.setItem(this.autoSaveKey, JSON.stringify(autoSaveData));
            console.log('Auto-save completed');
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    
    // Load auto-saved circuit
    loadAutoSave() {
        try {
            const stored = localStorage.getItem(this.autoSaveKey);
            if (stored) {
                const autoSaveData = JSON.parse(stored);
                console.log('Auto-save loaded');
                return autoSaveData;
            }
            return null;
        } catch (error) {
            console.error('Failed to load auto-save:', error);
            return null;
        }
    }
    
    // Start auto-save timer
    startAutoSave() {
        this.stopAutoSave(); // Clear existing timer
        
        this.autoSaveTimer = setInterval(() => {
            if (window.circuPlay && window.circuPlay.simulator) {
                const circuitData = window.circuPlay.simulator.exportCircuit();
                this.autoSave(circuitData);
            }
        }, this.autoSaveInterval);
    }
    
    // Stop auto-save timer
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    // Export circuit to JSON file
    exportToFile(name, circuitData) {
        try {
            const exportData = {
                name: name,
                description: `CircuPlay circuit exported on ${new Date().toLocaleDateString()}`,
                data: circuitData,
                timestamp: Date.now(),
                version: '1.0',
                app: 'CircuPlay'
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            link.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            
            console.log(`Circuit "${name}" exported to file`);
            return true;
        } catch (error) {
            console.error('Failed to export circuit:', error);
            this.showError('Failed to export circuit.');
            return false;
        }
    }
    
    // Import circuit from JSON file
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject('No file provided');
                return;
            }
            
            if (file.type !== 'application/json') {
                reject('Invalid file type. Please select a JSON file.');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // Validate import data
                    if (!this.validateImportData(importData)) {
                        reject('Invalid circuit file format');
                        return;
                    }
                    
                    console.log(`Circuit imported from file: ${importData.name}`);
                    resolve(importData);
                } catch (error) {
                    console.error('Failed to parse import file:', error);
                    reject('Failed to parse circuit file');
                }
            };
            
            reader.onerror = () => {
                reject('Failed to read file');
            };
            
            reader.readAsText(file);
        });
    }
    
    // Validate imported circuit data
    validateImportData(data) {
        // Check required fields
        if (!data || typeof data !== 'object') return false;
        if (!data.data || typeof data.data !== 'object') return false;
        if (!data.data.components || !Array.isArray(data.data.components)) return false;
        
        // Check component structure
        for (const component of data.data.components) {
            if (!component.type || typeof component.type !== 'string') return false;
            if (typeof component.x !== 'number' || typeof component.y !== 'number') return false;
        }
        
        return true;
    }
    
    // Save application settings
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            console.log('Settings saved');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    // Load application settings
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.settingsKey);
            const settings = stored ? JSON.parse(stored) : this.getDefaultSettings();
            this.applySettings(settings);
            return settings;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }
    
    // Get default settings
    getDefaultSettings() {
        return {
            gridSize: 20,
            autoSave: true,
            autoSaveInterval: 30000,
            theme: 'dark',
            showGrid: true,
            animationSpeed: 1,
            volume: 0.5
        };
    }
    
    // Apply settings to application
    applySettings(settings) {
        // Apply auto-save settings
        if (settings.autoSave) {
            this.autoSaveInterval = settings.autoSaveInterval;
            this.startAutoSave();
        } else {
            this.stopAutoSave();
        }
        
        // Apply other settings as needed
        console.log('Settings applied:', settings);
    }
    
    // Get storage usage information
    getStorageInfo() {
        try {
            const circuits = this.getAllCircuits();
            const circuitCount = Object.keys(circuits).length;
            
            // Estimate storage usage
            const circuitsSize = JSON.stringify(circuits).length;
            const autoSaveSize = localStorage.getItem(this.autoSaveKey)?.length || 0;
            const settingsSize = localStorage.getItem(this.settingsKey)?.length || 0;
            
            const totalSize = circuitsSize + autoSaveSize + settingsSize;
            const maxSize = 5 * 1024 * 1024; // Approximate localStorage limit (5MB)
            
            return {
                circuitCount: circuitCount,
                totalSize: totalSize,
                maxSize: maxSize,
                usagePercent: Math.round((totalSize / maxSize) * 100),
                formattedSize: this.formatBytes(totalSize)
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }
    
    // Format bytes to human readable string
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Clear all stored data
    clearAll() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.autoSaveKey);
            localStorage.removeItem(this.settingsKey);
            console.log('All CircuPlay data cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }
    
    // Show error message to user
    showError(message) {
        // This will be called by the UI system
        if (window.circuPlay && window.circuPlay.ui) {
            window.circuPlay.ui.showMessage(message, 'error');
        } else {
            alert(message);
        }
    }
    
    // Show success message to user
    showSuccess(message) {
        // This will be called by the UI system
        if (window.circuPlay && window.circuPlay.ui) {
            window.circuPlay.ui.showMessage(message, 'success');
        } else {
            console.log(message);
        }
    }
    
    // Create URL for sharing circuit
    createShareURL(circuitData) {
        try {
            // Compress and encode circuit data
            const compressed = this.compressCircuitData(circuitData);
            const encoded = btoa(JSON.stringify(compressed));
            
            // Create shareable URL
            const baseUrl = window.location.origin + window.location.pathname;
            const shareUrl = `${baseUrl}?circuit=${encoded}`;
            
            console.log('Share URL created');
            return shareUrl;
        } catch (error) {
            console.error('Failed to create share URL:', error);
            return null;
        }
    }
    
    // Load circuit from URL parameter
    loadFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const circuitParam = urlParams.get('circuit');
            
            if (circuitParam) {
                const decoded = JSON.parse(atob(circuitParam));
                const circuitData = this.decompressCircuitData(decoded);
                
                console.log('Circuit loaded from URL');
                return circuitData;
            }
            
            return null;
        } catch (error) {
            console.error('Failed to load circuit from URL:', error);
            return null;
        }
    }
    
    // Compress circuit data for sharing
    compressCircuitData(data) {
        // Simple compression - remove unnecessary data
        return {
            v: '1.0', // version
            g: data.gridSize,
            c: data.components.map(comp => ({
                t: comp.type,
                x: comp.x,
                y: comp.y,
                p: comp.properties || {}
            }))
        };
    }
    
    // Decompress circuit data from sharing
    decompressCircuitData(compressed) {
        return {
            version: compressed.v || '1.0',
            gridSize: compressed.g || 20,
            components: compressed.c.map(comp => ({
                type: comp.t,
                x: comp.x,
                y: comp.y,
                properties: comp.p || {}
            }))
        };
    }
}