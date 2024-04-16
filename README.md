# Project Overview
This project provides a detailed exploration of the role and core functionalities of AMM within the system architecture through practical demonstrations. By examining the code related to Redis subscriptions within the project, you can gain insight into the key operational mechanisms of the cross-chain process, understand the controllable workflow aspects for a Liquidity Provider (LP), and learn how to coordinate other subsystems to fulfill LP tasks.

# Key Components & Features
* Cross-Chain AMM: Demonstrates the workings of an AMM in a cross-chain environment, involving interactions and management of multiple on-chain assets.

* DEX Balances: Simulates the balance state of liquidity pools within a decentralized exchange (DEX), ensuring sufficient tokens are available for user swaps.

* CEX Balances: Synchronizes the account balances from a centralized exchange (CEX) to the local system for balance checks during order execution.

* Trading Engine: Incorporates a trading simulation module, showcasing how AMM employs CEX hedging strategies during token swaps.

# Workflow Management
The workflow management portion encompasses the following stages:

* Quoting: Retrieving real-time quotes provided by the AMM.

* Locking Prices: Users accept a given quote and lock in trade terms.

* Confirming Exchanges: Finalizing asset swaps, including cross-chain asset transfers and hedging operations.

# Quote Structure
A valid quote structure is as follows:

```js
{
  "origTotalPrice": "",
  "price": "", // return this.calculate(item, price);
  "origPrice": "", // Original currency quote, used to calculate the price after slippage
  "dst_usd_price": "", // Destination token/stablecoin price
  "min_amount": "", // Minimum required input amount
  "gas": "0",
  "capacity": `0x${(50000000000000000000000).toString(16)}`, // Maximum supply the system can provide
  "native_token_price": "0", // Source token/Target Chain Coin Price
  "native_token_usdt_price": "0", // Target Chain Coin Price/USDT
  "native_token_max": "1", // Maximum native_token exchange amount
  "native_token_min": "0.1", // Minimum exchange amount
  "timestamp": new Date().getTime(), // Timestamp of the quote
  "quote_hash": "", // Unique hash of the quote
}
```

This quote structure encapsulates the essential economic parameters and status information necessary for LPs and users to make informed decisions during token swaps.