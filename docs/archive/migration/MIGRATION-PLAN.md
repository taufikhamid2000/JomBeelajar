# Manual Migration Plan

## Step 1: Verify App Router Files Are Ready

Make sure all these App Router components are in place:

- `src/app/layout.tsx` - Root layout
- `src/app/quiz/layout.tsx` - Quiz layout
- All quiz routes in App Router format

## Step 2: Create a Backup of Pages Router Files

```bash
mkdir -p src/_pages_backup
cp -r src/pages/* src/_pages_backup/
```

## Step 3: Test Without Pages Router

Before fully removing the Pages Router files, you can test by temporarily renaming the directory:

```bash
mv src/pages src/_pages_temp
```

Now run the application and verify everything works:

```bash
npm run dev
```

## Step 4: Remove Pages Router Files If Everything Works

If all tests pass, you can safely remove the Pages Router files:

```bash
rm -rf src/pages
rm -rf src/_pages_temp  # if you temporarily renamed it
```

## Step 5: Update Configuration Files

Make sure your `next.config.js` is updated for App Router and that no Pages Router specific code remains.

## Step 6: Run Tests

```bash
npm test
```

This ensures everything continues to work after the migration.

## If Issues Arise

If issues occur, you can restore the Pages Router files from the backup:

```bash
mkdir -p src/pages
cp -r src/_pages_backup/* src/pages/
```
