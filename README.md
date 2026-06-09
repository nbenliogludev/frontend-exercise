# User Directory

Небольшое fullstack-приложение для просмотра большого справочника пользователей. Можно искать людей по имени или фамилии, фильтровать по национальности и хобби, менять сортировку и скроллить список без ручной пагинации.

Проект сделан как монорепозиторий на Yarn workspaces + Lerna:

- `client` — React 19, TypeScript, Vite, React Router, Tailwind CSS, TanStack Query, TanStack Virtual.
- `server` — Node.js, Express, TypeScript, SQLite, TypeORM.

## Что умеет

- Поиск по `first_name` и `last_name` с debounce: запрос уходит через 350 мс после остановки ввода.
- Фильтр по nationalities с OR-логикой: подходит любая выбранная национальность.
- Фильтр по hobbies с AND-логикой: пользователь должен иметь все выбранные хобби.
- Совместное применение поиска, hobbies и nationalities.
- Сортировка по `first_name`, `last_name`, `age`, `nationality`.
- Детерминированная сортировка: `id` используется как финальный tie-breaker.
- Бесконечная прокрутка на клиенте поверх постраничного API.
- Виртуализированный список карточек, чтобы большой список оставался плавным.
- Sidebar с top-20 hobbies и top-20 nationalities для текущего набора результатов.
- Состояние фильтров в URL: ссылку можно обновить, открыть заново или отправить кому-то ещё.

## Быстрый старт

Нужны Node.js 20+ и Yarn 1.x. Если Yarn не включён глобально, можно включить его через Corepack:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
```

Установить зависимости:

```bash
yarn install
```

Создать и заполнить SQLite-базу:

```bash
yarn workspace frontend-server seed
```

Запустить backend и frontend в dev-режиме:

```bash
yarn dev
```

После запуска:

- frontend: http://localhost:5173/users
- backend healthcheck: http://localhost:3001/api/health
- users API: http://localhost:3001/api/users

SQLite-файл создаётся в `server/data/users.sqlite`. Если хочется пересобрать данные с нуля, удалите этот файл и снова запустите seed-команду.

## Docker Compose

Нужен запущенный Docker Desktop или Docker Engine.

Сначала создайте данные в Docker volume:

```bash
docker compose --profile seed run --rm --build seed
```

Затем поднимите приложение:

```bash
docker compose up --build -d backend frontend
```

Открыть приложение:

```text
http://localhost:5173/users
```

Проверить backend:

```bash
curl http://localhost:3001/api/health
```

Остановить контейнеры:

```bash
docker compose down
```

Если нужно удалить и сам SQLite volume с данными:

```bash
docker compose down -v
```

## Полезные команды

```bash
yarn dev
```

Запускает client и server параллельно.

```bash
yarn build
```

Собирает оба workspace.

```bash
yarn typecheck
```

Проверяет TypeScript в client и server.

```bash
yarn workspace frontend-server seed
```

Пересоздаёт SQLite-данные для локального запуска.

```bash
yarn workspace frontend-server test
```

Запускает unit-тесты сервера (парсинг запроса, фильтрация, сортировка, пагинация, facets).

## API

### `GET /api/health`

Простой healthcheck:

```json
{
  "status": "ok"
}
```

### `GET /api/users`

Возвращает пользователей, метаданные пагинации и facet-счётчики.

Query params:

| Param | Example | Description |
| --- | --- | --- |
| `page` | `1` | Номер страницы. По умолчанию `1`. |
| `limit` | `40` | Размер страницы. Максимум `100`. |
| `q` | `ann` | Поиск по имени и фамилии. |
| `hobbies` | `Yoga,Photography` | Пользователь должен иметь все выбранные hobbies. |
| `nationalities` | `Canadian,Turkish` | Пользователь должен иметь любую из выбранных nationalities. |
| `sortBy` | `last_name` | `first_name`, `last_name`, `age`, `nationality`. |
| `sortDir` | `asc` | `asc` или `desc`. |

Пример:

```bash
curl "http://localhost:3001/api/users?q=el&hobbies=Yoga&nationalities=Turkish&sortBy=age&sortDir=desc&page=1&limit=20"
```

Форма ответа:

```json
{
  "data": [
    {
      "id": 1,
      "avatar": "https://...",
      "first_name": "Elena",
      "last_name": "Chen",
      "age": 32,
      "nationality": "Turkish",
      "hobbies": ["Photography", "Yoga"]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "q": "el",
    "hobbies": ["Yoga"],
    "nationalities": ["Turkish"],
    "sortBy": "age",
    "sortDir": "desc"
  },
  "facets": {
    "hobbies": [{ "value": "Yoga", "count": 12 }, { "value": "Photography", "count": 8 }],
    "nationalities": [{ "value": "American", "count": 18 }, { "value": "Turkish", "count": 15 }]
  }
}
```

Facet-счётчики используют разную логику в зависимости от типа фильтра:

- **Hobby facets** (AND-логика) считаются **с учётом** текущего hobby-фильтра, а также `q` и `nationalities`. Счётчик отвечает на вопрос «сколько человек останется в текущем наборе результатов, если я добавлю ещё это хобби?». Например, выбрав `Yoga`, видишь `Running: 65` — ровно столько людей будет в результате при выборе `Yoga + Running`.
- **Nationality facets** (OR-логика) считаются **без** текущего nationality-фильтра, но с `q` и `hobbies`. Счётчик отвечает на вопрос «сколько человек этой национальности соответствуют остальным фильтрам?». Например, выбрав `Turkish`, по-прежнему видишь `French: 89` — ровно столько French-пользователей появится в результате, если добавить `French` к выборке.

Такое поведение sidebar-а называется disjunctive faceting и делает его полезным навигатором: счётчики подсказывают, что произойдёт при каждом следующем клике.

## Как устроены данные

В базе есть две основные сущности:

- `User`
- `Hobby`

Связь между ними many-to-many через таблицу `user_hobbies`. У пользователя может быть от 0 до 10 hobbies.

Seed-команда создаёт большой набор пользователей, чтобы были заметны:

- пагинация;
- бесконечная прокрутка;
- сортировка;
- facet-счётчики;
- комбинированные фильтры.

## URL state

Клиент хранит состояние экрана в query string:

```text
/users?q=el&hobbies=Yoga&nationalities=Turkish&sortBy=age&sortDir=desc
```

В URL попадают:

- `q`
- `hobbies`
- `nationalities`
- `sortBy`
- `sortDir`

Поэтому после reload открывается тот же экран: поиск, фильтры и сортировка восстанавливаются из адресной строки.
