// Grid System for CircuPlay
class Grid {
    constructor(canvas, gridSize = 20) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Grid properties
        this.cols = Math.floor(this.width / this.gridSize);
        this.rows = Math.floor(this.height / this.gridSize);
        
        // Grid state for component placement
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        // Set up pixel perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // Resize canvas to fit grid perfectly
        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    // Convert pixel coordinates to grid coordinates
    pixelToGrid(x, y) {
        return {
            x: Math.floor(x / this.gridSize),
            y: Math.floor(y / this.gridSize)
        };
    }
    
    // Convert grid coordinates to pixel coordinates
    gridToPixel(gridX, gridY) {
        return {
            x: gridX * this.gridSize,
            y: gridY * this.gridSize
        };
    }
    
    // Snap pixel coordinates to grid
    snapToGrid(x, y) {
        const gridPos = this.pixelToGrid(x, y);
        return this.gridToPixel(gridPos.x, gridPos.y);
    }
    
    // Check if grid position is valid
    isValidPosition(gridX, gridY) {
        return gridX >= 0 && gridX < this.cols && gridY >= 0 && gridY < this.rows;
    }
    
    // Check if grid position is empty
    isEmpty(gridX, gridY) {
        if (!this.isValidPosition(gridX, gridY)) return false;
        return this.grid[gridY][gridX] === null;
    }
    
    // Check if area is empty for multi-cell components
    isAreaEmpty(gridX, gridY, width, height) {
        for (let y = gridY; y < gridY + height; y++) {
            for (let x = gridX; x < gridX + width; x++) {
                if (!this.isEmpty(x, y)) return false;
            }
        }
        return true;
    }
    
    // Place component on grid (handles multi-cell components)
    placeComponent(component, gridX, gridY) {
        const width = component.gridWidth || 1;
        const height = component.gridHeight || 1;
        
        if (!this.isAreaEmpty(gridX, gridY, width, height)) return false;
        
        // Place component in all required grid cells
        for (let y = gridY; y < gridY + height; y++) {
            for (let x = gridX; x < gridX + width; x++) {
                this.grid[y][x] = component;
            }
        }
        
        component.gridX = gridX;
        component.gridY = gridY;
        component.x = gridX * this.gridSize;
        component.y = gridY * this.gridSize;
        
        return true;
    }
    
    // Remove component from grid (handles multi-cell components)
    removeComponent(gridX, gridY) {
        if (!this.isValidPosition(gridX, gridY)) return null;
        
        const component = this.grid[gridY][gridX];
        if (!component) return null;
        
        const width = component.gridWidth || 1;
        const height = component.gridHeight || 1;
        
        // Remove component from all grid cells it occupies
        for (let y = component.gridY; y < component.gridY + height; y++) {
            for (let x = component.gridX; x < component.gridX + width; x++) {
                if (this.isValidPosition(x, y)) {
                    this.grid[y][x] = null;
                }
            }
        }
        
        return component;
    }
    
    // Get component at grid position
    getComponent(gridX, gridY) {
        if (!this.isValidPosition(gridX, gridY)) return null;
        return this.grid[gridY][gridX];
    }
    
    // Get component at pixel position
    getComponentAtPixel(x, y) {
        const gridPos = this.pixelToGrid(x, y);
        return this.getComponent(gridPos.x, gridPos.y);
    }
    
    // Find all components of a specific type
    findComponents(type) {
        const components = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const component = this.grid[y][x];
                if (component && component.type === type) {
                    components.push(component);
                }
            }
        }
        return components;
    }
    
    // Get neighboring components
    getNeighbors(gridX, gridY) {
        const neighbors = [];
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        for (const dir of directions) {
            const newX = gridX + dir.dx;
            const newY = gridY + dir.dy;
            const component = this.getComponent(newX, newY);
            if (component) {
                neighbors.push({
                    component,
                    direction: dir,
                    x: newX,
                    y: newY
                });
            }
        }
        
        return neighbors;
    }
    
    // Clear all components
    clear() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = null;
            }
        }
    }
    
    // Draw grid background
    drawGrid() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Set grid style
        this.ctx.strokeStyle = 'rgba(83, 58, 123, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= this.cols; x++) {
            const pixelX = x * this.gridSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, 0);
            this.ctx.lineTo(pixelX, this.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.rows; y++) {
            const pixelY = y * this.gridSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, pixelY);
            this.ctx.lineTo(this.width, pixelY);
            this.ctx.stroke();
        }
    }
    
    // Highlight grid cell
    highlightCell(gridX, gridY, color = 'rgba(76, 201, 240, 0.3)') {
        if (!this.isValidPosition(gridX, gridY)) return;
        
        const pixel = this.gridToPixel(gridX, gridY);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixel.x, pixel.y, this.gridSize, this.gridSize);
    }
    
    // Export grid state
    export() {
        const components = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const component = this.grid[y][x];
                if (component) {
                    components.push({
                        type: component.type,
                        x: x,
                        y: y,
                        properties: component.getProperties ? component.getProperties() : {}
                    });
                }
            }
        }
        return {
            gridSize: this.gridSize,
            components: components
        };
    }
    
    // Import grid state
    import(data) {
        this.clear();
        
        if (data.components) {
            for (const componentData of data.components) {
                // This will be called by the main application
                // to create and place components
                window.circuPlay.createComponentFromData(componentData);
            }
        }
    }
    
    // Update canvas size
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.cols = Math.floor(width / this.gridSize);
        this.rows = Math.floor(height / this.gridSize);
        
        // Recreate grid array
        const oldGrid = this.grid;
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        
        // Copy over existing components that still fit
        for (let y = 0; y < Math.min(oldGrid.length, this.rows); y++) {
            for (let x = 0; x < Math.min(oldGrid[0].length, this.cols); x++) {
                this.grid[y][x] = oldGrid[y][x];
            }
        }
        
        this.setupCanvas();
    }
}