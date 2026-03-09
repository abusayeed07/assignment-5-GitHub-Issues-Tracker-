document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (username === 'admin' && password === 'admin123') {
                localStorage.setItem('isAuthenticated', 'true');
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid credentials! Use admin/admin123');
            }
        });