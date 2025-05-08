const { Pool, types } = require('pg');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
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

/** Generate a URL-safe, 128-bit ID (22 chars) */
function generateId() {
  return crypto
    .randomBytes(16)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}



// GET /average_review/:business_id
const average_review = async function(req, res) {
  const yearLow  = req.query.year_low  ?? '2014';
  const yearHigh = req.query.year_high ?? '2016';
  const bid      = req.params.business_id;

  connection.query(`
    WITH rev AS (
      SELECT
        r.business_id               AS business_id,
        TO_CHAR(r.review_date,'YYYY') AS year,
        TO_CHAR(r.review_date,'MM')   AS month,
        COUNT(*)                    AS total_reviews
      FROM Review r
      WHERE TO_CHAR(r.review_date,'YYYY') BETWEEN '${yearLow}' AND '${yearHigh}'
        AND r.business_id = '${bid}'
      GROUP BY r.business_id, year, month
    )
    SELECT
      rev.business_id,
      rev.year,
      rev.month,
      rev.total_reviews,
      ROUND(
        AVG(rev.total_reviews)
        OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
      , 2) AS rolling_avg_reviews
    FROM rev
    ORDER BY rev.year, rev.month;
  `, (err, data) => {
    if (err) {
      console.error(err);
      return res.json({});
    }
    res.json(data.rows);
  });
};

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
    ORDER BY state, city, stars DESC, review_count DESC
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

// GET /checkin_performance/:business_id
const checkin_performance = async function(req, res) {
  const bid = req.params.business_id;

  connection.query(`
WITH same_city AS (
    SELECT business_id, name, city
    FROM business b1
    WHERE EXISTS (
        SELECT 1
        FROM business b2
        WHERE b2.business_id = '${bid}'
        AND b1.city = b2.city
    )

),
check_in AS (
  SELECT
    c.business_id     AS business_id,
    b.name            AS business_name,
    b.city            AS city,
    COUNT(*)          AS total_checkins
  FROM checkin c
  JOIN same_city b
    ON c.business_id = b.business_id
  GROUP BY c.business_id, b.name, b.city
),
average AS (
  SELECT
    AVG(ci.total_checkins) AS city_avg,
    ci.city
  FROM check_in ci
  GROUP BY ci.city
)
SELECT
  ci.business_id,
  ci.business_name,
  ci.total_checkins,
  CASE
    WHEN ci.total_checkins > average.city_avg THEN 'Above Average'
    ELSE 'Below Average'
  END AS checkin_performance
FROM check_in ci
JOIN average
  ON ci.city = average.city
WHERE ci.business_id = '${bid}'
ORDER BY checkin_performance, total_checkins DESC;
  `, (err, data) => {
    if (err) {
      console.error(err);
      return res.json({});
    }
    res.json(data.rows[0]);
  });
};

// GET /review_trend/:business_id
const review_trend = async function(req, res) {
  const bid = req.params.business_id;

  connection.query(`
WITH rev AS (
  SELECT
    COUNT(*)               AS review_count,
    t.business_id          AS business_id,
    EXTRACT(YEAR FROM t.tip_date) AS year,
    b.name                 AS business_name
  FROM tip t
  JOIN business b
    ON t.business_id = b.business_id
  WHERE t.business_id = '${bid}'
  GROUP BY t.business_id, year, b.name
),
tmp AS (
  SELECT
    rev.business_id,
    rev.business_name,
    rev.year,
    rev.review_count,
    rev.review_count
      - LAG(rev.review_count, 1, rev.review_count)
        OVER (PARTITION BY rev.business_id ORDER BY rev.year)
      AS trend
  FROM rev
)
SELECT
  tmp.business_id,
  tmp.business_name,
  tmp.year::TEXT AS year,
  tmp.review_count,
  CASE
    WHEN tmp.trend > 0 THEN 'Increasing'
    WHEN tmp.trend < 0 THEN 'Decreasing'
    ELSE 'Stable'
  END AS review_trend
FROM tmp
ORDER BY tmp.business_name, tmp.year;
  `, (err, data) => {
    if (err) {
      console.error(err);
      return res.json({});
    }
    res.json(data.rows);
  });
};

// GET /engagement_level/:business_id
const engagement_level = async function(req, res) {
  const bid = req.params.business_id;

  connection.query(`
WITH city AS (
    SELECT city
    FROM business
    WHERE business_id = '${bid}'
),
same_city AS (
    SELECT business_id, name, city
    FROM business
    WHERE city IN (SELECT * FROM city)
),
tips AS (
  SELECT COUNT(*)       AS tip_count,
         business_id
  FROM tip
  WHERE business_id IN (SELECT business_id FROM same_city)
  GROUP BY business_id
),
checkins AS (
  SELECT COUNT(*)       AS checkin_count,
         business_id
  FROM checkin
  WHERE business_id IN (SELECT business_id FROM same_city)
  GROUP BY business_id
),
engagement AS (
  SELECT
    b.business_id,
    b.name          AS business_name,
    b.city,
    COALESCE(t.tip_count, 0)     AS tip_count,
    COALESCE(c.checkin_count, 0) AS checkin_count,
    CASE
      WHEN COALESCE(c.checkin_count, 0) = 0 THEN 0
      ELSE t.tip_count::float / c.checkin_count
    END AS tip_checkin_ratio
  FROM same_city b
  LEFT JOIN tips t
    ON b.business_id = t.business_id
  LEFT JOIN checkins c
    ON b.business_id = c.business_id
),
city_avg AS (
  SELECT
    AVG(e.tip_checkin_ratio)   AS city_avg_ratio,
    e.city
  FROM engagement e
  GROUP BY e.city
)
SELECT
  e.business_id,
  e.business_name    AS name,
  e.tip_count,
  e.checkin_count,
  ROUND(e.tip_checkin_ratio::numeric, 3) AS tip_checkin_ratio,
  ROUND(city_avg.city_avg_ratio::numeric, 3) AS city_avg_ratio,
  CASE
    WHEN e.tip_checkin_ratio >= city_avg.city_avg_ratio * 1.1 THEN 'High Engagement'
    WHEN e.tip_checkin_ratio <= city_avg.city_avg_ratio * 0.9 THEN 'Low Engagement'
    ELSE 'Average Engagement'
  END AS engagement_label
FROM engagement e
JOIN city_avg
  ON e.city = city_avg.city
WHERE e.business_id = '${bid}'
ORDER BY e.tip_checkin_ratio DESC;
  `, (err, data) => {
    if (err) {
      console.error('engagement_level error:', err);
      return res.json({});
    }
    res.json(data.rows);
  });
};

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
  page = req.query.page;
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
  page = req.query.page;
  if (!page) {
    page = 1;
  }
  
  const pageSize = req.query.page_size === undefined ? 10 : req.query.page_size;
  const start = pageSize * (page - 1);

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
    ORDER BY avg_rating DESC, total_reviews DESC
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
    return res.status(400).json({ message: 'Username & password required' });
  }
  try {
    // 1) check login table for existing username
    const { rowCount } = await connection.query(
      'SELECT 1 FROM login WHERE username = $1',
      [username]
    );
    if (rowCount > 0) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    // 2) create a new unique user_id
    let userId;
    let exists;
    do {
      userId = generateId();
      const chk = await connection.query(
        'SELECT 1 FROM users WHERE user_id = $1',
        [userId]
      );
      exists = chk.rowCount > 0;
    } while (exists);

    // 3) insert into users (user_id, name, yelping_since, elite default null)
    await connection.query(
      `INSERT INTO users (user_id, name, yelping_since)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [userId, username]
    );

    // 4) insert into login (username PK, password, user_id FK)
    await connection.query(
      `INSERT INTO login (username, password, user_id)
       VALUES ($1, $2, $3)`,
      [username, password, userId]
    );

    return res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /login
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username & password required' });
  }
  try {
    // look up password + user_id
    const result = await connection.query(
      `SELECT l.password, l.user_id
       FROM login l
       WHERE l.username = $1`,
      [username]
    );
    if (result.rowCount === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // issue a JWT for front-end
    const token = jwt.sign(
      { user_id: result.rows[0].user_id, username },
      config.jwt_secret,
      { expiresIn: '1h' }
    );
    return res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /change_password
const change_password = async (req, res) => {
  const { user_id, new_password } = req.body;
  if (!user_id || !new_password) {
    return res.status(400).json({ message: 'user_id and new_password required' });
  }
  try {
    await connection.query(
      `UPDATE login
         SET password = $1
       WHERE user_id = $2`,
      [new_password, user_id]
    );
    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('change_password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /business/:business_id
const getBusiness = (req, res) => {
  const id = req.params.business_id;

  connection.query(
    `
    SELECT 
      b.business_id,
      b.name,
      b.address,
      b.city,
      b.state,
      b.postal_code,
      b.is_open,
      b.categories,
      b.hours
    FROM business b
    WHERE b.business_id = $1
    `,
    [id],
    (err, data) => {
      if (err) {
        console.error('getBusiness error:', err);
        return res.status(500).json({});
      }
      if (data.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(data.rows[0]);
    }
  );
};


// POST /review
const add_review = async function(req, res) {
  const { user_id, business_id, stars, review_text } = req.body;
  if (!user_id || !business_id || !stars || !review_text) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const review_id = generateId();
  // review_date defaults to now
  connection.query(`
    INSERT INTO Review
      (review_id, user_id, business_id, stars, review_text, review_date)
    VALUES
      ('${review_id}', '${user_id}', '${business_id}', ${stars}, '${review_text}', CURRENT_TIMESTAMP)
  `, (err) => {
    if (err) {
      console.error('add_review error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.json({ message: 'Review submitted' });
  });
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
  login,
  change_password,
  getBusiness,
  add_review
}
