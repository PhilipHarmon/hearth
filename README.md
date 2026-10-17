# Hearth

A MERN social network with an autumn look: walls, friends, photo and video posts, comments, likes, shares, and an admin console.

## Run it locally

```bash
cp server/.env.example server/.env     # fill in MONGO_URI, JWT_SECRET, ADMIN_EMAIL
npm install --prefix server && npm install --prefix client
npm run dev --prefix server            # terminal 1, API on :5000
npm run dev --prefix client            # terminal 2, app on :5173
```

Register using the email you put in `ADMIN_EMAIL` and that account becomes the admin.

## Deploy on Render

Create one **Web Service** from your repo:

- Build command: `npm run build`
- Start command: `npm start`
- Environment: `MONGO_URI`, `JWT_SECRET` (any long random string), `ADMIN_EMAIL`
- In MongoDB Atlas, allow Render's IPs under Network Access (0.0.0.0/0 is the quick option).

The Express server serves the built React app, so there is a single service and no CORS setup.

## What is in it

- Accounts with JWT sign-in; the account matching `ADMIN_EMAIL` is the admin.
- Friend requests (send, accept, decline, unfriend) and people search.
- Walls: edit your display name, bio, profile photo and cover. Post to your wall or a friend's wall with up to 6 photos or videos.
- Feed: your posts, friends' posts, posts on your or friends' walls, and any post a friend has commented on, so a comment exchange on a friend's page appears with its thread. Newest activity first.
- Like, comment, share, edit your own posts, delete your own comments. Wall owners can remove posts and comments on their wall.
- Hashtags: `#tags` in posts become links to a tag page, and a Trending card on the feed shows the most used tags this week.
- Notifications: a bell with an unread badge for likes, comments, shares, posts on your wall, and friend requests or acceptances. Each links to the post or person.
- Direct messages: one-to-one chat between friends with unread badges. Messages refresh by polling every few seconds, which works on any Render plan; swap in Socket.IO later if you want instant delivery.
- Admin (`/admin`): site stats, suspend or restore members, grant or remove admin, delete a member with their content, and delete any post or comment.

## Notes

- Media is stored in MongoDB GridFS (50 MB per file) because Render's disk resets on every deploy. For heavy video use, swap `server/routes/media.js` for Cloudinary or S3.
- Deleting a post or member does not remove their files from GridFS yet.
