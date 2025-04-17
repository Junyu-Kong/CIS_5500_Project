const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get('/average_review/:business_id', routes.average_review)
app.get('/top_local_business', routes.top_local_business)
app.get('/checkin_performance', routes.checkin_performance)
app.get('/review_trend', routes.review_trend)
app.get('/engagement_level', routes.engagement_level)
app.get('/user_review_count', routes.user_review_count)
app.get('/top_business', routes.top_business)
app.get('/local_categorized_business', routes.local_categorized_business)
app.get('/top_users_by_city', routes.top_users_by_city)
app.get('/tipper_stats', routes.tipper_stats)

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
