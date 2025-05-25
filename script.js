// TaskFlow - Modern To-Do List App
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTasks();
        this.updateStats();
        this.updateClearButton();
    }

    setupEventListeners() {
        // Task input and add button
        const taskInput = document.getElementById('taskInput');
        const addBtn = document.getElementById('addTaskBtn');
        const charCounter = document.getElementById('charCounter');

        taskInput.addEventListener('input', (e) => {
            charCounter.textContent = `${e.target.value.length}/200`;
            this.toggleAddButton();
        });

        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.addTask();
            }
        });

        addBtn.addEventListener('click', () => this.addTask());

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Clear all button
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.showConfirmModal('Are you sure you want to clear all tasks?', () => {
                this.clearAllTasks();
            });
        });

        // Modal event listeners
        this.setupModalListeners();

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                taskInput.focus();
            }
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    setupModalListeners() {
        // Edit modal
        const editModal = document.getElementById('editModal');
        const editInput = document.getElementById('editTaskInput');
        const editCharCounter = document.getElementById('editCharCounter');
        const closeModal = document.getElementById('closeModal');
        const cancelEdit = document.getElementById('cancelEdit');
        const saveEdit = document.getElementById('saveEdit');

        editInput.addEventListener('input', (e) => {
            editCharCounter.textContent = `${e.target.value.length}/200`;
        });

        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.saveTaskEdit();
            }
        });

        closeModal.addEventListener('click', () => this.closeEditModal());
        cancelEdit.addEventListener('click', () => this.closeEditModal());
        saveEdit.addEventListener('click', () => this.saveTaskEdit());

        // Confirm modal
        const confirmModal = document.getElementById('confirmModal');
        const cancelConfirm = document.getElementById('cancelConfirm');
        const confirmAction = document.getElementById('confirmAction');

        cancelConfirm.addEventListener('click', () => this.closeConfirmModal());
        confirmAction.addEventListener('click', () => this.executeConfirmAction());

        // Close modals when clicking outside
        [editModal, confirmModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();

        if (!text) {
            this.showToast('Please enter a task', 'warning');
            return;
        }

        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.updateClearButton();

        input.value = '';
        document.getElementById('charCounter').textContent = '0/200';
        this.toggleAddButton();

        this.showToast('Task added successfully!', 'success');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            
            this.saveTasks();
            this.renderTasks();
            this.updateStats();

            const message = task.completed ? 'Task completed!' : 'Task marked as pending';
            const type = task.completed ? 'success' : 'info';
            this.showToast(message, type);
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            const editInput = document.getElementById('editTaskInput');
            const editCharCounter = document.getElementById('editCharCounter');
            
            editInput.value = task.text;
            editCharCounter.textContent = `${task.text.length}/200`;
            
            this.showEditModal();
            setTimeout(() => editInput.focus(), 100);
        }
    }

    saveTaskEdit() {
        const editInput = document.getElementById('editTaskInput');
        const newText = editInput.value.trim();

        if (!newText) {
            this.showToast('Task cannot be empty', 'warning');
            return;
        }

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = newText;
            this.saveTasks();
            this.renderTasks();
            this.closeEditModal();
            this.showToast('Task updated successfully!', 'success');
        }
    }

    deleteTask(id) {
        this.showConfirmModal('Are you sure you want to delete this task?', () => {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.updateClearButton();
            this.showToast('Task deleted successfully!', 'success');
        });
    }

    clearAllTasks() {
        this.tasks = [];
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.updateClearButton();
        this.showToast('All tasks cleared!', 'success');
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        
        let filteredTasks = this.tasks;
        
        // Apply filter
        switch (this.currentFilter) {
            case 'pending':
                filteredTasks = this.tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(task => task.completed);
                break;
            default:
                filteredTasks = this.tasks;
        }

        // Clear current tasks
        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            taskList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            taskList.style.display = 'flex';

            filteredTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                taskList.appendChild(taskElement);
            });
        }
    }

    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        taskItem.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="taskManager.toggleTask('${task.id}')">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-text">${this.escapeHtml(task.text)}</div>
            <div class="task-actions">
                <button class="task-action-btn edit-btn" onclick="taskManager.editTask('${task.id}')" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn delete-btn" onclick="taskManager.deleteTask('${task.id}')" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return taskItem;
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;

        // Animate counter updates
        this.animateCounter('totalTasks', totalTasks);
        this.animateCounter('completedTasks', completedTasks);
        this.animateCounter('pendingTasks', pendingTasks);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue !== targetValue) {
            element.style.transform = 'scale(1.2)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }

    toggleAddButton() {
        const input = document.getElementById('taskInput');
        const addBtn = document.getElementById('addTaskBtn');
        
        addBtn.disabled = !input.value.trim();
    }

    updateClearButton() {
        const clearBtn = document.getElementById('clearAllBtn');
        clearBtn.disabled = this.tasks.length === 0;
    }

    // Modal methods
    showEditModal() {
        const modal = document.getElementById('editModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.editingTaskId = null;
    }

    showConfirmModal(message, callback) {
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        
        messageElement.textContent = message;
        this.confirmCallback = callback;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeConfirmModal() {
        const modal = document.getElementById('confirmModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.confirmCallback = null;
    }

    executeConfirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.closeConfirmModal();
    }

    closeModals() {
        this.closeEditModal();
        this.closeConfirmModal();
    }

    // Toast notifications
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="${icons[type]} toast-icon"></i>
            <span class="toast-message">${this.escapeHtml(message)}</span>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Local Storage methods
    saveTasks() {
        try {
            localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
        } catch (error) {
            this.showToast('Failed to save tasks', 'error');
            console.error('Error saving tasks:', error);
        }
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('taskflow_tasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            this.showToast('Failed to load tasks', 'error');
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export/Import functionality (bonus feature)
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `taskflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('Tasks exported successfully!', 'success');
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.updateClearButton();
                    this.showToast('Tasks imported successfully!', 'success');
                } else {
                    this.showToast('Invalid file format', 'error');
                }
            } catch (error) {
                this.showToast('Failed to import tasks', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
    
    // Add some helpful keyboard shortcuts info
    console.log('TaskFlow Keyboard Shortcuts:');
    console.log('Ctrl + / : Focus on task input');
    console.log('Enter : Add new task (when input is focused)');
    console.log('Escape : Close modals');
    
    // Add a welcome message for first-time users
    const isFirstTime = !localStorage.getItem('taskflow_tasks');
    if (isFirstTime) {
        setTimeout(() => {
            taskManager.showToast('Welcome to TaskFlow! Start by adding your first task.', 'info');
        }, 1000);
    }
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Handle app visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.taskManager) {
        // Refresh stats when user returns to the app
        window.taskManager.updateStats();
    }
});

// Handle beforeunload to warn about unsaved changes
window.addEventListener('beforeunload', (e) => {
    // Only show warning if there are unsaved tasks and user is in the middle of editing
    if (window.taskManager && window.taskManager.editingTaskId) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});
