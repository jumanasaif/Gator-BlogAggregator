
# 🐊 Gator - Advanced RSS Feed Aggregator CLI

**Gator** is a powerful CLI tool to collect, manage, and browse RSS feeds directly from your terminal. Supports multiple users, filtering, sorting, pagination, search, and bookmarks.

---

## 🎯 Features

- **User Management**
  - Register a new user
  - Login as an existing user
  - List all users
  - Reset the database

- **Feed Management**
  - Add a new feed
  - Follow or unfollow a feed
  - List all feeds
  - Show feeds you are following

- **Posts Aggregation & Browsing**
  - **fetch** posts continuously from followed feeds
  - **View** the latest posts
  - **Filter** posts by keyword
  - **Sort** posts by published date (`asc` or `desc`)
  - **Pagination** with `--page` and `--limit`
  - **Search** posts (fuzzy search in title & description)
  - **Bookmark** posts for later

---

## 🛠️ Built With

- TypeScript  
- Node.js  
- PostgreSQL (v16+)  
- Drizzle ORM  
- fast-xml-parser  

---

## ⚡ Installation

1. **Clone the repository**

```bash
git clone https://github.com/jumanasaif/Gator-BlogAggregator.git
cd gator
```

2. **Use the correct Node version**

```bash
nvm use
```

3. **Install dependencies**

```bash
npm install
```

4. **Create config file**

```bash
echo '{"db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable", "current_user_name": ""}' > ~/.gatorconfig.json
```

5. **Run database migrations**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## 🚀 Usage

### User Commands

```bash
npm run start register <username>    # Register a new user
npm run start login <username>       # Login as a user
npm run start users                  # List all users
npm run start reset                  # Reset the database
```

### Feed Commands

```bash
npm run start addfeed "<name>" "<url>"  # Add a new feed (auto-follow)
npm run start feeds                     # List all feeds
npm run start follow "<url>"            # Follow a feed
npm run start unfollow "<url>"          # Unfollow a feed
npm run start following                 # Show feeds you follow
```

### Aggregator

```bash
npm run start agg <interval>          # Start continuous aggregation (e.g., 30s)
```

### Browse Posts

```bash
npm run start -- browse [options]    #Show latest posts (default 2)
```

Options for browse:

| Option    | Description                                  | Example                     |
|-----------|----------------------------------------------|-----------------------------|
| --limit   | Number of posts to show                      | --limit=5                   |
| --sort    | Sort posts by date: asc or desc              | --sort=asc                  |
| --filter  | Filter posts by keyword in title/description | --filter=AI                 |
| --page    | Show specific page                           | --page=2                    |

**Example:**

```bash
npm run start -- browse --limit=5 --sort=asc --filter=AI --page=2
```

### Search Posts

```bash
npm run start search "<keyword>"     # Fuzzy search in title and description, Displays all matching posts with URLs  
```

 

### Bookmark Posts

```bash
npm run start bookmark <post_url>   # Save posts for later quick access
npm run start bookmarks             # List all bookmarkes
```


---

## 🔍 How It Works

- Gator stores feeds in PostgreSQL.  
- RSS feeds are fetched and parsed using **fast-xml-parser**.  
- Posts are linked to users via the **feedFollows** table.  
- Users can browse, search, filter, sort, paginate, and bookmark posts.  
- The `agg` command continuously fetches new posts from followed feeds.

---

## 📚 Tips

- Use `Ctrl+C` to safely stop aggregation.  
- Avoid sending too many requests to the same server (respect their limits).  
- Use bookmarks to save your favorite posts.  
```

تحطه مباشرة في ملف `README.md` على مشروعك في GitHub ويكون جاهز 🚀
