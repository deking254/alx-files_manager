const express = require('express');
const routes = require('./routes/index')
const app = express();
app.use('/', routes);
app.listen({port: 5000});
