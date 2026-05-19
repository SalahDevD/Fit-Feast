# 🍽️ Planification des Repas - Modern UI Redesign

## 📋 Overview

The "Planification des repas" (Meal Planning) page has been completely redesigned with a modern, professional, and premium interface featuring:

- ✨ **Glass Morphism Effects** - Modern frosted glass design
- 🌓 **Dark & Light Mode** - Full theme support with automatic detection
- 📱 **Responsive Design** - Perfect on all devices (mobile, tablet, desktop)
- 🎨 **Modern Icons** - Professional icons instead of emojis
- ⚡ **Smooth Animations** - Hover effects, transitions, and interactions
- 🛒 **Shopping List Integration** - Quick access to shopping list
- 🔍 **Smart Search** - Filter dishes by name
- 💫 **Premium Styling** - Gradients, shadows, and contemporary design

---

## 🎨 Design Features

### 1. **Color Scheme & Gradients**

#### Meal Type Icons & Colors:
- **Petit-déjeuner (Breakfast)** - ☕ Coffee icon → Orange gradient (from-orange-400 to-orange-500)
- **Déjeuner (Lunch)** - 🍴 Utensils icon → Green gradient (from-green-400 to-green-500)
- **Dîner (Dinner)** - 🔔 Cloche icon → Blue gradient (from-blue-400 to-blue-500)
- **Snack** - 🍎 Apple icon → Red gradient (from-red-400 to-red-500)

### 2. **Glass Morphism Design**
- **Light Mode**: White/translucent backgrounds with subtle shadows
- **Dark Mode**: Dark gray/translucent backgrounds with green glow
- **Backdrop Blur**: Provides modern, sophisticated appearance
- **Borders**: Subtle, semi-transparent borders for definition

### 3. **Responsive Layout**

```
Desktop (7-column grid):
┌─────────────────────────────────────────────────┐
│ Monday | Tuesday | Wednesday | Thursday | ...   │
├─────────────────────────────────────────────────┤
│ [Meal Cards for each day]                       │
└─────────────────────────────────────────────────┘

Mobile (1-column layout):
┌──────────────────┐
│ Monday           │
│ [Meal Cards]     │
├──────────────────┤
│ Tuesday          │
│ [Meal Cards]     │
└──────────────────┘
```

### 4. **Navigation Bar**
- **Logo**: Fit Feast with gradient colors
- **Menu Links**: Accueil, Menu, Meal Prep, Défis, Communauté
- **Shopping Button**: "Liste de courses" with icon and glow effect
- **Sticky Position**: Stays at top while scrolling
- **Dark Mode Support**: Automatic theme switching

---

## 🎯 Key Components

### 1. **Header Section**
- Week date indicator with calendar icon
- Large, bold title
- Descriptive subtitle
- Responsive typography

### 2. **Weekly Meal Grid**
- 7-day layout (responsive to 1 column on mobile)
- Date display for each day
- 4 meal type sections per day:
  - Petit-déjeuner
  - Déjeuner
  - Dîner
  - Snack

### 3. **Meal Cards**
Each meal slot contains:
- **Icon Badge**: Colored gradient with meal type icon
- **Meal Label**: Name of the meal type
- **Dish Display** (if selected):
  - Dish name
  - Calories and protein info
  - Delete button (hover effect)
- **Add Button** (if empty):
  - Plus icon
  - "Ajouter" text
  - Dashed border
  - Hover animation

### 4. **Add Modal Dialog**
- **Modal Header**: Meal type and day information
- **Search Input**: Filter dishes by name
- **Dishes List**: Scrollable list with:
  - Dish name
  - Calories
  - Proteins
  - Price
  - Selection indicator
- **Action Buttons**:
  - Cancel button
  - Add button (disabled when no dish selected)

### 5. **Empty State**
- Large emoji placeholder
- Friendly message
- Call-to-action text

---

## 🎭 Dark Mode & Light Mode

### Light Mode
- White/light backgrounds
- Gray text
- Soft shadows
- Clear borders
- Bright accent colors

### Dark Mode
- Gray/dark backgrounds
- White text
- Deep shadows with green glow
- Subtle borders
- Vibrant accent colors

**Automatic Detection**: The component detects the system/user dark mode preference via:
```javascript
document.documentElement.classList.contains('dark')
```

---

## 💫 Animations & Transitions

### Hover Effects
1. **Meal Cards**: Scale up (1.05) with smooth transition
2. **Buttons**: Scale up with color changes
3. **Delete Button**: Fade in on card hover
4. **Menu Links**: Color transition on hover

### Transitions
- Duration: 200-300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Smooth color changes throughout

### CSS Animations (in MealPrep.css)
- `modal-slide`: Modal entry animation
- `bounce-icon`: Icon bounce effect
- `stagger`: Staggered list animation
- `shine`: Shine effect
- `gentle-pulse`: Pulse animation

---

## 📱 Responsive Design

### Breakpoints

**Mobile (< 768px)**:
- Single column layout for days
- Stack meal cards vertically
- Full-width buttons
- Adjusted padding and spacing

**Tablet (768px - 1024px)**:
- 2-4 column grid
- Optimized spacing
- Touch-friendly buttons

**Desktop (> 1024px)**:
- Full 7-column layout
- All features visible
- Hover effects enabled
- Maximum visual impact

---

## 🛠️ Technical Implementation

### Dependencies
- **react-icons**: FaCoffee, FaUtensils, FaApple, FaCircle, etc.
- **react-icons/gi**: GiCloche (bell icon)
- **date-fns**: Date formatting with French locale
- **react-hot-toast**: Notifications
- **Tailwind CSS**: Styling framework

### State Management
```javascript
const [mealPlan, setMealPlan] = useState(null);
const [dishes, setDishes] = useState([]);
const [loading, setLoading] = useState(true);
const [showAddModal, setShowAddModal] = useState(false);
const [selectedDay, setSelectedDay] = useState(null);
const [selectedMealType, setSelectedMealType] = useState(null);
const [selectedDish, setSelectedDish] = useState(null);
const [darkMode, setDarkMode] = useState(false);
const [currentWeekStart, setCurrentWeekStart] = useState(...);
const [searchDish, setSearchDish] = useState('');
```

### Key Functions
1. **fetchData()**: Load meal plan and dishes from API
2. **addToPlan()**: Add selected dish to meal plan
3. **removeFromPlan()**: Remove dish from meal plan
4. **addAllToCart()**: Add all planned meals to shopping cart
5. **getMealItem()**: Get meal details for a specific day/type

---

## 🚀 Features Implemented

### ✅ Completed
- [x] Modern UI design with glass morphism
- [x] Responsive 7-day meal planning table
- [x] Professional meal type icons
- [x] Dark and light theme support
- [x] Smooth animations and transitions
- [x] Navigation bar with logo and menu
- [x] Shopping list button ("Liste de courses")
- [x] Add meal modal with search functionality
- [x] Delete meal functionality
- [x] Empty state display
- [x] Loading state
- [x] Keyboard and accessibility support

---

## 📖 Usage

### Adding a Meal
1. Click the "Ajouter" button on any empty meal slot
2. Select or search for a dish from the modal
3. Click "Ajouter au plan" to confirm
4. Meal appears in the grid

### Removing a Meal
1. Hover over the meal card
2. Click the delete (X) button
3. Meal is removed from the plan

### Going to Shopping List
1. Click "Liste de courses" button in the top right
2. All meals are added to your cart

### Switching Themes
- Use the system dark mode toggle
- Component automatically detects and updates

---

## 🎨 Styling Classes

### Tailwind Classes Used
- `backdrop-blur-xl`: Glass effect
- `bg-gradient-to-br`: Gradient backgrounds
- `shadow-2xl`: Drop shadows
- `rounded-3xl`: Large border radius
- `transition-all`: Smooth transitions
- `hover:scale-105`: Hover scaling
- `dark:`: Dark mode variants

### Custom CSS Classes
- `.glass-morphism`: Light mode glass effect
- `.glass-morphism-dark`: Dark mode glass effect
- `.meal-card`: Card styling
- `.animate-gradient`: Gradient animation
- `.pulse-gentle`: Pulse effect
- `.bounce-icon`: Icon bounce animation

---

## 🔧 Configuration

### Theme Colors
Edit in `tailwind.config.js`:
```javascript
colors: {
  primary: '#22c55e',      // Green
  secondary: '#16a34a',
  dark: '#1f2937',
  accent: '#f59e0b',
}
```

### Meal Types
Edit in MealPrep.js:
```javascript
const mealTypes = [
  { value: 'breakfast', label: 'Petit-déjeuner', icon: FaCoffee, color: 'from-orange-400 to-orange-500' },
  { value: 'lunch', label: 'Déjeuner', icon: FaUtensils, color: 'from-green-400 to-green-500' },
  { value: 'dinner', label: 'Dîner', icon: GiCloche, color: 'from-blue-400 to-blue-500' },
  { value: 'snack', label: 'Snack', icon: FaApple, color: 'from-red-400 to-red-500' },
];
```

---

## 🐛 Troubleshooting

### Icons Not Displaying
- Ensure `react-icons` is installed: `npm install react-icons`
- Import the correct icon set (fa, gi, etc.)

### Dark Mode Not Working
- Check if dark class is applied to `<html>` element
- Verify Tailwind dark mode is enabled in config

### Layout Issues on Mobile
- Check viewport meta tag in HTML
- Test with device emulation in browser DevTools

### Animation Performance
- Disable animations in Settings if experiencing lag
- Use hardware acceleration for smoother transitions

---

## 📝 Future Enhancements

Potential improvements for future versions:
- [ ] Drag-and-drop reordering of meals
- [ ] Meal plan templates
- [ ] Nutritional summary for the week
- [ ] Recipe details and instructions
- [ ] Meal prep difficulty indicators
- [ ] Budget-based meal filtering
- [ ] Favorite meals quick access
- [ ] Shopping list with prices
- [ ] Export meal plan to PDF
- [ ] Share meal plans with friends

---

## 📞 Support

For issues or questions about the redesign:
1. Check the browser console for errors
2. Verify API endpoints are responding
3. Clear browser cache and reload
4. Check dark mode preference settings

---

**Version**: 2.0 (Modern Redesign)  
**Last Updated**: May 2026  
**Author**: GitHub Copilot  
**Status**: ✅ Production Ready
