/**
 * FacturaOCR — Frontend Logic
 * Handles file selection, drag & drop, validation, upload with progress, and result display.
 */

(() => {
    'use strict';

    // -------------------------------------------------------------------------
    // DOM Elements
    // -------------------------------------------------------------------------
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const fileItems = document.getElementById('fileItems');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const validationErrors = document.getElementById('validationErrors');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const submitBtn = document.getElementById('submitBtn');
    const uploadForm = document.getElementById('uploadForm');
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsGrid = document.getElementById('resultsGrid');

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    const ALLOWED_TYPES = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
    ];
    const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    let selectedFiles = [];

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    function isValidFile(file) {
        const ext = getFileExtension(file.name);
        const typeValid = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
        const sizeValid = file.size <= MAX_FILE_SIZE;
        return { valid: typeValid && sizeValid, typeValid, sizeValid };
    }

    function getFileIcon(filename) {
        const ext = getFileExtension(filename);
        if (ext === 'pdf') {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>`;
        }
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
        </svg>`;
    }

    // -------------------------------------------------------------------------
    // File List Rendering
    // -------------------------------------------------------------------------
    function renderFileList() {
        if (selectedFiles.length === 0) {
            fileList.style.display = 'none';
            submitBtn.disabled = true;
            return;
        }

        fileList.style.display = 'block';
        submitBtn.disabled = false;
        fileItems.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.style.animationDelay = `${index * 0.05}s`;

            li.innerHTML = `
                <div class="file-item-icon">${getFileIcon(file.name)}</div>
                <div class="file-item-info">
                    <div class="file-item-name">${file.name}</div>
                    <div class="file-item-size">${formatFileSize(file.size)}</div>
                </div>
                <button type="button" class="file-item-remove" data-index="${index}" title="Remover">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;

            fileItems.appendChild(li);
        });
    }

    function addFiles(newFiles) {
        const errors = [];

        for (const file of newFiles) {
            const { valid, typeValid, sizeValid } = isValidFile(file);

            if (!typeValid) {
                errors.push(`"${file.name}" — formato não suportado. Use PDF, PNG, JPG ou WEBP.`);
                continue;
            }
            if (!sizeValid) {
                errors.push(`"${file.name}" — excede o limite de 20MB (${formatFileSize(file.size)}).`);
                continue;
            }

            // Avoid duplicates
            const alreadyAdded = selectedFiles.some(
                (f) => f.name === file.name && f.size === file.size
            );
            if (!alreadyAdded) {
                selectedFiles.push(file);
            }
        }

        showValidationErrors(errors);
        renderFileList();
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        renderFileList();
    }

    function clearAllFiles() {
        selectedFiles = [];
        fileInput.value = '';
        renderFileList();
        hideValidationErrors();
    }

    // -------------------------------------------------------------------------
    // Validation Errors
    // -------------------------------------------------------------------------
    function showValidationErrors(errors) {
        if (!errors.length) {
            hideValidationErrors();
            return;
        }

        validationErrors.innerHTML = errors
            .map(
                (err) => `
                <div class="validation-error-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span>${err}</span>
                </div>`
            )
            .join('');

        validationErrors.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(hideValidationErrors, 5000);
    }

    function hideValidationErrors() {
        validationErrors.style.display = 'none';
        validationErrors.innerHTML = '';
    }

    // -------------------------------------------------------------------------
    // Drag & Drop
    // -------------------------------------------------------------------------
    let dragCounter = 0;

    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            dropZone.classList.remove('drag-over');
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length) {
            addFiles(Array.from(files));
        }
    });

    // -------------------------------------------------------------------------
    // File Input Change
    // -------------------------------------------------------------------------
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            addFiles(Array.from(fileInput.files));
        }
        // Reset input so the same file can be re-selected
        fileInput.value = '';
    });

    // -------------------------------------------------------------------------
    // Remove / Clear
    // -------------------------------------------------------------------------
    fileItems.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.file-item-remove');
        if (removeBtn) {
            const index = parseInt(removeBtn.dataset.index, 10);
            removeFile(index);
        }
    });

    clearAllBtn.addEventListener('click', clearAllFiles);

    // -------------------------------------------------------------------------
    // Upload with Progress
    // -------------------------------------------------------------------------
    function uploadFiles() {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            selectedFiles.forEach((file) => {
                formData.append('files', file);
            });

            const xhr = new XMLHttpRequest();

            // Progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    progressFill.style.width = percent + '%';
                    progressPercent.textContent = percent + '%';
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } catch {
                        reject(new Error('Resposta inválida do servidor.'));
                    }
                } else {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        reject(new Error(data.error || `Erro ${xhr.status}`));
                    } catch {
                        reject(new Error(`Erro ${xhr.status}: ${xhr.statusText}`));
                    }
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Erro de rede. Verifique a conexão e tente novamente.'));
            });

            xhr.open('POST', '/upload');
            xhr.send(formData);
        });
    }

    // -------------------------------------------------------------------------
    // Results Rendering
    // -------------------------------------------------------------------------
    function renderResults(data) {
        if (!data.resultados || !data.resultados.length) return;

        resultsGrid.innerHTML = '';

        data.resultados.forEach((result, index) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.style.animationDelay = `${index * 0.1}s`;

            card.innerHTML = `
                <div class="result-card-header">
                    <div class="result-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                    </div>
                    <span class="result-card-filename">${result.arquivo}</span>
                </div>
                <div class="result-fields">
                    <div class="result-field">
                        <div class="result-field-label">Fornecedor</div>
                        <div class="result-field-value">${result.fornecedor}</div>
                    </div>
                    <div class="result-field">
                        <div class="result-field-label">NIF</div>
                        <div class="result-field-value">${result.nif}</div>
                    </div>
                    <div class="result-field">
                        <div class="result-field-label">Nº Factura</div>
                        <div class="result-field-value">${result.numero_factura}</div>
                    </div>
                    <div class="result-field">
                        <div class="result-field-label">Valor</div>
                        <div class="result-field-value">${result.valor}</div>
                    </div>
                    <div class="result-field">
                        <div class="result-field-label">Data</div>
                        <div class="result-field-value">${result.data}</div>
                    </div>
                    <div class="result-field full-width">
                        <div class="result-field-label">Descrição</div>
                        <div class="result-field-value">${result.descricao}</div>
                    </div>
                </div>
            `;

            resultsGrid.appendChild(card);
        });

        resultsContainer.style.display = 'block';
    }

    // -------------------------------------------------------------------------
    // Form Submit
    // -------------------------------------------------------------------------
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedFiles.length) return;

        // Reset UI
        hideValidationErrors();
        successMessage.style.display = 'none';
        resultsContainer.style.display = 'none';

        // Show progress
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';

        // Disable button
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            A processar...
        `;

        // Add spin keyframe dynamically
        if (!document.getElementById('spin-style')) {
            const style = document.createElement('style');
            style.id = 'spin-style';
            style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }

        try {
            const data = await uploadFiles();

            // Show success
            successText.textContent = data.message;
            successMessage.style.display = 'block';

            // Render results
            renderResults(data);

            // Clear form
            selectedFiles = [];
            fileInput.value = '';
            renderFileList();

        } catch (error) {
            showValidationErrors([error.message]);
        } finally {
            // Hide progress & restore button
            progressContainer.style.display = 'none';
            submitBtn.classList.remove('loading');
            submitBtn.disabled = selectedFiles.length === 0;
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Enviar Factura(s)
            `;
        }
    });
})();
