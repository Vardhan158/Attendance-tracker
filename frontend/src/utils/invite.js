const PENDING_INVITE_KEY = "pendingInvite";

export const savePendingInvite = (invite) => {
  localStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(invite));
};

export const getPendingInvite = () => {
  const rawInvite = localStorage.getItem(PENDING_INVITE_KEY);

  if (!rawInvite) {
    return null;
  }

  try {
    return JSON.parse(rawInvite);
  } catch {
    localStorage.removeItem(PENDING_INVITE_KEY);
    return null;
  }
};

export const clearPendingInvite = () => {
  localStorage.removeItem(PENDING_INVITE_KEY);
};

export const getInvitePath = (invite) => `/join-batch/${invite.batchId}?token=${invite.token}`;
