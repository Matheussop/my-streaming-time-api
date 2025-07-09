# Genre Synchronization Example

This document demonstrates how to use the automatic genre synchronization feature from TMDB.

## Scenario

You've just set up your application for the first time and don't have any genres registered in the database. When you try to register a movie or series, you'll get an error because the genres don't exist.

## Automatic Solution

The application solves this automatically! When you start the server for the first time, it:

1. Checks if genres exist in the database
2. If they don't exist, automatically fetches them from TMDB
3. Saves all genres with the correct IDs

## Example Logs

### First Run (No Genres)
```
Connected to MongoDB
No genres found in database. Starting TMDB genre synchronization...
Genre synchronization completed. Movie genres: 19, TV genres: 16
Server running on port 5000
```

### Subsequent Runs (With Genres)
```
Connected to MongoDB
Genres already exist in database. Skipping synchronization.
Server running on port 5000
```

## Manual Synchronization

If you need to synchronize genres manually (for example, to update the list), use the endpoint:

```bash
curl -X POST http://localhost:5000/genre/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Genres synchronized from TMDB",
  "result": {
    "movieGenres": 19,
    "tvGenres": 16
  }
}
```

## Available Genres

After synchronization, you'll have access to genres such as:

### Movies
- Action (ID: 28)
- Adventure (ID: 12)
- Animation (ID: 16)
- Comedy (ID: 35)
- Crime (ID: 80)
- Documentary (ID: 99)
- Drama (ID: 18)
- Family (ID: 10751)
- Fantasy (ID: 14)
- History (ID: 36)
- Horror (ID: 27)
- Music (ID: 10402)
- Mystery (ID: 9648)
- Romance (ID: 10749)
- Science Fiction (ID: 878)
- TV Movie (ID: 10770)
- Thriller (ID: 53)
- War (ID: 10752)
- Western (ID: 37)

### TV Shows
- Action & Adventure (ID: 10759)
- Animation (ID: 16)
- Comedy (ID: 35)
- Crime (ID: 80)
- Documentary (ID: 99)
- Drama (ID: 18)
- Family (ID: 10751)
- Kids (ID: 10762)
- Mystery (ID: 9648)
- News (ID: 10763)
- Reality (ID: 10764)
- Sci-Fi & Fantasy (ID: 10765)
- Soap (ID: 10766)
- Talk (ID: 10767)
- War & Politics (ID: 10768)
- Western (ID: 37)

## Registering a Movie

Now you can register a movie using the genre IDs:

```bash
curl -X POST http://localhost:5000/movies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Avengers: Endgame",
    "plot": "After the devastating events of Avengers: Infinity War...",
    "releaseDate": "2019-04-26",
    "rating": 8.4,
    "genre": [28, 12, 878],
    "tmdbId": 299534
  }'
```

The IDs `[28, 12, 878]` correspond to Action, Adventure, and Science Fiction genres.

## Checking Genres

To see all available genres:

```bash
curl -X GET http://localhost:5000/genre?page=1&limit=50 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Error: "TMDB_Bearer_Token not configured"
Make sure the environment variable is configured:
```env
TMDB_Bearer_Token=your_tmdb_bearer_token_here
```

### Error: "Genres not found"
If you get an error when registering content, check if synchronization was executed:
```bash
curl -X POST http://localhost:5000/genre/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Error Logs
If there are problems with synchronization, check the server logs for details about the error. 