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
- Route: GET /top_local_business
- Description: Returns the top 3 rated business per state-city as a JSON Array.
- Route Parameter(s): None
- Query Parameter(s): state (string)\* (default: '%'), city (string)\* (default: '%')
- Route Handler: top_local_business(req, res)
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

## Route 7
- Route: GET /top_business
- Description: Returns the top 10 highest-rated open businesses across all cities as a JSON Array.
- Route Parameter(s): None
- Query Parameter(s): None
- Route Handler: top_business(req, res)
- Return Type: JSON Array
- Return Parameters: [{ business_id (string), name (string), city (string), avg_rating (float), review_count (int) }]
- Expected (Output) Behavior:
  - Returns the top 10 businesses that are currently open, sorted by highest average rating (rounded to two decimal places) and number of reviews in descending order.
  - Results are aggregated across all cities, not partitioned by location.

## Route 8
- Route: GET /local_categorized_business
- Description: Returns a maximum of 20 open businesses in a given city and category, with at least a minimum average rating, as a JSON Array.
- Route Parameter(s): None
- Query Parameter(s): category (string)\* (default: '%'), city (string)\* (default: '%'), rating (float)\* (default: 0)
- Route Handler: local_categorized_business(req, res)
- Return Type: JSON Array
- Return Parameters: [{ business_id (string), name (string), address (string), city (string), state (string), categories (string), avg_rating (float), total_reviews (int) }]
- Expected (Output) Behavior:
  - Returns up to 20 businesses in the specified city and category whose average rating is greater than or equal to the given threshold.
  - Results are sorted by descending average rating and then by total number of reviews.
  - If no query parameters are specified, defaults will return businesses from all cities and categories with any rating.

## Route 9
- Route: GET /top_users_by_city
- Description: Returns the top 3 users per qualifying city based on tips and reviews as a JSON Array.
- Route Parameter(s): None
- Query Parameter(s): None
- Route Handler: top_users_by_city(req, res)
- Return Type: JSON Array
- Return Parameters: [{ city (string), user_id (string), user_name (string), total_reviews (int), total_tips (int) }]
- Expected (Output) Behavior:
  - For each city with at least 50 open businesses and an average review rating greater than 3.5, returns the top 3 users ranked by number of tips, then reviews.
  - Results are ordered by city and user rank within the city.

## Route 10
- Route: GET /tipper_stats
- Description: Returns statistics on users who have reviewed businesses in at least 3 different states, as a JSON Array.
- Route Parameter(s): None
- Query Parameter(s): None
- Route Handler: tipper_stats(req, res)
- Return Type: JSON Array
- Return Parameters: [{ user_id (string), user_name (string), states_reviewed (int), total_reviews (int), has_ever_tipped (boolean) }]
- Expected (Output) Behavior:
  - Returns users who have written reviews in at least 3 distinct states.
  - Includes number of states reviewed, total reviews, and whether the user has ever left a tip.
  - Results are sorted by number of states reviewed (descending), then by total reviews (descending).
