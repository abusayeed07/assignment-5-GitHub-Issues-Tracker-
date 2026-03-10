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

function toggleLoading(showIt) {
    if (showIt) {
        page.spinner.classList.remove('hidden');
        page.grid.classList.add('hidden');
    } else {
        page.spinner.classList.add('hidden');
        page.grid.classList.remove('hidden');
    }
}

function updateCounts() {
    let openTotal = 0;
    let closedTotal = 0;

    for (let i = 0; i < masterList.length; i++) {
        let oneIssue = masterList[i];
        if (oneIssue.status.toLowerCase() === 'open') {
            openTotal = openTotal + 1;
        } else {
            closedTotal = closedTotal + 1;
        }
    }

    page.total.textContent = masterList.length;
    page.openNum.textContent = openTotal;
    page.closedNum.textContent = closedTotal;
}

function updateDisplay() {
    showingList = [];

    if (currentTab === 'open') {
        for (let i = 0; i < masterList.length; i++) {
            if (masterList[i].status.toLowerCase() === 'open') {
                showingList.push(masterList[i]);
            }
        }
        page.status.textContent = 'Showing open issues';
    }
    else if (currentTab === 'closed') {
        for (let i = 0; i < masterList.length; i++) {
            if (masterList[i].status.toLowerCase() === 'closed') {
                showingList.push(masterList[i]);
            }
        }
        page.status.textContent = 'Showing closed issues';
    }
    else {
        for (let i = 0; i < masterList.length; i++) {
            showingList.push(masterList[i]);
        }
        page.status.textContent = 'Showing all issues';
    }

    displayIssues(showingList);
}

function displayIssues(issuesToShow) {
    if (issuesToShow.length === 0) {
        page.grid.innerHTML = `
            <div style="text-align: center; padding: 3rem; grid-column: span 4;">
                <p style="color: gray; font-size: 1.2rem;">No issues found</p>
            </div>
        `;
        return;
    }
    let allCards = '';

    for (let i = 0; i < issuesToShow.length; i++) {
        let issue = issuesToShow[i];
        allCards = allCards + makeCard(issue);
    }
    page.grid.innerHTML = allCards;

    let cards = document.querySelectorAll('.issue-card');
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let id = card.dataset.id;

        card.onclick = function () {
            showDetails(id);
        };
    }
}

function makeCard(issue) {
    let issueDate = new Date(issue.createdAt);
    let dateString = issueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    let authorInitial = issue.author ? issue.author.charAt(0).toUpperCase() : '?';
    let labels = issue.labels || [];
    
    let isOpen = issue.status.toLowerCase() === 'open';
    
    let statusColor = isOpen ? '#00A96E' : '#A855F7';
    let statusBgClass = isOpen ? 'bg-[#00A96E]' : 'bg-[#A855F7]';
    let statusBgLightClass = isOpen ? 'bg-[#00A96E] bg-opacity-10' : 'bg-[#A855F7] bg-opacity-10';
    let statusTextClass = isOpen ? 'text-[#00A96E]' : 'text-[#A855F7]';

    let priorityBarColor = statusBgClass;

    let priorityClass = `${statusBgLightClass} ${statusTextClass}`;

    function getLabelClass(label) {
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

    let labelsHTML = '';
    if (labels.length > 0) {
        for (let i = 0; i < Math.min(labels.length, 2); i++) {
            let label = labels[i];
            labelsHTML += `
                <span class="${getLabelClass(label)} text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                    <i class="${getLabelIcon(label)} text-xs"></i> ${label}
                </span>
            `;
        }
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

    let avatarColor = isOpen ? 'bg-gradient-to-br from-[#A855F7] to-[#A855F7]' : 'bg-gradient-to-br from-[#00A96E] to-[#00A96E]';

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

async function showDetails(issueId) {
    toggleLoading(true);

    try {
        let response = await fetch(SERVER + '/issue/' + issueId);
        let data = await response.json();

        if (data.status === 'success') {
            let issue = data.data;

            page.popupTitle.textContent = issue.title;

            let created = new Date(issue.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit'
            }).replace(/\//g, '/');

            let isOpen = issue.status.toLowerCase() === 'open';

            let statusBgClass = isOpen ? 'bg-[#00A96E]' : 'bg-[#A855F7]';

            let priorityClass = '';
            if (issue.priority.toLowerCase() === 'high') {
                priorityClass = 'text-red-600 font-bold';
            } else if (issue.priority.toLowerCase() === 'medium') {
                priorityClass = 'text-yellow-600 font-bold';
            } else {
                priorityClass = 'text-green-600 font-bold';
            }

            let labelsHTML = '';
            if (issue.labels && issue.labels.length > 0) {
                for (let i = 0; i < issue.labels.length; i++) {
                    let label = issue.labels[i];
                    labelsHTML += `
                        <span class="text-purple-600 text-sm">${label}</span>
                        ${i < issue.labels.length - 1 ? '<span class="text-gray-300 mx-1">•</span>' : ''}
                    `;
                }
            }

            page.popupText.innerHTML = `
                <div class="space-y-6">
                    <!-- Opened by and date -->
                    <div class="text-sm text-gray-600">
                        <span class="font-medium">Opened by: ${issue.author}</span><br>
                        <span>${created}</span>
                    </div>

                    <!-- Description -->
                    <p class="text-gray-700">
                        ${issue.description || 'No description provided.'}
                    </p>

                    <!-- Assignee and Priority in same line -->
                    <div class="flex items-center gap-8">
                        <div>
                            <span class="font-medium text-gray-700">Assignee:</span>
                            <span class="ml-2 text-gray-600">${issue.assignee || issue.author}</span>
                        </div>
                        <div>
                            <span class="font-medium text-gray-700">Priority:</span>
                            <span class="ml-2 ${priorityClass}">${issue.priority}</span>
                        </div>
                    </div>

                    <!-- Labels as text with dots -->
                    ${labelsHTML ? `
                        <div class="flex items-center gap-1 text-sm">
                            ${labelsHTML}
                        </div>
                    ` : ''}

                    
                </div>
            `;

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

async function doSearch() {
    let searchWord = page.searchBox.value.trim();

    if (searchWord === '') {
        updateDisplay();
        return;
    }

    toggleLoading(true);

    try {
        let response = await fetch(SERVER + '/issues/search?q=' + encodeURIComponent(searchWord));
        let data = await response.json();

        if (data.status === 'success') {
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

for (let i = 0; i < page.tabButtons.length; i++) {
    let button = page.tabButtons[i];

    button.onclick = function () {
        for (let j = 0; j < page.tabButtons.length; j++) {
            page.tabButtons[j].classList.remove('active', 'border-blue-500', 'text-blue-600');
            page.tabButtons[j].classList.add('border-transparent', 'text-gray-500');
        }

        button.classList.add('active', 'border-blue-500', 'text-blue-600');
        button.classList.remove('border-transparent', 'text-gray-500');

        currentTab = button.dataset.filter;
        updateDisplay();
    };
}
page.searchBtn.onclick = doSearch;

page.searchBox.onkeypress = function (event) {
    if (event.key === 'Enter') {
        doSearch();
    }
};

page.logout.onclick = function () {
    localStorage.removeItem('isAuthenticated');
    alert('Logged out!');
    window.location.href = 'index.html';
};

page.closePopup.onclick = function () {
    page.popup.classList.add('hidden');
    page.popup.classList.remove('flex');
};

page.popup.onclick = function (event) {
    if (event.target === page.popup) {
        page.popup.classList.add('hidden');
        page.popup.classList.remove('flex');
    }
};

if (!localStorage.getItem('isAuthenticated')) {
    localStorage.setItem('isAuthenticated', 'true');
}