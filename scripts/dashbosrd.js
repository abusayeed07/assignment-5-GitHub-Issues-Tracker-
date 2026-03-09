const SERVER = 'https://phi-lab-server.vercel.app/api/v1/lab';

let masterList = [];        
let showingList = [];      
let currentTab = 'all'; 

const page = {
    // Main areas
    grid: document.getElementById('issuesGrid'),       
    spinner: document.getElementById('loadingSpinner'),

    // Numbers at top
    total: document.getElementById('issueCount'),     
    openNum: document.getElementById('openCount'),     
    closedNum: document.getElementById('closedCount'),  
    status: document.getElementById('statsText'),      

    // Search stuff
    searchBox: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),

    // Logout button
    logout: document.getElementById('logoutBtn'),

    // Popup window (modal)
    popup: document.getElementById('issueModal'),
    popupTitle: document.getElementById('modalTitle'),
    popupText: document.getElementById('modalContent'),
    closePopup: document.getElementById('closeModal'),

    // Filter buttons at top
    tabButtons: document.querySelectorAll('.tab-btn')
};

document.addEventListener('DOMContentLoaded', getIssues);

async function getIssues() {
    toggleLoading(true);
    
    try {
        let response = await fetch(SERVER + '/issues');
        
        let data = await response.json();
        
        if (data.status === 'success') {
            masterList = data.data;
            updateCounts();

            updateDisplay();
        } else {
            alert('Could not get issues: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('No internet connection. Please check your wifi.');
        console.log('Error:', error);
    } finally {
        toggleLoading(false);
    }
}

// ==================== PART 6: SHOW/HIDE LOADING ====================
function toggleLoading(showIt) {
    if (showIt) {
        // Show spinner, hide issues
        page.spinner.classList.remove('hidden');
        page.grid.classList.add('hidden');
    } else {
        // Hide spinner, show issues
        page.spinner.classList.add('hidden');
        page.grid.classList.remove('hidden');
    }
}

// ==================== PART 7: UPDATE NUMBERS AT TOP ====================
function updateCounts() {
    // Count how many are open
    let openTotal = 0;
    let closedTotal = 0;

    // Loop through all issues and count them
    for (let i = 0; i < masterList.length; i++) {
        let oneIssue = masterList[i];
        if (oneIssue.status.toLowerCase() === 'open') {
            openTotal = openTotal + 1;
        } else {
            closedTotal = closedTotal + 1;
        }
    }

    // Put the numbers on screen
    page.total.textContent = masterList.length;
    page.openNum.textContent = openTotal;
    page.closedNum.textContent = closedTotal;
}

// ==================== PART 8: DECIDE WHAT TO SHOW ====================
function updateDisplay() {
    // Clear the showing list
    showingList = [];

    // Decide which issues to show based on selected tab
    if (currentTab === 'open') {
        // Show only open issues
        for (let i = 0; i < masterList.length; i++) {
            if (masterList[i].status.toLowerCase() === 'open') {
                showingList.push(masterList[i]);
            }
        }
        page.status.textContent = 'Showing open issues';
    }
    else if (currentTab === 'closed') {
        // Show only closed issues
        for (let i = 0; i < masterList.length; i++) {
            if (masterList[i].status.toLowerCase() === 'closed') {
                showingList.push(masterList[i]);
            }
        }
        page.status.textContent = 'Showing closed issues';
    }
    else {
        // Show all issues
        for (let i = 0; i < masterList.length; i++) {
            showingList.push(masterList[i]);
        }
        page.status.textContent = 'Showing all issues';
    }

    // Now put them on screen
    displayIssues(showingList);
}

// ==================== PART 9: PUT ISSUES ON SCREEN ====================
function displayIssues(issuesToShow) {
    // If no issues to show, display empty message
    if (issuesToShow.length === 0) {
        page.grid.innerHTML = `
            <div style="text-align: center; padding: 3rem; grid-column: span 4;">
                <p style="color: gray; font-size: 1.2rem;">No issues found</p>
            </div>
        `;
        return;
    }

    // Start with empty string, then add each issue
    let allCards = '';

    // Loop through each issue and make a card
    for (let i = 0; i < issuesToShow.length; i++) {
        let issue = issuesToShow[i];
        allCards = allCards + makeCard(issue);
    }

    // Put all cards on the page at once
    page.grid.innerHTML = allCards;

    // Make each card clickable
    let cards = document.querySelectorAll('.issue-card');
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let id = card.dataset.id;

        card.onclick = function () {
            showDetails(id);
        };
    }
}

// ==================== PART 10: CREATE ONE CARD ====================
function makeCard(issue) {
    // Choose border color based on status
    let borderColor = '';
    if (issue.status.toLowerCase() === 'open') {
        borderColor = 'border-green-500';
    } else {
        borderColor = 'border-purple-500';
    }

    // Format the date nicely
    let issueDate = new Date(issue.createdAt);
    let dateString = issueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Get first label or use 'unlabeled'
    let firstLabel = 'unlabeled';
    if (issue.labels && issue.labels.length > 0) {
        firstLabel = issue.labels[0];
    }

    // Choose priority color
    let priorityColor = '';
    if (issue.priority === 'high') {
        priorityColor = 'bg-red-100 text-red-800';
    } else if (issue.priority === 'medium') {
        priorityColor = 'bg-yellow-100 text-yellow-800';
    } else {
        priorityColor = 'bg-green-100 text-green-800';
    }

    // Choose status color
    let statusColor = '';
    if (issue.status.toLowerCase() === 'open') {
        statusColor = 'bg-green-100 text-green-800';
    } else {
        statusColor = 'bg-purple-100 text-purple-800';
    }

    // Build the card HTML
    return `
        <div class="issue-card bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 ${borderColor} p-5" data-id="${issue.id}">
            <h3 style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">${issue.title}</h3>
            <p style="color: #4a5568; margin-bottom: 1rem;">${issue.description || 'No description'}</p>
            
            <div style="font-size: 0.9rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: gray;">Author:</span>
                    <span style="font-weight: 500;">${issue.author}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: gray;">Priority:</span>
                    <span style="padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; ${priorityColor}">${issue.priority}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: gray;">Label:</span>
                    <span style="padding: 0.25rem 0.5rem; background-color: #ebf8ff; color: #2c5282; border-radius: 9999px; font-size: 0.75rem;">${firstLabel}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: gray;">Created:</span>
                    <span>${dateString}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding-top: 0.5rem; border-top: 1px solid #edf2f7;">
                    <span style="color: gray;">Status:</span>
                    <span style="padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; ${statusColor}">${issue.status}</span>
                </div>
            </div>
        </div>
    `;
}

// ==================== PART 11: SHOW DETAILS IN POPUP ====================
async function showDetails(issueId) {
    // Show loading
    toggleLoading(true);

    try {
        // Ask server for this specific issue
        let response = await fetch(SERVER + '/issue/' + issueId);
        let data = await response.json();

        if (data.status === 'success') {
            let issue = data.data;

            // Set popup title
            page.popupTitle.textContent = issue.title;

            // Format dates
            let created = new Date(issue.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            let updated = new Date(issue.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            // Make labels list
            let labelsHTML = '';
            if (issue.labels && issue.labels.length > 0) {
                for (let i = 0; i < issue.labels.length; i++) {
                    labelsHTML = labelsHTML + `<span style="display: inline-block; padding: 0.25rem 0.5rem; background-color: #ebf8ff; color: #2c5282; border-radius: 9999px; font-size: 0.75rem; margin-right: 0.25rem;">${issue.labels[i]}</span>`;
                }
            } else {
                labelsHTML = '<span style="color: gray;">No labels</span>';
            }

            // Priority color
            let priorityColor = '';
            if (issue.priority === 'high') {
                priorityColor = 'bg-red-100 text-red-800';
            } else if (issue.priority === 'medium') {
                priorityColor = 'bg-yellow-100 text-yellow-800';
            } else {
                priorityColor = 'bg-green-100 text-green-800';
            }

            // Status color
            let statusColor = '';
            if (issue.status.toLowerCase() === 'open') {
                statusColor = 'bg-green-100 text-green-800';
            } else {
                statusColor = 'bg-purple-100 text-purple-800';
            }

            // Build popup content
            page.popupText.innerHTML = `
                <div>
                    <div style="margin-bottom: 1rem;">
                        <h4 style="font-weight: 600; color: gray; margin-bottom: 0.25rem;">Description</h4>
                        <p>${issue.description || 'No description'}</p>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <h4 style="font-weight: 600; color: gray; margin-bottom: 0.25rem;">Labels</h4>
                        <div>${labelsHTML}</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <h4 style="font-weight: 600; color: gray; margin-bottom: 0.25rem;">Author</h4>
                            <p>${issue.author}</p>
                        </div>
                        
                        <div>
                            <h4 style="font-weight: 600; color: gray; margin-bottom: 0.25rem;">Assignee</h4>
                            <p>${issue.assignee || 'Unassigned'}</p>
                        </div>
                        
                        <div>
                            <h4 style="font-weight: 600; color: gray; margin-bottom: 0.25rem;">Status</h4>
                            <span style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; ${statusColor}">${issue.status}</span>
                        </div>
                        
                        <div>
                            <h4 style="font-weight: 600; color: gray; margin-bottom: 0.25rem;">Priority</h4>
                            <span style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; ${priorityColor}">${issue.priority}</span>
                        </div>
                        
                        <div style="grid-column: span 2;">
                            <h4 style="font-weight: 600; color: gray; margin-bottom: 0.25rem;">Created</h4>
                            <p>${created}</p>
                        </div>
                        
                        <div style="grid-column: span 2;">
                            <h4 style="font-weight: 600; color: gray; margin-bottom: 0.25rem;">Updated</h4>
                            <p>${updated}</p>
                        </div>
                    </div>
                </div>
            `;

            // Show popup
            page.popup.classList.remove('hidden');
            page.popup.classList.add('flex');
        } else {
            alert('Could not load details');
        }
    } catch (error) {
        alert('Failed to load details');
        console.log('Error:', error);
    } finally {
        toggleLoading(false);
    }
}

// ==================== PART 12: SEARCH FUNCTION ====================
async function doSearch() {
    // Get what user typed
    let searchWord = page.searchBox.value.trim();

    // If empty, just show regular list
    if (searchWord === '') {
        updateDisplay();
        return;
    }

    // Show loading
    toggleLoading(true);

    try {
        // Ask server for search results
        let response = await fetch(SERVER + '/issues/search?q=' + encodeURIComponent(searchWord));
        let data = await response.json();

        if (data.status === 'success') {
            // Show search results
            showingList = data.data;
            displayIssues(showingList);
            page.status.textContent = 'Search results for "' + searchWord + '"';
        } else {
            alert('Search failed');
        }
    } catch (error) {
        alert('Search failed. Try again.');
        console.log('Error:', error);
    } finally {
        toggleLoading(false);
    }
}

// ==================== PART 13: HANDLE TAB CLICKS ====================
for (let i = 0; i < page.tabButtons.length; i++) {
    let button = page.tabButtons[i];

    button.onclick = function () {
        // Remove active class from all buttons
        for (let j = 0; j < page.tabButtons.length; j++) {
            page.tabButtons[j].classList.remove('active', 'border-blue-500', 'text-blue-600');
            page.tabButtons[j].classList.add('border-transparent', 'text-gray-500');
        }

        // Add active class to clicked button
        button.classList.add('active', 'border-blue-500', 'text-blue-600');
        button.classList.remove('border-transparent', 'text-gray-500');

        // Update current tab and refresh display
        currentTab = button.dataset.filter;
        updateDisplay();
    };
}

// ==================== PART 14: SEARCH BUTTON ====================
page.searchBtn.onclick = doSearch;

// Press Enter in search box
page.searchBox.onkeypress = function (event) {
    if (event.key === 'Enter') {
        doSearch();
    }
};

// ==================== PART 15: LOGOUT ====================
page.logout.onclick = function () {
    localStorage.removeItem('isAuthenticated');
    alert('Logged out!');
    window.location.href = 'index.html';
};

// ==================== PART 16: CLOSE POPUP ====================
page.closePopup.onclick = function () {
    page.popup.classList.add('hidden');
    page.popup.classList.remove('flex');
};

// Click outside popup to close
page.popup.onclick = function (event) {
    if (event.target === page.popup) {
        page.popup.classList.add('hidden');
        page.popup.classList.remove('flex');
    }
};

// ==================== PART 17: LOGIN CHECK ====================
// For testing, we just auto-login
if (!localStorage.getItem('isAuthenticated')) {
    localStorage.setItem('isAuthenticated', 'true');
    // window.location.href = 'index.html'; // Uncomment for real app
}