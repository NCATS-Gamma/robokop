const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const apiRoutes = require('./serverRoutes');

const PORT = process.env.PORT || 80;
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '4000mb' }));

app.use(express.static('pack'));

// These are api routes
app.use(apiRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'pack/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
