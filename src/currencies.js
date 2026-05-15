// ============================================================================
// СПИСОК ВАЛЮТ для kogDA
// Один источник правды: используется в Settings.js, ServiceModal.js, Services.js
// При добавлении новой валюты — обязательно добавь её в backend whitelist
// (settings.js и meetings.js — ALLOWED_CURRENCIES)
// ============================================================================

export const CURRENCIES = [
  {
    code: 'RUB', symbol: '₽', label: '₽ RUB',
    aliases: ['рубль', 'рубли', 'руб', 'российский', 'россия', 'rub', '₽']
  },
  {
    code: 'UAH', symbol: '₴', label: '₴ UAH',
    aliases: ['гривна', 'гривны', 'грн', 'украина', 'украин', 'uah', '₴']
  },
  {
    code: 'USD', symbol: '$', label: '$ USD',
    aliases: ['доллар', 'доллары', 'американский', 'американ', 'usa', 'usd', '$']
  },
  {
    code: 'EUR', symbol: '€', label: '€ EUR',
    aliases: ['евро', 'eur', '€']
  },
  {
    code: 'KZT', symbol: '₸', label: '₸ KZT',
    aliases: ['тенге', 'казахстан', 'казах', 'kzt', '₸']
  },
  {
    code: 'BYN', symbol: 'Br', label: 'Br BYN',
    aliases: ['белорусский рубль', 'белорусский', 'бел рубль', 'бел руб', 'беларусь', 'белор', 'byn', 'br']
  },
  {
    code: 'ILS', symbol: '₪', label: '₪ ILS',
    aliases: ['шекель', 'шекели', 'израиль', 'израил', 'ils', '₪']
  },
  {
    code: 'GBP', symbol: '£', label: '£ GBP',
    aliases: ['фунт', 'фунты', 'стерлинг', 'британский', 'британ', 'английский', 'англ', 'gbp', '£']
  },
  {
    code: 'GEL', symbol: '₾', label: '₾ GEL',
    aliases: ['лари', 'грузия', 'грузин', 'gel', '₾']
  },
  {
    code: 'AED', symbol: 'AED', label: 'AED',
    aliases: ['дирхам', 'оаэ', 'эмират', 'дубай', 'aed']
  },
  {
    code: 'TRY', symbol: '₺', label: '₺ TRY',
    aliases: ['лира', 'турецкая лира', 'турция', 'турец', 'турк', 'try', '₺']
  },
  {
    code: 'THB', symbol: '฿', label: '฿ THB',
    aliases: ['бат', 'baht', 'тайланд', 'тайск', 'таиланд', 'thb', '฿']
  },
  {
    code: 'AMD', symbol: '֏', label: '֏ AMD',
    aliases: ['драм', 'драмы', 'армения', 'армян', 'amd', '֏']
  },
]

// Список кодов основных валют (без OTHER) — для whitelist
export const CURRENCY_CODES = CURRENCIES.map(c => c.code)

// Поиск валюты по коду
export function findCurrency(code) {
  if (!code) return null
  return CURRENCIES.find(c => c.code === code) || null
}

// Получить символ для отображения цены. Для OTHER кодов (которые не в списке)
// возвращаем сам код (например, "100 KGS").
export function getCurrencySymbol(code) {
  if (!code) return '$' // дефолт USD
  const c = findCurrency(code)
  if (c) return c.symbol || c.code
  // Это custom код вроде KGS, MXN — возвращаем как есть
  return code
}

// Получить label для отображения в строке/превью.
// Для известных валют — "₽ RUB", для custom — сам код.
export function getCurrencyLabel(code) {
  if (!code) return '$ USD'
  const c = findCurrency(code)
  if (c) return c.label
  return code
}

// Поиск валют по строке (для фильтра в выпадающем списке).
// Сравнивает с code, label, aliases (case-insensitive).
// Если query пустой — возвращает все.
export function searchCurrencies(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return CURRENCIES
  return CURRENCIES.filter(c => {
    if (c.code.toLowerCase().includes(q)) return true
    if (c.label.toLowerCase().includes(q)) return true
    return c.aliases.some(a => a.toLowerCase().includes(q))
  })
}

// Проверяет код пользовательской валюты (для OTHER).
// Принимаем 2-5 заглавных букв латиницы — стандарт ISO 4217 расширенный.
export function isValidCustomCurrencyCode(code) {
  if (!code) return false
  const s = String(code).trim().toUpperCase()
  return /^[A-Z]{2,5}$/.test(s)
}

// Нормализация введённого кода: убираем пробелы, переводим в UPPERCASE.
export function normalizeCustomCurrencyCode(code) {
  return String(code || '').trim().toUpperCase()
}