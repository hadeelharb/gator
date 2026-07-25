import { getPostsForUser } from "./lib/db/queries/posts.js";
import { scrapeFeeds } from "./scraper.js";
import { User } from "./lib/db/schema.js";
import { createFeedFollow, getFeedFollowsForUser, deleteFeedFollow, } from "./lib/db/queries/feed_follows.js";
import { createFeed,
  getFeeds,  getFeedByURL, } from "./lib/db/queries/feeds.js";
import { readConfig, setUser } from "./config.js";
import {
  createUser,
  getUserByName,
  getCurrentUser,
  resetUsers,
  getUsers,
} from "./lib/db/queries/users.js";

import { fetchFeed } from "./rss.js";

type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;
type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;
async function handlerLogin(
  cmdName: string,
  ...args: string[]
): Promise<void> {

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
async function handlerRegister(
  cmdName: string,
  ...args: string[]
): Promise<void> {

  if (args.length === 0) {
    throw new Error("Username is required");
  }

  const username = args[0];

  const existing = await getUserByName(username);

  if (existing) {
    throw new Error("User already exists");
  }

  const user = await createUser(username);

  setUser(username);

  console.log("User created successfully!");

  console.log(user);
}

async function handlerReset(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  await resetUsers();

  console.log("Users table has been reset.");
}

async function handlerUsers(
  cmdName: string,
  ...args: string[]
): Promise<void> {

  const users = await getUsers();

  const config = readConfig();

  for (const user of users) {

    if (user.name === config.currentUserName) {

      console.log(`* ${user.name} (current)`);

    } else {

      console.log(`* ${user.name}`);

    }

  }

}

async function handlerAgg(
  cmdName: string,
  ...args: string[]
): Promise<void> {

  if (args.length < 1) {
    throw new Error("Usage: agg <time_between_reqs>");
  }

  const timeBetweenRequests = parseDuration(args[0]);

  console.log(
    `Collecting feeds every ${args[0]}`
  );

  await scrapeFeeds();

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
}

async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {

  if (args.length < 2) {
    throw new Error("Usage: addfeed <name> <url>");
  }

  const name = args[0];
  const url = args[1];

  const feed = await createFeed(
    name,
    url,
    user.id,
  );

  await createFeedFollow(
    user.id,
    feed.id,
  );

  printFeed(feed, user);
}

async function handlerFeeds(
  cmdName: string,
  ...args: string[]
): Promise<void> {

  const feeds = await getFeeds();

  for (const feed of feeds) {
    console.log(`Name: ${feed.feedName}`);
    console.log(`URL: ${feed.feedURL}`);
    console.log(`User: ${feed.userName}`);
    console.log();
  }
}

async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {

  if (args.length < 1) {
    throw new Error("Usage: follow <url>");
  }

  const url = args[0];

  

  const feed = await getFeedByURL(url);

  if (!feed) {
    throw new Error("Feed not found");
  }

  const follow = await createFeedFollow(
    user.id,
    feed.id
  );

  console.log(`Feed: ${follow.feedName}`);
  console.log(`User: ${follow.userName}`);
}

async function handlerFollowing(
  cmdName: string,
    user: User,
  ...args: string[]
): Promise<void> {



  const follows = await getFeedFollowsForUser(user.id);

  for (const follow of follows) {
    console.log(follow.feedName);
  }
}
async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {

  if (args.length < 1) {
    throw new Error("Usage: unfollow <url>");
  }

  const url = args[0];

  await deleteFeedFollow(
    user.id,
    url
  );

  console.log("Feed unfollowed.");
}

async function handlerBrowse(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {

  const limit =
    args.length > 0
      ? Number(args[0])
      : 2;

  const posts = await getPostsForUser(
    user.id,
    limit,
  );

  for (const post of posts) {
    console.log(post.title);
    console.log(post.url);
    console.log();
  }
}
function printFeed(feed: any, user: any): void {
  console.log("Feed:");
  console.log(`ID: ${feed.id}`);
  console.log(`Name: ${feed.name}`);
  console.log(`URL: ${feed.url}`);
  console.log(`User: ${user.name}`);
}

type CommandsRegistry = Record<string, CommandHandler>;

 function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}
function middlewareLoggedIn(
  handler: UserCommandHandler
): CommandHandler {

  return async (
    cmdName: string,
    ...args: string[]
  ) => {

    const currentUser = await getCurrentUser();

    await handler(
      cmdName,
      currentUser,
      ...args
    );
  };
}
function parseDuration(duration: string): number {

  const regex = /^(\d+)(ms|s|m|h)$/;

  const match = duration.match(regex);

  if (!match) {
    throw new Error("Invalid duration");
  }

  const value = Number(match[1]);
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
      throw new Error("Invalid duration");
  }
}
async function main(): Promise<void> {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(
  registry,
  "register",
  handlerRegister
);
registerCommand(
  registry,
  "reset",
  handlerReset
);
registerCommand(
  registry,
  "users",
  handlerUsers
);

registerCommand(
    registry,
    "agg",
    handlerAgg
);
registerCommand(
  registry,
  "addfeed",
  middlewareLoggedIn(handlerAddFeed)
);
registerCommand(
  registry,
  "feeds",
  handlerFeeds
);
registerCommand(
  registry,
  "follow",
  middlewareLoggedIn(handlerFollow)
);
registerCommand(
  registry,
  "following",
  middlewareLoggedIn(handlerFollowing)
);
registerCommand(
  registry,
  "unfollow",
  middlewareLoggedIn(handlerUnfollow)
);
registerCommand(
  registry,
  "browse",
  middlewareLoggedIn(handlerBrowse)
);
    const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Not enough arguments.");
    process.exit(1);
  }
  
  const cmdName = args[0];
  const commandArgs = args.slice(1);

  try {
   await runCommand(registry, cmdName, ...commandArgs);
   process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
