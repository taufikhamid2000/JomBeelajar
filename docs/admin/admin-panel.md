# JomBeelajar Admin Panel Documentation

## Overview

The admin panel provides centralized management capabilities for the JomBeelajar platform. It allows administrators to manage users, content, monitor analytics, configure achievements, and adjust system settings.

## Key Features

### User Management

- View all registered users
- Modify user roles (admin, moderator, user)
- View user statistics and activity

### Content Management

- Create, edit, and delete subjects
- Manage topics within subjects
- Review and moderate user-created quizzes

### Analytics Dashboard

- Monitor key platform metrics
- Track user engagement and activity
- View quiz completion rates and scores

### Achievement Management

- Create and edit achievement criteria
- Award manual achievements
- Configure XP rewards

### System Settings

- General site configuration
- Gamification parameters
- Notification preferences

## Database Setup

The admin functionality relies on several database tables:

1. **user_roles** - Stores user role information
2. **site_config** - Stores site-wide configuration
3. **admin_logs** - Audit log of admin actions

## Access Control

The admin panel is protected by role-based access control:

- Only users with the 'admin' role can access the panel
- Certain actions may be restricted to specific admin roles
- All admin actions are logged for audit purposes

## Deployment

To set up the admin functionality:

1. Apply the database migration:

```
npm run db:migrate:admin
```

2. Create an initial admin user by running the following SQL in your Supabase SQL editor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_UUID', 'admin');
```

## Best Practices

1. **Limit Admin Access** - Only grant admin privileges to trusted users
2. **Use Audit Logs** - Regularly review admin actions through logs
3. **Test Changes** - Always test configuration changes before deploying to production
4. **Regular Backups** - Ensure database backups before making significant changes
5. **Security First** - Follow principle of least privilege and remove debug/development tools in production

## Security Considerations

1. **Production Deployments** - All debugging tools and endpoints have been removed for security
2. **Environment Variables** - Store sensitive keys in environment variables, never expose them
3. **Role Validation** - Implement server-side validation for all admin actions
4. **Authentication** - Always validate session tokens on both client and server sides
