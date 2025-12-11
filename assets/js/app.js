// app.js - handles dummy data and UI interactions
$(function(){
  // basic session (store username/role locally)
  function updateNavUser(){
    const name = localStorage.getItem('fclms_user') || 'Guest';
    const role = localStorage.getItem('fclms_role') || '';
    $('#navUser').text(name + (role?(' ('+role+')'):'') );
  }

  // role-based access control for demo: Legal role may only access Approval Workflow
  function enforceRoleAccess(){
    const role = localStorage.getItem('fclms_role') || '';
    if(role === 'Legal'){
      // hide all navbar items except Approval Workflow
      $('.navbar-nav .nav-item').each(function(){
        const text = $(this).text().trim();
        if(text.indexOf('Approval Workflow') === -1){
          $(this).hide();
        }
      });

      // If user is on any page other than approval_workflow (or index/login), redirect them
      const page = window.location.pathname.split('/').pop();
      const allow = ['approval_workflow.html', '', 'index.html'];
      if(page && allow.indexOf(page) === -1){
        window.location.href = 'approval_workflow.html';
      }
    }

    // Demo: User role may only access Contract Management (to create requests) and User Profile
    if(role === 'User'){
      $('.navbar-nav .nav-item').each(function(){
        const text = $(this).text().trim();
        if(text.indexOf('Contract Management') === -1 && text.indexOf('User Profile') === -1){
          $(this).hide();
        }
      });
      const page = window.location.pathname.split('/').pop();
      const allow = ['contract_management.html', 'user_profile.html', '', 'index.html'];
      if(page && allow.indexOf(page) === -1){
        window.location.href = 'contract_management.html';
      }
    }

    // Operations role: only access Compliance & Audit, Renewal Alerts and Operations page
    if(role === 'Operations'){
      $('.navbar-nav .nav-item').each(function(){
        const text = $(this).text().trim();
        if(text.indexOf('Compliance') === -1 && text.indexOf('Renewal') === -1 && text.indexOf('Operations') === -1){
          $(this).hide();
        }
      });
      const page = window.location.pathname.split('/').pop();
      const allow = ['compliance_audit.html','renewal_alerts.html','operations.html','', 'index.html'];
      if(page && allow.indexOf(page) === -1){
        window.location.href = 'operations.html';
      }
    }
    // Create Contract button should be available only to Users (they create requests)
    if(role === 'User'){
      $('#createContractBtn').show();
      // show user request section when on contract page
      if(window.location.pathname.split('/').pop() === 'contract_management.html'){
        $('#userRequestSection').show();
      }
    } else {
      $('#createContractBtn').hide();
      // hide user request form for non-users
      $('#userRequestSection').hide();
    }
  }

  updateNavUser();
  enforceRoleAccess();

  // Demo users (username/password/role) - only these credentials work for login
  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'Admin', fullname: 'Administrator' },
    { username: 'legal', password: 'legal123', role: 'Legal', fullname: 'Legal Team' },
    { username: 'ops', password: 'ops123', role: 'Operations', fullname: 'Operations User' },
    { username: 'user', password: 'user123', role: 'User', fullname: 'Standard User' }
  ];

  // Local storage keys
  const STORAGE_DRAFTS = 'fclms_drafts_v1';
  const STORAGE_CONTRACTS = 'fclms_contracts_v1';

  // Login form - validate against demoUsers
  $('#loginForm').on('submit', function(e){
    e.preventDefault();
    const username = $('#username').val().trim();
    const password = $('#password').val();
    const role = $('#role').val();
    if(!username || !password || !role){
      alert('Please enter username, password and select role.');
      return;
    }
    const matched = demoUsers.find(u => u.username === username && u.password === password && u.role === role);
    if(!matched){
      showToast('Invalid credentials. Use one of the demo accounts.', 'danger');
      return;
    }
    // store minimal session info
    localStorage.setItem('fclms_user', matched.username);
    localStorage.setItem('fclms_name', matched.fullname);
    localStorage.setItem('fclms_role', matched.role);
    updateNavUser();
    enforceRoleAccess();
    // Redirect based on role
    if(matched.role === 'Legal'){
      window.location.href = 'approval_workflow.html';
    } else if(matched.role === 'User'){
      window.location.href = 'contract_management.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  });

  // Persist all contracts (including drafts and requests) to localStorage
  function loadContractsFromStorage(){
    try{
      const raw = localStorage.getItem(STORAGE_CONTRACTS);
      if(!raw) return;
      const saved = JSON.parse(raw);
      if(Array.isArray(saved)){
        // replace entire contracts array with stored version
        contracts.length = 0;
        saved.forEach(c => contracts.push(c));
      }
    }catch(e){ console.error('loadContractsFromStorage', e); }
  }
  function saveContractsToStorage(){
    try{
      localStorage.setItem(STORAGE_CONTRACTS, JSON.stringify(contracts));
    }catch(e){ console.error('saveContractsToStorage', e); }
  }

  // initialize contracts from storage (if present)
  loadContractsFromStorage();

  // Dark mode support: toggle and persistence
  function applyDarkMode(enabled){
    if(enabled){
      $('body').addClass('dark-mode');
      // update toggle icon if present
      $('#darkModeToggle').text('☀️');
      $('#darkModeToggleFixed').text('☀️');
    } else {
      $('body').removeClass('dark-mode');
      $('#darkModeToggle').text('🌙');
      $('#darkModeToggleFixed').text('🌙');
    }
  }

  // initialize from localStorage
  const darkPref = localStorage.getItem('fclms_dark') === '1';
  applyDarkMode(darkPref);

  // global delegate click (button may be in navbar or fixed)
  $(document).on('click', '#darkModeToggle, #darkModeToggleFixed', function(){
    const currently = $('body').hasClass('dark-mode');
    const next = !currently;
    localStorage.setItem('fclms_dark', next ? '1' : '0');
    applyDarkMode(next);
  });

  // Toast helper: uses Bootstrap Toasts in bottom-right
  function ensureToastContainer(){
    if($('#fclmsToastContainer').length) return;
    const container = $('<div id="fclmsToastContainer" class="toast-container br"></div>');
    $('body').append(container);
  }

  function showToast(message, type){
    // type: success, info, warning, danger
    ensureToastContainer();
    const toastId = 'toast-' + Date.now();
    const bgClass = (type === 'success') ? 'bg-success text-white' : (type === 'warning') ? 'bg-warning text-dark' : (type === 'danger') ? 'bg-danger text-white' : 'bg-primary text-white';
    const toast = $(
      `<div id="${toastId}" class="toast align-items-center ${bgClass}" role="alert" aria-live="assertive" aria-atomic="true">
         <div class="d-flex">
           <div class="toast-body">${message}</div>
           <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
         </div>
       </div>`
    );
    $('#fclmsToastContainer').append(toast);
    const bsToast = new bootstrap.Toast(toast[0], { delay: 4000 });
    bsToast.show();
    // remove from DOM after hidden
    toast.on('hidden.bs.toast', function(){ $(this).remove(); });
  }

  // Profile page load
  if($('#profileForm').length){
    $('#p_name').val(localStorage.getItem('fclms_user') || 'Demo User');
    $('#p_email').val(localStorage.getItem('fclms_email') || 'user@example.com');
    $('#p_role').val(localStorage.getItem('fclms_role') || 'Operations');
    updateNavUser();
  }

  $('#profileForm').on('submit', function(e){
    e.preventDefault();
    localStorage.setItem('fclms_user', $('#p_name').val());
    localStorage.setItem('fclms_email', $('#p_email').val());
    updateNavUser();
    enforceRoleAccess();
    showToast('Profile updated', 'success');
  });

  $('#resetProfile').on('click', function(){
    $('#p_name').val(localStorage.getItem('fclms_user') || '');
    $('#p_email').val(localStorage.getItem('fclms_email') || '');
  });

  // Dummy data for contracts
  const contracts = [
    {number:'CNT-1001', client:'Acme Logistics', start:'2024-01-01', end:'2025-01-01', status:'Active', version:'1.0', notes:'Standard terms.'},
    {number:'CNT-1002', client:'Global Freight', start:'2023-09-15', end:'2024-09-14', status:'Expired', version:'2.1', notes:'Renewal needed.'},
    {number:'CNT-1003', client:'TransShip', start:'2024-06-01', end:'2026-06-01', status:'Pending', version:'1.0', notes:'Awaiting signatures.'},
    {number:'CNT-1004', client:'BlueSea', start:'2025-02-01', end:'2026-02-01', status:'Active', version:'1.2', notes:'Includes addendum.'}
  ];

  // Approvals dummy
  const approvals = [
    {number:'CNT-1003', client:'TransShip', submittedBy:'jdoe', submittedOn:'2025-11-20'},
    {number:'CNT-1005', client:'FastMove', submittedBy:'asmith', submittedOn:'2025-11-25'}
  ];

  // Compliance logs
  const compliance = [
    {date:'2025-11-01', user:'admin', action:'Created contract CNT-1001', details:'Initial create'},
    {date:'2025-11-10', user:'legal', action:'Reviewed CNT-1002', details:'Reviewed terms'}
  ];

  // Renewals
  const renewals = [
    {number:'CNT-1002', client:'Global Freight', alertDate:'2025-01-01', status:'Overdue'},
    {number:'CNT-1004', client:'BlueSea', alertDate:'2025-12-20', status:'Upcoming'}
  ];

  // Render contracts table
  function renderContracts(filter){
    const tbody = $('#contractsTable tbody');
    tbody.empty();
    contracts.forEach((c, idx)=>{
      if(filter){
        const f = filter.toLowerCase();
        if(!(c.number.toLowerCase().includes(f) || c.client.toLowerCase().includes(f))) return;
      }
      const tr = $('<tr>');
      tr.append($('<td>').html(`<strong>${c.number}</strong>`));
      tr.append($('<td>').text(c.client));
      tr.append($('<td>').text(c.start));
      tr.append($('<td>').text(c.end));
      // status badge
      const statusBadge = $(`<td><span class='badge badge-status-${c.status.replace(/\s+/g,'') }'>${c.status}</span></td>`);
      tr.append(statusBadge);
      tr.append($('<td>').text(c.requestedBy || ''));
      tr.append($('<td>').text(c.version || '')); 
      const actions = $(`<td class='action-btns'></td>`);
      actions.append(`<button class='btn btn-sm btn-outline-primary me-1 viewBtn' data-idx='${idx}'>View</button>`);
      actions.append(`<button class='btn btn-sm btn-outline-secondary me-1 editBtn' data-idx='${idx}'>Edit</button>`);
      // if this is a Requested item and current user is Admin, offer Publish
      const role = localStorage.getItem('fclms_role') || '';
      if(c.status === 'Requested' && role === 'Admin'){
        actions.append(`<button class='btn btn-sm btn-success me-1 publishBtn' data-idx='${idx}'>Publish</button>`);
      }
      actions.append(`<button class='btn btn-sm btn-outline-danger deleteBtn' data-idx='${idx}'>Delete</button>`);
      tr.append(actions);
      tbody.append(tr);
    });
  }
  if($('#contractsTable').length){
    renderContracts();
    $('#contractSearch').on('input', function(){ renderContracts($(this).val()); });

    // Create
    $('#createContractBtn').on('click', function(){
      // For Users, the button scrolls to the in-page request form.
      const role = localStorage.getItem('fclms_role') || '';
      if(role === 'User'){
        $('#userRequestSection').show();
        $('html, body').animate({ scrollTop: $('#userRequestSection').offset().top - 60 }, 300);
        return;
      }
      // For non-users (shouldn't see the button), fallback to open modal if present
      $('#contractModalLabel').text('Create Contract');
      $('#contractForm')[0].reset();
      $('#contractIndex').val('');
      var modal = new bootstrap.Modal(document.getElementById('contractModal'));
      modal.show();
    });

    // Save contract
      $('#contractForm').on('submit', function(e){
      e.preventDefault();
      const idx = $('#contractIndex').val();
      const obj = {
        number: $('#c_number').val(),
        client: $('#c_client').val(),
        start: $('#c_start').val(),
        end: $('#c_end').val(),
        status: $('#c_status').val(),
        version: $('#c_version').val(),
        notes: $('#c_notes').val()
      };
      if(idx){
        contracts[parseInt(idx)] = obj;
      } else {
        contracts.push(obj);
      }
      renderContracts($('#contractSearch').val());
      saveContractsToStorage();
      bootstrap.Modal.getInstance(document.getElementById('contractModal')).hide();
    });

    // Edit
    $(document).on('click', '.editBtn', function(){
      const idx = $(this).data('idx');
      const c = contracts[idx];
      $('#contractModalLabel').text('Edit Contract');
      $('#contractIndex').val(idx);
      $('#c_number').val(c.number);
      $('#c_client').val(c.client);
      $('#c_start').val(c.start);
      $('#c_end').val(c.end);
      $('#c_status').val(c.status);
      $('#c_version').val(c.version);
      $('#c_notes').val(c.notes);
      var modal = new bootstrap.Modal(document.getElementById('contractModal'));
      modal.show();
    });

    // View
    $(document).on('click', '.viewBtn', function(){
      const idx = $(this).data('idx');
      const c = contracts[idx];
      const html = `
        <dl class='row'>
          <dt class='col-sm-4'>Contract Number</dt><dd class='col-sm-8'>${c.number}</dd>
          <dt class='col-sm-4'>Client</dt><dd class='col-sm-8'>${c.client}</dd>
          <dt class='col-sm-4'>Start</dt><dd class='col-sm-8'>${c.start}</dd>
          <dt class='col-sm-4'>End</dt><dd class='col-sm-8'>${c.end}</dd>
          <dt class='col-sm-4'>Status</dt><dd class='col-sm-8'>${c.status}</dd>
          <dt class='col-sm-4'>Requested By</dt><dd class='col-sm-8'>${c.requestedBy || ''}</dd>
          <dt class='col-sm-4'>Version</dt><dd class='col-sm-8'>${c.version}</dd>
          <dt class='col-sm-4'>Notes</dt><dd class='col-sm-8'>${c.notes}</dd>
        </dl>`;
      $('#viewBody').html(html);
      var modal = new bootstrap.Modal(document.getElementById('viewModal'));
      modal.show();
    });

    // Publish requested contract (Admin action)
    $(document).on('click', '.publishBtn', function(){
      const idx = $(this).data('idx');
      const c = contracts[idx];
      if(!c) return;
      if(!confirm('Publish this requested contract?')) return;
      c.status = 'Active';
      // bump version if empty
      if(!c.version) c.version = '1.0';
      saveContractsToStorage();
      renderContracts($('#contractSearch').val());
      showToast('Contract published', 'success');
    });

    // Delete
    $(document).on('click', '.deleteBtn', function(){
      const idx = $(this).data('idx');
      if(confirm('Delete this contract?')){
        contracts.splice(idx,1);
        renderContracts($('#contractSearch').val());
        saveContractsToStorage();
        showToast('Contract deleted', 'success');
      }
    });
  }

  // User request form handling (only shown when role User)
  if($('#requestForm').length){
    const role = localStorage.getItem('fclms_role') || '';
    if(role === 'User'){
      $('#userRequestSection').show();
      $('#r_userid').val(localStorage.getItem('fclms_user') || '');
      // hide the standard contracts table for users
      $('#contractsTable').closest('.card').hide();
      $('#createContractBtn').hide();
    } else {
      $('#userRequestSection').hide();
    }

    $('#requestForm').on('submit', function(e){
      e.preventDefault();
      const userid = $('#r_userid').val();
      const start = $('#r_start').val();
      const end = $('#r_end').val();
      const desc = $('#r_description').val();
      if(!start || !end || !desc){
        showToast('Please fill all fields', 'warning');
        return;
      }
      const req = {
        number: 'REQ-' + Date.now(),
        client: '',
        start: start,
        end: end,
        status: 'Requested',
        version: '',
        notes: desc,
        requestedBy: userid
      };
      contracts.push(req);
      showToast('Contract request submitted', 'success');
      // clear form
      $('#requestForm')[0].reset();
      $('#r_userid').val(userid);
      // Admin will see it in contracts list (if currently on page as admin)
    });
  }

  // Operations page: draft handling and formatting toolbar
  if($('#draftForm').length){
    // show toolbar formatting using execCommand
    $(document).on('click', '.format', function(){
      const cmd = $(this).data('cmd');
      if(cmd === 'createLink'){
        // open modal to ask for url/text
        var modal = new bootstrap.Modal(document.getElementById('linkModal'));
        modal.show();
        return;
      }
      document.execCommand(cmd, false, null);
      $('#draftBody').focus();
    });

    // insert link from modal
    $('#insertLinkConfirm').on('click', function(){
      const url = $('#linkUrl').val().trim();
      const text = $('#linkText').val().trim();
      if(!url) { showToast('Please enter a URL', 'warning'); return; }
      // if text provided, insert text then link, otherwise wrap selection
      if(text){
        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${text}</a>`);
      } else {
        document.execCommand('createLink', false, url);
      }
      bootstrap.Modal.getInstance(document.getElementById('linkModal')).hide();
      $('#linkUrl').val(''); $('#linkText').val('');
    });

    // populate user id/name
    $('#d_number').val('');
    $('#d_client').val('');
    $('#d_title').val('');
    $('#draftBody').html('<p>Enter contract draft here...</p>');

    function renderDraftsList(){
      const list = $('#draftsList').empty();
      const user = localStorage.getItem('fclms_user') || '';
      contracts.filter(c => c.status === 'Draft' && (c.requestedBy === user || user === 'admin')).forEach((d, idx)=>{
        const item = $(`<button class='list-group-item list-group-item-action d-flex justify-content-between align-items-start' data-idx='${idx}'>
          <div>
            <div class='fw-bold'>${d.number}</div>
            <div class='small text-muted'>${d.client} — ${d.title || ''}</div>
          </div>
          <div><span class='badge badge-status-Draft'>Draft</span></div>
        </button>`);
        item.on('click', function(){
          const i = $(this).data('idx');
          const draft = contracts.filter(c=>c.status==='Draft')[i];
          if(draft){
            $('#d_number').val(draft.number);
            $('#d_client').val(draft.client);
            $('#d_start').val(draft.start);
            $('#d_end').val(draft.end);
            $('#d_version').val(draft.version);
            $('#d_title').val(draft.title || '');
            $('#draftBody').html(draft.body || draft.notes || '');
            showToast('Draft loaded', 'info');
          }
        });
        list.append(item);
      });
    }

    renderDraftsList();

    $('#saveDraft').on('click', function(e){
      e.preventDefault();
      const number = $('#d_number').val() || ('DRAFT-' + Date.now());
      const client = $('#d_client').val();
      const start = $('#d_start').val();
      const end = $('#d_end').val();
      const version = $('#d_version').val();
      const title = $('#d_title').val();
      const body = $('#draftBody').html();
      if(!client || !title){ showToast('Client and Title are required', 'warning'); return; }
      const draft = { number, client, start, end, status: 'Draft', version, notes: title, body: body, requestedBy: localStorage.getItem('fclms_user') || '' };
      // replace existing draft with same number
      const existingIndex = contracts.findIndex(c => c.number === number && c.status === 'Draft');
        if(existingIndex >= 0){ contracts[existingIndex] = draft; } else { contracts.push(draft); }
        // persist full contracts list
        saveContractsToStorage();
      // add compliance log entry
      compliance.push({ date: new Date().toISOString().slice(0,10), user: localStorage.getItem('fclms_user') || '', action: 'Saved draft ' + number, details: title });
      renderDraftsList();
      renderContracts($('#contractSearch').val());
      showToast('Draft saved', 'success');
    });

    // Send to Admin - set status to Requested so admin can view in Contract Management
    $('#sendToAdmin').on('click', function(e){
      e.preventDefault();
      var modal = new bootstrap.Modal(document.getElementById('confirmSendModal'));
      modal.show();
    });

    $('#confirmSendBtn').on('click', function(){
      const number = $('#d_number').val() || ('DRAFT-' + Date.now());
      const client = $('#d_client').val();
      const title = $('#d_title').val();
      const body = $('#draftBody').html();
      if(!client || !title){ showToast('Client and Title are required', 'warning'); return; }
      const req = { number, client, start: $('#d_start').val(), end: $('#d_end').val(), status: 'Requested', version: $('#d_version').val(), notes: title, body: body, requestedBy: localStorage.getItem('fclms_user') || '' };
      // remove any existing draft with same number
      for(let i = contracts.length -1; i>=0; i--){ if(contracts[i].number === number && contracts[i].status === 'Draft') contracts.splice(i,1); }
      contracts.push(req);
      // persist full contracts list
      saveContractsToStorage();
      renderDraftsList();
      renderContracts($('#contractSearch').val());
      compliance.push({ date: new Date().toISOString().slice(0,10), user: localStorage.getItem('fclms_user') || '', action: 'Sent draft ' + number + ' to admin', details: title });
      showToast('Draft sent to Admin', 'success');
      bootstrap.Modal.getInstance(document.getElementById('confirmSendModal')).hide();
    });

    // Export Draft as HTML file
    $('#exportDraft').on('click', function(e){
      e.preventDefault();
      const number = $('#d_number').val() || ('DRAFT-' + Date.now());
      const title = $('#d_title').val() || number;
      const body = $('#draftBody').html();
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${body}</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = number + '.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      showToast('Draft exported', 'info');
    });
  }

  // Approvals
  if($('#approvalsTable').length){
    function renderApprovals(){
      const tbody = $('#approvalsTable tbody').empty();
      approvals.forEach((a, idx)=>{
        const tr = $('<tr>');
        tr.append($('<td>').text(a.number));
        tr.append($('<td>').text(a.client));
        tr.append($('<td>').text(a.submittedBy));
        tr.append($('<td>').text(a.submittedOn));
        const actions = $('<td>');
        actions.append(`<button class='btn btn-sm btn-success me-1 approveBtn' data-idx='${idx}'>Approve</button>`);
        actions.append(`<button class='btn btn-sm btn-outline-danger rejectBtn' data-idx='${idx}'>Reject</button>`);
        tr.append(actions);
        tbody.append(tr);
      });
    }
    renderApprovals();

    $(document).on('click', '.approveBtn', function(){
      const idx = $(this).data('idx');
      const item = approvals.splice(idx,1)[0];
      showToast('Approved ' + item.number, 'success');
      // mark matching contract as Active if exists
      const cidx = contracts.findIndex(c => c.number === item.number);
      if(cidx >= 0){ contracts[cidx].status = 'Active'; saveContractsToStorage(); }
      renderApprovals();
    });
    $(document).on('click', '.rejectBtn', function(){
      const idx = $(this).data('idx');
      const item = approvals.splice(idx,1)[0];
      showToast('Rejected ' + item.number, 'danger');
      // mark matching contract as Rejected (or keep as Pending) — set to Expired for demo
      const cidx = contracts.findIndex(c => c.number === item.number);
      if(cidx >= 0){ contracts[cidx].status = 'Expired'; saveContractsToStorage(); }
      renderApprovals();
    });
  }

  // Compliance
  if($('#complianceTable').length){
    const tbody = $('#complianceTable tbody');
    compliance.forEach(c => {
      const tr = $('<tr>');
      tr.append($('<td>').text(c.date));
      tr.append($('<td>').text(c.user));
      tr.append($('<td>').text(c.action));
      tr.append($('<td>').text(c.details));
      tbody.append(tr);
    });

    $('#generateReport').on('click', function(){
      let csv = 'Date,User,Action,Details\n';
      compliance.forEach(r => { csv += [r.date, r.user, '"'+r.action+'"', '"'+r.details+'"'].join(',') + '\n'; });
      const blob = new Blob([csv], {type: 'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'compliance_report.csv';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  }

  // Renewals
  if($('#renewalsList').length){
    renewals.forEach(r =>{
      const item = $(`<div class='list-group-item d-flex justify-content-between align-items-start'>
          <div>
            <div class='fw-bold'>${r.number} — ${r.client}</div>
            <div class='small text-muted'>Alert: ${r.alertDate}</div>
          </div>
          <div><span class='badge bg-warning text-dark'>${r.status}</span></div>
        </div>`);
      $('#renewalsList').append(item);
    });
  }

  updateNavUser();
});
