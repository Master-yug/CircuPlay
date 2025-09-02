// Main Application File for CircuPlay
class CircuPlay {
    constructor() {
        this.canvas = null;
        this.grid = null;
        this.simulator = null;
        this.storage = null;
        this.ui = null;
        this.animationId = null;
        this.isRunning = false;
    }
    
    // Initialize the application
    init() {
        console.log('🔌 CircuPlay - Pixel Sandbox for Circuits');
        console.log('Initializing application...');
        
        // Get canvas element
        this.canvas = document.getElementById('circuitCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return false;
        }
        
        // Initialize core systems
        this.setupCanvas();
        this.initializeGrid();
        this.initializeStorage();
        this.initializeSimulator();
        this.initializeUI();
        
        // Start the application
        this.start();
        
        // Load circuit from URL if present
        this.loadFromURL();
        
        console.log('✅ CircuPlay initialized successfully!');
        return true;
    }
    
    // Setup canvas for pixel-perfect rendering
    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Set canvas size
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Get context and disable smoothing for pixel art
        const ctx = this.canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        console.log(`Canvas initialized: ${this.canvas.width}x${this.canvas.height}`);
    }
    
    // Initialize grid system
    initializeGrid() {
        this.grid = new Grid(this.canvas, 20); // 20px grid size
        console.log(`Grid initialized: ${this.grid.cols}x${this.grid.rows} cells`);
    }
    
    // Initialize storage system
    initializeStorage() {
        this.storage = new StorageManager();
        this.storage.init();
        console.log('Storage system initialized');
    }
    
    // Initialize simulation engine
    initializeSimulator() {
        this.simulator = new CircuitSimulator(this.grid);
        console.log('Simulation engine initialized');
    }
    
    // Initialize UI system
    initializeUI() {
        this.ui = new UIManager(this.canvas, this.grid, this.simulator, this.storage);
        console.log('UI system initialized');
    }
    
    // Start the application
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.simulator.start();
        this.startRenderLoop();
        
        console.log('🚀 CircuPlay started!');
        
        // Show welcome message
        this.ui.showMessage('Welcome to CircuPlay! Drag components from the toolbar to build circuits.', 'success');
    }
    
    // Stop the application
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.simulator.stop();
        this.stopRenderLoop();
        
        console.log('⏹️ CircuPlay stopped');
    }
    
    // Start render loop
    startRenderLoop() {
        const render = () => {
            if (this.isRunning) {
                this.ui.render();
                this.animationId = requestAnimationFrame(render);
            }
        };
        
        render();
    }
    
    // Stop render loop
    stopRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // Create component from data (used during import)
    createComponentFromData(componentData) {
        const component = ComponentFactory.create(
            componentData.type, 
            componentData.x * this.grid.gridSize, 
            componentData.y * this.grid.gridSize
        );
        
        if (component) {
            // Set properties if available
            if (componentData.properties) {
                component.setProperties(componentData.properties);
            }
            
            // Place on grid
            if (this.grid.placeComponent(component, componentData.x, componentData.y)) {
                this.simulator.addComponent(component);
                return component;
            }
        }
        
        return null;
    }
    
    // Load circuit from URL parameter
    loadFromURL() {
        try {
            const circuitData = this.storage.loadFromURL();
            if (circuitData) {
                this.simulator.importCircuit(circuitData);
                this.ui.showMessage('Circuit loaded from URL!', 'success');
                console.log('Circuit loaded from URL');
                
                // Clean URL
                const url = new URL(window.location);
                url.searchParams.delete('circuit');
                window.history.replaceState({}, document.title, url);
            }
        } catch (error) {
            console.error('Failed to load circuit from URL:', error);
            this.ui.showMessage('Failed to load circuit from URL', 'error');
        }
    }
    
    // Get application statistics
    getStats() {
        const simulatorStats = this.simulator.getStats();
        const storageInfo = this.storage.getStorageInfo();
        
        return {
            simulator: simulatorStats,
            storage: storageInfo,
            grid: {
                cols: this.grid.cols,
                rows: this.grid.rows,
                gridSize: this.grid.gridSize,
                totalCells: this.grid.cols * this.grid.rows,
                usedCells: simulatorStats.totalComponents
            },
            performance: {
                fps: this.getFPS(),
                renderTime: this.getRenderTime()
            }
        };
    }
    
    // Get current FPS (simplified)
    getFPS() {
        return 60; // Assume 60fps for now
    }
    
    // Get render time (simplified)
    getRenderTime() {
        return 16; // Assume 16ms for now
    }
    
    // Share circuit
    shareCircuit() {
        try {
            const circuitData = this.simulator.exportCircuit();
            const shareUrl = this.storage.createShareURL(circuitData);
            
            if (shareUrl) {
                // Copy to clipboard if available
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        this.ui.showMessage('Share URL copied to clipboard!', 'success');
                    }).catch(() => {
                        this.showShareDialog(shareUrl);
                    });
                } else {
                    this.showShareDialog(shareUrl);
                }
            }
        } catch (error) {
            console.error('Failed to create share URL:', error);
            this.ui.showMessage('Failed to create share URL', 'error');
        }
    }
    
    // Show share dialog
    showShareDialog(url) {
        const dialog = document.createElement('div');
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.background = '#16213e';
        dialog.style.border = '3px solid #533a7b';
        dialog.style.padding = '20px';
        dialog.style.zIndex = '10000';
        dialog.style.fontFamily = 'Press Start 2P, monospace';
        dialog.style.fontSize = '10px';
        dialog.style.color = '#eee';
        dialog.style.maxWidth = '500px';
        
        dialog.innerHTML = `
            <h3 style="margin-bottom: 15px; color: #4cc9f0;">Share Circuit</h3>
            <p style="margin-bottom: 15px;">Copy this URL to share your circuit:</p>
            <input type="text" value="${url}" style="width: 100%; padding: 10px; margin-bottom: 15px; background: #0f0f23; border: 2px solid #533a7b; color: #eee; font-family: monospace;" readonly>
            <button id="closeShareDialog" style="background: #4cc9f0; color: #fff; border: none; padding: 10px 20px; cursor: pointer; font-family: 'Press Start 2P', monospace; font-size: 10px;">Close</button>
        `;
        
        document.body.appendChild(dialog);
        
        // Select URL for easy copying
        const input = dialog.querySelector('input');
        input.select();
        
        // Close dialog
        dialog.querySelector('#closeShareDialog').onclick = () => {
            document.body.removeChild(dialog);
        };
    }
    
    // Handle errors
    handleError(error, context = 'Application') {
        console.error(`${context} Error:`, error);
        this.ui.showMessage(`${context} error: ${error.message}`, 'error');
    }
    
    // Cleanup on page unload
    cleanup() {
        this.stop();
        this.storage.stopAutoSave();
        console.log('CircuPlay cleaned up');
    }
}

// Global instance
window.circuPlay = new CircuPlay();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.circuPlay.init();
    } catch (error) {
        console.error('Failed to initialize CircuPlay:', error);
        alert('Failed to initialize CircuPlay. Please refresh the page.');
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.circuPlay.cleanup();
});

// Handle errors globally
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.circuPlay && window.circuPlay.ui) {
        window.circuPlay.ui.showMessage('An unexpected error occurred', 'error');
    }
});

// Export for debugging
window.CircuPlayDebug = {
    getStats: () => window.circuPlay.getStats(),
    exportCircuit: () => window.circuPlay.simulator.exportCircuit(),
    validateCircuit: () => window.circuPlay.simulator.validateCircuit(),
    clearStorage: () => window.circuPlay.storage.clearAll(),
    getStorageInfo: () => window.circuPlay.storage.getStorageInfo()
};

console.log('🔌 CircuPlay main script loaded. Debugging available via window.CircuPlayDebug');

// Development helpers
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 Development mode detected');
    
    // Add some development shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
            switch (e.key) {
                case 'D':
                    e.preventDefault();
                    console.log('Debug info:', window.CircuPlayDebug.getStats());
                    break;
                case 'C':
                    e.preventDefault();
                    if (confirm('Clear all storage?')) {
                        window.CircuPlayDebug.clearStorage();
                    }
                    break;
                case 'V':
                    e.preventDefault();
                    const issues = window.CircuPlayDebug.validateCircuit();
                    console.log('Validation issues:', issues);
                    break;
            }
        }
    });
}