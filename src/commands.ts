import { setUser, readConfig } from "./config";
import { createUser, getUserByName, deleteAllUsers, getUsers  } from "./lib/db/queries/users";
import { createFeed,getFeedByUrl,getFeedsWithUsers,markFeedFetched ,getNextFeedToFetch} from "./lib/db/queries/feeds";
import { createFeedFollow, deleteFeedFollowByUrl, getFeedFollowsForUser } from "./lib/db/queries/feedFollows";
import { User } from "./lib/db/queries/users";
import { fetchFeed } from "./rss";
import { createPost } from "./lib/db/queries/posts";
import { getPostsForUser } from "./lib/db/queries/posts";
import { db } from "./lib/db";
import { feedFollows, posts } from "./lib/db/schema";
import { eq } from "drizzle-orm";
import { bookmarkPost,getBookmarksForUser } from "./lib/db/queries/bookmarks";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;


export function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]) => {
    const config = readConfig();
    const currentUserName = config.currentUserName;

    if (!currentUserName) {
      throw new Error("No current user set. Please login first.");
    }

    const user = await getUserByName(currentUserName);

    if (!user) {
      throw new Error(`User ${currentUserName} not found`);
    }

    return handler(cmdName, user, ...args);
  };
}


export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
) {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}

export async function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length === 0) {
    throw new Error("Username is required");
  }

  const username = args[0];

  const user = await getUserByName(username);

  if (!user) {
    throw new Error("User does not exist");
  }

  setUser(username);

  console.log(`User set to ${username}`);
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
  if (args.length === 0) {
    throw new Error("Username is required");
  }

  const name = args[0];

  const existingUser = await getUserByName(name);

  if (existingUser) {
    throw new Error("User already exists");
  }

  const user = await createUser(name);

  setUser(name);

  console.log("User created:");
  console.log(user);
}

export const handlerReset: CommandHandler = async () => {
  await deleteAllUsers();
  console.log("Database reset successful.");
};

export const handlerUsers: CommandHandler = async () => {
  const allUsers = await getUsers();
  const config = readConfig();

  for (const user of allUsers) {
    if (user.name === config.currentUserName) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
};

export const handlerAgg: CommandHandler = async (_, ...args) => {
  if (args.length < 1) {
    throw new Error("Usage: agg <time_between_reqs>");
  }

  const durationStr = args[0];
  const timeBetweenRequests = parseDuration(durationStr);

  console.log(`Collecting feeds every ${durationStr}`);

  await scrapeFeeds().catch(console.error);

  const interval = setInterval(() => {
    scrapeFeeds().catch(console.error);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
};


function printFeed(feed: any, user: any) {
  console.log("Feed created:");
  console.log(`ID: ${feed.id}`);
  console.log(`Name: ${feed.name}`);
  console.log(`URL: ${feed.url}`);
  console.log(`User: ${user.name}`);
  console.log(`Created at: ${feed.createdAt}`);
  console.log(`Updated at: ${feed.updatedAt}`);
}

export const handlerAddFeedUser: UserCommandHandler = async (cmdName, user, ...args) => {
  if (args.length < 2) {
    throw new Error("Usage: addfeed <name> <url>");
  }

  const [name, url] = args;
  const feed = await createFeed(user.id, name, url);
  const follow = await createFeedFollow(user.id, feed.id);
  printFeed(feed, user);
  console.log(`${follow.userName} is now following ${follow.feedName}`);
};

export const handlerFeeds: CommandHandler = async () => {
  const results = await getFeedsWithUsers();

  for (const row of results) {
    console.log("Name:", row.feeds.name);
    console.log("URL:", row.feeds.url);
    console.log("User:", row.users?.name);
    console.log("-----");
  }
};


export const handlerFollowUser: UserCommandHandler = async (_, user, ...args) => {
  if (args.length < 1) throw new Error("URL is required");
  const url = args[0];

  const feed = await getFeedByUrl(url);
  if (!feed) throw new Error("Feed not found");

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`${follow.userName} is now following ${follow.feedName}`);
};




export const handlerFollowingUser: UserCommandHandler = async (_, user) => {
  const follows = await getFeedFollowsForUser(user.id);
  for (const follow of follows) {
    console.log(`* ${follow.feedName}`);
  }
};


export const handlerUnfollow: UserCommandHandler = async (_, user, ...args) => {
  if (args.length < 1) throw new Error("Feed URL is required");

  const url = args[0];
  const feed = await deleteFeedFollowByUrl(user.id, url);

  console.log(`${user.name} has unfollowed feed: ${feed.name}`);
};

async function scrapeFeeds() {
  const nextFeed = await getNextFeedToFetch();

  if (!nextFeed) {
    console.log("No feeds found.");
    return;
  }

  console.log(`Fetching feed: ${nextFeed.name}`);

  await markFeedFetched(nextFeed.id as string);

  try {
    const rssFeed = await fetchFeed(nextFeed.url as string);

    console.log(`Feed: ${rssFeed.channel.title}`);
    console.log("-----");

    for (const item of rssFeed.channel.item) {
      const publishedDate = item.pubDate
      ? new Date(item.pubDate)
      : undefined;

      await createPost({
        title: item.title,
        url: item.link,
        description: item.description,
        publishedAt: publishedDate,
        feedId: nextFeed.id as string,
      });
      console.log(`Saved posts from ${nextFeed.name}`);
    }
    
  } catch (err) {
    console.error("Failed to fetch feed:", err);
  }
}


function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error("Invalid duration format. Use 1s, 1m, 1h etc.");
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      throw new Error("Invalid duration unit");
  }
}


export const handlerBrowse: UserCommandHandler = async (_, user, ...args) => {
  let limit = 2;
  let sortOrder: "desc" | "asc" = "desc";
  let filterKeyword: string | undefined = undefined;
  let page = 1;


  for (const arg of args) {
    if (arg.startsWith("--limit=")) limit = parseInt(arg.split("=")[1]);
    else if (arg.startsWith("--sort=")) sortOrder = arg.split("=")[1] === "asc" ? "asc" : "desc";
    else if (arg.startsWith("--filter=")) filterKeyword = arg.split("=")[1];
    else if (arg.startsWith("--page=")) page = parseInt(arg.split("=")[1]);
  }

  const offset = (page - 1) * limit;

  let posts = await getPostsForUser(user.id, limit, sortOrder, offset);
  
  if (filterKeyword) {
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(filterKeyword.toLowerCase()) ||
        (p.description?.toLowerCase().includes(filterKeyword.toLowerCase()) ?? false)
    );
  }

  for (const post of posts) {
    console.log(`Title: ${post.title}`);
    console.log(`URL: ${post.url}`);
    console.log(`Published: ${post.publishedAt}`);
    console.log("-----");
  }
};

export const handlerSearch: UserCommandHandler = async (_, user, ...args) => {
  if (args.length === 0) throw new Error("Please provide a search query");

  const query = args.join(" ").toLowerCase();

  const searchResults = await db
    .select({
      title: posts.title,
      url: posts.url,
      description: posts.description,
    })
    .from(posts)
    .innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
    .where(eq(feedFollows.userId, user.id));

  const results = searchResults.filter(
    (p) =>
      p.title.toLowerCase().includes(query) ||
      (p.description?.toLowerCase().includes(query) ?? false)
  );

  for (const post of results) {
    console.log(`Title: ${post.title}`);
    console.log(`URL: ${post.url}`);
    console.log("-----");
  }
};



export const handlerBookmark: UserCommandHandler = async (_, user, ...args) => {
  if (args.length < 1) throw new Error("Post URL is required");
  const postUrl = args[0];
  const postRows = await db
    .select()
    .from(posts)
    .innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
    .where(eq(feedFollows.userId, user.id));
  
  const postRow = postRows.find(p => p.posts.url === postUrl);

  if (!postRow) throw new Error("Post not found");
  await bookmarkPost(user.id, postRow.posts.id);
  console.log(`Bookmarked post: ${postRow.posts.title}`);
};


export const handlerBookmarks: UserCommandHandler = async (_, user) => {
  const bookmarks = await getBookmarksForUser(user.id);

  if (bookmarks.length === 0) {
    console.log("No bookmarks yet.");
    return;
  }

  for (const post of bookmarks) {
    console.log(`Title: ${post.title}`);
    console.log(`URL: ${post.url}`);
    console.log(`Published: ${post.publishedAt}`);
    console.log("-----");
  }
};