import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const script = readFileSync(new URL('../google-apps-script/Code.gs', import.meta.url), 'utf8');

function createService() {
  const sheets = new Map();
  const scriptProperties = new Map([['ADMIN_PASSWORD', 'a sufficiently long admin password']]);
  let uuid = 0;

  class Sheet {
    constructor(name) {
      this.name = name;
      this.rows = [];
    }

    getDataRange() {
      return { getValues: () => this.rows.map((row) => [...row]) };
    }

    getRange(row, column, rowCount = 1, columnCount = 1) {
      return {
        setValues: (values) => {
          values.forEach((valuesRow, rowOffset) => {
            const targetRow = row - 1 + rowOffset;
            while (this.rows.length <= targetRow) this.rows.push([]);
            valuesRow.forEach((value, columnOffset) => {
              this.rows[targetRow][column - 1 + columnOffset] = value;
            });
          });
        },
        setValue: (value) => {
          while (this.rows.length < row) this.rows.push([]);
          while (this.rows[row - 1].length < column) this.rows[row - 1].push('');
          this.rows[row - 1][column - 1] = value;
        },
        getValues: () => Array.from({ length: rowCount }, (_, rowOffset) =>
          Array.from({ length: columnCount }, (_, columnOffset) =>
            this.rows[row - 1 + rowOffset]?.[column - 1 + columnOffset] ?? '',
          ),
        ),
        setNumberFormat() {},
      };
    }

    appendRow(row) {
      this.rows.push([...row]);
    }

    deleteRow(row) {
      this.rows.splice(row - 1, 1);
    }

    deleteColumn(column) {
      this.rows.forEach((row) => row.splice(column - 1, 1));
    }

    getLastColumn() {
      return this.rows.reduce((lastColumn, row) => Math.max(lastColumn, row.length), 0);
    }

    getMaxRows() { return 1000; }
    setFrozenRows() {}
  }

  const spreadsheet = {
    getSheetByName: (name) => sheets.get(name) || null,
    insertSheet: (name) => {
      const sheet = new Sheet(name);
      sheets.set(name, sheet);
      return sheet;
    },
  };
  const context = {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key) => scriptProperties.get(key) || null,
      setProperty: (key, value) => scriptProperties.set(key, value),
    }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { getUuid: () => `uuid-${++uuid}` },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (content) => ({
        content,
        setMimeType() { return this; },
        getContent() { return this.content; },
      }),
    },
  };
  runInNewContext(script, context);
  context.setupSheets();

  function addInvitation(id, primary, code, guestNames = [primary], allocatedSeats = 2) {
    sheets.get('INVITATIONS').appendRow([id, primary, code, 'Family', allocatedSeats, '2026-01-01T00:00:00.000Z']);
    guestNames.forEach((name, index) => sheets.get('INVITED_GUESTS').appendRow([
      `${id}-G${index + 1}`,
      id,
      name,
      index === 0 ? 'Primary Guest' : 'Companion',
      '',
    ]));
  }

  function post(payload) {
    const output = context.doPost({ parameter: { payload: JSON.stringify(payload) } });
    return JSON.parse(output.getContent());
  }

  return {
    sheets,
    addInvitation,
    post,
    properties: scriptProperties,
    get: context.doGet,
    setup: context.setupSheets,
    isRsvpOpen: context.isRsvpOpen_,
  };
}

test('setup removes legacy companion guests and responses while retaining primary records', () => {
  const service = createService();
  service.properties.delete('COMPANION_GUEST_MIGRATION_V1');
  service.addInvitation('WED-001', 'Jordan Lee', 'private-001', ['Jordan Lee', 'Taylor Lee']);
  const responseSheet = service.sheets.get('RSVP_RESPONSES');
  responseSheet.rows = [
    ['response_id', 'invitation_id', 'guest_id', 'guest_name', 'attendance_status', 'dietary_restrictions', 'contact_number', 'submitted_at'],
    ['R-001', 'WED-001', 'WED-001-G1', 'Jordan Lee', 'attending', '', '+639171234567', '2026-11-19T10:00:00.000Z'],
    ['R-002', 'WED-001', 'WED-001-G2', 'Taylor Lee', 'attending', '', '', '2026-11-19T10:00:00.000Z'],
  ];

  service.setup();

  assert.deepEqual(responseSheet.rows[0], [
    'response_id', 'invitation_id', 'guest_id', 'guest_name', 'attendance_status', 'contact_number', 'submitted_at',
  ]);
  assert.deepEqual(responseSheet.rows.slice(1).map((row) => row[2]), ['WED-001-G1']);
  assert.deepEqual(service.sheets.get('INVITED_GUESTS').rows.slice(1).map((row) => row[2]), ['Jordan Lee']);
  assert.equal(service.sheets.get('INVITATIONS').rows[1][4], 2);
});

test('name lookup returns matching invitations without exposing invitation codes', () => {
  const service = createService();
  service.addInvitation('WED-001', 'Tony Stark', 'private-001');
  service.addInvitation('WED-002', 'Steve Rogers', 'private-002');

  const result = JSON.parse(service.get({ parameter: { action: 'lookup', q: 'tOn' } }).getContent());

  assert.equal(result.ok, true);
  assert.equal(result.data.invitations.length, 1);
  assert.equal(result.data.invitations[0].invitation_id, 'WED-001');
  assert.equal('invitation_code' in result.data.invitations[0], false);
});

test('admin dashboard identifies the invitation with invalid guest data', () => {
  const service = createService();
  service.addInvitation('WED-BAD', 'Tony Stark', 'private-bad', ['Tony Stark', 'Pepper Potts', 'Rhodey'], 3);

  const result = service.post({
    action: 'admin_dashboard',
    admin_password: 'a sufficiently long admin password',
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'seat_mismatch');
  assert.match(result.error, /WED-BAD/);
  assert.match(result.error, /allocated_seats=3/);
  assert.match(result.error, /Companion: 2/);
});

test('RSVP records one guest and an optional companion once, and updates the party response', () => {
  const service = createService();
  service.addInvitation('WED-001', 'Tony Stark', 'private-001');
  service.addInvitation('WED-002', 'Steve Rogers', 'private-002');
  const payload = {
    action: 'submit_rsvp',
    invitation_id: 'WED-001',
    invitation_code: 'private-001',
    attendance_status: 'attending',
    bring_companion: true,
    companion_name: 'Pepper Potts',
    contact_number: '+639171234567',
  };

  const first = service.post(payload);
  assert.equal(first.ok, true);
  assert.deepEqual(first.data.responses.map((response) => response.guest_name), ['Tony Stark', 'Pepper Potts']);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows.length, 3);

  const verified = service.post({
    action: 'verify_invitation',
    invitation_id: 'WED-001',
    invitation_code: 'private-001',
  });
  assert.equal(verified.ok, true);
  assert.equal(verified.data.invitation.contact_number, '+639171234567');
  assert.equal(verified.data.invitation.guests[1].guest_name, 'Pepper Potts');

  const renamed = service.post({ ...payload, companion_name: 'Pepper Parker' });
  assert.equal(renamed.ok, true);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows.length, 3);
  assert.equal(service.sheets.get('INVITED_GUESTS').rows.find((row) => row[0] === first.data.responses[1].guest_id)[2], 'Pepper Parker');

  const noCompanion = service.post({ ...payload, bring_companion: false, companion_name: '' });
  assert.equal(noCompanion.ok, true);
  assert.equal(noCompanion.data.responses.length, 1);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows.length, 2);
  assert.equal(service.sheets.get('INVITED_GUESTS').rows.length, 3);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows[1][5], '+639171234567');

  const dashboard = service.post({ action: 'admin_dashboard', admin_password: 'a sufficiently long admin password' });
  assert.equal(dashboard.data.summary.attending, 1);
  assert.equal(dashboard.data.summary.capacity_remaining, 59);
  assert.equal(dashboard.data.summary.pending, 1);
});

test('RSVP requires a mobile number and companion name and rejects duplicate names', () => {
  const service = createService();
  service.addInvitation('WED-001', 'Tony Stark', 'private-001');
  const payload = {
    action: 'submit_rsvp',
    invitation_id: 'WED-001',
    invitation_code: 'private-001',
    attendance_status: 'attending',
    bring_companion: true,
    companion_name: 'Pepper Potts',
    contact_number: '+639171234567',
  };

  const missingMobile = service.post({ ...payload, contact_number: '' });
  assert.equal(missingMobile.ok, false);
  assert.equal(missingMobile.code, 'invalid_input');

  const missingCompanion = service.post({ ...payload, companion_name: '' });
  assert.equal(missingCompanion.ok, false);
  assert.equal(missingCompanion.code, 'invalid_input');

  const duplicateGuest = service.post({ ...payload, companion_name: 'Tony Stark' });
  assert.equal(duplicateGuest.ok, false);
  assert.equal(duplicateGuest.code, 'duplicate_guest');

  const declinedWithCompanion = service.post({ ...payload, attendance_status: 'declined' });
  assert.equal(declinedWithCompanion.ok, false);
  assert.equal(declinedWithCompanion.code, 'invalid_companion');
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows.length, 1);
});

test('admin can add or rename one companion without confirming their RSVP', () => {
  const service = createService();
  service.addInvitation('WED-001', 'Tony Stark', 'private-001', ['Tony Stark'], 1);
  const admin = { admin_password: 'a sufficiently long admin password' };
  const setCompanion = (companionName) => service.post({
    ...admin,
    action: 'admin_set_companion',
    invitation_id: 'WED-001',
    companion_name: companionName,
  });

  const added = setCompanion('Pepper Potts');
  assert.equal(added.ok, true);
  assert.equal(added.data.created, true);
  assert.equal(service.sheets.get('INVITED_GUESTS').rows.length, 3);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows.length, 1);
  assert.equal(service.sheets.get('INVITATIONS').rows[1][4], 2);

  const verified = service.post({
    action: 'verify_invitation',
    invitation_id: 'WED-001',
    invitation_code: 'private-001',
  });
  assert.equal(verified.data.invitation.guests[1].rsvp_status, '');

  const renamed = setCompanion('Pepper Parker');
  assert.equal(renamed.ok, true);
  assert.equal(renamed.data.created, false);
  assert.equal(renamed.data.guest_id, added.data.guest_id);
  assert.equal(service.sheets.get('INVITED_GUESTS').rows.length, 3);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows.length, 1);

  const accepted = service.post({
    action: 'submit_rsvp',
    invitation_id: 'WED-001',
    invitation_code: 'private-001',
    attendance_status: 'attending',
    bring_companion: true,
    companion_name: 'Pepper Parker',
    contact_number: '+639171234567',
  });
  assert.equal(accepted.ok, true);

  const edited = setCompanion('Pepper Stark');
  assert.equal(edited.ok, true);
  assert.equal(edited.data.created, false);
  assert.equal(service.sheets.get('INVITED_GUESTS').rows.length, 3);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows.length, 3);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows[2][3], 'Pepper Stark');
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows[2][4], 'attending');
});

test('the 60-person capacity includes companions and released seats can be reused', () => {
  const service = createService();
  for (let index = 1; index <= 31; index += 1) {
    service.addInvitation(`WED-${String(index).padStart(3, '0')}`, `Guest ${index}`, `private-${index}`);
  }
  for (let index = 1; index <= 30; index += 1) {
    const id = `WED-${String(index).padStart(3, '0')}`;
    const result = service.post({
      action: 'submit_rsvp',
      invitation_id: id,
      invitation_code: `private-${index}`,
      attendance_status: 'attending',
      bring_companion: true,
      companion_name: `Companion ${index}`,
      contact_number: `+6391712345${String(index).padStart(2, '0')}`,
    });
    assert.equal(result.ok, true);
  }
  assert.equal(service.post({
    action: 'submit_rsvp',
    invitation_id: 'WED-031',
    invitation_code: 'private-31',
    attendance_status: 'attending',
    bring_companion: false,
    contact_number: '+639171234599',
  }).code, 'capacity_reached');

  const releaseSeat = service.post({
    action: 'submit_rsvp',
    invitation_id: 'WED-001',
    invitation_code: 'private-1',
    attendance_status: 'attending',
    bring_companion: false,
    contact_number: '+639171234500',
  });
  assert.equal(releaseSeat.ok, true);
  const usesReleasedSeat = service.post({
    action: 'submit_rsvp',
    invitation_id: 'WED-031',
    invitation_code: 'private-31',
    attendance_status: 'attending',
    bring_companion: false,
    contact_number: '+639171234599',
  });
  assert.equal(usesReleasedSeat.ok, true);
});

test('the deadline includes 11:59 PM Philippine time on November 30, 2026', () => {
  const service = createService();
  assert.equal(service.isRsvpOpen(new Date('2026-11-30T23:59:59.999+08:00')), true);
  assert.equal(service.isRsvpOpen(new Date('2026-12-01T00:00:00.000+08:00')), false);
});

test('invitation creation allows one named guest and admin actions require authentication', () => {
  const service = createService();
  const headers = { admin_password: 'a sufficiently long admin password' };
  const tooManyGuests = service.post({
    ...headers,
    action: 'admin_create_invitation',
    primary_guest_name: 'Tony Stark',
    invitation_code: 'private-001',
    guest_names: ['Tony Stark', 'Pepper Potts'],
  });
  assert.equal(tooManyGuests.ok, false);
  assert.equal(tooManyGuests.code, 'invalid_guests');

  const created = service.post({
    ...headers,
    action: 'admin_create_invitation',
    primary_guest_name: 'Tony Stark',
    invitation_code: 'private-001',
    guest_names: ['Tony Stark'],
  });
  assert.equal(created.ok, true);
  assert.equal(service.sheets.get('INVITATIONS').rows[1][4], 2);

  const unauthorizedAdmin = service.post({ action: 'admin_dashboard', admin_password: 'wrong-password' });
  assert.equal(unauthorizedAdmin.ok, false);
  assert.equal(unauthorizedAdmin.code, 'unauthorized');
});
