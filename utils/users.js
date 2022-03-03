const users = [];

// Join user to chat
function userJoin(id, username, room) {
  const user = { id, username, room };
  var count = 0;
  if (users.indexOf(user) == -1) users.push(user);

  return user;
}

// Get current user
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users
function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}
//Get all rooms
function getAllRooms() {
  const rooms = [];
  users.forEach((user) => {
    if (rooms.indexOf(user.room) == -1) rooms.push(user.room);
  });
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllRooms,
};
