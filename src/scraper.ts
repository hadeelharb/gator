import {
  getNextFeedToFetch,
  markFeedFetched,
} from "./lib/db/queries/feeds.js";

import { fetchFeed } from "./rss.js";
import { createPost } from "./lib/db/queries/posts.js";

export async function scrapeFeeds() {
  const nextFeed = await getNextFeedToFetch();

  if (!nextFeed) {
    console.log("No feeds found.");
    return;
  }

  console.log(`Fetching ${nextFeed.name}...`);

  const rssFeed = await fetchFeed(nextFeed.url);

  await markFeedFetched(nextFeed.id);

 for (const item of rssFeed.channel.item) {
  try {
    await createPost(
      item.title,
      item.link,
      item.description,
      new Date(item.pubDate),
      nextFeed.id,
    );

    console.log(`Saved: ${item.title}`);
  } catch {
    // duplicate post
  }
}
}
