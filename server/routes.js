const { Pool, types } = require('pg');
const config = require('./config.json')

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));

// GET /average_review/:business_id
const average_review = async function(req, res) {
  const yearLow = req.query.year_low ?? '2014'
  const yearHigh = req.query.year_high ?? '2016'

  connection.query(`
    WITH rev AS (
      SELECT business_id,
             TO_CHAR(review_date, 'YYYY') AS year,
             TO_CHAR(review_date, 'MM') AS month,
             COUNT(*) AS total_reviews
      FROM Review
      WHERE TO_CHAR(review_date, 'YYYY') BETWEEN '${yearLow}' AND '${yearHigh}'
            AND business_id = '${req.params.business_id}'
      GROUP BY business_id, year, month
      ORDER BY business_id, year, month
    )
    SELECT business_id,
           year,
           month,
           total_reviews,
           ROUND(AVG(total_reviews) OVER(ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS rolling_avg_reviews
    FROM rev
    ORDER BY year, month;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// GET /top_business
const top_business = async function(req, res) {
  const state = req.query.state ?? '%'
  const city = req.query.year_high ?? '%'

  connection.query(`
    WITH bus_rev AS (
        SELECT b.business_id AS bid,
              AVG(r.stars) AS stars,
              COUNT(review_id) AS rev_count,
              b.state AS state,
              b.city AS city,
              MAX(b.is_open) AS is_open,
              b.name AS name
        FROM business b
        LEFT JOIN review r
            ON b.business_id = r.business_id
        WHERE b.state LIKE '${state}'
            AND b.city LIKE '${city}'
        GROUP BY b.business_id, b.state, b.city, b.name
    ), ranking AS (
      SELECT *,
              ROW_NUMBER() OVER(
                  PARTITION BY state, city
                  ORDER BY stars DESC
              ) AS row
      FROM bus_rev
      WHERE rev_count > 10
          AND is_open = 1
    )
    SELECT bid AS business_id,
          name AS business_name,
          state, city,
          stars,
          rev_count AS review_count
    FROM ranking
    WHERE row <= 3
    ORDER BY state, city, stars DESC, review_count DESC;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// GET /checkin_performance
const checkin_performance = async function(req, res) {
  const business_id = req.query.business_id ?? '%'

  connection.query(`
    WITH check_in AS (
      SELECT c.business_id,
              b.name AS business_name,
              b.city,
              COUNT(*) AS total_checkins
      FROM checkin c
      JOIN business b
          ON c.business_id = b.business_id
      GROUP BY c.business_id, b.name, b.city
    ),
    average AS (
      SELECT AVG(total_checkins) AS checkin,
              city
      FROM check_in
      GROUP BY city
    )
    SELECT c.business_id,
           c.business_name,
           c.city,
           c.total_checkins,
           CASE
              WHEN c.total_checkins > a.checkin THEN 'Above Average'
              ELSE 'Below Average'
           END AS checkin_performance
    FROM check_in c
    JOIN average a
      ON c.city = a.city
    WHERE business_id = '${business_id}'
    ORDER BY checkin_performance, total_checkins DESC;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

module.exports = {
  average_review,
  top_business,
  checkin_performance
}
