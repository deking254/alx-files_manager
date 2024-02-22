const express = require('express');
const routes = require('./routes/index')
const env = require('process');
const app = express();
const port = env.PORT || 5000;
app.use('/', routes);
app.listen(port);
