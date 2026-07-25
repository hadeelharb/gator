# Gator 🐊 - RSS Feed Aggregator

A light-weight, type-safe CLI RSS feed aggregator built with **TypeScript**, **Node.js**, **PostgreSQL**, and **Drizzle ORM**.

`Gator` allows users to manage and follow RSS feeds across the internet, fetch new posts periodically, and read/browse post summaries directly from their terminal.

---

## 🚀 Features

- **User Management**: Register and switch active CLI user accounts easily.
- **Feed Aggregation**: Add and manage multiple RSS feed URLs.
- **Feed Following**: Follow and unfollow feeds added by you or other users.
- **Background Worker**: Continuously fetch and store new posts in PostgreSQL.
- **Terminal Reader**: Browse recent blog posts directly inside your terminal with optional display limits.

---

## 📋 Prerequisites

Before setting up Gator, ensure you have the following installed on your local machine:

- **Node.js**: `v22.15.0` (managed via [NVM](https://github.com/nvm-sh/nvm))
- **PostgreSQL**: Version 16+
- **Linux / WSL2** (Recommended for Windows users)

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_GITHUB_USERNAME/gator.git](https://github.com/YOUR_GITHUB_USERNAME/gator.git)
cd gator
