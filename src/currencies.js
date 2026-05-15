// ============================================================================
// БАЗА ВАЛЮТ kogDA
// Полная база ISO 4217: 180 валют + русские имена + алиасы для поиска
//
// Используется в Settings.js, ServiceModal.js, Services.js
// Backend принимает любой 2-5 латинских букв код (валидация в settings.js и meetings.js)
//
// Структура:
//   code: ISO 4217 трёхбуквенный код (UPPERCASE)
//   symbol: знак валюты (если есть; для редких — пусто или сам код)
//   label: компактное "₽ RUB" для свёрнутой строки
//   name: полное русское имя для подсказки в списке
//   aliases: массив строк для поиска (русские слова + английские + символы)
// ============================================================================

// Популярные — показываются по умолчанию когда поиск пустой
export const POPULAR_CODES = ['RUB', 'USD', 'EUR', 'UAH', 'KZT']

export const CURRENCIES = [
  // СНГ и ближайший круг
  { code: 'RUB', symbol: '₽',  label: '₽ RUB',  name: 'Российский рубль',         aliases: ['рубль', 'рубли', 'руб', 'российский', 'россия', 'rub'] },
  { code: 'UAH', symbol: '₴',  label: '₴ UAH',  name: 'Украинская гривна',        aliases: ['гривна', 'гривны', 'грн', 'украина', 'украинская', 'uah'] },
  { code: 'BYN', symbol: 'Br', label: 'Br BYN', name: 'Белорусский рубль',        aliases: ['белорусский рубль', 'белорусский', 'бел рубль', 'беларусь', 'белор', 'byn'] },
  { code: 'KZT', symbol: '₸',  label: '₸ KZT',  name: 'Казахстанский тенге',      aliases: ['тенге', 'казахстан', 'казах', 'kzt'] },
  { code: 'KGS', symbol: 'с',  label: 'с KGS',  name: 'Кыргызский сом',           aliases: ['сом', 'кыргызский сом', 'киргизский', 'кыргызстан', 'киргизия', 'kgs'] },
  { code: 'UZS', symbol: 'сўм',label: 'UZS',    name: 'Узбекский сум',            aliases: ['сум', 'сўм', 'узбекский', 'узбекистан', 'uzs'] },
  { code: 'TJS', symbol: 'смн',label: 'TJS',    name: 'Таджикский сомони',        aliases: ['сомони', 'таджикский', 'таджикистан', 'tjs'] },
  { code: 'TMT', symbol: 'm',  label: 'TMT',    name: 'Туркменский манат',        aliases: ['туркменский манат', 'туркменистан', 'туркмения', 'tmt'] },
  { code: 'MDL', symbol: 'L',  label: 'L MDL',  name: 'Молдавский лей',           aliases: ['молдавский лей', 'молдавия', 'молдова', 'mdl'] },
  { code: 'AMD', symbol: '֏',  label: '֏ AMD',  name: 'Армянский драм',           aliases: ['драм', 'армянский', 'армения', 'amd'] },
  { code: 'GEL', symbol: '₾',  label: '₾ GEL',  name: 'Грузинский лари',          aliases: ['лари', 'грузинский', 'грузия', 'gel'] },
  { code: 'AZN', symbol: '₼',  label: '₼ AZN',  name: 'Азербайджанский манат',    aliases: ['манат', 'азербайджанский', 'азербайджан', 'azn'] },

  // США, Канада, другие англоязычные доллары
  { code: 'USD', symbol: '$',   label: '$ USD',   name: 'Доллар США',             aliases: ['доллар', 'доллары', 'американский', 'американ', 'сша', 'usa', 'usd', '$'] },
  { code: 'CAD', symbol: 'C$',  label: 'C$ CAD',  name: 'Канадский доллар',       aliases: ['канадский доллар', 'канада', 'канадский', 'cad'] },
  { code: 'AUD', symbol: 'A$',  label: 'A$ AUD',  name: 'Австралийский доллар',   aliases: ['австралийский доллар', 'австралия', 'австралийский', 'aud'] },
  { code: 'NZD', symbol: 'NZ$', label: 'NZ$ NZD', name: 'Новозеландский доллар',  aliases: ['новозеландский доллар', 'новая зеландия', 'нзд', 'nzd'] },

  // Европа
  { code: 'EUR', symbol: '€',  label: '€ EUR',  name: 'Евро',                     aliases: ['евро', 'eur', '€'] },
  { code: 'GBP', symbol: '£',  label: '£ GBP',  name: 'Фунт стерлингов',          aliases: ['фунт', 'фунты', 'стерлинг', 'британский', 'англия', 'великобритания', 'gbp'] },
  { code: 'CHF', symbol: 'Fr', label: 'CHF',    name: 'Швейцарский франк',        aliases: ['швейцарский франк', 'швейцария', 'франк', 'chf'] },
  { code: 'SEK', symbol: 'kr', label: 'SEK',    name: 'Шведская крона',           aliases: ['шведская крона', 'швеция', 'sek'] },
  { code: 'NOK', symbol: 'kr', label: 'NOK',    name: 'Норвежская крона',         aliases: ['норвежская крона', 'норвегия', 'nok'] },
  { code: 'DKK', symbol: 'kr', label: 'DKK',    name: 'Датская крона',            aliases: ['датская крона', 'дания', 'dkk'] },
  { code: 'ISK', symbol: 'kr', label: 'ISK',    name: 'Исландская крона',         aliases: ['исландская крона', 'исландия', 'isk'] },
  { code: 'PLN', symbol: 'zł', label: 'zł PLN', name: 'Польский злотый',          aliases: ['злотый', 'польский', 'польша', 'pln'] },
  { code: 'CZK', symbol: 'Kč', label: 'CZK',    name: 'Чешская крона',            aliases: ['чешская крона', 'чехия', 'czk'] },
  { code: 'HUF', symbol: 'Ft', label: 'HUF',    name: 'Венгерский форинт',        aliases: ['форинт', 'венгерский', 'венгрия', 'huf'] },
  { code: 'RON', symbol: 'lei',label: 'RON',    name: 'Румынский лей',            aliases: ['румынский лей', 'румыния', 'ron'] },
  { code: 'BGN', symbol: 'лв', label: 'BGN',    name: 'Болгарский лев',           aliases: ['лев', 'болгарский', 'болгария', 'bgn'] },
  { code: 'HRK', symbol: 'kn', label: 'HRK',    name: 'Хорватская куна',          aliases: ['куна', 'хорватия', 'хорватский', 'hrk'] },
  { code: 'RSD', symbol: 'дин',label: 'RSD',    name: 'Сербский динар',           aliases: ['сербский динар', 'сербия', 'rsd'] },
  { code: 'BAM', symbol: 'KM', label: 'BAM',    name: 'Боснийская марка',         aliases: ['боснийская марка', 'босния', 'bam'] },
  { code: 'MKD', symbol: 'ден',label: 'MKD',    name: 'Македонский денар',        aliases: ['денар', 'македонский', 'македония', 'mkd'] },
  { code: 'ALL', symbol: 'L',  label: 'ALL',    name: 'Албанский лек',            aliases: ['лек', 'албанский', 'албания', 'all'] },
  { code: 'TRY', symbol: '₺',  label: '₺ TRY',  name: 'Турецкая лира',            aliases: ['лира', 'турецкая лира', 'турция', 'турецкий', 'try'] },

  // Ближний Восток
  { code: 'ILS', symbol: '₪',  label: '₪ ILS',  name: 'Израильский шекель',       aliases: ['шекель', 'шекели', 'израильский', 'израиль', 'ils'] },
  { code: 'AED', symbol: 'AED',label: 'AED',    name: 'Дирхам ОАЭ',               aliases: ['дирхам', 'оаэ', 'эмират', 'дубай', 'aed'] },
  { code: 'SAR', symbol: 'ر.س',label: 'SAR',    name: 'Саудовский риял',          aliases: ['саудовский риял', 'саудовская аравия', 'sar'] },
  { code: 'QAR', symbol: 'ر.ق',label: 'QAR',    name: 'Катарский риал',           aliases: ['катарский риал', 'катар', 'qar'] },
  { code: 'BHD', symbol: 'BD', label: 'BHD',    name: 'Бахрейнский динар',        aliases: ['бахрейнский динар', 'бахрейн', 'bhd'] },
  { code: 'KWD', symbol: 'KD', label: 'KWD',    name: 'Кувейтский динар',         aliases: ['кувейтский динар', 'кувейт', 'kwd'] },
  { code: 'OMR', symbol: 'ر.ع',label: 'OMR',    name: 'Оманский риал',            aliases: ['оманский риал', 'оман', 'omr'] },
  { code: 'JOD', symbol: 'JD', label: 'JOD',    name: 'Иорданский динар',         aliases: ['иорданский динар', 'иордания', 'jod'] },
  { code: 'LBP', symbol: 'ل.ل',label: 'LBP',    name: 'Ливанский фунт',           aliases: ['ливанский фунт', 'ливан', 'lbp'] },
  { code: 'SYP', symbol: '£S', label: 'SYP',    name: 'Сирийский фунт',           aliases: ['сирийский фунт', 'сирия', 'syp'] },
  { code: 'IQD', symbol: 'ع.د',label: 'IQD',    name: 'Иракский динар',           aliases: ['иракский динар', 'ирак', 'iqd'] },
  { code: 'IRR', symbol: '﷼',  label: 'IRR',    name: 'Иранский риал',            aliases: ['иранский риал', 'иран', 'irr'] },
  { code: 'YER', symbol: '﷼',  label: 'YER',    name: 'Йеменский риал',           aliases: ['йеменский риал', 'йемен', 'yer'] },

  // Азия
  { code: 'CNY', symbol: '¥',  label: '¥ CNY',  name: 'Китайский юань',           aliases: ['юань', 'китайский', 'китай', 'cny', 'rmb', 'жэньминьби'] },
  { code: 'JPY', symbol: '¥',  label: '¥ JPY',  name: 'Японская йена',            aliases: ['йена', 'иена', 'японская', 'япония', 'jpy'] },
  { code: 'KRW', symbol: '₩',  label: '₩ KRW',  name: 'Южнокорейская вона',       aliases: ['вона', 'южнокорейская', 'корея', 'южная корея', 'krw'] },
  { code: 'KPW', symbol: '₩',  label: 'KPW',    name: 'Северокорейская вона',     aliases: ['северокорейская вона', 'северная корея', 'kpw'] },
  { code: 'HKD', symbol: 'HK$',label: 'HK$ HKD',name: 'Гонконгский доллар',       aliases: ['гонконгский доллар', 'гонконг', 'hkd'] },
  { code: 'TWD', symbol: 'NT$',label: 'NT$ TWD',name: 'Тайваньский доллар',       aliases: ['тайваньский доллар', 'тайвань', 'twd'] },
  { code: 'SGD', symbol: 'S$', label: 'S$ SGD', name: 'Сингапурский доллар',      aliases: ['сингапурский доллар', 'сингапур', 'sgd'] },
  { code: 'MYR', symbol: 'RM', label: 'RM MYR', name: 'Малайзийский ринггит',     aliases: ['ринггит', 'малайзийский', 'малайзия', 'myr'] },
  { code: 'THB', symbol: '฿',  label: '฿ THB',  name: 'Тайский бат',              aliases: ['бат', 'таиланд', 'тайланд', 'тайский', 'thb'] },
  { code: 'VND', symbol: '₫',  label: '₫ VND',  name: 'Вьетнамский донг',         aliases: ['донг', 'вьетнамский', 'вьетнам', 'vnd'] },
  { code: 'IDR', symbol: 'Rp', label: 'Rp IDR', name: 'Индонезийская рупия',      aliases: ['индонезийская рупия', 'индонезия', 'idr'] },
  { code: 'PHP', symbol: '₱',  label: '₱ PHP',  name: 'Филиппинский песо',        aliases: ['филиппинский песо', 'филиппины', 'php'] },
  { code: 'INR', symbol: '₹',  label: '₹ INR',  name: 'Индийская рупия',          aliases: ['рупия', 'индийская', 'индия', 'inr'] },
  { code: 'PKR', symbol: '₨',  label: 'PKR',    name: 'Пакистанская рупия',       aliases: ['пакистанская рупия', 'пакистан', 'pkr'] },
  { code: 'BDT', symbol: '৳',  label: '৳ BDT',  name: 'Бангладешская така',       aliases: ['така', 'бангладешская', 'бангладеш', 'bdt'] },
  { code: 'LKR', symbol: 'Rs', label: 'LKR',    name: 'Шри-ланкийская рупия',     aliases: ['шри-ланкийская рупия', 'шри ланка', 'lkr'] },
  { code: 'NPR', symbol: 'Rs', label: 'NPR',    name: 'Непальская рупия',         aliases: ['непальская рупия', 'непал', 'npr'] },
  { code: 'AFN', symbol: '؋',  label: 'AFN',    name: 'Афганский афгани',         aliases: ['афгани', 'афганский', 'афганистан', 'afn'] },
  { code: 'MMK', symbol: 'K',  label: 'MMK',    name: 'Мьянманский кьят',         aliases: ['кьят', 'мьянманский', 'мьянма', 'бирма', 'mmk'] },
  { code: 'KHR', symbol: '៛',  label: 'KHR',    name: 'Камбоджийский риель',      aliases: ['риель', 'камбоджийский', 'камбоджа', 'khr'] },
  { code: 'LAK', symbol: '₭',  label: 'LAK',    name: 'Лаосский кип',             aliases: ['кип', 'лаосский', 'лаос', 'lak'] },
  { code: 'BND', symbol: 'B$', label: 'BND',    name: 'Брунейский доллар',        aliases: ['брунейский доллар', 'бруней', 'bnd'] },
  { code: 'MNT', symbol: '₮',  label: '₮ MNT',  name: 'Монгольский тугрик',       aliases: ['тугрик', 'монгольский', 'монголия', 'mnt'] },
  { code: 'BTN', symbol: 'Nu', label: 'BTN',    name: 'Бутанский нгултрум',       aliases: ['нгултрум', 'бутанский', 'бутан', 'btn'] },
  { code: 'MOP', symbol: 'P',  label: 'MOP',    name: 'Патака Макао',             aliases: ['патака', 'макао', 'mop'] },
  { code: 'MVR', symbol: 'Rf', label: 'MVR',    name: 'Мальдивская руфия',        aliases: ['руфия', 'мальдивская', 'мальдивы', 'mvr'] },

  // Латинская Америка
  { code: 'MXN', symbol: '$',  label: '$ MXN',  name: 'Мексиканский песо',        aliases: ['мексиканский песо', 'мексика', 'mxn'] },
  { code: 'BRL', symbol: 'R$', label: 'R$ BRL', name: 'Бразильский реал',         aliases: ['реал', 'бразильский', 'бразилия', 'brl'] },
  { code: 'ARS', symbol: '$',  label: '$ ARS',  name: 'Аргентинский песо',        aliases: ['аргентинский песо', 'аргентина', 'ars'] },
  { code: 'CLP', symbol: '$',  label: '$ CLP',  name: 'Чилийский песо',           aliases: ['чилийский песо', 'чили', 'clp'] },
  { code: 'COP', symbol: '$',  label: '$ COP',  name: 'Колумбийский песо',        aliases: ['колумбийский песо', 'колумбия', 'cop'] },
  { code: 'PEN', symbol: 'S/', label: 'PEN',    name: 'Перуанский соль',          aliases: ['соль', 'перуанский', 'перу', 'pen'] },
  { code: 'UYU', symbol: '$U', label: 'UYU',    name: 'Уругвайский песо',         aliases: ['уругвайский песо', 'уругвай', 'uyu'] },
  { code: 'PYG', symbol: '₲',  label: '₲ PYG',  name: 'Парагвайский гуарани',     aliases: ['гуарани', 'парагвайский', 'парагвай', 'pyg'] },
  { code: 'BOB', symbol: 'Bs', label: 'BOB',    name: 'Боливийский боливиано',    aliases: ['боливиано', 'боливийский', 'боливия', 'bob'] },
  { code: 'VES', symbol: 'Bs', label: 'VES',    name: 'Венесуэльский боливар',    aliases: ['боливар', 'венесуэльский', 'венесуэла', 'ves'] },
  { code: 'GTQ', symbol: 'Q',  label: 'GTQ',    name: 'Гватемальский кетсаль',    aliases: ['кетсаль', 'гватемальский', 'гватемала', 'gtq'] },
  { code: 'HNL', symbol: 'L',  label: 'HNL',    name: 'Гондурасская лемпира',     aliases: ['лемпира', 'гондурас', 'hnl'] },
  { code: 'NIO', symbol: 'C$', label: 'NIO',    name: 'Никарагуанская кордоба',   aliases: ['кордоба', 'никарагуа', 'nio'] },
  { code: 'CRC', symbol: '₡',  label: '₡ CRC',  name: 'Костариканский колон',     aliases: ['колон', 'коста-рика', 'коста рика', 'crc'] },
  { code: 'PAB', symbol: 'B/.',label: 'PAB',    name: 'Панамский бальбоа',        aliases: ['бальбоа', 'панама', 'pab'] },
  { code: 'DOP', symbol: 'RD$',label: 'DOP',    name: 'Доминиканский песо',       aliases: ['доминиканский песо', 'доминикана', 'dop'] },
  { code: 'CUP', symbol: '$',  label: '$ CUP',  name: 'Кубинский песо',           aliases: ['кубинский песо', 'куба', 'cup'] },
  { code: 'HTG', symbol: 'G',  label: 'HTG',    name: 'Гаитянский гурд',          aliases: ['гурд', 'гаитянский', 'гаити', 'htg'] },
  { code: 'JMD', symbol: 'J$', label: 'JMD',    name: 'Ямайский доллар',          aliases: ['ямайский доллар', 'ямайка', 'jmd'] },
  { code: 'TTD', symbol: 'TT$',label: 'TTD',    name: 'Доллар Тринидада и Тобаго',aliases: ['доллар тринидада', 'тринидад', 'тобаго', 'ttd'] },
  { code: 'BBD', symbol: 'Bds$',label: 'BBD',   name: 'Барбадосский доллар',      aliases: ['барбадосский доллар', 'барбадос', 'bbd'] },
  { code: 'BSD', symbol: 'B$', label: 'BSD',    name: 'Багамский доллар',         aliases: ['багамский доллар', 'багамы', 'bsd'] },
  { code: 'BZD', symbol: 'BZ$',label: 'BZD',    name: 'Белизский доллар',         aliases: ['белизский доллар', 'белиз', 'bzd'] },
  { code: 'BMD', symbol: 'BD$',label: 'BMD',    name: 'Бермудский доллар',        aliases: ['бермудский доллар', 'бермуды', 'bmd'] },
  { code: 'KYD', symbol: 'CI$',label: 'KYD',    name: 'Доллар Каймановых островов', aliases: ['доллар каймановых островов', 'каймановы', 'kyd'] },
  { code: 'AWG', symbol: 'ƒ',  label: 'AWG',    name: 'Арубанский флорин',        aliases: ['арубанский флорин', 'аруба', 'awg'] },
  { code: 'ANG', symbol: 'ƒ',  label: 'ANG',    name: 'Антильский гульден',       aliases: ['антильский гульден', 'кюрасао', 'ang'] },
  { code: 'XCD', symbol: 'EC$',label: 'XCD',    name: 'Восточно-карибский доллар',aliases: ['восточно-карибский доллар', 'карибский', 'xcd'] },
  { code: 'GYD', symbol: 'G$', label: 'GYD',    name: 'Гайанский доллар',         aliases: ['гайанский доллар', 'гайана', 'gyd'] },
  { code: 'SRD', symbol: 'Sr$',label: 'SRD',    name: 'Суринамский доллар',       aliases: ['суринамский доллар', 'суринам', 'srd'] },

  // Африка
  { code: 'ZAR', symbol: 'R',  label: 'R ZAR',  name: 'Южноафриканский ранд',     aliases: ['ранд', 'рэнд', 'южноафриканский', 'юар', 'zar'] },
  { code: 'EGP', symbol: 'ج.م',label: 'EGP',    name: 'Египетский фунт',          aliases: ['египетский фунт', 'египет', 'egp'] },
  { code: 'NGN', symbol: '₦',  label: '₦ NGN',  name: 'Нигерийская найра',        aliases: ['найра', 'нигерийская', 'нигерия', 'ngn'] },
  { code: 'KES', symbol: 'KSh',label: 'KES',    name: 'Кенийский шиллинг',        aliases: ['кенийский шиллинг', 'кения', 'kes'] },
  { code: 'GHS', symbol: '₵',  label: '₵ GHS',  name: 'Ганский седи',             aliases: ['седи', 'ганский', 'гана', 'ghs'] },
  { code: 'MAD', symbol: 'د.م',label: 'MAD',    name: 'Марокканский дирхам',      aliases: ['марокканский дирхам', 'марокко', 'mad'] },
  { code: 'TND', symbol: 'د.ت',label: 'TND',    name: 'Тунисский динар',          aliases: ['тунисский динар', 'тунис', 'tnd'] },
  { code: 'DZD', symbol: 'دج', label: 'DZD',    name: 'Алжирский динар',          aliases: ['алжирский динар', 'алжир', 'dzd'] },
  { code: 'LYD', symbol: 'ل.د',label: 'LYD',    name: 'Ливийский динар',          aliases: ['ливийский динар', 'ливия', 'lyd'] },
  { code: 'SDG', symbol: 'ج.س',label: 'SDG',    name: 'Суданский фунт',           aliases: ['суданский фунт', 'судан', 'sdg'] },
  { code: 'ETB', symbol: 'Br', label: 'ETB',    name: 'Эфиопский быр',            aliases: ['быр', 'эфиопский', 'эфиопия', 'etb'] },
  { code: 'UGX', symbol: 'USh',label: 'UGX',    name: 'Угандийский шиллинг',      aliases: ['угандийский шиллинг', 'уганда', 'ugx'] },
  { code: 'TZS', symbol: 'TSh',label: 'TZS',    name: 'Танзанийский шиллинг',     aliases: ['танзанийский шиллинг', 'танзания', 'tzs'] },
  { code: 'RWF', symbol: 'FRw',label: 'RWF',    name: 'Руандийский франк',        aliases: ['руандийский франк', 'руанда', 'rwf'] },
  { code: 'BIF', symbol: 'FBu',label: 'BIF',    name: 'Бурундийский франк',       aliases: ['бурундийский франк', 'бурунди', 'bif'] },
  { code: 'DJF', symbol: 'Fdj',label: 'DJF',    name: 'Франк Джибути',            aliases: ['франк джибути', 'джибути', 'djf'] },
  { code: 'SOS', symbol: 'Sh', label: 'SOS',    name: 'Сомалийский шиллинг',      aliases: ['сомалийский шиллинг', 'сомали', 'sos'] },
  { code: 'ERN', symbol: 'Nfk',label: 'ERN',    name: 'Эритрейская накфа',        aliases: ['накфа', 'эритрейская', 'эритрея', 'ern'] },
  { code: 'CDF', symbol: 'FC', label: 'CDF',    name: 'Конголезский франк',       aliases: ['конголезский франк', 'конго', 'cdf'] },
  { code: 'XAF', symbol: 'FCFA',label: 'XAF',   name: 'Франк КФА BEAC (Центральная Африка)', aliases: ['франк кфа beac', 'центральная африка', 'xaf'] },
  { code: 'XOF', symbol: 'CFA',label: 'XOF',    name: 'Франк КФА BCEAO (Западная Африка)', aliases: ['франк кфа bceao', 'западная африка', 'xof'] },
  { code: 'GMD', symbol: 'D',  label: 'GMD',    name: 'Гамбийский даласи',        aliases: ['даласи', 'гамбийский', 'гамбия', 'gmd'] },
  { code: 'GNF', symbol: 'FG', label: 'GNF',    name: 'Гвинейский франк',         aliases: ['гвинейский франк', 'гвинея', 'gnf'] },
  { code: 'SLL', symbol: 'Le', label: 'SLL',    name: 'Сьерра-леонский леоне',    aliases: ['леоне', 'сьерра леоне', 'sll'] },
  { code: 'LRD', symbol: 'L$', label: 'LRD',    name: 'Либерийский доллар',       aliases: ['либерийский доллар', 'либерия', 'lrd'] },
  { code: 'CVE', symbol: '$',  label: 'CVE',    name: 'Эскудо Кабо-Верде',        aliases: ['эскудо кабо-верде', 'кабо-верде', 'cve'] },
  { code: 'STN', symbol: 'Db', label: 'STN',    name: 'Добра Сан-Томе и Принсипи',aliases: ['добра', 'сан-томе', 'stn'] },
  { code: 'AOA', symbol: 'Kz', label: 'AOA',    name: 'Ангольская кванза',        aliases: ['кванза', 'ангольская', 'ангола', 'aoa'] },
  { code: 'NAD', symbol: 'N$', label: 'NAD',    name: 'Намибийский доллар',       aliases: ['намибийский доллар', 'намибия', 'nad'] },
  { code: 'BWP', symbol: 'P',  label: 'BWP',    name: 'Ботсванская пула',         aliases: ['пула', 'ботсванская', 'ботсвана', 'bwp'] },
  { code: 'ZMW', symbol: 'ZK', label: 'ZMW',    name: 'Замбийская квача',         aliases: ['квача', 'замбийская', 'замбия', 'zmw'] },
  { code: 'MWK', symbol: 'MK', label: 'MWK',    name: 'Малавийская квача',        aliases: ['малавийская квача', 'малави', 'mwk'] },
  { code: 'MZN', symbol: 'MT', label: 'MZN',    name: 'Мозамбикский метикал',     aliases: ['метикал', 'мозамбикский', 'мозамбик', 'mzn'] },
  { code: 'ZWL', symbol: 'Z$', label: 'ZWL',    name: 'Зимбабвийский доллар',     aliases: ['зимбабвийский доллар', 'зимбабве', 'zwl'] },
  { code: 'LSL', symbol: 'L',  label: 'LSL',    name: 'Лоти Лесото',              aliases: ['лоти', 'лесото', 'lsl'] },
  { code: 'SZL', symbol: 'E',  label: 'SZL',    name: 'Свазилендский лилангени',  aliases: ['лилангени', 'свазиленд', 'эсватини', 'szl'] },
  { code: 'MGA', symbol: 'Ar', label: 'MGA',    name: 'Малагасийский ариари',     aliases: ['ариари', 'малагасийский', 'мадагаскар', 'mga'] },
  { code: 'KMF', symbol: 'CF', label: 'KMF',    name: 'Коморский франк',          aliases: ['коморский франк', 'коморы', 'kmf'] },
  { code: 'SCR', symbol: '₨',  label: 'SCR',    name: 'Сейшельская рупия',        aliases: ['сейшельская рупия', 'сейшелы', 'scr'] },
  { code: 'MUR', symbol: '₨',  label: 'MUR',    name: 'Маврикийская рупия',       aliases: ['маврикийская рупия', 'маврикий', 'mur'] },
  { code: 'SHP', symbol: '£',  label: 'SHP',    name: 'Фунт Святой Елены',        aliases: ['фунт святой елены', 'святая елена', 'shp'] },

  // Океания
  { code: 'FJD', symbol: 'FJ$',label: 'FJD',    name: 'Доллар Фиджи',             aliases: ['доллар фиджи', 'фиджи', 'fjd'] },
  { code: 'PGK', symbol: 'K',  label: 'PGK',    name: 'Папуа-новогвинейская кина',aliases: ['кина', 'папуа', 'pgk'] },
  { code: 'SBD', symbol: 'SI$',label: 'SBD',    name: 'Доллар Соломоновых островов', aliases: ['доллар соломоновых островов', 'соломоновы', 'sbd'] },
  { code: 'VUV', symbol: 'VT', label: 'VUV',    name: 'Вату Вануату',             aliases: ['вату', 'вануату', 'vuv'] },
  { code: 'WST', symbol: 'WS$',label: 'WST',    name: 'Самоанская тала',          aliases: ['тала', 'самоанская', 'самоа', 'wst'] },
  { code: 'TOP', symbol: 'T$', label: 'TOP',    name: 'Паанга Тонги',             aliases: ['паанга', 'тонга', 'top'] },
  { code: 'XPF', symbol: '₣',  label: 'XPF',    name: 'Французский тихоокеанский франк', aliases: ['тихоокеанский франк', 'французская полинезия', 'xpf'] },

  // Островные фунты
  { code: 'GIP', symbol: '£',  label: 'GIP',    name: 'Гибралтарский фунт',       aliases: ['гибралтарский фунт', 'гибралтар', 'gip'] },
  { code: 'FKP', symbol: '£',  label: 'FKP',    name: 'Фунт Фолклендских островов',aliases: ['фунт фолклендских', 'фолкленды', 'fkp'] },
  { code: 'IMP', symbol: '£',  label: 'IMP',    name: 'Мэнский фунт',             aliases: ['мэнский фунт', 'остров мэн', 'imp'] },
  { code: 'JEP', symbol: '£',  label: 'JEP',    name: 'Джерсийский фунт',         aliases: ['джерсийский фунт', 'джерси', 'jep'] },
  { code: 'GGP', symbol: '£',  label: 'GGP',    name: 'Гернсийский фунт',         aliases: ['гернсийский фунт', 'гернси', 'ggp'] },

  // Криптовалюты
  { code: 'BTC', symbol: '₿',  label: '₿ BTC',  name: 'Биткоин',                  aliases: ['биткоин', 'биткойн', 'бтк', 'btc'] },
  { code: 'ETH', symbol: 'Ξ',  label: 'Ξ ETH',  name: 'Эфириум',                  aliases: ['эфириум', 'эфир', 'eth'] },
  { code: 'USDT',symbol: '₮',  label: 'USDT',   name: 'Tether USD',               aliases: ['тезер', 'usdt', 'тетер'] },
  { code: 'USDC',symbol: '$',  label: 'USDC',   name: 'USD Coin',                 aliases: ['usdc'] },
]

// Карта быстрого доступа по коду
const CURRENCY_MAP = new Map(CURRENCIES.map(c => [c.code, c]))

// Поиск валюты по коду
export function findCurrency(code) {
  if (!code) return null
  return CURRENCY_MAP.get(String(code).toUpperCase()) || null
}

// Получить символ. Для legacy OTHER → $. Для неизвестного кода → сам код.
export function getCurrencySymbol(code) {
  if (!code || code === 'OTHER') return '$'
  const c = findCurrency(code)
  if (c) return c.symbol || c.code
  return code
}

// Получить label.
export function getCurrencyLabel(code) {
  if (!code || code === 'OTHER') return '$ USD'
  const c = findCurrency(code)
  if (c) return c.label
  return code
}

// Получить полное имя.
export function getCurrencyName(code) {
  if (!code || code === 'OTHER') return 'Доллар США'
  const c = findCurrency(code)
  if (c) return c.name
  return code
}

// Получить список популярных валют для дефолтного отображения
export function getPopularCurrencies() {
  return POPULAR_CODES.map(code => CURRENCY_MAP.get(code)).filter(Boolean)
}

// Поиск с релевантностью. Возвращает список валют отсортированных по релевантности.
// 100 — точное совпадение с code или алиасом
// 80  — code/alias начинается с query
// 60  — name начинается с query
// 40  — code/alias содержит query
// 20  — name содержит query
export function searchCurrencies(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return CURRENCIES

  const scored = []
  for (const c of CURRENCIES) {
    const code = c.code.toLowerCase()
    const name = c.name.toLowerCase()
    let score = 0

    if (code === q) score = 100
    if (score < 100) {
      for (const a of c.aliases) {
        if (a.toLowerCase() === q) { score = 100; break }
      }
    }
    if (score < 80 && code.startsWith(q)) score = 80
    if (score < 80) {
      for (const a of c.aliases) {
        if (a.toLowerCase().startsWith(q)) { score = 80; break }
      }
    }
    if (score < 60 && name.startsWith(q)) score = 60
    if (score < 40 && code.includes(q)) score = 40
    if (score < 40) {
      for (const a of c.aliases) {
        if (a.toLowerCase().includes(q)) { score = 40; break }
      }
    }
    if (score < 20 && name.includes(q)) score = 20

    if (score > 0) scored.push({ c, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.map(x => x.c)
}