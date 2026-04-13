const searchForm = document.getElementById('searchForm');
const uidInput = document.getElementById('uidInput');
const searchBtn = document.getElementById('searchBtn');
const searchMessage = document.getElementById('searchMessage');
const resultCard = document.getElementById('resultCard');
const uidBadge = document.getElementById('uidBadge');
const detailsGrid = document.getElementById('detailsGrid');
const sportsList = document.getElementById('sportsList');
const saveStatusBtn = document.getElementById('saveStatusBtn');
const saveMessage = document.getElementById('saveMessage');

const statusInputs = {
    Undertaking: document.getElementById('undertaking'),
    CertificateIssued: document.getElementById('certificateIssued'),
    Attendance: document.getElementById('attendance'),
    PrizeMoneySent: document.getElementById('prizeMoneySent')
};

let activeUid = '';

const detailFields = [
    ['Name', 'Name'],
    ['EnrollmentNo', 'Enrollment No'],
    ['Affiliation', 'Affiliation'],
    ['Course', 'Course'],
    ['MobileNo', 'Mobile'],
    ['EmailID', 'Email'],
    ['TeamRole', 'Team Role'],
    ['CaptainUID', 'Captain UID'],
    ['TotalAmount', 'Total Amount'],
    ['TransactionID', 'Transaction ID'],
    ['CreatedAt', 'Created At']
];

const winnerFields = [
    ['WinnerFormRank', 'Winner Rank'],
    ['PrizeAmount', 'Prize Amount'],
    ['BankName', 'Bank Name'],
    ['AccountNumber', 'Account Number'],
    ['IFSCCode', 'IFSC Code'],
    ['RefereeVerified', 'Referee Verified']
];

function setMessage(el, text, type) {
    el.textContent = text || '';
    el.classList.remove('error', 'success');
    if (type) {
        el.classList.add(type);
    }
}

function normalizeBoolean(value) {
    return Number(value) === 1;
}

function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    return String(value);
}

function parseSports(value) {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.filter(Boolean).map((item) => String(item));
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter(Boolean).map((item) => String(item));
            }
        } catch (err) {
            const fallback = value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
            if (fallback.length) {
                return fallback;
            }
        }
    }

    return [];
}

function renderDetails(participant) {
    detailsGrid.innerHTML = '';

    detailFields.forEach(([key, label]) => {
        const card = document.createElement('article');
        card.className = 'detail-card';
        card.innerHTML = [
            '<p class="detail-label">' + label + '</p>',
            '<p class="detail-value">' + formatValue(participant[key]) + '</p>'
        ].join('');
        detailsGrid.appendChild(card);
    });
}

function renderSports(participant) {
    const sports = parseSports(participant.Sports);
    sportsList.innerHTML = '';

    if (!sports.length) {
        const empty = document.createElement('span');
        empty.className = 'sport-chip';
        empty.textContent = 'No sports found';
        sportsList.appendChild(empty);
        return;
    }

    sports.forEach((sport) => {
        const chip = document.createElement('span');
        chip.className = 'sport-chip';
        chip.textContent = sport;
        sportsList.appendChild(chip);
    });
}

function renderWinnerDetails(participant) {
    const winnerPanel = document.getElementById('winnerPanel');
    const isWinner = participant.WinnerFormRank && participant.WinnerFormRank !== '';
    
    if (!isWinner) {
        if (winnerPanel) {
            winnerPanel.hidden = true;
        }
        return;
    }
    
    if (!winnerPanel) {
        return;
    }
    
    winnerPanel.hidden = false;
    const winnerGrid = document.getElementById('winnerGrid');
    winnerGrid.innerHTML = '';

    winnerFields.forEach(([key, label]) => {
        const card = document.createElement('article');
        card.className = 'detail-card';
        card.innerHTML = [
            '<p class="detail-label">' + label + '</p>',
            '<p class="detail-value">' + formatValue(participant[key]) + '</p>'
        ].join('');
        winnerGrid.appendChild(card);
    });
}

function updateStatusVisuals() {
    Object.values(statusInputs).forEach((inputEl) => {
        const row = inputEl.closest('.status-item');
        if (!row) {
            return;
        }
        row.classList.toggle('done', inputEl.checked);
    });
}

function renderTracking(participant) {
    Object.keys(statusInputs).forEach((key) => {
        statusInputs[key].checked = normalizeBoolean(participant[key]);
    });
    updateStatusVisuals();
}

async function fetchParticipant(uid) {
    const response = await fetch('api.php?uid=' + encodeURIComponent(uid), {
        method: 'GET',
        headers: {
            Accept: 'application/json'
        }
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to fetch participant details.');
    }

    return data.participant;
}

async function saveStatuses() {
    if (!activeUid) {
        setMessage(saveMessage, 'Fetch a participant first.', 'error');
        return;
    }

    setMessage(saveMessage, 'Saving status...', 'success');
    saveStatusBtn.disabled = true;

    const payload = {
        UID: activeUid,
        Undertaking: statusInputs.Undertaking.checked ? 1 : 0,
        CertificateIssued: statusInputs.CertificateIssued.checked ? 1 : 0,
        Attendance: statusInputs.Attendance.checked ? 1 : 0,
        PrizeMoneySent: statusInputs.PrizeMoneySent.checked ? 1 : 0
    };

    try {
        const response = await fetch('api.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Status update failed.');
        }

        setMessage(saveMessage, 'Status updated successfully.', 'success');
    } catch (error) {
        setMessage(saveMessage, error.message, 'error');
    } finally {
        saveStatusBtn.disabled = false;
    }
}

searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const uid = uidInput.value.trim();
    if (!uid) {
        setMessage(searchMessage, 'Please enter UID or Enrollment Number.', 'error');
        return;
    }

    searchBtn.disabled = true;
    setMessage(searchMessage, 'Searching participant...', 'success');
    setMessage(saveMessage, '', '');

    try {
        const participant = await fetchParticipant(uid);
        activeUid = participant.UID || uid;
        uidBadge.textContent = 'UID: ' + activeUid;

        renderDetails(participant);
        renderSports(participant);
        renderTracking(participant);
        renderWinnerDetails(participant);

        resultCard.hidden = false;
        setMessage(searchMessage, 'Participant found.', 'success');
    } catch (error) {
        resultCard.hidden = true;
        activeUid = '';
        setMessage(searchMessage, error.message, 'error');
    } finally {
        searchBtn.disabled = false;
    }
});

Object.values(statusInputs).forEach((inputEl) => {
    inputEl.addEventListener('change', updateStatusVisuals);
});

saveStatusBtn.addEventListener('click', saveStatuses);
