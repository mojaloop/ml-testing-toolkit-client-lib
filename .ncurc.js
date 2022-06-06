module.exports = {
  // Add a TODO comment indicating the reason for each rejected dependency upgrade added to this list, and what should be done to resolve it (i.e. handle it through a story, etc).
  reject: [
    // TODO: Upgrading ws is causing incompatibility issues with old versions of ws servers. Need to investigate the cause.
    "ws",
    // TODO: Upgrading socket.io-client is causing incompatibility issues with old versions of socket.io servers. Need to investigate the cause.
    "socket.io-client",
    "@types/socket.io"
  ]
}