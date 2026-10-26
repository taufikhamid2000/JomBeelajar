# Component Design System

This document outlines the component design system used throughout the JomBeelajar application.

## Design Principles

JomBeelajar follows these core design principles:

1. **Consistency**: Uniform look and feel across all pages
2. **Accessibility**: WCAG 2.1 AA compliance for all components
3. **Responsiveness**: Optimal experience across all device sizes
4. **Reusability**: Component-based architecture for DRY code
5. **Performance**: Optimized for fast loading and interaction

## Component Hierarchy

The component system is organized in this hierarchy:

1. **Base UI Components**: Fundamental building blocks
2. **Composite Components**: Combinations of base components
3. **Feature Components**: Domain-specific implementations
4. **Page Components**: Full page implementations

## Base UI Components

Located in `src/components/ui/`, these are the foundational elements:

### Buttons

```jsx
<Button
  variant="primary" | "secondary" | "outline" | "danger"
  size="sm" | "md" | "lg"
  isLoading={boolean}
  disabled={boolean}
  onClick={handleClick}
>
  Button Text
</Button>
```

### Input Fields

```jsx
<Input
  type="text" | "email" | "password" | "number"
  label="Label Text"
  placeholder="Placeholder text"
  error="Error message"
  value={value}
  onChange={handleChange}
  required={boolean}
/>
```

### Cards

```jsx
<Card
  variant="default" | "elevated" | "bordered"
  padding="none" | "sm" | "md" | "lg"
>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Footer content</Card.Footer>
</Card>
```

## Theming

### Color Palette

| Name       | Light Mode | Dark Mode | Usage                             |
| ---------- | ---------- | --------- | --------------------------------- |
| primary    | #3B82F6    | #60A5FA   | Primary actions, links            |
| secondary  | #10B981    | #34D399   | Secondary actions, success states |
| accent     | #8B5CF6    | #A78BFA   | Highlights, accents               |
| neutral    | #6B7280    | #9CA3AF   | Text, borders                     |
| background | #FFFFFF    | #111827   | Page background                   |
| surface    | #F9FAFB    | #1F2937   | Card background                   |

### Typography

| Style | Font       | Weight | Size     | Line Height | Usage          |
| ----- | ---------- | ------ | -------- | ----------- | -------------- |
| h1    | Geist Sans | 700    | 2.25rem  | 2.5rem      | Page titles    |
| h2    | Geist Sans | 600    | 1.875rem | 2.25rem     | Section titles |
| h3    | Geist Sans | 600    | 1.5rem   | 2rem        | Card titles    |
| body  | Geist Sans | 400    | 1rem     | 1.5rem      | General text   |
| small | Geist Sans | 400    | 0.875rem | 1.25rem     | Caption text   |

## Layout Components

### Container

```jsx
<Container
  maxWidth="sm" | "md" | "lg" | "xl" | "full"
  padding={boolean}
>
  {children}
</Container>
```

### Grid

```jsx
<Grid
  columns={1-12}
  gap="none" | "sm" | "md" | "lg"
>
  <Grid.Item span={1-12}>
    Content
  </Grid.Item>
</Grid>
```

### Stack

```jsx
<Stack
  direction="horizontal" | "vertical"
  gap="none" | "sm" | "md" | "lg"
  align="start" | "center" | "end"
  justify="start" | "center" | "between" | "around" | "end"
>
  {children}
</Stack>
```

## Feature-Specific Components

Each feature area has its own specialized components:

- **Quiz Components**: Question cards, timers, result displays
- **Dashboard Components**: Stat cards, progress indicators
- **Admin Components**: Data tables, form builders
- **Leaderboard Components**: Ranking tables, user badges

## Accessibility

All components follow these accessibility requirements:

- Proper ARIA attributes
- Keyboard navigation support
- Sufficient color contrast
- Screen reader compatible
- Focus management

## Responsive Design

Components adapt to different screen sizes using:

- Mobile-first approach with Tailwind breakpoints
- Fluid typography and spacing
- Conditional rendering for mobile/desktop
- Touch-friendly elements on mobile

## Usage Guidelines

### Component Selection

- Use the simplest component that meets your needs
- Prefer composition over customization
- Keep component props to a minimum
- Maintain consistent naming conventions

### State Management

- Use React Query for server state
- Use React state for UI state
- Avoid prop drilling with context where needed
- Keep state close to where it's used

## Adding New Components

When adding new components:

1. Check if an existing component can be extended
2. Place in the appropriate directory
3. Include TypeScript types for props
4. Add comprehensive tests
5. Document usage examples
6. Ensure accessibility compliance

## Future Improvements

Planned enhancements to the component system:

1. Storybook integration for component documentation
2. Component performance monitoring
3. Enhanced animation system
4. More comprehensive dark mode support
