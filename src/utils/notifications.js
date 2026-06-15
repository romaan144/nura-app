// Web Push Notifications — no server needed for local notifications
// Safari iOS 16.4+, Chrome, Firefox

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function scheduleLocalNotification(title, body, delayMs = 0, icon = '/logo-iso.png') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (delayMs === 0) {
    new Notification(title, { body, icon })
  } else {
    setTimeout(() => new Notification(title, { body, icon }), delayMs)
  }
}

export function scheduleRetentionNotifications(userName = 'tú') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  // 24h reminder if no activity
  scheduleLocalNotification(
    '¿Encontraste lo que buscabas?',
    'Nüra tiene más de 1.200 profesionales verificados esperando.',
    24 * 60 * 60 * 1000
  )
}

export function notifyServiceConfirmed(helperName) {
  scheduleLocalNotification(
    '✅ Solicitud enviada',
    `${helperName} recibirá tu solicitud y te confirmará en breve.`
  )
}

export function notifySearchComplete(count, specialty) {
  scheduleLocalNotification(
    `${count} profesionales encontrados`,
    `Nüra encontró ${count} ${specialty || 'profesionales'} cerca de ti.`
  )
}
