// UI System for CircuPlay - Handles all user interactions
class UIManager {
    constructor(canvas, grid, simulator, storage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;
        this.simulator = simulator;
        this.storage = storage;
        
        // UI state
        this.isDragging = false;
        this.draggedComponent = null;
        this.selectedComponent = null;
        this.mousePos = { x: 0, y: 0 };
        this.ghostComponent = null;
        
        // UI elements
        this.toolbar = document.querySelector('.toolbar');
        this.statusBar = document.querySelector('.status');
        this.coordinatesDisplay = document.querySelector('.coordinates');
        
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupButtons();
    }
    
    // Setup all event listeners
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleCanvasRightClick(e));
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Prevent default context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    // Setup drag and drop functionality
    setupDragAndDrop() {
        const componentItems = document.querySelectorAll('.component-item');
        
        componentItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
        });
        
        // Canvas drop events
        this.canvas.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.canvas.addEventListener('drop', (e) => this.handleDrop(e));
        this.canvas.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        this.canvas.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    }
    
    // Setup button functionality
    setupButtons() {
        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCircuit();
        });
        
        // Save button
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.showSaveDialog();
        });
        
        // Load button
        document.getElementById('loadBtn').addEventListener('click', () => {
            this.showLoadDialog();
        });
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportCircuit();
        });
        
        // Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        // Import file input
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importCircuit(e.target.files[0]);
        });
        
        // Starter circuit buttons
        document.getElementById('loadBlinkingLED').addEventListener('click', () => {
            this.loadStarterCircuit('blinkingLED');
        });
        
        document.getElementById('loadBasicAND').addEventListener('click', () => {
            this.loadStarterCircuit('basicAND');
        });
    }
    
    // Handle drag start from component palette
    handleDragStart(e) {
        const componentType = e.target.closest('.component-item').dataset.type;
        e.dataTransfer.setData('text/plain', componentType);
        e.dataTransfer.effectAllowed = 'copy';
        
        // Add visual feedback
        e.target.classList.add('dragging');
        setTimeout(() => e.target.classList.remove('dragging'), 100);
    }
    
    // Handle drag over canvas
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Show ghost component
        this.showGhostComponent(x, y, e.dataTransfer.getData('text/plain'));
    }
    
    // Handle drag enter canvas
    handleDragEnter(e) {
        e.preventDefault();
        this.canvas.parentElement.classList.add('drag-over');
    }
    
    // Handle drag leave canvas
    handleDragLeave(e) {
        e.preventDefault();
        this.canvas.parentElement.classList.remove('drag-over');
        this.hideGhostComponent();
    }
    
    // Handle drop on canvas
    handleDrop(e) {
        e.preventDefault();
        this.canvas.parentElement.classList.remove('drag-over');
        
        const componentType = e.dataTransfer.getData('text/plain');
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.placeComponent(componentType, x, y);
        this.hideGhostComponent();
    }
    
    // Show ghost component during drag
    showGhostComponent(x, y, type) {
        const gridPos = this.grid.snapToGrid(x, y);
        const gridCoord = this.grid.pixelToGrid(gridPos.x, gridPos.y);
        
        // Clear previous ghost
        this.hideGhostComponent();
        
        // Create ghost component
        this.ghostComponent = {
            type: type,
            x: gridPos.x,
            y: gridPos.y,
            valid: this.grid.isEmpty(gridCoord.x, gridCoord.y)
        };
    }
    
    // Hide ghost component
    hideGhostComponent() {
        this.ghostComponent = null;
    }
    
    // Place component on canvas
    placeComponent(type, x, y) {
        const gridPos = this.grid.snapToGrid(x, y);
        const gridCoord = this.grid.pixelToGrid(gridPos.x, gridPos.y);
        
        // Check if position is valid
        if (!this.grid.isEmpty(gridCoord.x, gridCoord.y)) {
            this.showMessage('Cannot place component here', 'error');
            return false;
        }
        
        // Create component
        const component = ComponentFactory.create(type, gridPos.x, gridPos.y);
        if (!component) {
            this.showMessage('Failed to create component', 'error');
            return false;
        }
        
        // Place on grid
        if (this.grid.placeComponent(component, gridCoord.x, gridCoord.y)) {
            this.simulator.addComponent(component);
            this.updateStatus(`Placed ${type} at (${gridCoord.x}, ${gridCoord.y})`);
            return true;
        } else {
            this.showMessage('Failed to place component', 'error');
            return false;
        }
    }
    
    // Handle canvas click
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const component = this.grid.getComponentAtPixel(x, y);
        
        if (component) {
            this.selectComponent(component);
            
            // Handle component-specific interactions
            if (component.type === 'switch') {
                component.toggle();
                this.updateStatus(`Switch ${component.closed ? 'closed' : 'opened'}`);
            }
        } else {
            this.selectComponent(null);
        }
    }
    
    // Handle canvas mouse move
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mousePos = { x, y };
        
        // Update coordinates display
        const gridPos = this.grid.pixelToGrid(x, y);
        this.updateCoordinates(gridPos.x, gridPos.y);
        
        // Update cursor based on hover
        const component = this.grid.getComponentAtPixel(x, y);
        this.canvas.style.cursor = component ? 'pointer' : 'crosshair';
    }
    
    // Handle canvas right click
    handleCanvasRightClick(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const component = this.grid.getComponentAtPixel(x, y);
        
        if (component) {
            this.showContextMenu(e, component);
        }
    }
    
    // Select component
    selectComponent(component) {
        this.selectedComponent = component;
        
        if (component) {
            this.updateStatus(`Selected ${component.type} at (${component.gridX}, ${component.gridY})`);
        } else {
            this.updateStatus('Ready');
        }
    }
    
    // Show context menu for component
    showContextMenu(e, component) {
        // Simple context menu implementation
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.style.background = '#16213e';
        menu.style.border = '2px solid #533a7b';
        menu.style.borderRadius = '0';
        menu.style.padding = '10px';
        menu.style.zIndex = '1000';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn pixel-btn';
        deleteBtn.style.width = '100%';
        deleteBtn.onclick = () => {
            this.deleteComponent(component);
            document.body.removeChild(menu);
        };
        
        menu.appendChild(deleteBtn);
        document.body.appendChild(menu);
        
        // Remove menu when clicking elsewhere
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', removeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
        }, 100);
    }
    
    // Delete component
    deleteComponent(component) {
        const gridCoord = this.grid.pixelToGrid(component.x, component.y);
        this.grid.removeComponent(gridCoord.x, gridCoord.y);
        this.simulator.removeComponent(component);
        
        if (this.selectedComponent === component) {
            this.selectedComponent = null;
        }
        
        this.updateStatus(`Deleted ${component.type}`);
    }
    
    // Handle keyboard input
    handleKeyDown(e) {
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                if (this.selectedComponent) {
                    this.deleteComponent(this.selectedComponent);
                }
                break;
            case 'Escape':
                this.selectComponent(null);
                break;
            case 'c':
                if (e.ctrlKey) {
                    this.clearCircuit();
                }
                break;
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.showSaveDialog();
                }
                break;
            case 'o':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.showLoadDialog();
                }
                break;
        }
    }
    
    // Handle window resize
    handleResize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        this.grid.resize(rect.width, rect.height);
    }
    
    // Clear circuit
    clearCircuit() {
        if (confirm('Are you sure you want to clear the circuit?')) {
            this.grid.clear();
            this.simulator.components = [];
            this.simulator.powerSources = [];
            this.selectedComponent = null;
            this.updateStatus('Circuit cleared');
        }
    }
    
    // Show save dialog
    showSaveDialog() {
        const name = prompt('Enter circuit name:');
        if (name) {
            const circuitData = this.simulator.exportCircuit();
            if (this.storage.saveCircuit(name, circuitData)) {
                this.showMessage(`Circuit "${name}" saved successfully`, 'success');
            }
        }
    }
    
    // Show load dialog
    showLoadDialog() {
        const circuits = this.storage.getAllCircuits();
        const names = Object.keys(circuits);
        
        if (names.length === 0) {
            this.showMessage('No saved circuits found', 'info');
            return;
        }
        
        // Simple dialog - could be enhanced with a proper UI
        const name = prompt(`Select circuit to load:\n${names.join('\n')}\n\nEnter name:`);
        if (name && circuits[name]) {
            this.loadCircuit(circuits[name].data);
            this.showMessage(`Circuit "${name}" loaded successfully`, 'success');
        }
    }
    
    // Export circuit
    exportCircuit() {
        const name = prompt('Enter filename for export:') || 'circuit';
        const circuitData = this.simulator.exportCircuit();
        
        if (this.storage.exportToFile(name, circuitData)) {
            this.showMessage('Circuit exported successfully', 'success');
        }
    }
    
    // Import circuit
    importCircuit(file) {
        if (!file) return;
        
        this.storage.importFromFile(file)
            .then(importData => {
                this.loadCircuit(importData.data);
                this.showMessage(`Circuit "${importData.name}" imported successfully`, 'success');
            })
            .catch(error => {
                this.showMessage(`Import failed: ${error}`, 'error');
            });
    }
    
    // Load circuit data
    loadCircuit(circuitData) {
        this.simulator.importCircuit(circuitData);
    }
    
    // Load starter circuit
    loadStarterCircuit(type) {
        switch (type) {
            case 'blinkingLED':
                this.simulator.createBlinkingLED();
                this.showMessage('Blinking LED circuit loaded', 'success');
                break;
            case 'basicAND':
                this.simulator.createBasicANDGate();
                this.showMessage('Basic AND gate circuit loaded', 'success');
                break;
        }
    }
    
    // Update status message
    updateStatus(message) {
        if (this.statusBar) {
            this.statusBar.textContent = message;
        }
    }
    
    // Update coordinates display
    updateCoordinates(gridX, gridY) {
        if (this.coordinatesDisplay) {
            this.coordinatesDisplay.textContent = `Grid: (${gridX}, ${gridY})`;
        }
    }
    
    // Show message to user
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.right = '20px';
        messageEl.style.background = type === 'error' ? '#ff6b6b' : type === 'success' ? '#4cc9f0' : '#7209b7';
        messageEl.style.color = '#fff';
        messageEl.style.padding = '10px 20px';
        messageEl.style.borderRadius = '0';
        messageEl.style.border = '2px solid #533a7b';
        messageEl.style.fontFamily = 'Press Start 2P, monospace';
        messageEl.style.fontSize = '10px';
        messageEl.style.zIndex = '10000';
        messageEl.style.maxWidth = '300px';
        messageEl.style.wordBreak = 'break-word';
        
        document.body.appendChild(messageEl);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                document.body.removeChild(messageEl);
            }
        }, 3000);
        
        console.log(`${type.toUpperCase()}: ${message}`);
    }
    
    // Render all UI elements
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.grid.drawGrid();
        
        // Draw ghost component
        if (this.ghostComponent) {
            this.drawGhostComponent();
        }
        
        // Draw all components
        this.simulator.components.forEach(component => {
            component.draw(this.ctx);
            
            // Highlight selected component
            if (component === this.selectedComponent) {
                this.ctx.strokeStyle = '#4cc9f0';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(component.x - 2, component.y - 2, component.width + 4, component.height + 4);
            }
        });
    }
    
    // Draw ghost component
    drawGhostComponent() {
        if (!this.ghostComponent) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        
        // Create temporary component for rendering
        const tempComponent = ComponentFactory.create(
            this.ghostComponent.type, 
            this.ghostComponent.x, 
            this.ghostComponent.y
        );
        
        if (tempComponent) {
            tempComponent.draw(this.ctx);
            
            // Draw placement indicator
            this.ctx.strokeStyle = this.ghostComponent.valid ? '#4cc9f0' : '#ff6b6b';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                this.ghostComponent.x - 1, 
                this.ghostComponent.y - 1, 
                20 + 2, 
                20 + 2
            );
        }
        
        this.ctx.restore();
    }
}