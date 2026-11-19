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

  function addInvitation(id, primary, code, guestNames, allocatedSeats = guestNames.length) {
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

  return { sheets, addInvitation, post, properties: scriptProperties, get: context.doGet, setup: context.setupSheets };
}

test('setup removes the dietary restrictions column and preserves other response data', () => {
  const service = createService();
  const responseSheet = service.sheets.get('RSVP_RESPONSES');
  responseSheet.rows = [
    ['response_id', 'invitation_id', 'guest_id', 'guest_name', 'attendance_status', 'dietary_restrictions', 'contact_number', 'submitted_at'],
    ['R-001', 'WED-001', 'G-001', 'Jordan Lee', 'attending', 'peanuts', '+639171234567', '2026-11-19T10:00:00.000Z'],
  ];

  service.setup();

  assert.deepEqual(responseSheet.rows[0], [
    'response_id', 'invitation_id', 'guest_id', 'guest_name', 'attendance_status', 'contact_number', 'submitted_at',
  ]);
  assert.deepEqual(responseSheet.rows[1], [
    'R-001', 'WED-001', 'G-001', 'Jordan Lee', 'attending', '+639171234567', '2026-11-19T10:00:00.000Z',
  ]);
});

test('partial name lookup only returns matching invitation summaries, never invitation codes', () => {
  const service = createService();
  service.addInvitation('WED-001', 'Tony Stark', 'private-001', ['Tony Stark', 'Pepper Potts']);
  service.addInvitation('WED-002', 'Steve Rogers', 'private-002', ['Steve Rogers']);

  const result = JSON.parse(service.get({ parameter: { action: 'lookup', q: 'pEp' } }).getContent());

  assert.equal(result.ok, true);
  assert.equal(result.data.invitations.length, 1);
  assert.equal(result.data.invitations[0].invitation_id, 'WED-001');
  assert.equal('invitation_code' in result.data.invitations[0], false);
});

test('RSVP rejects guests from another invitation and updates existing responses without duplicates', () => {
  const service = createService();
  service.addInvitation('WED-001', 'Tony Stark', 'private-001', ['Tony Stark', 'Pepper Potts']);
  service.addInvitation('WED-002', 'Steve Rogers', 'private-002', ['Steve Rogers']);

  const unauthorized = service.post({
    action: 'submit_rsvp',
    invitation_id: 'WED-001',
    invitation_code: 'private-001',
    responses: [
      { guest_id: 'WED-001-G1', attendance_status: 'attending' },
      { guest_id: 'WED-002-G1', attendance_status: 'attending' },
    ],
  });
  assert.equal(unauthorized.ok, false);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows.length, 1);

  const first = service.post({
    action: 'submit_rsvp',
    invitation_id: 'WED-001',
    invitation_code: 'private-001',
    responses: [
      { guest_id: 'WED-001-G1', attendance_status: 'attending' },
      { guest_id: 'WED-001-G2', attendance_status: 'declined' },
    ],
  });
  assert.equal(first.ok, true);
  assert.deepEqual(first.data.responses.map((response) => response.attendance_status), ['attending', 'declined']);

  const update = service.post({
    action: 'submit_rsvp',
    invitation_id: 'WED-001',
    invitation_code: 'private-001',
    responses: [
      { guest_id: 'WED-001-G1', attendance_status: 'declined' },
      { guest_id: 'WED-001-G2', attendance_status: 'attending' },
    ],
  });
  assert.equal(update.ok, true);
  assert.equal(service.sheets.get('RSVP_RESPONSES').rows.length, 3);
  assert.deepEqual(service.sheets.get('INVITED_GUESTS').rows.slice(1).map((row) => row[4]), ['declined', 'attending', '']);
  const dashboard = service.post({ action: 'admin_dashboard', admin_password: 'a sufficiently long admin password' });
  assert.equal(dashboard.data.summary.attendance_percentage, 33);
  assert.equal(dashboard.data.summary.pending, 1);
});

test('invitation verification enforces the seat count and admin actions require server-side authentication', () => {
  const service = createService();
  service.addInvitation('WED-001', 'Tony Stark', 'private-001', ['Tony Stark', 'Pepper Potts'], 1);

  const invalidInvitation = service.post({
    action: 'verify_invitation',
    invitation_id: 'WED-001',
    invitation_code: 'private-001',
  });
  assert.equal(invalidInvitation.ok, false);
  assert.equal(invalidInvitation.code, 'seat_mismatch');

  const unauthorizedAdmin = service.post({ action: 'admin_dashboard', admin_password: 'wrong-password' });
  assert.equal(unauthorizedAdmin.ok, false);
  assert.equal(unauthorizedAdmin.code, 'unauthorized');
});

test('invitation management allows at most one companion', () => {
  const service = createService();
  const headers = { admin_password: 'a sufficiently long admin password' };

  const tooManyGuests = service.post({
    ...headers,
    action: 'admin_create_invitation',
    primary_guest_name: 'Tony Stark',
    invitation_code: 'private-001',
    guest_names: ['Tony Stark', 'Pepper Potts', 'Happy Hogan'],
  });
  assert.equal(tooManyGuests.ok, false);
  assert.equal(tooManyGuests.code, 'invalid_guests');

  const created = service.post({
    ...headers,
    action: 'admin_create_invitation',
    primary_guest_name: 'Tony Stark',
    invitation_code: 'private-001',
    guest_names: ['Tony Stark', 'Pepper Potts'],
  });
  assert.equal(created.ok, true);

  const extraCompanion = service.post({
    ...headers,
    action: 'admin_add_guest',
    invitation_id: created.data.invitation_id,
    guest_name: 'Happy Hogan',
  });
  assert.equal(extraCompanion.ok, false);
  assert.equal(extraCompanion.code, 'companion_limit');
});
