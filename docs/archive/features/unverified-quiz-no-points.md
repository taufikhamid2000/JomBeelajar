# Unverified Quiz Points Prevention

## Overview

This document describes the implementation of a feature that prevents users from earning points/XP when completing unverified quizzes, and provides clear notifications about this restriction.

## Changes Made

### 1. Quiz Submission Logic (`src/lib/quiz.ts`)

**Modified `submitQuizAttempt` function to check quiz verification status:**

- Added a verification check before awarding points
- Quiz verification status is fetched from the database
- Only verified quizzes award XP to users
- Unverified quizzes still record completion but don't update user stats

```typescript
// Check if the quiz is verified before awarding points
const { data: quizData, error: quizError } = await supabase
  .from('quizzes')
  .select('verified')
  .eq('id', quizId)
  .single();

const isQuizVerified = quizData?.verified || false;

// Only award XP and update stats for verified quizzes
if (isQuizVerified) {
  // Award XP and update user stats
  const earnedXp = Math.round(score * 10);
  await updateUserStats(userId, earnedXp, true);
} else {
  logger.log('No XP awarded - quiz is not verified');
}
```

### 2. Quiz Player Component (`src/components/quiz/QuizPlayer.tsx`)

**Added verification status prop and warning banner:**

- Added `isVerified?: boolean` prop to interface
- Shows warning banner when starting an unverified quiz
- Clearly indicates no points will be awarded
- Passes verification status to QuizResults component

**Warning Message:**

- Yellow warning banner with alert icon
- Clear messaging: "No points or XP will be awarded"
- Notes that content may not be reviewed for accuracy

### 3. Quiz Results Component (`src/components/quiz/QuizResults.tsx`)

**Added verification status indicator in results:**

- Added `isVerified?: boolean` prop to interface
- Shows notice when quiz completion doesn't award points
- Yellow notice box with clear messaging

**Results Notice:**

- "No points awarded: This was an unverified quiz"
- Displayed prominently in results summary

### 4. Quiz Playing Page (`src/app/quiz/[subject]/[topic]/play/[quizId]/page.tsx`)

**Passes verification status to QuizPlayer:**

- Passes `quiz.verified` status to QuizPlayer component
- Ensures verification status flows through the entire quiz experience

## User Experience

### Before Taking Quiz

- Users see a clear warning when starting an unverified quiz
- Warning explains no points will be awarded
- Notes that content may not be reviewed for accuracy

### During Quiz

- Quiz functions normally
- No indication during quiz (to avoid distraction)

### After Completion

- Results show normal score and breakdown
- Clear notice that no points were awarded
- Maintains all other functionality (retake, view all quizzes)

## Existing Features Maintained

### Quiz Table (`src/components/topic/QuizTable.tsx`)

- Already shows verification status with color-coded badges
- Green badge for verified quizzes
- Yellow badge for unverified quizzes
- Filter options for verified/unverified quizzes

### Admin Features

- All admin verification workflows remain unchanged
- Audit system continues to work as before
- Verification/unverification process unchanged

## Technical Implementation

### Database Queries

- Minimal additional database calls (one verification check per submission)
- No schema changes required
- Uses existing `verified` column in `quizzes` table

### Performance Impact

- Negligible performance impact
- Single additional query during quiz submission
- No impact on quiz loading or playing experience

### Error Handling

- Graceful fallback if verification check fails
- Defaults to not awarding points if database error occurs
- Maintains quiz completion tracking regardless

## Benefits

1. **Quality Control**: Prevents gaming the system with low-quality unverified content
2. **Leaderboard Integrity**: Ensures rankings reflect only verified quiz performance
3. **Clear Communication**: Users understand exactly when points will/won't be awarded
4. **Administrative Control**: Maintains verification as a meaningful quality gate

## Testing Scenarios

To test this feature:

1. **Verified Quiz**: Take a verified quiz, confirm points are awarded
2. **Unverified Quiz**: Take an unverified quiz, confirm:
   - Warning shows before starting
   - Quiz functions normally
   - No points awarded in results
   - Quiz completion is still recorded
3. **Admin Verification**: Verify a quiz and confirm it starts awarding points
4. **Filter Functionality**: Use quiz table filters to find verified/unverified quizzes

## Future Enhancements

Potential improvements for the future:

1. **Partial Credit**: Award reduced XP for unverified quizzes (e.g., 50% of normal)
2. **Verification Incentives**: Bonus XP for taking newly verified quizzes
3. **Quality Metrics**: Track accuracy differences between verified/unverified content
4. **User Preferences**: Allow users to choose whether to see unverified quizzes
