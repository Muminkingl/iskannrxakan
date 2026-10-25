'use strict';

const $ = id => document.getElementById(id);
const tg = window.Telegram?.WebApp;
const initData = tg?.initData || '';
let sessionExpiresAt = 0;
let expiryTimer;
let toastTimer;
let cursor = null;
let search = '';
let pageRequest = 0;
let pendingConfirmation = null;
let changingMembership = false;
let lookupResult = null;

const date = value => value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baghdad' }).format(new Date(value)) : 'No manual subscription';
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function lock(title, description, retry = false) {
  ++pageRequest;
  clearTimeout(expiryTimer);
  sessionExpiresAt = 0;
  pendingConfirmation = null;
  lookupResult = null;
  $('confirmation-dialog').close();
  $('member-list').replaceChildren();
  $('lookup-result').replaceChildren();
  $('confirmation-member').replaceChildren();
  $('confirmation-note').textContent = '';
  $('workspace').hidden = true;
  $('owner-tag').hidden = true;
  $('gate').hidden = false;
  $('gate-title').textContent = title;
  $('gate-description').textContent = description;
  $('gate-retry').hidden = !retry;
}

function toast(message, error = false) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.toggle('error', error);
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 6000);
}

async function api(action, data = {}) {
  let response;
  try {
    response = await fetch('/api/system', {
      method: 'POST', credentials: 'omit', redirect: 'error', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `tma ${initData}` },
      body: JSON.stringify({ action, ...data }), signal: AbortSignal.timeout(25000),
    });
  } catch { throw new Error('Could not connect. Check your connection and try again.'); }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) lock('Private workspace', result.message || 'Close System and open it again from the Telegram bot.');
    throw new Error(result.message || 'System is temporarily unavailable. Please try again.');
  }
  return result;
}

function memberCard(member, allowExpire = true) {
  const card = element('article', 'member');
  card.append(element('span', 'avatar', (member.name || member.reference || '?').trim().slice(0, 2).toUpperCase()));
  const content = element('div', 'member-content');
  content.append(element('h3', 'member-name', member.name || 'Member'), element('p', 'member-email', member.email));
  const details = element('div', 'member-details');
  details.append(element('span', 'reference-tag', member.reference));
  if (member.manualActive) {
    const soon = Date.parse(member.manualExpiresAt) - Date.now() <= 7 * 86400000;
    details.append(element('span', `member-state${soon ? ' soon' : ''}`, soon ? 'Ends soon' : 'Active'));
  }
  const expiryLabel = member.manualExpiresAt
    ? `${member.manualActive ? 'Manual access until' : 'Previous expiry'}: ${date(member.manualExpiresAt)}`
    : 'No active manual subscription';
  content.append(details, element('p', 'member-expiry', expiryLabel));
  card.append(content);
  if (allowExpire && member.manualActive) {
    const expire = element('button', 'danger expire-button', 'Expire');
    expire.setAttribute('aria-label', `Expire manual access for ${member.name || member.reference}`);
    expire.addEventListener('click', async () => {
      expire.disabled = true;
      try { showConfirmation(await api('prepare_expire', { userId: member.id }), 'expire'); }
      catch (error) { toast(error.message, true); }
      finally { expire.disabled = false; }
    });
    card.append(expire);
  }
  return card;
}

async function loadMembers(append = false) {
  const requestId = ++pageRequest;
  $('members-status').textContent = 'Loading members…';
  $('reload-members').disabled = true;
  $('load-more').disabled = true;
  try {
    const result = await api('members', { search, cursor: append ? cursor : null });
    if (requestId !== pageRequest || !sessionExpiresAt) return;
    if (!append) $('member-list').replaceChildren();
    for (const member of result.items) $('member-list').append(memberCard(member));
    $('stat-active').textContent = result.stats.active.toLocaleString();
    $('stat-expiring').textContent = result.stats.expiringSoon.toLocaleString();
    cursor = result.nextCursor;
    $('load-more').hidden = !cursor;
    const count = $('member-list').children.length;
    $('members-status').textContent = count ? `${count} ${count === 1 ? 'member' : 'members'} shown${search ? ' for this search' : ''}` : '';
    if (!count) {
      const empty = element('div', 'empty');
      empty.append(element('h3', '', search ? 'No matching members' : 'Your members will appear here'), element('p', '', search ? 'Try a name, email or complete account reference.' : 'Add your first member using their unique account code.'));
      $('member-list').append(empty);
    }
  } catch (error) {
    if (requestId === pageRequest) { $('members-status').textContent = error.message; toast(error.message, true); }
  } finally {
    if (requestId === pageRequest) { $('reload-members').disabled = false; $('load-more').disabled = false; }
  }
}

function setPage(page) {
  for (const name of ['members', 'add']) {
    const selected = page === name;
    $(`${name}-page`).hidden = !selected;
    $(`${name}-tab`).classList.toggle('selected', selected);
    if (selected) $(`${name}-tab`).setAttribute('aria-current', 'page');
    else $(`${name}-tab`).removeAttribute('aria-current');
  }
}

function showConfirmation(result, action) {
  if (!sessionExpiresAt) return;
  pendingConfirmation = { ...result, action };
  const grant = action === 'grant';
  $('confirmation-label').textContent = grant ? 'CONFIRM / 30 DAYS' : 'CONFIRM / EXPIRE';
  $('confirmation-title').textContent = grant ? 'Activate Premium access?' : 'Expire manual access?';
  $('confirmation-description').textContent = grant ? 'Review this account before adding a 30-day manual subscription.' : 'Manual Premium access will end immediately. The account and its subscription record are kept.';
  const info = $('confirmation-member');
  info.replaceChildren(element('strong', '', result.member.name || 'Member'), element('span', '', result.member.email), element('code', '', result.member.reference));
  if (grant) {
    const current = result.member.manualActive ? Date.parse(result.member.manualExpiresAt) : 0;
    const expectedExpiry = new Date(Math.max(Date.now(), current) + 30 * 86400000).toISOString();
    $('confirmation-note').textContent = `${result.member.manualActive ? 'Adds 30 days to the current expiry.' : 'Starts a new 30-day plan.'} New expiry: ${date(expectedExpiry)}.`;
  } else $('confirmation-note').textContent = `Current expiry: ${date(result.member.manualExpiresAt)}.`;
  $('confirmation-error').hidden = true;
  $('confirmation-submit').textContent = grant ? 'Confirm 30 days' : 'Expire access';
  $('confirmation-submit').className = grant ? 'primary' : 'danger';
  $('confirmation-dialog').showModal();
}

async function confirmChange() {
  if (!pendingConfirmation || changingMembership) return;
  const confirmation = pendingConfirmation;
  changingMembership = true;
  $('confirmation-submit').disabled = true;
  $('confirmation-cancel').disabled = true;
  $('confirmation-submit').textContent = 'Saving…';
  $('confirmation-error').hidden = true;
  try {
    const result = await api(confirmation.action, { confirmation: confirmation.confirmation });
    if (!sessionExpiresAt) return;
    pendingConfirmation = null;
    lookupResult = null;
    $('lookup-result').hidden = true;
    $('lookup-result').replaceChildren();
    $('confirmation-dialog').close();
    toast(confirmation.action === 'grant' ? `Premium active until ${date(result.expiresAt)}.` : 'Manual subscription expired.');
    search = '';
    $('search').value = '';
    setPage('members');
    await loadMembers();
  } catch (error) {
    $('confirmation-error').textContent = error.message;
    $('confirmation-error').hidden = false;
  } finally {
    changingMembership = false;
    $('confirmation-submit').disabled = false;
    $('confirmation-cancel').disabled = false;
    $('confirmation-submit').textContent = confirmation.action === 'grant' ? 'Confirm 30 days' : 'Expire access';
  }
}

async function boot() {
  if (!initData) { lock('A private workspace.', 'Open System using the menu button in your Telegram bot. This link does not provide account access.'); return; }
  $('gate-retry').hidden = true;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.('#10121b');
    tg.setBackgroundColor?.('#10121b');
    const { owner } = await api('session');
    sessionExpiresAt = owner.expiresAt;
    $('gate').hidden = true;
    $('workspace').hidden = false;
    $('owner-tag').hidden = false;
    clearTimeout(expiryTimer);
    expiryTimer = setTimeout(() => lock('Session complete', 'Close System and open it again from the bot to start a fresh session.'), Math.max(0, owner.expiresAt - Date.now()));
    await loadMembers();
  } catch (error) { lock('Workspace unavailable', error.message, true); }
}

$('gate-retry').addEventListener('click', boot);
$('members-tab').addEventListener('click', () => setPage('members'));
$('add-tab').addEventListener('click', () => setPage('add'));
$('reload-members').addEventListener('click', () => void loadMembers());
$('load-more').addEventListener('click', () => void loadMembers(true));
$('search-form').addEventListener('submit', event => { event.preventDefault(); search = $('search').value.trim(); void loadMembers(); });
$('lookup-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('lookup-button').disabled = true;
  $('lookup-button').textContent = 'Finding member…';
  $('lookup-result').hidden = true;
  lookupResult = null;
  try {
    const result = await api('lookup', { reference: $('reference').value.trim().toUpperCase() });
    if (!sessionExpiresAt) return;
    lookupResult = result;
    const panel = $('lookup-result');
    const add = element('button', 'primary', 'Review 30-day subscription');
    add.addEventListener('click', () => { if (lookupResult === result) showConfirmation(result, 'grant'); });
    panel.replaceChildren(element('span', 'step-label', '02 / CONFIRM MEMBER'), memberCard(result.member, false), element('p', 'lookup-note', result.member.manualActive ? 'This account already has manual access. Confirming adds 30 days to its current expiry.' : 'This account is ready for a new 30-day manual Premium plan.'), add);
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) { toast(error.message, true); }
  finally { $('lookup-button').disabled = false; $('lookup-button').textContent = 'Find member →'; }
});
$('reference').addEventListener('input', () => { lookupResult = null; $('lookup-result').hidden = true; });
$('confirmation-cancel').addEventListener('click', () => { if (!changingMembership) { pendingConfirmation = null; $('confirmation-dialog').close(); } });
$('confirmation-dialog').addEventListener('cancel', event => { if (changingMembership) event.preventDefault(); else pendingConfirmation = null; });
$('confirmation-submit').addEventListener('click', () => void confirmChange());
void boot();
