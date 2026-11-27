const SHEET_HEADERS = {
  INVITATIONS: ['invitation_id', 'primary_guest_name', 'invitation_code', 'guest_type', 'allocated_seats', 'created_at'],
  INVITED_GUESTS: ['guest_id', 'invitation_id', 'guest_name', 'guest_role', 'rsvp_status'],
  RSVP_RESPONSES: ['response_id', 'invitation_id', 'guest_id', 'guest_name', 'attendance_status', 'contact_number', 'submitted_at'],
};
const RSVP_DEADLINE = '2026-11-30T23:59:59.999+08:00';
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
    sheet_('INVITATIONS').getRange(invitation._row, 5).setValue(maxSeatsForGuestType_(invitation.guest_type));
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
  validateCompanionLimit_(invitation, guests);
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
    validateCompanionLimit_(invitation, guests);
    const status = payload.attendance_status;
    if (status !== 'attending' && status !== 'declined') {
      throw apiError_('invalid_status', 'Choose Joyfully accepts or Regretfully declines.');
    }
    const primary = guests.filter(function (guest) { return guest.guest_role === 'Primary Guest'; })[0];
    const registeredCompanions = guests.filter(function (guest) { return guest.guest_role === 'Companion'; });
    const companionStatuses = {};
    const companionUpdates = [];
    let newCompanionNames = [];
    if (Array.isArray(payload.registered_companions) || Array.isArray(payload.new_companion_names)) {
      if (!Array.isArray(payload.registered_companions) || !Array.isArray(payload.new_companion_names)) {
        throw apiError_('invalid_companion', 'Companion details could not be read. Please review the companion list and try again.');
      }
      if (payload.registered_companions.length !== registeredCompanions.length) {
        throw apiError_('invalid_companion', 'Submit an accept-or-decline choice for every registered companion.');
      }
      const seenCompanions = {};
      payload.registered_companions.forEach(function (response) {
        if (!response || typeof response !== 'object') {
          throw apiError_('invalid_companion', 'Companion details could not be read. Please review the companion list and try again.');
        }
        const registered = registeredCompanions.filter(function (guest) { return guest.guest_id === response.guest_id; })[0];
        if (!registered || seenCompanions[registered.guest_id]) {
          throw apiError_('invalid_companion', 'The registered companion list has changed. Please verify the invitation again.');
        }
        const name = cleanSingleGuestName_(response.guest_name, 'Guest full name');
        if (response.attendance_status !== 'attending' && response.attendance_status !== 'declined') {
          throw apiError_('invalid_companion', 'Choose Joyfully accepts or Regretfully declines for each companion.');
        }
        seenCompanions[registered.guest_id] = true;
        companionStatuses[registered.guest_id] = response.attendance_status;
        companionUpdates.push({ guest: registered, name: name });
      });
      newCompanionNames = payload.new_companion_names.map(function (name) {
        return cleanSingleGuestName_(name, 'Guest full name');
      });
      if (status === 'declined' && newCompanionNames.length) {
        throw apiError_('invalid_companion', 'Additional companions can only be added when the primary guest accepts.');
      }
      if (guests.length + newCompanionNames.length > Number(invitation.allocated_seats)) {
        throw apiError_('guest_not_allowed', 'This invitation does not have enough remaining seats for those companions.');
      }
      const allNames = [primary.guest_name].concat(companionUpdates.map(function (item) { return item.name; }), newCompanionNames);
      const uniqueNames = {};
      allNames.forEach(function (name) {
        const key = name.toLocaleLowerCase();
        if (uniqueNames[key]) throw apiError_('duplicate_guest', 'Each guest must have a different name.');
        uniqueNames[key] = true;
      });
    } else {
      if (registeredCompanions.length > 1) {
        throw apiError_('invalid_companion', 'Please update the RSVP page before submitting responses for multiple companions.');
      }
      if (registeredCompanions.length) {
        const registered = registeredCompanions[0];
        const name = cleanSingleGuestName_(payload.companion_name, 'Guest full name');
        const companionStatus = payload.companion_attendance_status;
        if (companionStatus !== 'attending' && companionStatus !== 'declined') {
          throw apiError_('invalid_companion', 'Choose Joyfully accepts or Regretfully declines for your guest.');
        }
        companionUpdates.push({ guest: registered, name: name });
        companionStatuses[registered.guest_id] = companionStatus;
      } else {
        if (typeof payload.bring_companion !== 'boolean' || (status === 'declined' && payload.bring_companion)) {
          throw apiError_('invalid_companion', 'An additional guest can only be included with an accepted RSVP.');
        }
        if (payload.bring_companion) {
          newCompanionNames.push(cleanSingleGuestName_(payload.companion_name, 'Guest full name'));
        }
      }
      if (guests.length + newCompanionNames.length > Number(invitation.allocated_seats)) {
        throw apiError_('guest_not_allowed', 'This invitation does not have enough remaining seats for an additional guest.');
      }
      const names = [primary.guest_name].concat(companionUpdates.map(function (item) { return item.name; }), newCompanionNames);
      if (new Set(names.map(function (name) { return name.toLocaleLowerCase(); })).size !== names.length) {
        throw apiError_('duplicate_guest', 'Each guest must have a different name.');
      }
    }
    const contact = status === 'attending'
      ? cleanRequired_(payload.contact_number, 40, 'Mobile number')
      : cleanText_(payload.contact_number, 40);
    const responseSheet = sheet_('RSVP_RESPONSES');
    const guestSheet = sheet_('INVITED_GUESTS');
    const existingRows = records_('RSVP_RESPONSES');
    const responseIds = {};
    existingRows.forEach(function (row) {
      if (responseIds[row.guest_id]) throw apiError_('duplicate_response', 'Duplicate response records need to be resolved by the wedding organizers.');
      responseIds[row.guest_id] = true;
    });
    const now = new Date().toISOString();
    companionUpdates.forEach(function (item) {
      guestSheet.getRange(item.guest._row, 3).setValue(item.name);
      updateResponseGuestNames_(item.guest.guest_id, item.name);
    });
    newCompanionNames.forEach(function (name) {
      const guestId = Utilities.getUuid();
      guestSheet.appendRow([guestId, invitation.invitation_id, name, 'Companion', '']);
      companionStatuses[guestId] = 'attending';
    });
    const currentGuests = getInvitationGuests_(invitation.invitation_id);
    currentGuests.forEach(function (guest) {
      const attendance = guest.guest_role === 'Primary Guest' ? status : companionStatuses[guest.guest_id];
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
      return {
        guest_id: guest.guest_id,
        guest_name: guest.guest_name,
        attendance_status: guest.guest_role === 'Primary Guest' ? status : companionStatuses[guest.guest_id],
      };
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
    const allowAdditionalGuest = payload.allow_additional_guest === undefined
      ? guestType.trim() !== ''
      : payload.allow_additional_guest;
    if (typeof allowAdditionalGuest !== 'boolean') {
      throw apiError_('invalid_input', 'Choose whether this invitation allows additional guests.');
    }
    if (!guestType && allowAdditionalGuest) {
      throw apiError_('invalid_input', 'An invitation without a guest classification cannot allow additional guests.');
    }
    const invitationId = 'WED-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const seats = isFamilyGuestType_(guestType) ? 3 : allowAdditionalGuest ? 2 : 1;
    sheet_('INVITATIONS').appendRow([invitationId, primary, code, guestType, seats, new Date().toISOString()]);
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
    const allowAdditionalGuest = payload.allow_additional_guest === undefined
      ? guestType.trim() !== '' && Number(invitation.allocated_seats) > 1
      : payload.allow_additional_guest;
    if (typeof allowAdditionalGuest !== 'boolean') {
      throw apiError_('invalid_input', 'Choose whether this invitation allows additional guests.');
    }
    if (!guestType && allowAdditionalGuest) {
      throw apiError_('invalid_input', 'An invitation without a guest classification cannot allow additional guests.');
    }
    const seats = isFamilyGuestType_(guestType) ? 3 : allowAdditionalGuest ? 2 : 1;
    if (guests.length > seats) {
      throw apiError_('seat_mismatch', 'Remove the additional guest before limiting this invitation to one seat.');
    }
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
    const name = cleanSingleGuestName_(payload.companion_name, 'Additional guest full name');
    if (guests.some(function (guest) {
      return guest.guest_id !== (companion ? companion.guest_id : '') &&
        guest.guest_name.toLowerCase() === name.toLowerCase();
    })) {
      throw apiError_('duplicate_guest', 'The additional guest’s name must be different from the invited guest’s name.');
    }

    if (companion) {
      sheet_('INVITED_GUESTS').getRange(companion._row, 3).setValue(name);
      updateResponseGuestNames_(companion.guest_id, name);
      return { guest_id: companion.guest_id, guest_name: name, created: false };
    }

    if (guests.length >= maxSeatsForGuestType_(invitation.guest_type)) {
      throw apiError_('guest_not_allowed', 'This invitation has no remaining seats for an additional guest.');
    }
    const guestId = Utilities.getUuid();
    sheet_('INVITATIONS').getRange(invitation._row, 5).setValue(
      Math.max(Number(invitation.allocated_seats), maxSeatsForGuestType_(invitation.guest_type), guests.length + 1),
    );
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
    throw apiError_('invalid_guests', 'Add only the invited guest here; additional guests register with the RSVP.');
  }
  const names = input.map(function (name) { return cleanRequired_(name, 120, 'Guest name'); });
  if (names[0].toLowerCase() !== primary.toLowerCase()) {
    throw apiError_('primary_guest_required', 'The primary guest must be included in the invited guest list.');
  }
  return names;
}

function validateSeatCount_(invitation, guests, includeDetails) {
  const seats = Number(invitation.allocated_seats);
  const maximumSeats = maxSeatsForGuestType_(invitation.guest_type);
  const primaryCount = guests.filter(function (guest) { return guest.guest_role === 'Primary Guest'; }).length;
  const companionCount = guests.filter(function (guest) { return guest.guest_role === 'Companion'; }).length;
  const names = guests.map(function (guest) { return guest.guest_name.toLowerCase(); });
  const duplicateNames = new Set(names).size !== names.length;
  if (!Number.isInteger(seats) || seats < 1 || seats > maximumSeats || guests.length < 1 || guests.length > seats ||
      primaryCount !== 1 || companionCount > maximumSeats - 1 ||
      primaryCount + companionCount !== guests.length || duplicateNames) {
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

function validateCompanionLimit_(invitation, guests) {
  const maximumCompanions = Math.min(Number(invitation.allocated_seats), maxSeatsForGuestType_(invitation.guest_type)) - 1;
  if (guests.length - 1 > maximumCompanions) {
    throw apiError_('companion_limit', 'This invitation has reached its additional guest limit.');
  }
}

function maxSeatsForGuestType_(guestType) {
  const type = cleanText_(guestType, 80);
  if (!type) return 1;
  return isFamilyGuestType_(type) ? 3 : 2;
}

function isFamilyGuestType_(guestType) {
  const type = cleanText_(guestType, 80).toLocaleLowerCase();
  return type === 'family' || type === 'family guest';
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

function cleanSingleGuestName_(value, label) {
  const name = cleanRequired_(value, 120, label);
  if (name.indexOf(',') !== -1) {
    throw apiError_('invalid_input', 'Enter one guest name only; multiple names are not allowed.');
  }
  return name;
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
