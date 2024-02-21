const express = require('express');
const routes = require('./routes/index')
const app = express();
routes.getStatus(app);
routes.getStats(app);
app.listen({port: 5000});
