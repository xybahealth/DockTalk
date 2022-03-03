var users = [
  { id: 1, username: 'roshan', room: 'magic' },
  { id: 2, username: 'roshan', room: 'magic' },
  { id: 3, username: 'Sameer', room: 'magic' },
  { id: 4, username: 'Ankit', room: 'magic' },
  { id: 5, username: 'Sandeep', room: 'magic' },
  { id: 6, username: 'roshan', room: 'magic' },
];

const categories = [...new Set(users.map((user) => user.username))];
console.log(categories);

var users = [
  { id: 1, username: 'roshan', room: 'magic' },

  { id: 3, username: 'Sameer', room: 'magic' },
  { id: 4, username: 'Ankit', room: 'magic' },
  { id: 5, username: 'Sandeep', room: 'magic' },
];
