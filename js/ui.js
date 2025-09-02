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
        
        // Zoom state
        this.zoom = 1.0;
        this.minZoom = 0.25;
        this.maxZoom = 4.0;
        this.zoomStep = 0.1;
        this.panOffset = { x: 0, y: 0 };
        this.isPanning = false;
        this.lastPanPos = { x: 0, y: 0 };
        
        // UI elements
        this.toolbar = document.querySelector('.toolbar');
        this.statusBar = document.querySelector('.status');
        this.coordinatesDisplay = document.querySelector('.coordinates');
        
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupButtons();
        this.addZoomControls();
        this.addAudioControls();
        this.setupNavigationControls();
    }
    
    // Setup all event listeners
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleCanvasRightClick(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
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
        // Add click sound to all buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.audioManager.playClick();
            });
        });
        
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
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates for proper zoom/pan handling
        const worldPos = this.screenToWorld(screenX, screenY);
        
        // Show ghost component
        this.showGhostComponent(worldPos.x, worldPos.y, e.dataTransfer.getData('text/plain'));
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
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates for proper zoom/pan handling
        const worldPos = this.screenToWorld(screenX, screenY);
        
        this.placeComponent(componentType, worldPos.x, worldPos.y);
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
            window.audioManager.playError();
            this.showMessage('Cannot place component here', 'error');
            return false;
        }
        
        // Create component
        const component = ComponentFactory.create(type, gridPos.x, gridPos.y);
        if (!component) {
            window.audioManager.playError();
            this.showMessage('Failed to create component', 'error');
            return false;
        }
        
        // Place on grid
        if (this.grid.placeComponent(component, gridCoord.x, gridCoord.y)) {
            this.simulator.addComponent(component);
            this.updateStatus(`Placed ${type} at (${gridCoord.x}, ${gridCoord.y})`);
            window.audioManager.playPlaceComponent();
            return true;
        } else {
            window.audioManager.playError();
            this.showMessage('Failed to place component', 'error');
            return false;
        }
    }
    
    // Handle canvas click
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Handle panning
        if (this.isPanning) {
            const deltaX = e.clientX - this.lastPanPos.x;
            const deltaY = e.clientY - this.lastPanPos.y;
            
            this.panOffset.x += deltaX;
            this.panOffset.y += deltaY;
            
            this.lastPanPos = { x: e.clientX, y: e.clientY };
            return;
        }
        
        // Convert screen coordinates to world coordinates
        const worldPos = this.screenToWorld(screenX, screenY);
        const x = worldPos.x;
        const y = worldPos.y;
        
        const component = this.grid.getComponentAtPixel(x, y);
        
        if (component) {
            this.selectComponent(component);
            
            // Handle component-specific interactions
            if (component.type === 'switch') {
                component.toggle();
                window.audioManager.playSwitch();
                this.updateStatus(`Switch ${component.closed ? 'closed' : 'opened'}`);
            }
        } else {
            this.selectComponent(null);
        }
    }
    
    // Handle canvas mouse move
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Handle panning
        if (this.isPanning) {
            const deltaX = e.clientX - this.lastPanPos.x;
            const deltaY = e.clientY - this.lastPanPos.y;
            
            this.panOffset.x += deltaX;
            this.panOffset.y += deltaY;
            
            this.lastPanPos = { x: e.clientX, y: e.clientY };
            return;
        }
        
        // Convert screen coordinates to world coordinates
        const worldPos = this.screenToWorld(screenX, screenY);
        const x = worldPos.x;
        const y = worldPos.y;
        
        this.mousePos = { x: screenX, y: screenY };
        
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
                    window.audioManager.playClick();
                }
                break;
            case 'Escape':
                this.selectComponent(null);
                window.audioManager.playClick();
                break;
            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
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
            case 'e':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.exportCircuit();
                    window.audioManager.playClick();
                }
                break;
            case 'i':
                if (e.ctrlKey) {
                    e.preventDefault();
                    document.getElementById('importFile').click();
                    window.audioManager.playClick();
                }
                break;
            case 'm':
                if (e.ctrlKey) {
                    e.preventDefault();
                    const enabled = window.audioManager.toggle();
                    const btn = document.getElementById('audioToggleBtn');
                    if (btn) {
                        btn.textContent = enabled ? '🔊' : '🔇';
                        btn.classList.toggle('muted', !enabled);
                    }
                    this.showMessage(`Audio ${enabled ? 'enabled' : 'disabled'}`, 'info');
                }
                break;
            case 'h':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.showHelpDialog();
                }
                break;
            case 'g':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleGrid();
                }
                break;
            case 'Tab':
                e.preventDefault();
                this.selectNextComponent();
                break;
            case 'Enter':
            case ' ':
                if (this.selectedComponent && this.selectedComponent.type === 'switch') {
                    e.preventDefault();
                    this.selectedComponent.toggle();
                    window.audioManager.playSwitch();
                    this.updateStatus(`Switch ${this.selectedComponent.closed ? 'closed' : 'opened'}`);
                }
                break;
            case '=':
            case '+':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.zoomIn();
                }
                break;
            case '-':
            case '_':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.zoomOut();
                }
                break;
            case '0':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.resetZoom();
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                if (this.selectedComponent) {
                    e.preventDefault();
                    this.moveSelectedComponent(e.key);
                }
                break;
            // Number keys for quick component selection
            case '1':
                if (!e.ctrlKey) this.quickSelectComponent('battery');
                break;
            case '2':
                if (!e.ctrlKey) this.quickSelectComponent('led');
                break;
            case '3':
                if (!e.ctrlKey) this.quickSelectComponent('resistor');
                break;
            case '4':
                if (!e.ctrlKey) this.quickSelectComponent('switch');
                break;
            case '5':
                if (!e.ctrlKey) this.quickSelectComponent('wire');
                break;
            case '6':
                if (!e.ctrlKey) this.quickSelectComponent('and-gate');
                break;
            case '7':
                if (!e.ctrlKey) this.quickSelectComponent('or-gate');
                break;
            case '8':
                if (!e.ctrlKey) this.quickSelectComponent('not-gate');
                break;
            case '9':
                if (!e.ctrlKey) this.quickSelectComponent('xor-gate');
                break;
        }
    }
    
    // Show help dialog with keyboard shortcuts
    showHelpDialog() {
        const helpDialog = document.createElement('div');
        helpDialog.style.position = 'fixed';
        helpDialog.style.top = '50%';
        helpDialog.style.left = '50%';
        helpDialog.style.transform = 'translate(-50%, -50%)';
        helpDialog.style.background = '#16213e';
        helpDialog.style.border = '3px solid #533a7b';
        helpDialog.style.padding = '20px';
        helpDialog.style.zIndex = '10000';
        helpDialog.style.fontFamily = 'Press Start 2P, monospace';
        helpDialog.style.fontSize = '8px';
        helpDialog.style.color = '#eee';
        helpDialog.style.maxWidth = '600px';
        helpDialog.style.maxHeight = '80vh';
        helpDialog.style.overflow = 'auto';
        
        helpDialog.innerHTML = `
            <h3 style="margin-bottom: 15px; color: #4cc9f0;">Keyboard Shortcuts</h3>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-bottom: 15px;">
                <strong style="color: #4cc9f0;">File Operations:</strong><span></span>
                <span>Ctrl + S</span><span>Save circuit</span>
                <span>Ctrl + O</span><span>Load circuit</span>
                <span>Ctrl + E</span><span>Export circuit</span>
                <span>Ctrl + I</span><span>Import circuit</span>
                <span>Ctrl + C</span><span>Clear circuit</span>
                
                <strong style="color: #4cc9f0;">Navigation:</strong><span></span>
                <span>Ctrl + +</span><span>Zoom in</span>
                <span>Ctrl + -</span><span>Zoom out</span>
                <span>Ctrl + 0</span><span>Reset zoom</span>
                <span>Mouse wheel</span><span>Zoom at cursor</span>
                <span>Middle mouse</span><span>Pan canvas</span>
                
                <strong style="color: #4cc9f0;">Components:</strong><span></span>
                <span>Delete/Backspace</span><span>Delete selected</span>
                <span>Tab</span><span>Select next component</span>
                <span>Arrow keys</span><span>Move selected component</span>
                <span>Enter/Space</span><span>Toggle switch</span>
                <span>Escape</span><span>Deselect component</span>
                
                <strong style="color: #4cc9f0;">Quick Select:</strong><span></span>
                <span>1</span><span>Battery</span>
                <span>2</span><span>LED</span>
                <span>3</span><span>Resistor</span>
                <span>4</span><span>Switch</span>
                <span>5</span><span>Wire</span>
                <span>6</span><span>AND Gate</span>
                <span>7</span><span>OR Gate</span>
                <span>8</span><span>NOT Gate</span>
                <span>9</span><span>XOR Gate</span>
                
                <strong style="color: #4cc9f0;">Other:</strong><span></span>
                <span>Ctrl + M</span><span>Toggle audio</span>
                <span>Ctrl + G</span><span>Toggle grid</span>
                <span>Ctrl + H</span><span>Show this help</span>
            </div>
            <button id="closeHelp" style="background: #4cc9f0; color: #fff; border: none; padding: 10px 20px; cursor: pointer; font-family: 'Press Start 2P', monospace; font-size: 8px;">Close</button>
        `;
        
        document.body.appendChild(helpDialog);
        
        // Close help dialog
        document.getElementById('closeHelp').onclick = () => {
            document.body.removeChild(helpDialog);
        };
        
        // Close on escape
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(helpDialog);
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        
        document.addEventListener('keydown', closeOnEscape);
    }
    
    // Toggle grid visibility
    toggleGrid() {
        // This would need to be implemented in the grid class
        this.showMessage('Grid toggle not implemented yet', 'info');
    }
    
    // Select next component (for tab navigation)
    selectNextComponent() {
        if (this.simulator.components.length === 0) return;
        
        let currentIndex = this.simulator.components.indexOf(this.selectedComponent);
        currentIndex = (currentIndex + 1) % this.simulator.components.length;
        
        this.selectComponent(this.simulator.components[currentIndex]);
        window.audioManager.playClick();
    }
    
    // Move selected component with arrow keys
    moveSelectedComponent(direction) {
        if (!this.selectedComponent) return;
        
        const gridCoord = this.grid.pixelToGrid(this.selectedComponent.x, this.selectedComponent.y);
        let newX = gridCoord.x;
        let newY = gridCoord.y;
        
        switch (direction) {
            case 'ArrowUp': newY--; break;
            case 'ArrowDown': newY++; break;
            case 'ArrowLeft': newX--; break;
            case 'ArrowRight': newX++; break;
        }
        
        // Check if new position is valid
        if (newX >= 0 && newX < this.grid.cols && newY >= 0 && newY < this.grid.rows) {
            if (this.grid.isEmpty(newX, newY)) {
                // Remove from old position
                this.grid.removeComponent(gridCoord.x, gridCoord.y);
                
                // Update component position
                const newPixelPos = this.grid.gridToPixel(newX, newY);
                this.selectedComponent.x = newPixelPos.x;
                this.selectedComponent.y = newPixelPos.y;
                
                // Place in new position
                this.grid.placeComponent(this.selectedComponent, newX, newY);
                
                this.updateStatus(`Moved ${this.selectedComponent.type} to (${newX}, ${newY})`);
                window.audioManager.playClick();
            } else {
                window.audioManager.playError();
                this.showMessage('Cannot move to occupied cell', 'error');
            }
        } else {
            window.audioManager.playError();
            this.showMessage('Cannot move outside grid', 'error');
        }
    }
    
    // Quick select component type (for number key shortcuts)
    quickSelectComponent(type) {
        // Set ghost component for placement
        this.ghostComponent = {
            type: type,
            x: this.mousePos.x,
            y: this.mousePos.y,
            valid: true
        };
        
        this.updateStatus(`Selected ${type} for placement (click to place)`);
        window.audioManager.playClick();
    }
    
    // Handle mouse wheel for zooming
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const deltaY = e.deltaY;
        const zoomDirection = deltaY > 0 ? -1 : 1;
        
        this.zoomAt(mouseX, mouseY, zoomDirection);
    }
    
    // Handle mouse down for panning
    handleMouseDown(e) {
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left click
            e.preventDefault();
            this.isPanning = true;
            this.lastPanPos = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    // Handle mouse up for panning
    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = '';
        }
    }
    
    // Zoom in
    zoomIn() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.zoomAt(centerX, centerY, 1);
    }
    
    // Zoom out
    zoomOut() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.zoomAt(centerX, centerY, -1);
    }
    
    // Reset zoom to 100%
    resetZoom() {
        this.zoom = 1.0;
        this.panOffset = { x: 0, y: 0 };
        this.updateZoomDisplay();
    }
    
    // Zoom at specific point
    zoomAt(x, y, direction) {
        const newZoom = this.zoom + (direction * this.zoomStep);
        
        if (newZoom < this.minZoom || newZoom > this.maxZoom) {
            return;
        }
        
        // Calculate zoom point in world coordinates
        const worldX = (x - this.panOffset.x) / this.zoom;
        const worldY = (y - this.panOffset.y) / this.zoom;
        
        // Update zoom
        this.zoom = newZoom;
        
        // Adjust pan offset to keep zoom point in same screen position
        this.panOffset.x = x - worldX * this.zoom;
        this.panOffset.y = y - worldY * this.zoom;
        
        this.updateZoomDisplay();
    }
    
    // Add zoom controls to UI
    addZoomControls() {
        // Check if zoom controls already exist in HTML
        if (document.getElementById('zoomInBtn')) {
            // Controls exist in HTML, just add event listeners
            document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
            document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
            document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());
            return;
        }
        
        // Create zoom controls dynamically if they don't exist
        const controls = document.querySelector('.controls');
        
        // Create zoom controls container
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button id="zoomOutBtn" class="btn pixel-btn zoom-btn" title="Zoom Out (Ctrl + -)">-</button>
            <span id="zoomDisplay" class="zoom-display">100%</span>
            <button id="zoomInBtn" class="btn pixel-btn zoom-btn" title="Zoom In (Ctrl + +)">+</button>
            <button id="resetZoomBtn" class="btn pixel-btn zoom-btn" title="Reset Zoom (Ctrl + 0)">⌂</button>
        `;
        
        controls.appendChild(zoomControls);
        
        // Add event listeners
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());
    }
    
    // Update zoom display
    updateZoomDisplay() {
        const display = document.getElementById('zoomDisplay');
        if (display) {
            display.textContent = `${Math.round(this.zoom * 100)}%`;
        }
        
        // Update coordinates to show zoom level
        this.updateCoordinates();
    }
    
    // Transform canvas context for zoom and pan
    transformCanvas() {
        this.ctx.save();
        this.ctx.translate(this.panOffset.x, this.panOffset.y);
        this.ctx.scale(this.zoom, this.zoom);
    }
    
    // Restore canvas transform
    restoreCanvas() {
        this.ctx.restore();
    }
    
    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.panOffset.x) / this.zoom,
            y: (screenY - this.panOffset.y) / this.zoom
        };
    }
    
    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.zoom + this.panOffset.x,
            y: worldY * this.zoom + this.panOffset.y
        };
    }
    
    // Add audio controls to UI
    addAudioControls() {
        // Audio controls are already in HTML, just need to wire up events
        const audioToggleBtn = document.getElementById('audioToggleBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (audioToggleBtn) {
            audioToggleBtn.addEventListener('click', () => {
                const enabled = window.audioManager.toggle();
                audioToggleBtn.textContent = enabled ? '🔊' : '🔇';
                audioToggleBtn.classList.toggle('muted', !enabled);
                audioToggleBtn.title = enabled ? 'Turn Sound Off' : 'Turn Sound On';
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                window.audioManager.setVolume(volume);
            });
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
            window.audioManager.playClear();
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
                window.audioManager.playSuccess();
                break;
            case 'basicAND':
                this.simulator.createBasicANDGate();
                this.showMessage('Basic AND gate circuit loaded', 'success');
                window.audioManager.playSuccess();
                break;
            case 'xorDemo':
                this.simulator.createXORDemo();
                this.showMessage('XOR gate demonstration loaded', 'success');
                window.audioManager.playSuccess();
                break;
            case 'fullAdder':
                this.simulator.createFullAdder();
                this.showMessage('Full adder circuit loaded', 'success');
                window.audioManager.playSuccess();
                break;
            case 'srFlipFlop':
                this.simulator.createSRFlipFlop();
                this.showMessage('SR flip-flop circuit loaded', 'success');
                window.audioManager.playSuccess();
                break;
            case 'counter':
                this.simulator.createCounter();
                this.showMessage('4-bit counter circuit loaded', 'success');
                window.audioManager.playSuccess();
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
            if (gridX !== undefined && gridY !== undefined) {
                this.coordinatesDisplay.textContent = `Grid: (${gridX}, ${gridY}) | Zoom: ${Math.round(this.zoom * 100)}%`;
            } else {
                this.coordinatesDisplay.textContent = `Zoom: ${Math.round(this.zoom * 100)}%`;
            }
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
        
        // Apply zoom and pan transforms
        this.transformCanvas();
        
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
                this.ctx.lineWidth = 2 / this.zoom; // Adjust line width for zoom
                this.ctx.strokeRect(component.x - 2, component.y - 2, component.width + 4, component.height + 4);
            }
        });
        
        // Restore transform
        this.restoreCanvas();
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
    
    // Setup navigation controls
    setupNavigationControls() {
        const panStep = 50; // pixels to pan per button press
        
        // Pan up
        document.getElementById('panUp')?.addEventListener('click', () => {
            this.panOffset.y += panStep;
        });
        
        // Pan down
        document.getElementById('panDown')?.addEventListener('click', () => {
            this.panOffset.y -= panStep;
        });
        
        // Pan left
        document.getElementById('panLeft')?.addEventListener('click', () => {
            this.panOffset.x += panStep;
        });
        
        // Pan right
        document.getElementById('panRight')?.addEventListener('click', () => {
            this.panOffset.x -= panStep;
        });
        
        // Center view
        document.getElementById('panCenter')?.addEventListener('click', () => {
            this.panOffset = { x: 0, y: 0 };
            this.zoom = 1.0;
            this.updateZoomDisplay();
        });
    }
}