# Code Block Activity - UI Enhancement Quick Reference

## 🎨 Color Palette

### Primary Gradient
- **Start:** #667eea (Purple/Indigo)
- **End:** #764ba2 (Blue-Purple)

### Status Colors
- **Success:** #4ade80 (Green)
- **Error:** #ef4444 (Red)
- **Warning:** #ffc107 (Amber)
- **Text:** #333333 (Dark Gray)
- **Background:** #ffffff (White) with light gradients

### Transparency Effects
- Backdrops with `backdrop-filter: blur(10px)`
- Overlay backgrounds with `rgba(0, 0, 0, 0.5)`
- Hover states with color overlays

---

## 🎭 Component States

### Buttons

#### Primary Button (Action)
```
Background: Linear gradient (Green)
Color: White
Hover: Lift up, enhanced shadow
Disabled: 50% opacity, not-allowed cursor
```

#### Secondary Button (Alternative)
```
Background: Transparent with border
Color: White
Hover: Increased opacity, glow effect
Disabled: 50% opacity, not-allowed cursor
```

#### Icon Button (Exit)
```
Background: Transparent with border
Hover: Increased opacity, rotation animation
Border-radius: 50% (circular)
```

---

## 📐 Layout Grid System

### Instructor Builder
```
Desktop (>1200px):   3-column layout
Tablet (768-1200px): 2-column layout
Mobile (<768px):     1-column layout
```

### Student View
```
Fixed Position Full-Screen Layout
├── Header (flex, fixed height)
├── Game Container (flex: 1, scrollable)
└── Footer (flex, fixed height)
```

---

## ⏱️ Animation Timings

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| Bounce | 2s | infinite | Icons, emphasis |
| Slide Up | 0.6s | ease | Panel entrance |
| Fade In | 0.3s | ease | Modal appearance |
| Pop In | 0.5s | cubic-bezier | Score display |
| Transition | 0.3s | ease | Hover effects |

---

## 🔤 Typography Scale

```
h1: 36px, font-weight: 700      (Header title)
h2: 20px, font-weight: 700      (Panel title)
h3: 18px, font-weight: 600      (Feedback title)
h4: 14px, font-weight: 600      (Section title)
h5: 13px, font-weight: 500      (Subsection)
Body: 14px, font-weight: 400    (Default)
Small: 12px, font-weight: 400   (Helper text)
Code: 13px, monospace           (Code display)
```

---

## 📦 Spacing Scale

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
3xl: 30px
4xl: 40px
```

---

## 🎯 Icons Used

### Instructor Interface
- 🧩 Activity/Puzzle
- 📝 Language/Code
- 📦 Blocks/Components
- 🔒 Hidden/Locked
- 💡 Hints
- 📊 Preview
- ✅ Validation
- 💾 Save

### Student Interface
- 🧩 Activity/Type
- ✅ Success/Correct
- ❌ Error/Incorrect
- 📝 Language
- ⏱️ Timer
- 🔄 Attempts
- 🎯 Status indicator

---

## 🚀 Button States

### Primary (Action Button)
```
Normal:   bg-gradient, shadow-md
Hover:   transform translateY(-2px), shadow-lg
Active:  slightly darker, no transform
Disabled: opacity-50, cursor-not-allowed
```

### Secondary (Alternative Button)
```
Normal:   bg-transparent, border-white
Hover:   increased opacity, glow effect
Active:  increased opacity
Disabled: opacity-50, cursor-not-allowed
```

---

## 📱 Responsive Breakpoints

```
Mobile:    < 768px
Tablet:    768px - 1024px
Desktop:   > 1024px
Large:     > 1280px
XL:        > 1536px
```

### Key Adjustments
- **Mobile:** Single column, larger touch targets, text truncation
- **Tablet:** Two columns, adjusted sizing
- **Desktop:** Full three-column with all details visible

---

## 🎪 Modal/Overlay Styling

### Validation Feedback
```
Position: fixed, full-screen overlay
Backdrop: rgba(0, 0, 0, 0.5) with blur
Card: white, border-radius-lg, shadow-xl
Animation: Slide up + fade in
Z-index: 100 (on top of everything)
```

---

## ✨ Visual Hierarchy

### Instructor Panel (by importance)
1. **Step Number** (Circle badge)
2. **Panel Title** (Large, colored)
3. **Form Fields** (Main content)
4. **Stats/Info** (Secondary)
5. **Help Text** (Tertiary, smaller)

### Student Feedback (by importance)
1. **Icon** (Large emoji, animated)
2. **Main Message** (Bold, large)
3. **Score** (Prominent circle)
4. **Details** (Secondary, list)
5. **Action Buttons** (Footer)

---

## 🔔 Visual Feedback Elements

### Form Focus
```
Border: color-primary
Shadow: 0 0 0 3px rgba(primary, 0.1)
Background: slight color tint
Transition: smooth 0.3s
```

### Hover States
```
Background: slight opacity increase
Transform: translateY(-2px) on lift
Shadow: enhanced shadow
Cursor: pointer
```

### Active/Checked
```
Accent Color: primary color
Icon: checkmark or indicator
Background: slight tint
Border: primary color

```

---

## 📊 Component Measurements

### Cards/Panels
- Padding: 24-28px
- Border-radius: 12-16px
- Min-width: 350px (responsive)
- Box-shadow: 0 8px 24px rgba(0,0,0,0.12)

### Inputs
- Height: 40px (standard)
- Padding: 12px 14px
- Border: 2px solid
- Border-radius: 8px

### Buttons
- Height: 40px (standard)
- Padding: 10px 20px
- Border-radius: 8px
- Min-width: 120px

---

## 🎯 Focus Management

### Keyboard Navigation
- Tab order follows logical flow
- Focus visible with outline or shadow
- Enter key triggers primary action
- Escape closes modals/overlays

### Touch Friendly
- Min button size: 44x44px
- Min touch target: 48x48px
- Spacing between targets: 8px+
- Large tap areas for important actions

---

## ✅ Accessibility Features

- ✓ Sufficient color contrast (WCAG AA)
- ✓ Color-independent status indicators
- ✓ Semantic HTML structure
- ✓ Clear focus states
- ✓ Descriptive labels and titles
- ✓ Proper heading hierarchy
- ✓ ARIA attributes where needed
- ✓ Keyboard navigation support

---

## 🎨 Customization Guide

### To Change Primary Color:
1. Update gradient start: `--primary-light: #...`
2. Update gradient end: `--primary-dark: #...`
3. Update all `.bg-gradient` references
4. Update shadows and hover effects

### To Change Success Color:
1. Update `#4ade80` to new color
2. Update all `.success` class colors
3. Update success badges and checkmarks

### To Adjust Spacing:
1. Modify CSS variables
2. Update responsive breakpoints
3. Adjust gap values in grid/flex

---

## 📝 Notes

- All animations are GPU-accelerated for smooth performance
- Backdrop filters may require modern browser support
- Gradients are consistent across instructor and student interfaces
- Mobile experience is fully optimized
- Dark mode can be easily added as variant
- Color scheme is WCAG AA compliant

---

## 🚀 Future Customizations

These enhancements provide a solid foundation for:
- Dark mode variant
- Theme switching
- Custom color schemes
- Additional animation options
- Enhanced visual effects
- Advanced interactions
- Accessibility improvements
