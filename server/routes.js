const { Pool, types } = require('pg');
const jwt    = require('jsonwebtoken');
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

// GET /top_local_business
const top_local_business = async function(req, res) {
  const state = req.query.state ?? '%'
  page = req.query.page;
  if (!page) {
    page = 1;
  }
  
  const pageSize = req.query.page_size === undefined ? 10 : req.query.page_size;
  const start = pageSize * (page - 1);

  const city = req.query.city ?? '%'

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

// GET /checkin_performance/:business_id
const checkin_performance = async function(req, res) {

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
           c.total_checkins,
           CASE
              WHEN c.total_checkins > a.checkin THEN 'Above Average'
              ELSE 'Below Average'
           END AS checkin_performance
    FROM check_in c
    JOIN average a
      ON c.city = a.city
    WHERE business_id = '${req.params.business_id}'
    ORDER BY checkin_performance, total_checkins DESC;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows[0]);
    }
  });
}

// GET /review_trend/:business_id
const review_trend = async function(req, res) {

  connection.query(`
    WITH rev AS (
      SELECT COUNT(*) AS review_count,
              t.business_id,
              TO_CHAR(t.tip_date, 'YYYY') AS year,
              b.name AS business_name
      FROM tip t
      JOIN business b
          ON t.business_id = b.business_id
      WHERE business_id = '${req.params.business_id}'
      GROUP BY t.business_id, year, b.name
    ),
    tmp AS (
      SELECT business_id,
              business_name,
              year,
              review_count,
              review_count - LAG(
                review_count, 1, review_count
              ) OVER (
                PARTITION BY business_id
                ORDER BY year
              ) AS trend
      FROM rev
    )
    SELECT business_id,
          business_name,
          year,
          review_count,
          CASE
            WHEN trend > 0 THEN 'Increasing'
            WHEN trend < 0 THEN 'Decreasing'
            ELSE 'Stable'
          END AS review_trend
    FROM tmp
    ORDER BY business_name, year;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// GET /engagement_level/:business_id
const engagement_level = async function(req, res) {

  connection.query(`
    WITH tips AS (
      SELECT COUNT(*) AS tip_count, business_id
      FROM tip
      GROUP BY business_id
    ),
    checkins AS (
      SELECT COUNT(*) AS checkin_count, business_id
      FROM checkin
      GROUP BY business_id
    ),
    engagement AS (
      SELECT b.business_id,
              b.name AS business_name,
              b.city,
              t.tip_count,
              c.checkin_count,
              CASE
                  WHEN COALESCE(c.checkin_count, 0) = 0 THEN 0
                  ELSE t.tip_count / c.checkin_count
              END AS tip_checkin_ratio
      FROM tips t
      RIGHT JOIN Business b
          ON t.business_id = b.business_id
      LEFT JOIN checkins c
          ON b.business_id = c.business_id
    ),
    city_avg AS (
      SELECT AVG(tip_checkin_ratio) AS city_avg_ratio, city
      FROM engagement
      GROUP BY city
    )
    SELECT e.business_id,
          e.business_name AS name,
          e.tip_count,
          e.checkin_count,
          ROUND(e.tip_checkin_ratio, 3) AS tip_checkin_ratio,
          ROUND(a.city_avg_ratio, 3) AS city_avg_ratio,
          CASE
            WHEN tip_checkin_ratio >= a.city_avg_ratio * 1.1 THEN 'High Engagement'
            WHEN tip_checkin_ratio <= a.city_avg_ratio * 0.9 THEN 'Low Engagement'
            ELSE 'Average Engagement'
          END AS engagement_label
    FROM engagement e
    JOIN city_avg a
      ON e.city = a.city
    WHERE business_id = '${req.params.business_id}'
    ORDER BY e.tip_checkin_ratio DESC;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// GET /user_review_count
const user_review_count = async function(req, res) {
  const userId = req.query.user_id ?? '%'

  connection.query(`
    SELECT u.user_id, u.name AS user_name, COUNT(r.review_id) AS total_reviews
    FROM users u
    Left JOIN Review r
    ON u.user_id = r.user_id
    WHERE u.user_id LIKE '${userId}'
    GROUP BY u.user_id, name
    ORDER BY total_reviews DESC, name;
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
  const page = req.query.page;
  if (!page) {
    page = 1;
  }
  
  const pageSize = req.query.page_size === undefined ? 10 : req.query.page_size;
  const start = pageSize * (page - 1);
  
  connection.query(`
    WITH business_reviews AS (
      SELECT 
        b.business_id, 
        b.name, 
        b.city, 
        AVG(r.stars) AS avg_rating, 
        COUNT(r.review_id) AS review_count
      FROM Business b
      JOIN Review r 
        ON b.business_id = r.business_id
      WHERE b.is_open = 1
      GROUP BY b.business_id, b.name, b.city
    )
    SELECT 
      business_id, 
      name, 
      city, 
      ROUND(avg_rating, 2) AS avg_rating, 
      review_count
    FROM business_reviews
    ORDER BY avg_rating DESC, review_count DESC
    LIMIT ${pageSize} OFFSET ${start};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// GET /local_categorized_business
const local_categorized_business = async function(req, res) {
  const city     = req.query.city     || '';
  const category = req.query.category || '';
  const rating   = parseFloat(req.query.rating) || 0;

  connection.query(`
    WITH filtered_businesses AS (
      SELECT 
        b.business_id, 
        b.name, 
        b.address, 
        b.city, 
        b.state, 
        b.categories,
        AVG(r.stars) AS avg_rating,
        COUNT(r.review_id) AS total_reviews
      FROM Business b
      LEFT JOIN Review r 
        ON b.business_id = r.business_id
      WHERE b.city = '${city}'
        AND b.categories LIKE '%${category}%'
      GROUP BY b.business_id, b.name, b.address, b.city, b.state, b.categories
    )
    SELECT 
      business_id, 
      name, 
      address, 
      city, 
      state, 
      categories,
      ROUND(avg_rating, 2) AS avg_rating, 
      total_reviews
    FROM filtered_businesses
    WHERE avg_rating >= ${rating}
    ORDER BY avg_rating DESC, total_reviews DESC;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// GET /top_users_by_city
const top_users_by_city = async function(req, res) {

  connection.query(`
    WITH city_stats AS (
      SELECT
        b.city,
        COUNT(DISTINCT b.business_id)    AS open_businesses,
        AVG(r.stars)                     AS city_avg_rating
      FROM Business b
      JOIN Review r ON b.business_id = r.business_id
      WHERE b.is_open = 1
      GROUP BY b.city
      HAVING
        COUNT(DISTINCT b.business_id) >= 50
        AND AVG(r.stars) > 3.5
    ),
    user_metrics AS (
      SELECT
        u.user_id,
        u.name      AS user_name,
        b.city,
        COUNT(r.review_id)    AS total_reviews,
        COUNT(t.tip_date)     AS total_tips
      FROM Users u
      JOIN Review r ON u.user_id = r.user_id
      JOIN Business b ON r.business_id = b.business_id
      LEFT JOIN Tip t
        ON u.user_id = t.user_id
      AND b.business_id = t.business_id
      GROUP BY u.user_id, u.name, b.city
    )
    SELECT
      um.city,
      um.user_id,
      um.user_name,
      um.total_reviews,
      um.total_tips
    FROM (
      SELECT
        um.*,
        ROW_NUMBER() OVER (
          PARTITION BY um.city
          ORDER BY um.total_tips DESC,
                  um.total_reviews DESC
        ) AS rn
      FROM user_metrics um
      JOIN city_stats cs ON um.city = cs.city
    ) um
    WHERE um.rn <= 3
    ORDER BY um.city, um.rn;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// GET /tipper_stats
const tipper_stats = async function(req, res) {
  const page = req.query.page;
  if (!page) {
    page = 1;
  }
  
  const pageSize = req.query.page_size === undefined ? 10 : req.query.page_size;
  const start = pageSize * (page - 1);

  connection.query(`
    WITH user_state_counts AS (
      -- Count how many distinct states each user has reviewed in
      SELECT
        u.user_id,
        u.name,
        COUNT(DISTINCT b.state) AS states_reviewed
      FROM Users u
      JOIN Review r    ON u.user_id = r.user_id
      JOIN Business b  ON r.business_id = b.business_id
      GROUP BY u.user_id, u.name
    ),
    user_review_totals AS (
      -- Total reviews per user
      SELECT
        user_id,
        COUNT(*) AS total_reviews
      FROM Review
      GROUP BY user_id
    ),
    user_tip_flags AS (
      -- Whether the user has ever tipped
      SELECT
        user_id,
        'TRUE' AS has_tipped
      FROM Tip
      GROUP BY user_id
    )
    SELECT
      usc.user_id,
      usc.name          AS user_name,
      usc.states_reviewed,
      urt.total_reviews,
      COALESCE(utf.has_tipped, 'FALSE') AS has_ever_tipped
    FROM user_state_counts usc
    JOIN user_review_totals urt USING (user_id)
    LEFT JOIN user_tip_flags utf USING (user_id)
    WHERE usc.states_reviewed >= 3
    ORDER BY usc.states_reviewed DESC, urt.total_reviews DESC
    LIMIT ${pageSize} OFFSET ${start};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// POST /register
const register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    // insert into users(username, password) directly
    await connection.query(
      `INSERT INTO users (username, password) VALUES ($1, $2)`,
      [username, password]
    );
    return res.status(201).json({ message: 'User registered' });
  } catch (err) {
    if (err.code === '23505') {
      // unique_violation
      return res.status(409).json({ message: 'Username already taken' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /login
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    // look up the user’s stored password
    const result = await connection.query(
      `SELECT user_id, password FROM users WHERE username = $1`,
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { user_id, password: stored } = result.rows[0];
    if (password !== stored) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Sign and return a JWT (optional—you can return whatever you like)
    const token = jwt.sign(
      { user_id, username },
      config.jwt_secret,
      { expiresIn: '1h' }
    );
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  average_review,
  top_local_business,
  checkin_performance,
  review_trend,
  engagement_level,
  user_review_count,
  top_business,
  local_categorized_business,
  top_users_by_city,
  tipper_stats,
  register,
  login
}
