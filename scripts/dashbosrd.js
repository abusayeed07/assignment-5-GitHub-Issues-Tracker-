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
// ==================== PART 10: CREATE ONE CARD ====================
function makeCard(issue) {
    // Format the date nicely
    let issueDate = new Date(issue.createdAt);
    let dateString = issueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Get first letter of author for avatar
    let authorInitial = issue.author ? issue.author.charAt(0).toUpperCase() : '?';

    // Get all labels or use empty array
    let labels = issue.labels || [];
    
    // Check if issue is open or closed
    let isOpen = issue.status.toLowerCase() === 'open';
    
    // Choose colors based on status (open or closed)
    let statusColor = isOpen ? '#00A96E' : '#A855F7';
    let statusBgClass = isOpen ? 'bg-[#00A96E]' : 'bg-[#A855F7]';
    let statusBgLightClass = isOpen ? 'bg-[#00A96E] bg-opacity-10' : 'bg-[#A855F7] bg-opacity-10';
    let statusTextClass = isOpen ? 'text-[#00A96E]' : 'text-[#A855F7]';
    
    // Choose priority bar color (using status colors)
    let priorityBarColor = statusBgClass;

    // Choose priority badge color (using status colors)
    let priorityClass = `${statusBgLightClass} ${statusTextClass}`;

    // Get label class and icon based on label text
    function getLabelClass(label) {
        // Use status colors for all labels
        return `${statusBgLightClass} ${statusTextClass}`;
    }

    function getLabelIcon(label) {
        const iconMap = {
            'BUG': 'fas fa-bug',
            'HELP WANTED': 'fas fa-life-ring',
            'FEATURE': 'fas fa-star',
            'DOCUMENTATION': 'fas fa-book',
            'ENHANCEMENT': 'fas fa-rocket'
        };
        return iconMap[label.toUpperCase()] || 'fas fa-tag';
    }

    // Build the labels HTML
    let labelsHTML = '';
    if (labels.length > 0) {
        // Show first 2 labels max to avoid overcrowding
        for (let i = 0; i < Math.min(labels.length, 2); i++) {
            let label = labels[i];
            labelsHTML += `
                <span class="${getLabelClass(label)} text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                    <i class="${getLabelIcon(label)} text-xs"></i> ${label}
                </span>
            `;
        }
        // If there are more labels, show +X
        if (labels.length > 2) {
            labelsHTML += `
                <span class="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
                    +${labels.length - 2}
                </span>
            `;
        }
    } else {
        labelsHTML = `
            <span class="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
                No labels
            </span>
        `;
    }

    // Avatar color based on status
    let avatarColor = isOpen ? 'bg-gradient-to-br from-[#A855F7] to-[#A855F7]' : 'bg-gradient-to-br from-[#00A96E] to-[#00A96E]';

    // Build the card HTML matching the image design
    return `
        <div class="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200 issue-card" data-id="${issue.id}">
            <!-- Top accent bar based on status (open or closed) -->
            <div class="h-2 ${priorityBarColor}"></div>
            
            <div class="p-6">
                <!-- Title and priority section -->
                <div class="flex items-start justify-between gap-4 mb-4">
                    <h2 class="text-xl font-bold text-gray-800 flex-1">${issue.title}</h2>
                    <span class="${priorityClass} text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">${issue.priority}</span>
                </div>
                
                <!-- Description -->
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${issue.description || 'No description provided'}</p>
                
                <!-- Tags/Labels -->
                <div class="flex flex-wrap gap-2 mb-4">
                    ${labelsHTML}
                </div>
                
                <!-- Footer with author and date -->
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 ${avatarColor} rounded-full flex items-center justify-center">
                            <span class="text-white text-xs font-bold">${authorInitial}</span>
                        </div>
                        <span class="text-sm text-gray-600">${issue.author}</span>
                    </div>
                    <div class="flex items-center gap-1 text-sm text-gray-400">
                        <i class="far fa-calendar-alt"></i>
                        <span>${dateString}</span>
                    </div>
                </div>
                
                <!-- Issue number and status -->
                <div class="mt-3 text-xs text-gray-400 flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <i class="fas fa-hashtag"></i>
                        <span>${issue.id} by ${issue.author}</span>
                    </div>
                    <span class="${statusBgLightClass} ${statusTextClass} text-xs px-3 py-1 rounded-full">${issue.status}</span>
                </div>
            </div>
        </div>
    `;
}

// ==================== PART 11: SHOW DETAILS IN POPUP ====================
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
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            });

            // Check if issue is open or closed
            let isOpen = issue.status.toLowerCase() === 'open';
            
            // Set status colors based on open/closed
            let statusColor = isOpen ? '#00A96E' : '#A855F7';
            let statusBgClass = isOpen ? 'bg-[#00A96E]' : 'bg-[#A855F7]';
            let statusBgLightClass = isOpen ? 'bg-[#00A96E] bg-opacity-10' : 'bg-[#A855F7] bg-opacity-10';
            let statusTextClass = isOpen ? 'text-[#00A96E]' : 'text-[#A855F7]';

            // Priority color classes
            let priorityClass = '';
            if (issue.priority.toLowerCase() === 'high') {
                priorityClass = 'bg-red-100 text-red-600';
            } else if (issue.priority.toLowerCase() === 'medium') {
                priorityClass = 'bg-yellow-100 text-yellow-600';
            } else {
                priorityClass = 'bg-green-100 text-green-600';
            }

            // Make labels list with icons
            let labelsHTML = '';
            if (issue.labels && issue.labels.length > 0) {
                for (let i = 0; i < issue.labels.length; i++) {
                    let label = issue.labels[i];
                    let icon = '';
                    if (label.toUpperCase() === 'BUG') icon = 'fas fa-bug';
                    else if (label.toUpperCase() === 'HELP WANTED') icon = 'fas fa-life-ring';
                    else if (label.toUpperCase() === 'FEATURE') icon = 'fas fa-star';
                    else if (label.toUpperCase() === 'DOCUMENTATION') icon = 'fas fa-book';
                    else if (label.toUpperCase() === 'ENHANCEMENT') icon = 'fas fa-rocket';
                    else icon = 'fas fa-tag';
                    
                    labelsHTML += `
                        <span class="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                            <i class="${icon} text-xs"></i> ${label}
                        </span>
                    `;
                }
            } else {
                labelsHTML = '<span class="text-gray-500 text-sm">No labels</span>';
            }

            // Get first letter of author for avatar
            let authorInitial = issue.author ? issue.author.charAt(0).toUpperCase() : '?';

            // Build popup content matching the image design
            page.popupText.innerHTML = `
                <div class="space-y-6">
                    <!-- Status and Opened info -->
                    <div class="flex items-center gap-4">
                        <span class="${statusBgLightClass} ${statusTextClass} text-xs font-bold px-3 py-1.5 rounded-full">${issue.status}</span>
                        <span class="text-sm text-gray-500">
                            <span class="font-medium text-gray-700">Opened by ${issue.author}</span> • ${created}
                        </span>
                    </div>

                    <!-- Labels/Tags -->
                    <div class="flex flex-wrap gap-2">
                        ${labelsHTML}
                    </div>

                    <!-- Description -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-700 text-sm leading-relaxed">
                            ${issue.description || 'No description provided.'}
                        </p>
                    </div>

                    <!-- Assignee and Priority -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assignee</h4>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 ${statusBgClass} rounded-full flex items-center justify-center">
                                    <span class="text-white text-sm font-bold">${authorInitial}</span>
                                </div>
                                <span class="text-gray-800 font-medium">${issue.assignee || issue.author}</span>
                            </div>
                        </div>
                        
                        <div>
                            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Priority</h4>
                            <span class="${priorityClass} text-xs font-bold px-3 py-1.5 rounded-full inline-block">${issue.priority}</span>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
                            Cancel
                        </button>
                        <button class="px-4 py-2 ${statusBgClass} text-white rounded-lg hover:opacity-90 transition-opacity duration-200 text-sm font-medium">
                            ${isOpen ? 'Close Issue' : 'Reopen Issue'}
                        </button>
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