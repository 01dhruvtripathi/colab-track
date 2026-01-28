// Projects View Controller
class ProjectsView {
    constructor() {
        this.projects = [];
    }

    async init() {
        await this.loadProjects();
        this.setupEventListeners();
    }

    async loadProjects() {
        const grid = document.getElementById('projectsGrid');
        if (!grid) return;

        Utils.showLoading(grid);

        const workspaceId = app.getCurrentWorkspace()?.id;
        if (!workspaceId) {
            Utils.showEmptyState(grid, 'Select a workspace to view projects');
            return;
        }

        const response = await projectService.getAll(workspaceId);

        if (response.success) {
            this.projects = response.data;
            this.renderProjects(this.projects);
        } else {
            Utils.showEmptyState(grid, 'Failed to load projects', 'fa-exclamation-triangle');
        }
    }

    renderProjects(projects) {
        const grid = document.getElementById('projectsGrid');
        if (!grid) return;

        if (projects.length === 0) {
            Utils.showEmptyState(grid, 'No projects found', 'fa-folder-open');
            return;
        }

        grid.innerHTML = projects.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <div>
                        <h3 class="project-title">${Utils.sanitizeHtml(project.name)}</h3>
                        <p class="project-description">${Utils.sanitizeHtml(project.description || '')}</p>
                    </div>
                </div>
                <div class="project-meta">
                    <span><i class="fas fa-users"></i> ${project.members.length} members</span>
                    <span><i class="fas fa-tasks"></i> ${project.tasksCount || 0} tasks</span>
                </div>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.getProgressPercentage()}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${project.getProgressPercentage()}% Complete</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const projectId = card.getAttribute('data-project-id');
                this.openProject(projectId);
            });
        });
    }

    openProject(projectId) {
        // Switch to tasks view and filter by project
        app.switchView('tasks');
        // This would filter tasks by project
    }

    setupEventListeners() {
        // New project button
        const newProjectBtn = document.getElementById('newProjectBtn');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                this.showNewProjectModal();
            });
        }

        // Search
        const searchInput = document.getElementById('projectSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filterProjects(e.target.value);
            }, 300));
        }
    }

    filterProjects(searchTerm) {
        const filtered = this.projects.filter(project =>
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderProjects(filtered);
    }

    showNewProjectModal() {
        const modalContent = `
            <form id="newProjectForm">
                <div class="form-group">
                    <label class="form-label">Project Name</label>
                    <input type="text" class="form-input" name="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" name="description"></textarea>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn-primary">Create Project</button>
                </div>
            </form>
        `;

        Utils.showModal(modalContent, 'New Project');

        const form = document.getElementById('newProjectForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const projectData = Object.fromEntries(formData);

                const workspaceId = app.getCurrentWorkspace()?.id;
                if (!workspaceId) {
                    Utils.showToast('Please select a workspace', 'error');
                    return;
                }

                const response = await projectService.create(workspaceId, projectData);

                if (response.success) {
                    Utils.showToast('Project created successfully', 'success');
                    Utils.hideModal();
                    await this.loadProjects();
                } else {
                    Utils.showToast(response.error || 'Failed to create project', 'error');
                }
            });
        }
    }

    async refresh() {
        await this.loadProjects();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectsView;
}


