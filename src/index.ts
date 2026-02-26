import { 
  CommandsRegistry, 
  registerCommand, 
  runCommand, 
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerUsers ,
  handlerAgg,
  handlerAddFeedUser ,
  handlerFeeds,
  handlerFollowUser,
  handlerFollowingUser,
  middlewareLoggedIn,
  handlerUnfollow,
  handlerBrowse,
  handlerSearch,
  handlerBookmark,
  handlerBookmarks

} from "./commands";


async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand( registry,"addfeed",middlewareLoggedIn(handlerAddFeedUser));
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry,"follow",middlewareLoggedIn(handlerFollowUser));
  registerCommand(registry,"following",middlewareLoggedIn(handlerFollowingUser));
  registerCommand(registry,"unfollow",middlewareLoggedIn(handlerUnfollow));
  registerCommand(registry,"browse",middlewareLoggedIn(handlerBrowse));
  registerCommand(registry, "search", middlewareLoggedIn(handlerSearch));
  registerCommand(registry, "bookmark", middlewareLoggedIn(handlerBookmark));
  registerCommand(registry, "bookmarks", middlewareLoggedIn(handlerBookmarks));

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Not enough arguments provided.");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
    process.exit(0);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

main();