// Teams View Controller
class TeamsView {
    constructor() {
        this.teams = [];
    }

    async init() {
        await this.loadTeams();
        this.setupEventListeners();
    }

    async loadTeams() {
        const grid = document.getElementById('teamsGrid');
        if (!grid) return;

        Utils.showLoading(grid);

        const workspaceId = app.getCurrentWorkspace()?.id;
        if (!workspaceId) {
            Utils.showEmptyState(grid, 'Select a workspace to view teams');
            return;
        }

        const response = await teamService.getAll(workspaceId);

        if (response.success) {
            this.teams = response.data;
            this.renderTeams(this.teams);
        } else {
            Utils.showEmptyState(grid, 'Failed to load teams', 'fa-exclamation-triangle');
        }
    }

    renderTeams(teams) {
        const grid = document.getElementById('teamsGrid');
        if (!grid) return;

        if (teams.length === 0) {
            Utils.showEmptyState(grid, 'No teams found', 'fa-users');
            return;
        }

        grid.innerHTML = teams.map(team => `
            <div class="team-card" data-team-id="${team.id}">
                <div class="team-header">
                    <div class="team-avatar">${team.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <h3 class="team-name">${Utils.sanitizeHtml(team.name)}</h3>
                        <p>${Utils.sanitizeHtml(team.description || '')}</p>
                    </div>
                </div>
                <div class="team-members">
                    ${team.members.slice(0, 5).map(member => `
                        <img src="${member.avatar || 'https://via.placeholder.com/32'}" 
                             alt="${member.name}" 
                             class="member-avatar" 
                             title="${member.name}">
                    `).join('')}
                    ${team.members.length > 5 ? `<span class="member-count">+${team.members.length - 5}</span>` : ''}
                </div>
            </div>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const teamId = card.getAttribute('data-team-id');
                this.openTeam(teamId);
            });
        });
    }

    openTeam(teamId) {
        // Show team details
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            // Open team detail modal or navigate
            console.log('Opening team:', team);
        }
    }

    setupEventListeners() {
        // New team button
        const newTeamBtn = document.getElementById('newTeamBtn');
        if (newTeamBtn) {
            newTeamBtn.addEventListener('click', () => {
                this.showNewTeamModal();
            });
        }
    }

    showNewTeamModal() {
        const modalContent = `
            <form id="newTeamForm">
                <div class="form-group">
                    <label class="form-label">Team Name</label>
                    <input type="text" class="form-input" name="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" name="description"></textarea>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn-primary">Create Team</button>
                </div>
            </form>
        `;

        Utils.showModal(modalContent, 'New Team');

        const form = document.getElementById('newTeamForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const teamData = Object.fromEntries(formData);

                const workspaceId = app.getCurrentWorkspace()?.id;
                if (!workspaceId) {
                    Utils.showToast('Please select a workspace', 'error');
                    return;
                }

                const response = await teamService.create(workspaceId, teamData);

                if (response.success) {
                    Utils.showToast('Team created successfully', 'success');
                    Utils.hideModal();
                    await this.loadTeams();
                } else {
                    Utils.showToast(response.error || 'Failed to create team', 'error');
                }
            });
        }
    }

    async refresh() {
        await this.loadTeams();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamsView;
}


