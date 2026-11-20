const SHEET_HEADERS = {
  INVITATIONS: ['invitation_id', 'primary_guest_name', 'invitation_code', 'guest_type', 'allocated_seats', 'created_at'],
  INVITED_GUESTS: ['guest_id', 'invitation_id', 'guest_name', 'guest_role', 'rsvp_status'],
  RSVP_RESPONSES: ['response_id', 'invitation_id', 'guest_id', 'guest_name', 'attendance_status', 'contact_number', 'submitted_at'],
};
const RSVP_DEADLINE = '2026-11-30T23:59:59.999+08:00';
const RSVP_CAPACITY = 60;
const COMPANION_MIGRATION_PROPERTY = 'COMPANION_GUEST_MIGRATION_V1';

function setupSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Bind this Apps Script project to the wedding guest spreadsheet first.');
  Object.keys(SHEET_HEADERS).forEach(function (name) {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    if (name === 'RSVP_RESPONSES') removeDietaryRestrictionsColumn_(sheet);
    const headers = SHEET_HEADERS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).setNumberFormat('@');
  });
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty(COMPANION_MIGRATION_PROPERTY) !== 'true') {
    migrateCompanionGuests_();
    properties.setProperty(COMPANION_MIGRATION_PROPERTY, 'true');
  }
  return 'Sheets are ready. Set ADMIN_PASSWORD in Project Settings > Script properties before deploying.';
}

function migrateCompanionGuests_() {
  const guestSheet = sheet_('INVITED_GUESTS');
  records_('INVITED_GUESTS').filter(function (guest) { return guest.guest_role === 'Companion'; })
    .sort(function (a, b) { return b._row - a._row; })
    .forEach(function (guest) {
      deleteMatchingRows_('RSVP_RESPONSES', 'guest_id', guest.guest_id);
      guestSheet.deleteRow(guest._row);
    });
  records_('INVITATIONS').forEach(function (invitation) {
    sheet_('INVITATIONS').getRange(invitation._row, 5).setValue(2);
  });
}

function removeDietaryRestrictionsColumn_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) return;
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (header) { return String(header); });
  const dietaryColumn = headers.indexOf('dietary_restrictions');
  if (dietaryColumn !== -1) sheet.deleteColumn(dietaryColumn + 1);
}

function doGet(event) {
  try {
    const params = event && event.parameter ? event.parameter : {};
    if (params.action !== 'lookup') return json_({ ok: false, code: 'invalid_action', error: 'This action is not available.' });
    return json_({ ok: true, data: lookup_(params.q || '') });
  } catch (error) {
    return json_({ ok: false, code: 'lookup_error', error: publicError_(error) });
  }
}

function doPost(event) {
  try {
    const payload = parsePayload_(event);
    let data;
    switch (payload.action) {
      case 'verify_invitation':
        data = verifyInvitation_(payload.invitation_id, payload.invitation_code);
        break;
      case 'submit_rsvp':
        data = submitRsvp_(payload);
        break;
      case 'admin_dashboard':
        requireAdmin_(payload.admin_password);
        data = adminDashboard_();
        break;
      case 'admin_create_invitation':
        requireAdmin_(payload.admin_password);
        data = adminCreateInvitation_(payload);
        break;
      case 'admin_edit_invitation':
        requireAdmin_(payload.admin_password);
        data = adminEditInvitation_(payload);
        break;
      case 'admin_remove_guest':
        requireAdmin_(payload.admin_password);
        data = adminRemoveGuest_(payload);
        break;
      case 'admin_set_companion':
        requireAdmin_(payload.admin_password);
        data = adminSetCompanion_(payload);
        break;
      case 'admin_delete_invitation':
        requireAdmin_(payload.admin_password);
        data = adminDeleteInvitation_(payload);
        break;
      default:
        throw apiError_('invalid_action', 'This action is not available.');
    }
    return json_({ ok: true, data: data });
  } catch (error) {
    return json_({ ok: false, code: error.code || 'request_failed', error: publicError_(error) });
  }
}

function parsePayload_(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  const raw = parameters.payload || (event && event.postData ? event.postData.contents : '');
  if (!raw || raw.length > 50000) throw apiError_('invalid_request', 'The request is missing or too large.');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw apiError_('invalid_request', 'The request could not be read.');
  }
}

function lookup_(query) {
  const term = cleanText_(query, 100).toLocaleLowerCase();
  if (term.length < 2) throw apiError_('query_too_short', 'Enter at least two letters to search.');
  const guests = records_('INVITED_GUESTS');
  const invitations = records_('INVITATIONS');
  validateInvitationRecords_(invitations);
  const matchedIds = {};
  guests.forEach(function (guest) {
    if (String(guest.guest_name).toLocaleLowerCase().indexOf(term) !== -1) matchedIds[guest.invitation_id] = true;
  });
  const results = invitations.filter(function (invitation) { return matchedIds[invitation.invitation_id]; })
    .slice(0, 10)
    .map(function (invitation) {
      return {
        invitation_id: invitation.invitation_id,
        primary_guest_name: invitation.primary_guest_name,
        guest_type: invitation.guest_type,
        allocated_seats: Number(invitation.allocated_seats),
      };
    });
  return { invitations: results };
}

function verifyInvitation_(invitationId, invitationCode) {
  const invitation = findInvitation_(invitationId);
  if (!invitation || !constantTimeEqual_(invitation.invitation_code, cleanText_(invitationCode, 100))) {
    throw apiError_('invalid_invitation', 'That invitation code could not be verified. Please check the code and try again.');
  }
  const guests = getInvitationGuests_(invitation.invitation_id);
  validateSeatCount_(invitation, guests);
  validateCompanionLimit_(guests);
  const responses = responseIndex_(invitation.invitation_id);
  const primaryGuest = guests.filter(function (guest) { return guest.guest_role === 'Primary Guest'; })[0];
  return {
    invitation: {
      invitation_id: invitation.invitation_id,
      primary_guest_name: invitation.primary_guest_name,
      guest_type: invitation.guest_type,
      allocated_seats: Number(invitation.allocated_seats),
      contact_number: responses[primaryGuest.guest_id] ? responses[primaryGuest.guest_id].contact_number : '',
      guests: guests.map(function (guest) {
        const response = responses[guest.guest_id];
        return {
          guest_id: guest.guest_id,
          guest_name: guest.guest_name,
          guest_role: guest.guest_role,
          rsvp_status: response ? response.attendance_status : '',
        };
      }),
    },
  };
}

function submitRsvp_(payload) {
  if (!isRsvpOpen_(new Date())) throw apiError_('rsvp_closed', 'The RSVP deadline has passed. Please contact Kym if you need to make a change.');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw apiError_('busy', 'The RSVP service is busy. Please try again in a moment.');
  try {
    const invitation = findInvitation_(payload.invitation_id);
    if (!invitation || !constantTimeEqual_(invitation.invitation_code, cleanText_(payload.invitation_code, 100))) {
      throw apiError_('invalid_invitation', 'Your invitation could not be verified. Please search again and check your invitation code.');
    }
    const guests = getInvitationGuests_(invitation.invitation_id);
    validateSeatCount_(invitation, guests);
    validateCompanionLimit_(guests);
    const status = payload.attendance_status;
    if (status !== 'attending' && status !== 'declined') {
      throw apiError_('invalid_status', 'Choose Joyfully accepts or Regretfully declines.');
    }
    if (typeof payload.bring_companion !== 'boolean' || (status === 'declined' && payload.bring_companion)) {
      throw apiError_('invalid_companion', 'A companion can only be registered with an accepted RSVP.');
    }
    const primary = guests.filter(function (guest) { return guest.guest_role === 'Primary Guest'; })[0];
    let companion = guests.filter(function (guest) { return guest.guest_role === 'Companion'; })[0];
    const companionName = payload.bring_companion ? cleanRequired_(payload.companion_name, 120, 'Companion full name') : '';
    if (companionName && companionName.toLowerCase() === primary.guest_name.toLowerCase()) {
      throw apiError_('duplicate_guest', 'The companion name must be different from the invited guest name.');
    }
    const contact = cleanRequired_(payload.contact_number, 40, 'Mobile number');
    const responseSheet = sheet_('RSVP_RESPONSES');
    const guestSheet = sheet_('INVITED_GUESTS');
    const existingRows = records_('RSVP_RESPONSES');
    const responseIds = {};
    existingRows.forEach(function (row) {
      if (responseIds[row.guest_id]) throw apiError_('duplicate_response', 'Duplicate response records need to be resolved by the wedding organizers.');
      responseIds[row.guest_id] = true;
    });
    const oldAttending = existingRows.filter(function (row) {
      return row.invitation_id === invitation.invitation_id && row.attendance_status === 'attending';
    }).length;
    const nextAttending = status === 'attending' ? (payload.bring_companion ? 2 : 1) : 0;
    const totalAttending = existingRows.filter(function (row) { return row.attendance_status === 'attending'; }).length;
    if (totalAttending - oldAttending + nextAttending > RSVP_CAPACITY) {
      throw apiError_('capacity_reached', 'The celebration has reached its 60-seat capacity. Please contact Kym for help.');
    }

    const now = new Date().toISOString();
    if (!payload.bring_companion && companion) {
      deleteMatchingRows_('RSVP_RESPONSES', 'guest_id', companion.guest_id);
      guestSheet.deleteRow(companion._row);
    } else if (payload.bring_companion && companion) {
      guestSheet.getRange(companion._row, 3).setValue(companionName);
      updateResponseGuestNames_(companion.guest_id, companionName);
    } else if (payload.bring_companion) {
      companion = {
        guest_id: Utilities.getUuid(),
        invitation_id: invitation.invitation_id,
        guest_name: companionName,
        guest_role: 'Companion',
      };
      guestSheet.appendRow([companion.guest_id, invitation.invitation_id, companionName, 'Companion', '']);
    }
    const currentGuests = getInvitationGuests_(invitation.invitation_id);
    currentGuests.forEach(function (guest) {
      const attendance = guest.guest_role === 'Primary Guest' ? status : 'attending';
      guestSheet.getRange(guest._row, 5).setValue(attendance);
      const existing = records_('RSVP_RESPONSES').filter(function (row) { return row.guest_id === guest.guest_id; })[0];
      const record = [
        existing ? existing.response_id : Utilities.getUuid(),
        invitation.invitation_id,
        guest.guest_id,
        guest.guest_name,
        attendance,
        guest.guest_role === 'Primary Guest' ? contact : '',
        now,
      ];
      if (existing) responseSheet.getRange(existing._row, 1, 1, record.length).setValues([record]);
      else responseSheet.appendRow(record);
    });
    const results = getInvitationGuests_(invitation.invitation_id).map(function (guest) {
      return { guest_id: guest.guest_id, guest_name: guest.guest_name, attendance_status: status === 'attending' ? 'attending' : 'declined' };
    });
    return { responses: results };
  } finally {
    lock.releaseLock();
  }
}

function isRsvpOpen_(now) {
  return now.getTime() <= new Date(RSVP_DEADLINE).getTime();
}

function adminDashboard_() {
  const invitations = records_('INVITATIONS');
  validateInvitationRecords_(invitations);
  const guests = records_('INVITED_GUESTS');
  const responseRecords = records_('RSVP_RESPONSES');
  const responsesByGuest = {};
  responseRecords.forEach(function (response) {
    if (responsesByGuest[response.guest_id]) throw apiError_('duplicate_response', 'Duplicate response records need to be resolved by the wedding organizers.');
    responsesByGuest[response.guest_id] = response;
  });
  const contactsByInvitation = {};
  guests.forEach(function (guest) {
    const response = responsesByGuest[guest.guest_id];
    if (guest.guest_role === 'Primary Guest' && response) contactsByInvitation[guest.invitation_id] = response.contact_number || '';
  });
  const invited = guests.map(function (guest) {
    const response = responsesByGuest[guest.guest_id] || {};
    return {
      invitation_id: guest.invitation_id,
      guest_id: guest.guest_id,
      guest_name: guest.guest_name,
      guest_role: guest.guest_role,
      attendance_status: response.attendance_status || '',
      contact_number: contactsByInvitation[guest.invitation_id] || '',
      submitted_at: response.submitted_at || '',
    };
  });
  const attending = invited.filter(function (guest) { return guest.attendance_status === 'attending'; }).length;
  const declined = invited.filter(function (guest) { return guest.attendance_status === 'declined'; }).length;
  const responded = attending + declined;
  return {
    summary: {
      total_invitations: invitations.length,
      total_guests: guests.length,
      attending: attending,
      capacity: RSVP_CAPACITY,
      capacity_remaining: Math.max(0, RSVP_CAPACITY - attending),
      declined: declined,
      pending: guests.length - responded,
      attendance_percentage: guests.length ? Math.round(attending / guests.length * 100) : 0,
    },
    invitations: invitations.map(function (invitation) {
      const invitationGuests = guests.filter(function (guest) { return guest.invitation_id === invitation.invitation_id; });
      validateSeatCount_(invitation, invitationGuests, true);
      return {
        invitation_id: invitation.invitation_id,
        primary_guest_name: invitation.primary_guest_name,
        invitation_code: invitation.invitation_code,
        guest_type: invitation.guest_type,
        allocated_seats: Number(invitation.allocated_seats),
        guests: invitationGuests.map(function (guest) {
          const response = responsesByGuest[guest.guest_id];
          return {
            guest_id: guest.guest_id,
            guest_name: guest.guest_name,
            guest_role: guest.guest_role,
            rsvp_status: response ? response.attendance_status : '',
          };
        }),
      };
    }),
    responses: invited,
  };
}

function adminCreateInvitation_(payload) {
  return withLock_(function () {
    const primary = cleanRequired_(payload.primary_guest_name, 120, 'Primary guest name');
    const code = cleanRequired_(payload.invitation_code, 100, 'Invitation code');
    const guestType = cleanText_(payload.guest_type, 80);
    const names = validateGuestNames_(payload.guest_names, primary);
    const invitationId = 'WED-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    sheet_('INVITATIONS').appendRow([invitationId, primary, code, guestType, 2, new Date().toISOString()]);
    names.forEach(function (name) {
      sheet_('INVITED_GUESTS').appendRow([
        Utilities.getUuid(),
        invitationId,
        name,
        'Primary Guest',
        '',
      ]);
    });
    return { invitation_id: invitationId };
  });
}

function adminEditInvitation_(payload) {
  return withLock_(function () {
    const invitation = findInvitation_(payload.invitation_id);
    if (!invitation) throw apiError_('not_found', 'Invitation not found.');
    const primary = cleanRequired_(payload.primary_guest_name, 120, 'Primary guest name');
    const code = cleanRequired_(payload.invitation_code, 100, 'Invitation code');
    const guestType = cleanText_(payload.guest_type, 80);
    const guests = getInvitationGuests_(invitation.invitation_id);
    validateSeatCount_(invitation, guests);
    const seats = 2;
    const primaryGuests = guests.filter(function (guest) { return guest.guest_role === 'Primary Guest'; });
    if (primaryGuests.length !== 1) throw apiError_('invalid_invitation', 'This invitation must have exactly one primary guest.');
    if (guests.some(function (guest) {
      return guest.guest_id !== primaryGuests[0].guest_id && guest.guest_name.toLowerCase() === primary.toLowerCase();
    })) throw apiError_('duplicate_guest', 'The primary guest name must be unique within this invitation.');
    const sheet = sheet_('INVITATIONS');
    sheet.getRange(invitation._row, 2, 1, 4).setValues([[primary, code, guestType, seats]]);
    const primaryGuest = primaryGuests[0];
    sheet_('INVITED_GUESTS').getRange(primaryGuest._row, 3).setValue(primary);
    updateResponseGuestNames_(primaryGuest.guest_id, primary);
    return { invitation_id: invitation.invitation_id };
  });
}

function adminRemoveGuest_(payload) {
  return withLock_(function () {
    const invitation = findInvitation_(payload.invitation_id);
    if (!invitation) throw apiError_('not_found', 'Invitation not found.');
    const guests = getInvitationGuests_(invitation.invitation_id);
    validateSeatCount_(invitation, guests);
    const guest = guests.filter(function (item) { return item.guest_id === payload.guest_id; })[0];
    if (!guest) throw apiError_('not_found', 'Guest not found on this invitation.');
    if (guest.guest_role === 'Primary Guest') throw apiError_('primary_guest', 'Edit the primary guest name instead of removing the primary guest.');
    deleteMatchingRows_('RSVP_RESPONSES', 'guest_id', guest.guest_id);
    sheet_('INVITED_GUESTS').deleteRow(guest._row);
    return { invitation_id: invitation.invitation_id };
  });
}

function adminSetCompanion_(payload) {
  return withLock_(function () {
    const invitation = findInvitation_(payload.invitation_id);
    if (!invitation) throw apiError_('not_found', 'Invitation not found.');
    const guests = getInvitationGuests_(invitation.invitation_id);
    validateSeatCount_(invitation, guests);
    const companion = guests.filter(function (guest) { return guest.guest_role === 'Companion'; })[0];
    const name = cleanRequired_(payload.companion_name, 120, 'Companion full name');
    if (guests.some(function (guest) {
      return guest.guest_id !== (companion ? companion.guest_id : '') &&
        guest.guest_name.toLowerCase() === name.toLowerCase();
    })) {
      throw apiError_('duplicate_guest', 'The companion name must be different from the invited guest name.');
    }

    if (companion) {
      sheet_('INVITED_GUESTS').getRange(companion._row, 3).setValue(name);
      updateResponseGuestNames_(companion.guest_id, name);
      return { guest_id: companion.guest_id, guest_name: name, created: false };
    }

    const guestId = Utilities.getUuid();
    sheet_('INVITATIONS').getRange(invitation._row, 5).setValue(2);
    sheet_('INVITED_GUESTS').appendRow([
      guestId,
      invitation.invitation_id,
      name,
      'Companion',
      '',
    ]);
    return { guest_id: guestId, guest_name: name, created: true };
  });
}

function adminDeleteInvitation_(payload) {
  return withLock_(function () {
    const invitation = findInvitation_(payload.invitation_id);
    if (!invitation) throw apiError_('not_found', 'Invitation not found.');
    deleteMatchingRows_('RSVP_RESPONSES', 'invitation_id', invitation.invitation_id);
    deleteMatchingRows_('INVITED_GUESTS', 'invitation_id', invitation.invitation_id);
    sheet_('INVITATIONS').deleteRow(invitation._row);
    return { deleted: true };
  });
}

function validateGuestNames_(input, primary) {
  if (!Array.isArray(input) || input.length !== 1) {
    throw apiError_('invalid_guests', 'Add only the invited guest here; companions register with the RSVP.');
  }
  const names = input.map(function (name) { return cleanRequired_(name, 120, 'Guest name'); });
  if (names[0].toLowerCase() !== primary.toLowerCase()) {
    throw apiError_('primary_guest_required', 'The primary guest must be included in the invited guest list.');
  }
  return names;
}

function validateSeatCount_(invitation, guests, includeDetails) {
  const seats = Number(invitation.allocated_seats);
  const primaryCount = guests.filter(function (guest) { return guest.guest_role === 'Primary Guest'; }).length;
  const companionCount = guests.filter(function (guest) { return guest.guest_role === 'Companion'; }).length;
  const names = guests.map(function (guest) { return guest.guest_name.toLowerCase(); });
  const duplicateNames = new Set(names).size !== names.length;
  if (!Number.isInteger(seats) || seats < 1 || seats > 2 || guests.length < 1 || guests.length > seats ||
      primaryCount !== 1 || companionCount > 1 || primaryCount + companionCount !== guests.length || duplicateNames) {
    let message = 'This invitation has an incorrect seat allocation or guest list. Please contact the wedding organizers.';
    if (includeDetails) {
      const roles = {};
      guests.forEach(function (guest) {
        const role = guest.guest_role || '(blank)';
        roles[role] = (roles[role] || 0) + 1;
      });
      const roleSummary = Object.keys(roles).map(function (role) { return role + ': ' + roles[role]; }).join(', ') || 'none';
      message = 'Invitation ' + invitation.invitation_id + ' has invalid data (allocated_seats=' +
        invitation.allocated_seats + ', guest rows=' + guests.length + ', roles=' + roleSummary +
        ', duplicate names=' + duplicateNames + '). Check its rows in INVITATIONS and INVITED_GUESTS.';
    }
    throw apiError_('seat_mismatch', message);
  }
}

function validateCompanionLimit_(guests) {
  if (guests.length > 2) {
    throw apiError_('companion_limit', 'An invitation can include only one companion.');
  }
}

function getInvitationGuests_(invitationId) {
  return records_('INVITED_GUESTS').filter(function (guest) { return guest.invitation_id === invitationId; });
}

function responseIndex_(invitationId) {
  const index = {};
  records_('RSVP_RESPONSES').filter(function (row) { return row.invitation_id === invitationId; }).forEach(function (row) {
    if (index[row.guest_id]) throw apiError_('duplicate_response', 'Duplicate response records need to be resolved by the wedding organizers.');
    index[row.guest_id] = row;
  });
  return index;
}

function findInvitation_(invitationId) {
  const id = cleanText_(invitationId, 100);
  if (!id) return null;
  const invitations = records_('INVITATIONS');
  validateInvitationRecords_(invitations);
  return invitations.filter(function (row) { return row.invitation_id === id; })[0] || null;
}

function validateInvitationRecords_(invitations) {
  const ids = {};
  invitations.forEach(function (invitation) {
    const id = String(invitation.invitation_id || '');
    const code = String(invitation.invitation_code || '');
    if (!id || !code) throw apiError_('invalid_invitation', 'An invitation is missing its ID or code. Please contact the wedding organizers.');
    if (ids[id]) throw apiError_('duplicate_invitation', 'Duplicate invitation IDs need to be resolved by the wedding organizers.');
    ids[id] = true;
  });
}

function updateResponseGuestNames_(guestId, name) {
  records_('RSVP_RESPONSES').filter(function (response) { return response.guest_id === guestId; }).forEach(function (response) {
    sheet_('RSVP_RESPONSES').getRange(response._row, 4).setValue(name);
  });
}

function deleteMatchingRows_(sheetName, key, value) {
  const sheet = sheet_(sheetName);
  records_(sheetName).filter(function (row) { return row[key] === value; }).sort(function (a, b) { return b._row - a._row; })
    .forEach(function (row) { sheet.deleteRow(row._row); });
}

function requireAdmin_(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || expected.length < 16) throw apiError_('admin_not_configured', 'Admin access has not been configured. Set a strong ADMIN_PASSWORD in Apps Script project settings.');
  if (!constantTimeEqual_(expected, String(password || ''))) throw apiError_('unauthorized', 'The admin password is incorrect.');
}

function constantTimeEqual_(expected, actual) {
  const left = String(expected || '');
  const right = String(actual || '');
  let difference = left.length ^ right.length;
  const size = Math.max(left.length, right.length);
  for (let i = 0; i < size; i += 1) difference |= (left.charCodeAt(i % (left.length || 1)) || 0) ^ (right.charCodeAt(i % (right.length || 1)) || 0);
  return difference === 0;
}

function records_(sheetName) {
  const sheet = sheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(function (header) { return String(header); });
  return values.slice(1).map(function (row, index) {
    const record = { _row: index + 2 };
    headers.forEach(function (header, column) { record[header] = row[column] === null ? '' : String(row[column]); });
    return record;
  }).filter(function (record) { return Object.keys(record).some(function (key) { return key !== '_row' && record[key] !== ''; }); });
}

function sheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw apiError_('not_configured', 'The wedding spreadsheet is not configured.');
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw apiError_('not_configured', 'Run setupSheets() in Apps Script to create the required sheets.');
  return sheet;
}

function withLock_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw apiError_('busy', 'The service is busy. Please try again in a moment.');
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function cleanRequired_(value, maxLength, label) {
  const text = cleanText_(value, maxLength);
  if (!text) throw apiError_('invalid_input', label + ' is required.');
  return text;
}

function cleanText_(value, maxLength) {
  return String(value === undefined || value === null ? '' : value).trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength || 500);
}

function apiError_(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function publicError_(error) {
  return error && error.message ? error.message : 'Something went wrong. Please try again.';
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
