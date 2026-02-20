
// // Get username and room from URL
const { username } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

localStorage.setItem("username",username);

// const socket = io();
