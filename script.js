document.addEventListener('DOMContentLoaded', () => {
    const authScreen = document.getElementById('authScreen');
    const authForm = document.getElementById('authForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const messageEl = document.getElementById('message');
    
    const appContainer = document.getElementById('appContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    const welcomeMessage = document.getElementById('welcomeMessage');

    const form = document.getElementById('pressioneForm');
    const tableBody = document.querySelector('#pressioneTable tbody');
    const ctx = document.getElementById('pressioneChart').getContext('2d');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const submitBtn = form.querySelector('button[type="submit"]');
    const updateBtn = document.getElementById('updateBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    let pressioneChart;
    let misurazioni = [];
    let editingIndex = -1;
    let currentUser = null;

    // Funzioni di autenticazione
    function registerUser(username, password) {
        let users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username]) {
            messageEl.textContent = 'Nome utente già esistente.';
            return false;
        }
        users[username] = password;
        localStorage.setItem('users', JSON.stringify(users));
        messageEl.textContent = 'Registrazione completata! Ora puoi accedere.';
        messageEl.style.color = 'green';
        return true;
    }

    function loginUser(username, password) {
        let users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username] && users[username] === password) {
            currentUser = username;
            localStorage.setItem('currentUser', currentUser);
            return true;
        }
        messageEl.textContent = 'Nome utente o password errati.';
        return false;
    }

    function logoutUser() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        appContainer.style.display = 'none';
        authScreen.style.display = 'block';
        usernameInput.value = '';
        passwordInput.value = '';
        messageEl.textContent = '';
        misurazioni = [];
        tableBody.innerHTML = '';
        updateChart([]);
    }

    function checkLoginStatus() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = storedUser;
            showApp();
        } else {
            authScreen.style.display = 'block';
            appContainer.style.display = 'none';
        }
    }

    function showApp() {
        welcomeMessage.textContent = `Benvenuto, ${currentUser}!`;
        authScreen.style.display = 'none';
        appContainer.style.display = 'block';
        loadMisurazioni();
    }

    // Gestione eventi di autenticazione
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        if (loginUser(username, password)) {
            showApp();
        }
    });

    registerBtn.addEventListener('click', () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        if (username && password) {
            registerUser(username, password);
        } else {
            messageEl.textContent = 'Inserisci nome utente e password.';
        }
    });

    logoutBtn.addEventListener('click', logoutUser);

    // Funzioni per mostrare la password
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
    });

    // Funzioni per il diario
    function loadMisurazioni() {
        const allMisurazioni = JSON.parse(localStorage.getItem('misurazioni')) || [];
        misurazioni = allMisurazioni.filter(m => m.username === currentUser);
        tableBody.innerHTML = '';
        misurazioni.forEach((misurazione, index) => {
            addMisurazioneToTable(misurazione, index);
        });
        updateChart(misurazioni);
    }

    function addMisurazioneToTable(misurazione, index) {
        const newRow = tableBody.insertRow();
        
        let statusClass = '';
        const sistolica = parseInt(misurazione.sistolica);
        const diastolica = parseInt(misurazione.diastolica);

        if (sistolica < 120 && diastolica < 80) {
            statusClass = 'status-green';
        } else if ((sistolica >= 120 && sistolica < 140) || (diastolica >= 80 && diastolica < 90)) {
            statusClass = 'status-yellow';
        } else if (sistolica >= 140 || diastolica >= 90) {
            statusClass = 'status-red';
        } else {
            statusClass = '';
        }

        newRow.innerHTML = `
            <td>${misurazione.data}</td>
            <td>${misurazione.ora}</td>
            <td>${misurazione.sistolica}</td>
            <td>${misurazione.diastolica}</td>
            <td>${misurazione.battito}</td>
            <td>${misurazione.note}</td>
            <td><div class="status-circle ${statusClass}"></div></td>
            <td class="action-buttons">
                <button class="edit-btn" data-index="${index}">Modifica</button>
                <button class="delete-btn" data-index="${index}">Elimina</button>
            </td>
        `;

        const editButton = newRow.querySelector('.edit-btn');
        const deleteButton = newRow.querySelector('.delete-btn');

        editButton.addEventListener('click', () => {
            editMisurazione(index);
        });

        deleteButton.addEventListener('click', () => {
            deleteMisurazione(index);
        });
    }

    function deleteMisurazione(index) {
        if (confirm('Sei sicuro di voler eliminare questa misurazione?')) {
            const allMisurazioni = JSON.parse(localStorage.getItem('misurazioni')) || [];
            const misurazioniUtente = allMisurazioni.filter(m => m.username === currentUser);
            
            const misurazioneDaEliminare = misurazioniUtente[index];
            const indiceReale = allMisurazioni.findIndex(m => 
                m.username === misurazioneDaEliminare.username && 
                m.data === misurazioneDaEliminare.data && 
                m.ora === misurazioneDaEliminare.ora
            );

            if (indiceReale !== -1) {
                allMisurazioni.splice(indiceReale, 1);
                localStorage.setItem('misurazioni', JSON.stringify(allMisurazioni));
                loadMisurazioni();
            }
        }
    }

    function editMisurazione(index) {
        editingIndex = index;
        const misurazione = misurazioni[index];
        
        document.getElementById('data').value = misurazione.data;
        document.getElementById('ora').value = misurazione.ora;
        document.getElementById('sistolica').value = misurazione.sistolica;
        document.getElementById('diastolica').value = misurazione.diastolica;
        document.getElementById('battito').value = misurazione.battito;
        document.getElementById('note').value = misurazione.note;

        submitBtn.style.display = 'none';
        document.getElementById('actionButtons').style.display = 'block';
    }

    cancelBtn.addEventListener('click', () => {
        editingIndex = -1;
        form.reset();
        submitBtn.style.display = 'block';
        document.getElementById('actionButtons').style.display = 'none';
    });

    updateBtn.addEventListener('click', () => {
        if (editingIndex !== -1) {
            const updatedMisurazione = {
                username: currentUser,
                data: document.getElementById('data').value,
                ora: document.getElementById('ora').value,
                sistolica: document.getElementById('sistolica').value,
                diastolica: document.getElementById('diastolica').value,
                battito: document.getElementById('battito').value,
                note: document.getElementById('note').value
            };

            const allMisurazioni = JSON.parse(localStorage.getItem('misurazioni')) || [];
            const misurazioneOriginale = misurazioni[editingIndex];

            const indiceReale = allMisurazioni.findIndex(m => 
                m.username === misurazioneOriginale.username && 
                m.data === misurazioneOriginale.data && 
                m.ora === misurazioneOriginale.ora
            );
            
            if (indiceReale !== -1) {
                allMisurazioni[indiceReale] = updatedMisurazione;
                localStorage.setItem('misurazioni', JSON.stringify(allMisurazioni));
                loadMisurazioni();
                cancelBtn.click();
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const misurazione = {
            username: currentUser,
            data: document.getElementById('data').value,
            ora: document.getElementById('ora').value,
            sistolica: document.getElementById('sistolica').value,
            diastolica: document.getElementById('diastolica').value,
            battito: document.getElementById('battito').value,
            note: document.getElementById('note').value
        };

        const allMisurazioni = JSON.parse(localStorage.getItem('misurazioni')) || [];
        allMisurazioni.push(misurazione);
        localStorage.setItem('misurazioni', JSON.stringify(allMisurazioni));

        loadMisurazioni();
        form.reset();
    });

    function updateChart(misurazioni) {
        const labels = misurazioni.map(m => `${m.data} ${m.ora}`);
        const sistolicaData = misurazioni.map(m => m.sistolica);
        const diastolicaData = misurazioni.map(m => m.diastolica);

        if (pressioneChart) {
            pressioneChart.destroy();
        }

        pressioneChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pressione Sistolica',
                        data: sistolicaData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.1
                    },
                    {
                        label: 'Pressione Diastolica',
                        data: diastolicaData,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Pressione (mmHg)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Data e Ora'
                        }
                    }
                }
            }
        });
    }

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const misurazioni = JSON.parse(localStorage.getItem('misurazioni')) || [];
        const misurazioniUtente = misurazioni.filter(m => m.username === currentUser) || [];

        const headers = [['Data', 'Ora', 'Sistolica', 'Diastolica', 'Battito', 'Note']];
        
        const data = misurazioniUtente.map(mis => [
            mis.data,
            mis.ora,
            mis.sistolica,
            mis.diastolica,
            mis.battito,
            mis.note
        ]);

        doc.text(`Diario della Pressione di ${currentUser}`, 14, 20);

        doc.autoTable({
            startY: 30,
            head: headers,
            body: data
        });

        const canvas = document.getElementById('pressioneChart');
        
        html2canvas(canvas, { scale: 2 }).then(highResCanvas => {
            const imgData = highResCanvas.toDataURL('image/png');
            const imgWidth = 180;
            const imgHeight = highResCanvas.height * imgWidth / highResCanvas.width;
            
            const finalY = doc.autoTable.previous.finalY;
            if (finalY + imgHeight + 20 > doc.internal.pageSize.height) {
                doc.addPage();
            }

            doc.text("Andamento della Pressione", 14, finalY + 20 || 30);
            doc.addImage(imgData, 'PNG', 14, finalY + 30 || 40, imgWidth, imgHeight);

            doc.save(`diario_pressione_${currentUser}.pdf`);
        });
    });

    exportJsonBtn.addEventListener('click', () => {
        const misurazioniUtente = misurazioni.filter(m => m.username === currentUser);
        const dataStr = JSON.stringify(misurazioniUtente, null, 2);
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `diario_pressione_${currentUser}.json`; 
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    checkLoginStatus();
});
