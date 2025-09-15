class ImageUploader {
    constructor() {
        this.selectedImages = [];
        this.webhookUrl = 'https://n8n.remotedok.fun/form/REPLACE_WITH_YOUR_WEBHOOK_ID';
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.imageUpload = document.getElementById('imageUpload');
        this.imageGrid = document.getElementById('imageGrid');
        this.imagePreviewContainer = document.getElementById('imagePreviewContainer');
        this.uploadForm = document.getElementById('uploadForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.successMessage = document.getElementById('successMessage');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.propertyNameInput = document.getElementById('propertyName');
    }

    bindEvents() {
        // File upload area events
        this.fileUploadArea.addEventListener('click', () => this.imageUpload.click());
        this.fileUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.fileUploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.fileUploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // File input change
        this.imageUpload.addEventListener('change', this.handleFileSelect.bind(this));

        // Form submission
        this.uploadForm.addEventListener('submit', this.handleSubmit.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.fileUploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const validFiles = files.filter(file => this.validateFile(file));
        
        if (validFiles.length !== files.length) {
            this.showError('Alguns arquivos foram rejeitados. Apenas imagens PNG, JPG, JPEG até 10MB são permitidas.');
        }

        validFiles.forEach(file => {
            if (!this.selectedImages.find(img => img.name === file.name)) {
                this.selectedImages.push(file);
            }
        });

        this.updateImagePreview();
        this.updateSubmitButton();
    }

    validateFile(file) {
        if (!this.allowedTypes.includes(file.type)) {
            return false;
        }
        
        if (file.size > this.maxFileSize) {
            return false;
        }
        
        return true;
    }

    updateImagePreview() {
        this.imageGrid.innerHTML = '';
        
        if (this.selectedImages.length === 0) {
            this.imagePreviewContainer.style.display = 'none';
            return;
        }

        this.imagePreviewContainer.style.display = 'block';

        this.selectedImages.forEach((file, index) => {
            const imageItem = this.createImagePreview(file, index);
            this.imageGrid.appendChild(imageItem);
        });
    }

    createImagePreview(file, index) {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', () => this.removeImage(index));
        
        const imageName = document.createElement('div');
        imageName.className = 'image-name';
        imageName.textContent = file.name;
        
        imageItem.appendChild(img);
        imageItem.appendChild(removeBtn);
        imageItem.appendChild(imageName);
        
        return imageItem;
    }

    removeImage(index) {
        this.selectedImages.splice(index, 1);
        this.updateImagePreview();
        this.updateSubmitButton();
    }

    updateSubmitButton() {
        const hasImages = this.selectedImages.length > 0;
        const hasPropertyName = this.propertyNameInput.value.trim() !== '';
        
        this.submitBtn.disabled = !hasImages || !hasPropertyName;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.selectedImages.length === 0) {
            this.showError('Por favor, selecione pelo menos uma imagem.');
            return;
        }

        const propertyName = this.propertyNameInput.value.trim();
        if (!propertyName) {
            this.showError('Por favor, digite o nome da propriedade.');
            return;
        }

        this.showProgress();
        this.submitBtn.disabled = true;
        this.submitBtn.classList.add('loading');

        try {
            await this.uploadImages(propertyName);
            this.showSuccess();
            this.resetForm();
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Erro ao enviar imagens. Verifique sua conexão e tente novamente.');
        } finally {
            this.hideProgress();
            this.submitBtn.disabled = false;
            this.submitBtn.classList.remove('loading');
        }
    }

    async uploadImages(propertyName) {
        const totalImages = this.selectedImages.length;
        let uploadedCount = 0;

        for (let i = 0; i < this.selectedImages.length; i++) {
            const file = this.selectedImages[i];
            
            try {
                await this.uploadSingleImage(file, propertyName, i + 1);
                uploadedCount++;
                
                const progress = (uploadedCount / totalImages) * 100;
                this.updateProgress(progress, `Enviando imagem ${uploadedCount} de ${totalImages}`);
                
            } catch (error) {
                console.error(`Error uploading image ${i + 1}:`, error);
                throw new Error(`Falha ao enviar a imagem ${file.name}`);
            }
        }
    }

    async uploadSingleImage(file, propertyName, sequenceNumber) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('propertyName', propertyName);
        formData.append('sequenceNumber', sequenceNumber);
        formData.append('fileName', file.name);
        formData.append('fileSize', file.size);
        formData.append('fileType', file.type);

        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    }

    updateProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }

    showProgress() {
        this.progressContainer.style.display = 'block';
        this.hideMessages();
    }

    hideProgress() {
        this.progressContainer.style.display = 'none';
    }

    showSuccess() {
        this.successMessage.style.display = 'flex';
        this.hideError();
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'flex';
        this.hideSuccess();
    }

    hideSuccess() {
        this.successMessage.style.display = 'none';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    hideMessages() {
        this.hideSuccess();
        this.hideError();
    }

    resetForm() {
        this.selectedImages = [];
        this.imageUpload.value = '';
        this.propertyNameInput.value = '';
        this.updateImagePreview();
        this.updateSubmitButton();
        this.hideProgress();
    }
}

// Initialize the uploader when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const uploader = new ImageUploader();
    
    // Add real-time validation for property name
    const propertyNameInput = document.getElementById('propertyName');
    propertyNameInput.addEventListener('input', () => {
        uploader.updateSubmitButton();
    });
});

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const submitBtn = document.getElementById('submitBtn');
            if (!submitBtn.disabled) {
                submitBtn.click();
            }
        }
        
        // Escape to clear selection
        if (e.key === 'Escape') {
            const fileUpload = document.getElementById('imageUpload');
            fileUpload.value = '';
        }
    });

    // Add paste functionality for images
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        const files = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
                files.push(item.getAsFile());
            }
        }
        
        if (files.length > 0) {
            e.preventDefault();
            const uploader = window.uploader || new ImageUploader();
            uploader.processFiles(files);
        }
    });
});
