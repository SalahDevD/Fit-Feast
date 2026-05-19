# 🎨 Visual Design Map - Planification des Repas

## Page Layout Structure

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                          NAVIGATION BAR (Sticky)                              ║
║  [Logo] Fit Feast    [Menu Links...]          [Liste de Courses Button] [User] ║
╚════════════════════════════════════════════════════════════════════════════════╝
                                                    ↓

╔════════════════════════════════════════════════════════════════════════════════╗
║                            HEADER SECTION                                      ║
║  📅 Semaine du 5 mai 2026                                                      ║
║                                                                                ║
║  Planification des repas                                                       ║
║  Organisez votre semaine culinaire...                                          ║
╚════════════════════════════════════════════════════════════════════════════════╝
                                    ↓

╔════════════════════════════════════════════════════════════════════════════════╗
║                    WEEKLY MEAL PLANNING GRID                                   ║
║  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐  
║  │  MONDAY  │ TUESDAY  │WEDNESDAY │THURSDAY  │ FRIDAY   │SATURDAY  │ SUNDAY   │  
║  │ 5 mai    │ 6 mai    │ 7 mai    │ 8 mai    │ 9 mai    │ 10 mai   │ 11 mai   │  
║  ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤  
║  │          │          │          │          │          │          │          │  
║  │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │  
║  │ │☕ P-D│ │ │☕ P-D│ │ │☕ P-D│ │ │☕ P-D│ │ │☕ P-D│ │ │☕ P-D│ │ │☕ P-D│ │  
║  │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │  
║  │ │ Oeufs│ │ │+ Add │ │ │Granola│ │ │+ Add │ │ │Yogurt│ │ │+ Add │ │ │Toast │ │  
║  │ │350cal│ │ │      │ │ │280cal│ │ │      │ │ │200cal│ │ │      │ │ │320cal│ │  
║  │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │  
║  │          │          │          │          │          │          │          │  
║  │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │  
║  │ │🍴 Dej│ │ │🍴 Dej│ │ │🍴 Dej│ │ │🍴 Dej│ │ │🍴 Dej│ │ │🍴 Dej│ │ │🍴 Dej│ │  
║  │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │  
║  │ │Poulet│ │ │+ Add │ │ │Pâtes │ │ │+ Add │ │ │Salad │ │ │+ Add │ │ │Fish  │ │  
║  │ │450cal│ │ │      │ │ │420cal│ │ │      │ │ │350cal│ │ │      │ │ │480cal│ │  
║  │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │  
║  │          │          │          │          │          │          │          │  
║  │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │  
║  │ │🔔 Din│ │ │🔔 Din│ │ │🔔 Din│ │ │🔔 Din│ │ │🔔 Din│ │ │🔔 Din│ │ │🔔 Din│ │  
║  │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │  
║  │ │Steak │ │ │+ Add │ │ │Chicken│ │ │+ Add │ │ │Lamb  │ │ │+ Add │ │ │Veggie│ │  
║  │ │550cal│ │ │      │ │ │480cal│ │ │      │ │ │520cal│ │ │      │ │ │380cal│ │  
║  │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │  
║  │          │          │          │          │          │          │          │  
║  │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │  
║  │ │🍎Snack│ │ │+ Add │ │ │Nuts  │ │ │+ Add │ │ │Fruit │ │ │+ Add │ │ │Cheese│ │  
║  │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │ ├──────┤ │  
║  │ │150cal│ │ │      │ │ │120cal│ │ │      │ │ │100cal│ │ │      │ │ │200cal│ │  
║  │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │  
║  │          │          │          │          │          │          │          │  
║  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘  
╚════════════════════════════════════════════════════════════════════════════════╝
```

---

## Meal Card Details

### Card with Meal (Selected State)
```
┌─────────────────────────┐
│ ☕ Petit-déjeuner       │  ← Header with icon and label
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Oeufs Brouillés   │ │  ← Meal name
│ │ 350 kcal          │ │
│ │ 15g protéines     │ │  ← Nutrition info
│ │              [✕]  │ │  ← Delete button (on hover)
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Empty Card (Add State)
```
┌─────────────────────────┐
│ ☕ Petit-déjeuner       │  ← Header with icon
├─────────────────────────┤
│                         │
│         ┌───────┐       │
│         │   ➕  │       │  ← Add button with icon
│         │       │       │
│         │Ajouter│       │
│         └───────┘       │
│                         │
└─────────────────────────┘
```

---

## Modal Dialog

### Add Meal Modal
```
╔════════════════════════════════════════════╗
║  Ajouter un plat                      [✕]  ║  ← Header
║  Déjeuner - Lundi                         ║  ← Meal info
╠════════════════════════════════════════════╣
║                                            ║
║  Rechercher un plat                       ║  ← Search input
║  ┌────────────────────────────────────┐   ║
║  │ Tapez le nom du plat...          │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  DISHES LIST (Scrollable)                 ║
║  ┌────────────────────────────────────┐   ║
║  │ ☑ Poulet Rôti                   [✓]│   ║  ← Selected
║  │ 450 kcal | 35g protéines | 12€     │   ║
║  ├────────────────────────────────────┤   ║
║  │ ☐ Pâtes Carbonara                  │   ║  ← Unselected
║  │ 420 kcal | 16g protéines | 10€     │   ║
║  ├────────────────────────────────────┤   ║
║  │ ☐ Salade César                     │   ║
║  │ 350 kcal | 12g protéines | 9€      │   ║
║  ├────────────────────────────────────┤   ║
║  │ ☐ Steak Frites                     │   ║
║  │ 550 kcal | 45g protéines | 15€     │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
╠════════════════════════════════════════════╣
║  ┌──────────────┐  ┌──────────────────┐   ║
║  │   Annuler    │  │ ➕ Ajouter au plan│   ║  ← Actions
║  └──────────────┘  └──────────────────┘   ║
╚════════════════════════════════════════════╝
```

---

## Navigation Bar

### Desktop View
```
┌──────────────────────────────────────────────────────────────┐
│ [🍴]Fit Feast    Accueil Menu Meal Prep Défis Communauté     │
│                                  🛒 Liste de courses  [👤]   │
└──────────────────────────────────────────────────────────────┘
     Logo           Menu Items                Shopping Cart     User
```

### Mobile View
```
┌────────────────────────────────────────┐
│ [🍴]Fit Feast       🛒  [👤]  [☰]     │
│  Logo            Shopping  User  Menu  │
└────────────────────────────────────────┘
```

---

## Color Palette

### Light Mode
```
Background:    #FFFFFF (white) with opacity
Primary:       #22C55E (green)
Secondary:     #16A34A (dark green)
Text:          #1F2937 (dark gray)
Borders:       #D1D5DB (light gray)
Shadows:       rgba(0,0,0,0.1)
```

### Dark Mode
```
Background:    #111827 (dark gray) with opacity
Primary:       #22C55E (green)
Secondary:     #16A34A (dark green)
Text:          #F3F4F6 (light gray)
Borders:       #374151 (medium gray)
Shadows:       rgba(0,0,0,0.5)
Glow:          rgba(34,197,94,0.5)
```

---

## Meal Type Icon & Color Mapping

| Meal Type | Icon | Label | Color Gradient |
|-----------|------|-------|-----------------|
| Breakfast | ☕ Coffee | Petit-déjeuner | Orange 400→500 |
| Lunch | 🍴 Utensils | Déjeuner | Green 400→500 |
| Dinner | 🔔 Cloche | Dîner | Blue 400→500 |
| Snack | 🍎 Apple | Snack | Red 400→500 |

---

## Responsive Breakpoints

### Mobile (< 768px)
```
Single column layout
Full width cards
Stacked navigation
Touch-friendly sizing
Visible menu toggle
```

### Tablet (768px - 1024px)
```
2-4 column layout
Adjusted spacing
Visible navigation
Touch and hover support
```

### Desktop (> 1024px)
```
Full 7-column layout
All features visible
Hover effects active
Maximum visual impact
All menu items visible
```

---

## Interaction States

### Meal Card Hover
```
Before:                     After:
┌──────────────┐           ┌──────────────┐
│ [Meal Info]  │  →        │ [Meal Info]  │
│              │           │          [✕] │ ← Visible
└──────────────┘           └──────────────┘
Scale: 1.0                 Scale: 1.05
                          Shadow: Enhanced
                          Brightness: +10%
```

### Button Hover
```
Before:              After:
[Button Text]   →   [Button Text]
Scale: 1.0          Scale: 1.02
Color: Base         Color: Lighter
Shadow: Base        Shadow: Enhanced
```

---

## Glass Morphism Effect

### Applied To
- Main container
- Day columns
- Meal cards
- Modal dialog
- Header section
- Navigation bar

### Properties
```css
background: rgba(255, 255, 255, 0.25) [Light]
            rgba(0, 0, 0, 0.25) [Dark]
backdrop-filter: blur(4px)
-webkit-backdrop-filter: blur(4px)
border: 1px solid rgba(255, 255, 255, 0.18) [Light]
        1px solid rgba(255, 255, 255, 0.1) [Dark]
```

---

## Animation Timeline

### Modal Slide In
```
0ms:    Scale 0.95, Opacity 0%
150ms:  Scale 1.0, Opacity 100%
300ms:  Complete
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### Card Scale
```
0ms:    Scale 1.0
200ms:  Scale 1.05
Easing: ease-out
```

### Fade In Elements
```
Element 1: 0ms  delay
Element 2: 50ms delay
Element 3: 100ms delay
...and so on
```

---

## Typography Hierarchy

```
H1: 3xl (48px) - Bold         ← Page Title
H2: 2xl (24px) - Semibold     ← Meal Labels
H3: lg (18px) - Bold          ← Card Titles
H4: base (16px) - Semibold    ← Section Headers
Body: sm (14px) - Regular     ← Default Text
Caption: xs (12px) - Regular  ← Metadata
```

---

## Accessibility Features

- ✅ Semantic HTML structure
- ✅ ARIA labels for interactive elements
- ✅ Color contrast ratios (WCAG AA)
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Alternative text for icons
- ✅ Screen reader friendly
- ✅ Responsive to system preferences

---

**Design System Version**: 2.0  
**Last Updated**: May 2026  
**Framework**: React + Tailwind CSS + Custom CSS  
**Browser Support**: All modern browsers (Chrome, Firefox, Safari, Edge)
