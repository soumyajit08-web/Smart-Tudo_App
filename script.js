
    // Global variables
    let todos = JSON.parse(localStorage.getItem('todos') || '[]');
    let currentFilter = 'all';
    let searchQuery = '';
    let nextId = Math.max(...todos.map(t => t.id), 0) + 1;

    // Initialize theme
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Toggle theme function
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'}-gradient);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 15px;
            box-shadow: var(--shadow-hover);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Add todo function
    function addTodo() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (!text) {
            showNotification('Please enter a task!', 'warning');
            return;
        }

        const todo = {
            id: nextId++,
            text,
            completed: false,
            category: document.getElementById('categorySelect').value,
            priority: document.getElementById('prioritySelect').value,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        todos.unshift(todo);
        input.value = '';
        input.style.borderColor = 'var(--border-color)';
        
        saveTodos();
        render();
        updateStats();
        showNotification('Task added successfully! ✅', 'success');
    }

    // Toggle todo completion
    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            
            saveTodos();
            render();
            updateStats();
            
            const message = todo.completed ? 'Task completed! 🎉' : 'Task reopened 📝';
            showNotification(message, todo.completed ? 'success' : 'info');
        }
    }

    // Delete todo
    function deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            render();
            updateStats();
            showNotification('Task deleted 🗑️', 'warning');
        }
    }

    // Edit todo
    function editTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        const newText = prompt('Edit task:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            todo.text = newText.trim();
            saveTodos();
            render();
            showNotification('Task updated ✏️', 'info');
        }
    }

    // Set filter
    function setFilter(filter) {
        currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        render();
    }

    // Filter todos by search
    function filterTodos() {
        searchQuery = document.getElementById('searchInput').value.toLowerCase();
        render();
    }

    // Get filtered todos
    function getFilteredTodos() {
        let filtered = [...todos];

        if (searchQuery) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(searchQuery) ||
                todo.category.toLowerCase().includes(searchQuery)
            );
        }

        if (currentFilter === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        } else if (currentFilter === 'pending') {
            filtered = filtered.filter(todo => !todo.completed);
        } else if (['work', 'personal', 'health', 'shopping', 'other'].includes(currentFilter)) {
            filtered = filtered.filter(todo => todo.category === currentFilter);
        }

        return filtered.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    // Render todos
    function render() {
        const container = document.getElementById('todosContainer');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = getFilteredTodos();

        if (filteredTodos.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        container.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="priority-indicator priority-${todo.priority}"></div>
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="toggleTodo(${todo.id})"></div>
                <div class="todo-content">
                    <div class="todo-text">${escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <span class="todo-category category-${todo.category}">${todo.category}</span>
                        <span>•</span>
                        <span>${formatDate(todo.createdAt)}</span>
                        ${todo.completedAt ? `<span>• Completed ${formatDate(todo.completedAt)}</span>` : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn edit-btn" onclick="editTodo(${todo.id})" title="Edit task">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTodo(${todo.id})" title="Delete task">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update statistics
    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    }

    // Save todos to localStorage
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // Format date helper
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }

    // Escape HTML helper
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize app
    document.addEventListener('DOMContentLoaded', function() {
        initTheme();
        render();
        updateStats();

        // Bind events
        const taskInput = document.getElementById('taskInput');
        
        taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addTodo();
            }
        });

        taskInput.addEventListener('input', (e) => {
            const remaining = 100 - e.target.value.length;
            if (remaining < 20) {
                e.target.style.borderColor = remaining < 10 ? '#f87171' : '#fbbf24';
            } else {
                e.target.style.borderColor = 'var(--border-color)';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'k': // focus search
                        e.preventDefault();
                        const searchInput = document.getElementById('searchInput');
                        if (searchInput) searchInput.focus();
                        break;
                    case 'n': // focus new task
                        e.preventDefault();
                        const newTask = document.getElementById('taskInput');
                        if (newTask) newTask.focus();
                        break;
                }
            }
        });
    });
