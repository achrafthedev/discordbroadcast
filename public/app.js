document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const messageInput = document.getElementById('message');
    const charCount = document.getElementById('charCount');
    const filterSelect = document.getElementById('filter');
    const roleSelectionGroup = document.getElementById('roleSelectionGroup');
    const roleSelect = document.getElementById('roleId');
    const delayInput = document.getElementById('delay');
    const delayVal = document.getElementById('delayVal');
    const broadcastForm = document.getElementById('broadcastForm');
    const sendBtn = document.getElementById('sendBtn');
    
    // Status Elements
    const botAvatar = document.getElementById('botAvatar');
    const botName = document.getElementById('botName');
    const guildName = document.getElementById('guildName');
    const memberCount = document.getElementById('memberCount');
    const pingVal = document.getElementById('pingVal');
    const statusPulse = document.getElementById('statusPulse');
    const statusText = document.getElementById('statusText');
    
    // Monitor Elements
    const progressBar = document.getElementById('progressBar');
    const broadcastStatus = document.getElementById('broadcastStatus');
    const progressPercent = document.getElementById('progressPercent');
    const statSent = document.getElementById('statSent');
    const statFailed = document.getElementById('statFailed');
    const statTotal = document.getElementById('statTotal');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Log Console
    const logConsole = document.getElementById('logConsole');
    const clearLogsBtn = document.getElementById('clearLogsBtn');

    let isBroadcasting = false;

    // Character Counter
    messageInput.addEventListener('input', () => {
        const count = messageInput.value.length;
        charCount.textContent = count;
        if (count >= 1900) {
            charCount.style.color = 'var(--danger)';
        } else if (count >= 1500) {
            charCount.style.color = 'var(--warning)';
        } else {
            charCount.style.color = 'var(--text-muted)';
        }
    });

    // Delay Range Slider Display
    delayInput.addEventListener('input', () => {
        delayVal.textContent = delayInput.value;
    });

    // Filter Type Change Event
    filterSelect.addEventListener('change', () => {
        if (filterSelect.value === 'role') {
            roleSelectionGroup.classList.remove('hide');
            roleSelect.setAttribute('required', 'required');
            fetchRoles();
        } else {
            roleSelectionGroup.classList.add('hide');
            roleSelect.removeAttribute('required');
        }
    });

    // Clear Logs Console
    clearLogsBtn.addEventListener('click', () => {
        logConsole.innerHTML = '<div class="log-entry system-msg">Console logs cleared.</div>';
    });

    // Append logs to console
    function appendLog(type, text, timestamp = null) {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        
        const time = timestamp || new Date().toLocaleTimeString();
        
        entry.innerHTML = `
            <span class="log-timestamp">[${time}]</span>
            <span class="log-message">${escapeHtml(text)}</span>
        `;
        
        logConsole.appendChild(entry);
        logConsole.scrollTop = logConsole.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Fetch Guild Roles
    async function fetchRoles() {
        try {
            const res = await fetch('/api/roles');
            if (!res.ok) throw new Error('Failed to retrieve guild roles.');
            
            const roles = await res.json();
            
            // Clear prior roles except default placeholder
            roleSelect.innerHTML = '<option value="" disabled selected>Select a role...</option>';
            
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name;
                option.style.color = role.color;
                roleSelect.appendChild(option);
            });
        } catch (error) {
            appendLog('error', `Failed to load roles: ${error.message}`);
        }
    }

    // Fetch System Status
    async function fetchStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            
            if (data.status === 'online') {
                statusPulse.className = 'pulse-dot online';
                statusText.textContent = 'ONLINE';
                statusText.style.color = 'var(--success)';
                pingVal.textContent = `${data.ping} ms`;
                
                if (data.botAvatar) {
                    botAvatar.src = data.botAvatar;
                    botAvatar.classList.remove('hide');
                }
                botName.textContent = data.botName;
                guildName.textContent = data.guildName;
                memberCount.textContent = `${data.memberCount} Members`;
                
                // Release form validation lock
                if (!isBroadcasting) {
                    sendBtn.removeAttribute('disabled');
                }
            } else {
                setSystemOffline();
            }
        } catch (error) {
            setSystemOffline();
        }
    }

    function setSystemOffline() {
        statusPulse.className = 'pulse-dot offline';
        statusText.textContent = 'OFFLINE';
        statusText.style.color = 'var(--danger)';
        pingVal.textContent = '-- ms';
        botAvatar.classList.add('hide');
        botName.textContent = 'Bot Offline';
        guildName.textContent = 'Connection Disconnected';
        memberCount.textContent = '0 Members';
        sendBtn.setAttribute('disabled', 'disabled');
    }

    // Submit Broadcast Request
    broadcastForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isBroadcasting) return;

        const payload = {
            message: messageInput.value,
            filter: filterSelect.value,
            roleId: filterSelect.value === 'role' ? roleSelect.value : null,
            imageUrl: document.getElementById('imageUrl').value || null,
            delay: parseInt(delayInput.value, 10)
        };

        try {
            sendBtn.setAttribute('disabled', 'disabled');
            sendBtn.innerHTML = '<span>Initializing...</span>';
            
            const res = await fetch('/api/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server rejected broadcast initiation.');
            
            appendLog('info', 'Broadcast request accepted. Running sequence...');
            
            // Clear message input field upon trigger
            messageInput.value = '';
            charCount.textContent = '0';
            document.getElementById('imageUrl').value = '';
        } catch (error) {
            appendLog('error', `Failed to send broadcast: ${error.message}`);
            sendBtn.removeAttribute('disabled');
            sendBtn.innerHTML = `
                <span>Send Broadcast</span>
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            `;
        }
    });

    // Cancel Broadcast
    cancelBtn.addEventListener('click', async () => {
        try {
            cancelBtn.setAttribute('disabled', 'disabled');
            cancelBtn.innerHTML = '<span>Cancelling...</span>';
            
            const res = await fetch('/api/broadcast/cancel', { method: 'POST' });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Cancellation request rejected.');
            appendLog('info', 'Cancellation request sent successfully.');
        } catch (error) {
            appendLog('error', `Failed to cancel broadcast: ${error.message}`);
            cancelBtn.removeAttribute('disabled');
            cancelBtn.innerHTML = `
                <span>Cancel Broadcast</span>
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
            `;
        }
    });

    // Establish Server-Sent Events (SSE) stream for live feedback
    function initProgressStream() {
        const source = new EventSource('/api/progress');

        source.addEventListener('status', (event) => {
            const data = JSON.parse(event.data);
            updateMonitorUI(data);
        });

        source.addEventListener('log', (event) => {
            const log = JSON.parse(event.data);
            appendLog(log.type, log.text, log.timestamp);
        });

        source.onerror = (err) => {
            console.error('SSE Connection failed. Re-establishing connection...', err);
        };
    }

    function updateMonitorUI(data) {
        const { status, sentCount, failedCount, totalCount } = data;

        // Render counters
        statSent.textContent = sentCount;
        statFailed.textContent = failedCount;
        statTotal.textContent = totalCount;

        // Render percentage & bar
        const processed = sentCount + failedCount;
        const percent = totalCount > 0 ? Math.round((processed / totalCount) * 100) : 0;
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;

        // Render Status Tag & Form Locks
        broadcastStatus.textContent = status.toUpperCase();
        broadcastStatus.className = `broadcast-state status-${status}`;

        if (status === 'broadcasting') {
            isBroadcasting = true;
            statusPulse.className = 'pulse-dot broadcasting';
            sendBtn.setAttribute('disabled', 'disabled');
            sendBtn.innerHTML = '<span>Broadcasting Active</span>';
            cancelBtn.classList.remove('hide');
            cancelBtn.removeAttribute('disabled');
            cancelBtn.innerHTML = `
                <span>Cancel Broadcast</span>
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
            `;
        } else {
            isBroadcasting = false;
            statusPulse.className = 'pulse-dot online';
            sendBtn.removeAttribute('disabled');
            sendBtn.innerHTML = `
                <span>Send Broadcast</span>
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            `;
            cancelBtn.classList.add('hide');
        }
    }

    // Initialize Page
    fetchStatus();
    initProgressStream();
    
    // Status update loop
    setInterval(fetchStatus, 5000);
});
