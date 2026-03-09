// ==================== API CONFIGURATION ====================
const API_BASE = 'https://phi-lab-server.vercel.app/api/v1/lab';

// ==================== STATE ====================
let currentFilter = 'all';
let issues = [];
let filteredIssues = [];

// ==================== AUTH CHECK ====================
// For testing, you can comment this out or set a dummy value
if (!localStorage.getItem('isAuthenticated')) {
    // For testing purposes, set a dummy value
    localStorage.setItem('isAuthenticated', 'true');
    window.location.href = 'index.html'; // Uncomment for production
}

// ==================== DOM ELEMENTS ====================
const issuesGrid = document.getElementById('issuesGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const issueCount = document.getElementById('issueCount');
const openCount = document.getElementById('openCount');
const closedCount = document.getElementById('closedCount');
const statsText = document.getElementById('statsText');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const logoutBtn = document.getElementById('logoutBtn');
const modal = document.getElementById('issueModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const tabBtns = document.querySelectorAll('.tab-btn');

// ==================== EVENT LISTENERS ====================
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
            b.classList.remove('active', 'border-blue-500', 'text-blue-600');
            b.classList.add('border-transparent', 'text-gray-500');
        });
        btn.classList.add('active', 'border-blue-500', 'text-blue-600');
        btn.classList.remove('border-transparent', 'text-gray-500');

        currentFilter = btn.dataset.filter;
        filterIssues();
    });
});

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isAuthenticated');
    alert('Logged out successfully!');
    window.location.href = 'index.html'; // Uncomment for production
});

closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
});

// Load issues on page load
document.addEventListener('DOMContentLoaded', loadIssues);

// ==================== CORE FUNCTIONS ====================

// Load all issues from API
async function loadIssues() {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/issues`);
        const data = await response.json();

        // FIXED: Check for status === 'success' instead of data.success
        if (data.status === 'success') {
            issues = data.data;
            updateStats();
            filterIssues();
        } else {
            showError('Failed to load issues: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading issues:', error);
        showError('Failed to load issues. Please check your connection.');
    } finally {
        showLoading(false);
    }
}

// Filter issues based on current filter
function filterIssues() {
    switch (currentFilter) {
        case 'open':
            filteredIssues = issues.filter(issue => issue.status.toLowerCase() === 'open');
            statsText.textContent = 'Showing open issues';
            break;
        case 'closed':
            filteredIssues = issues.filter(issue => issue.status.toLowerCase() === 'closed');
            statsText.textContent = 'Showing closed issues';
            break;
        default:
            filteredIssues = [...issues];
            statsText.textContent = 'Showing all issues';
    }

    displayIssues(filteredIssues);
}

// Display issues in the grid
function displayIssues(issuesToShow) {
    if (!issuesToShow || issuesToShow.length === 0) {
        issuesGrid.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p class="text-gray-500 text-lg">No issues found</p>
                    </div>
                `;
        return;
    }

    issuesGrid.innerHTML = issuesToShow.map(issue => createIssueCard(issue)).join('');

    document.querySelectorAll('.issue-card').forEach(card => {
        card.addEventListener('click', () => showIssueDetails(parseInt(card.dataset.id)));
    });
}

// Create an issue card HTML
function createIssueCard(issue) {
    const borderColor = issue.status.toLowerCase() === 'open' ? 'border-green-500' : 'border-purple-500';
    const date = new Date(issue.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Handle labels array - take first label or use 'unlabeled'
    const primaryLabel = issue.labels && issue.labels.length > 0 ? issue.labels[0] : 'unlabeled';

    return `
                <div class="issue-card bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 ${borderColor} p-5" data-id="${issue.id}">
                    <h3 class="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">${issue.title}</h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-3">${issue.description || 'No description provided'}</p>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center justify-between">
                            <span class="text-gray-500">Author:</span>
                            <span class="font-medium text-gray-700">${issue.author}</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-gray-500">Priority:</span>
                            <span class="px-2 py-1 rounded-full text-xs font-semibold ${issue.priority === 'high' ? 'bg-red-100 text-red-800' :
            issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
        }">${issue.priority}</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-gray-500">Label:</span>
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">${primaryLabel}</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-gray-500">Created:</span>
                            <span class="text-gray-600">${date}</span>
                        </div>
                        
                        <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span class="text-gray-500">Status:</span>
                            <span class="px-2 py-1 rounded-full text-xs font-semibold ${issue.status.toLowerCase() === 'open' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
        }">${issue.status}</span>
                        </div>
                    </div>
                </div>
            `;
}

// Show issue details in modal
async function showIssueDetails(issueId) {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/issue/${issueId}`);
        const data = await response.json();

        // FIXED: Check for status === 'success'
        if (data.status === 'success') {
            const issue = data.data;
            modalTitle.textContent = issue.title;

            const date = new Date(issue.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Handle labels array for modal
            const labelsList = issue.labels && issue.labels.length > 0
                ? issue.labels.map(label => `<span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs mr-1">${label}</span>`).join('')
                : '<span class="text-gray-500">No labels</span>';

            modalContent.innerHTML = `
                        <div class="space-y-4">
                            <div>
                                <h4 class="text-sm font-semibold text-gray-500 mb-1">Description</h4>
                                <p class="text-gray-700">${issue.description || 'No description provided'}</p>
                            </div>
                            
                            <div>
                                <h4 class="text-sm font-semibold text-gray-500 mb-1">Labels</h4>
                                <div class="flex flex-wrap gap-1">
                                    ${labelsList}
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 class="text-sm font-semibold text-gray-500 mb-1">Author</h4>
                                    <p class="text-gray-700">${issue.author}</p>
                                </div>
                                
                                <div>
                                    <h4 class="text-sm font-semibold text-gray-500 mb-1">Assignee</h4>
                                    <p class="text-gray-700">${issue.assignee || 'Unassigned'}</p>
                                </div>
                                
                                <div>
                                    <h4 class="text-sm font-semibold text-gray-500 mb-1">Status</h4>
                                    <span class="inline-block px-2 py-1 rounded-full text-xs font-semibold ${issue.status.toLowerCase() === 'open' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                }">${issue.status}</span>
                                </div>
                                
                                <div>
                                    <h4 class="text-sm font-semibold text-gray-500 mb-1">Priority</h4>
                                    <span class="inline-block px-2 py-1 rounded-full text-xs font-semibold ${issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                    issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                }">${issue.priority}</span>
                                </div>
                                
                                <div class="col-span-2">
                                    <h4 class="text-sm font-semibold text-gray-500 mb-1">Created At</h4>
                                    <p class="text-gray-700">${date}</p>
                                </div>
                                
                                <div class="col-span-2">
                                    <h4 class="text-sm font-semibold text-gray-500 mb-1">Last Updated</h4>
                                    <p class="text-gray-700">${new Date(issue.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
                                </div>
                            </div>
                        </div>
                    `;

            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            showError('Failed to load issue details');
        }
    } catch (error) {
        console.error('Error loading issue details:', error);
        showError('Failed to load issue details');
    } finally {
        showLoading(false);
    }
}

// Perform search
async function performSearch() {
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        filterIssues();
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/issues/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();

        // FIXED: Check for status === 'success'
        if (data.status === 'success') {
            filteredIssues = data.data;
            displayIssues(filteredIssues);
            statsText.textContent = `Search results for "${searchTerm}"`;
        } else {
            showError('Search failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error searching issues:', error);
        showError('Search failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Update statistics
function updateStats() {
    const openIssues = issues.filter(issue => issue.status.toLowerCase() === 'open').length;
    const closedIssues = issues.filter(issue => issue.status.toLowerCase() === 'closed').length;

    issueCount.textContent = issues.length;
    openCount.textContent = openIssues;
    closedCount.textContent = closedIssues;
}

// Show/hide loading spinner
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
        issuesGrid.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        issuesGrid.classList.remove('hidden');
    }
}

// Show error message
function showError(message) {
    alert(message);
}

// Helper functions (kept for reference but not needed)
async function fetchAllIssues() {
    const resp = await fetch(`${API_BASE}/issues`);
    return resp.json();
}

async function fetchIssueById(id) {
    const resp = await fetch(`${API_BASE}/issue/${id}`);
    return resp.json();
}

async function searchIssues(query) {
    const resp = await fetch(`${API_BASE}/issues/search?q=${encodeURIComponent(query)}`);
    return resp.json();
}