const path = require('path');
const express = require('express');
const routes = require('./routes');

const PORT = process.env.PORT || 80;
const app = express();

app.use(express.static('pack'));

// These are api routes
app.use(routes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'pack/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
