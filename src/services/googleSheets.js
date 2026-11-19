const endpoint = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL?.trim();

export class ApiError extends Error {
  constructor(message, code = 'api_error') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

async function request(url, options) {
  if (!endpoint) {
    throw new ApiError('The wedding RSVP service is not configured yet. Please contact the wedding organizers.', 'not_configured');
  }

  let response;
  try {
    response = await fetch(url, { ...options, redirect: 'follow' });
  } catch {
    throw new ApiError('We could not reach the RSVP service. Please check your connection and try again.', 'network_error');
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('The RSVP service returned an unexpected response. Please try again later.', 'invalid_response');
  }

  if (!response.ok || !result?.ok) {
    throw new ApiError(result?.error || 'Something went wrong. Please try again.', result?.code || 'request_failed');
  }
  return result.data;
}

export function searchInvitations(query) {
  const url = new URL(endpoint || 'https://invalid.local');
  url.searchParams.set('action', 'lookup');
  url.searchParams.set('q', query.trim());
  return request(url.toString(), { method: 'GET' });
}

export function verifyInvitation(invitationId, invitationCode) {
  return post({ action: 'verify_invitation', invitation_id: invitationId, invitation_code: invitationCode });
}

export function submitRsvp(payload) {
  return post({ action: 'submit_rsvp', ...payload });
}

export function adminRequest(action, payload = {}, password) {
  return post({ action, ...payload, admin_password: password });
}

function post(payload) {
  if (!endpoint) {
    throw new ApiError('The wedding RSVP service is not configured yet. Please contact the wedding organizers.', 'not_configured');
  }
  return request(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ payload: JSON.stringify(payload) }),
  });
}
