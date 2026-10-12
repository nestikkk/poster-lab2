# Лабораторная работа 2: Poster

Смарт-контракт Poster (Solidity, Hardhat 3) в сети Sepolia и dApp на Next.js + web3.js: публикация постов с тегом, просмотр всех постов, фильтр по тегу.

- Контракт: https://sepolia.etherscan.io/address/0x48F1EB9f061602fC46e8fb7f63Bb4706DE11db5D#code.

## Структура

- `poster-contract/` - контракт, тест, модуль деплоя
- `poster-ui/` - интерфейс

## Запуск интерфейса

Нужны Node.js 22+ и MetaMask (сеть Sepolia).

```bash
cd poster-ui
npm install
npm run dev
```

Открыть http://localhost:3000.
