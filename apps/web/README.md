# @checkout/web — фронтенд магазина

## Запуск

```sh
npm run dev:web          # http://localhost:3000
npm run build:web        # сборка в dist/
npm run preview:web      # превью сборки
```

## Структура

```
src/
  api/
    client.ts        единый HTTP-клиент: request<T>(), ApiError, token
    endpoints.ts     типизированные вызовы API
  hooks/
    useAsync.ts      generic async hook с sequence counter
    usePolling.ts    polling с автоостановкой
  store/
    AppContext.tsx    единый стейт: корзина, заказ, навигация
    session.ts       localStorage persistence
    idempotency.ts   UUID для Idempotency-Key
  pages/
    Catalog.tsx      каталог товаров
    Cart.tsx         корзина с изменением количества
    Checkout.tsx     форма оформления + расчёт доставки
    Payment.tsx      тестовая оплата с sandbox-картами
    Success.tsx      страница успеха
  components/
    ErrorBanner.tsx  отображение ошибок API
    FieldError.tsx   ошибка поля формы
    Money.tsx        форматирование сумм
    Spinner.tsx      индикатор загрузки
  format.ts          formatMoney()
  styles.css         стили, адаптив 390–1280px
```

## Архитектура

- **Один HTTP-клиент** — `request<T>()` в `client.ts`. Все заголовки, парсинг, обработка ошибок в одном месте.
- **Единый AppContext** — состояние приложения, навигация, все API-вызовы через него.
- **ApiError** — единый тип ошибки с `code`, `message`, `fields`. Создаётся в `client.ts`.
- **usePolling** — polling с auto-stop при unmount и terminal status.
- **Восстановление** — token, orderId, paymentId в localStorage; проверка статуса оплаты при reload.
