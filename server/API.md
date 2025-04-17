# API Documentation

## Route 1
- Route: GET /average_review/:business_id
- Description: Returns the average number and rolling average of reviews for a matching business per year-month as JSON Array.
- Route Parameter(s): type (string)
- Query Parameter(s): yearLow (string)\* (default: '2016'), yearHigh (string)\* (default: '2016')
- Route Handler: average_review(req, res)
- Return Type: JSON Array
- Return Parameters: [{ business_id (string), year (string), month (string), total_reviews (int), rolling_avg_reviews(int) }]
- Expected (Output) Behavior:
  - Returns the average number and rolling average of reviews for a business per year-month as JSON Array.

## Route 2
- Route: GET /top_business
- Description: Returns the top 3 rated business per state-city as a JSON Array.
- Route Parameter(s): None
- Query Parameter(s): state (string)\* (default: '%'), city (string)\* (default: '%')
- Route Handler: top_business(req, res)
- Return Type: JSON Array
- Return Parameters: [{ business_id (string), business_name (string), state (string), city (string), stars (int), review_count (int) }]
- Expected (Output) Behavior:
  - Case 1: If state (a two letter US state acronym) or both state and city are specified, will return only top rated business within that place that is open and has more than 10 reviews. Could return empty array if there's no match.
  - Case 2: If state is not specified, will return only top rated business if each state-city pair that is open and has more than 10 reviews.

## Route 3
- Route: GET /checkin_performance/:business_id
- Description: For a given business, identify whether they have more or less number of checkins compared to that of the average within the same city as a JSON object.
- Route Parameter(s): business_id (string)
- Query Parameter(s): None
- Route Handler: checkin_performance(req, res)
- Return Type: JSON Object
- Return Parameters: [{ business_id (string), business_name (string), total_checkins (int), checkin_performance (string) }]
- Expected (Output) Behavior:
  - For a given business, identify whether they have more or less number of checkins compared to that of the average within the same city as a JSON object. checkin_performance is of ENUM('Above Average', 'Below Average')

## Route 4
- Route: GET /review_trend/:business_id
- Description: For a given business, return whether their review count per year and whether it is decreasing or increasing compared to previous year as JSON Array.
- Route Parameter(s): business_id (string)
- Query Parameter(s): None
- Route Handler: review_trend(req, res)
- Return Type: JSON Array
- Return Parameters: [{ business_id (string), business_name (string), year (string), review_count (int), review_trend (string) }]
- Expected (Output) Behavior:
  - For a given business, return whether their review count per year and whether it is decreasing or increasing compared to previous year as JSON Array. review_trend is of ENUM('Increasing', 'Decresing', 'Stable')

## Route 5
- Route: GET /engagement_level/:business_id
- Description: For a given business, calculate its tip-to-checkin ratio, and then compare it with city average to see whether it has high engagement, low engagement, or average as JSON Object
- Route Parameter(s): business_id (string)
- Query Parameter(s): None
- Route Handler: engagement_level(req, res)
- Return Type: JSON Object
- Return Parameters: [{ business_id (string), business_name (string), tip_count (int), checkin_count (int), tip_checkin_ratio (int), city_avg_ratio (int), engagement_label (string) }]
- Expected (Output) Behavior:
  - For a given business, calculate its tip-to-checkin ratio, and then compare it with city average to see whether it has high engagement, low engagement, or average as JSON Object. engagement_label is of ENUM('High Engagement', 'Low Engagement', 'Average Engagement')

## Route 6
- Route: GET /user_review_count
- Description: Count the total number of reviews made by users as JSON Array
- Route Parameter(s): None
- Query Parameter(s): user_id (string)\* (default: '%')
- Route Handler: user_review_count(req, res)
- Return Type: JSON Array
- Return Parameters: [{ user_id (string), user_name (string), total_reviews (int) }]
- Expected (Output) Behavior:
  - Case 1: If user_id is not specified, return all users' ordered by their total number of reviews made
  - Case 2: If user_id is specified, return the matching user with their total number of reviews made